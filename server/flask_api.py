#!/usr/bin/env python3
"""
Flask API server for Step 2 Excel file processing
"""
import os
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('PGHOST', 'localhost'),
            database=os.getenv('PGDATABASE', 'postgres'),
            user=os.getenv('PGUSER', 'postgres'),
            password=os.getenv('PGPASSWORD', ''),
            port=os.getenv('PGPORT', '5432')
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def process_excel_file(file_path, column_mappings):
    """Process Excel file and extract questions with mappings"""
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Extract column mappings
        question_col = column_mappings.get('questionNumber', 'Question Number')
        category_col = column_mappings.get('process', 'Process')
        subcategory_col = column_mappings.get('subProcess', 'Sub-Process')
        question_text_col = column_mappings.get('question', 'Question')
        
        # Validate required columns exist
        missing_cols = []
        for col_name, col_key in [
            (question_col, 'questionNumber'),
            (category_col, 'process'),
            (subcategory_col, 'subProcess'),
            (question_text_col, 'question')
        ]:
            if col_name not in df.columns:
                missing_cols.append(f"{col_key} -> {col_name}")
        
        if missing_cols:
            return {
                'success': False,
                'error': f"Missing columns: {', '.join(missing_cols)}",
                'available_columns': df.columns.tolist()
            }
        
        # Process data
        questions = []
        categories = set()
        subcategories = set()
        
        for index, row in df.iterrows():
            # Skip rows with missing essential data
            if pd.isna(row[question_col]) or pd.isna(row[question_text_col]):
                continue
                
            question_number = str(row[question_col]).strip()
            category = str(row[category_col]).strip() if not pd.isna(row[category_col]) else "Uncategorized"
            subcategory = str(row[subcategory_col]).strip() if not pd.isna(row[subcategory_col]) else "General"
            question_text = str(row[question_text_col]).strip()
            
            categories.add(category)
            subcategories.add(subcategory)
            
            questions.append({
                'id': question_number,
                'question': question_text,
                'category': category,
                'subcategory': subcategory
            })
        
        return {
            'success': True,
            'questions': questions,
            'total_questions': len(questions),
            'categories': list(categories),
            'subcategories': list(subcategories),
            'category_count': len(categories),
            'subcategory_count': len(subcategories)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f"Error processing Excel file: {str(e)}",
            'traceback': traceback.format_exc()
        }

@app.route('/api/python/process-excel', methods=['POST'])
def process_excel():
    """Process uploaded Excel file with column mappings"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format. Only .xlsx and .xls files are allowed'}), 400
        
        # Get form data
        application_id = request.form.get('applicationId')
        file_type = request.form.get('fileType', 'primary')  # primary or followup
        column_mappings = json.loads(request.form.get('columnMappings', '{}'))
        
        if not application_id:
            return jsonify({'error': 'Application ID is required'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Process Excel file
        result = process_excel_file(file_path, column_mappings)
        
        if not result['success']:
            # Clean up file
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify(result), 400
        
        # Save to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Insert or update data request
            insert_query = """
                INSERT INTO data_requests (
                    application_id, file_name, file_size, file_type, 
                    questions, total_questions, categories, subcategories,
                    column_mappings, uploaded_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (application_id, file_type) 
                DO UPDATE SET 
                    file_name = EXCLUDED.file_name,
                    file_size = EXCLUDED.file_size,
                    questions = EXCLUDED.questions,
                    total_questions = EXCLUDED.total_questions,
                    categories = EXCLUDED.categories,
                    subcategories = EXCLUDED.subcategories,
                    column_mappings = EXCLUDED.column_mappings,
                    uploaded_at = EXCLUDED.uploaded_at
                RETURNING id
            """
            
            cursor.execute(insert_query, (
                int(application_id),
                filename,
                file.content_length or 0,
                file_type,
                json.dumps(result['questions']),
                result['total_questions'],
                json.dumps(result['categories']),
                json.dumps(result['subcategories']),
                json.dumps(column_mappings),
                datetime.now()
            ))
            
            data_request_id = cursor.fetchone()['id']
            conn.commit()
            
            response_data = {
                'id': data_request_id,
                'applicationId': int(application_id),
                'fileName': filename,
                'fileSize': file.content_length or 0,
                'fileType': file_type,
                'questions': result['questions'],
                'totalQuestions': result['total_questions'],
                'categories': result['categories'],
                'subcategories': result['subcategories'],
                'categoryCount': result['category_count'],
                'subcategoryCount': result['subcategory_count'],
                'columnMappings': column_mappings
            }
            
            return jsonify(response_data), 200
            
        except Exception as db_error:
            conn.rollback()
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/python/get-columns', methods=['POST'])
def get_excel_columns():
    """Get column names from uploaded Excel file for mapping"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(file_path)
        
        try:
            # Read Excel file to get columns
            df = pd.read_excel(file_path, nrows=0)  # Read only headers
            columns = df.columns.tolist()
            
            # Get a sample of first few rows for preview
            df_sample = pd.read_excel(file_path, nrows=3)
            sample_data = df_sample.to_dict('records')
            
            return jsonify({
                'columns': columns,
                'sample_data': sample_data
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except Exception as e:
        return jsonify({
            'error': f'Error reading Excel file: {str(e)}'
        }), 500

@app.route('/api/python/data-requests/<int:application_id>', methods=['GET'])
def get_data_requests(application_id):
    """Get data requests for an application"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT id, application_id, file_name, file_size, file_type,
                   questions, total_questions, categories, subcategories,
                   column_mappings, uploaded_at
            FROM data_requests 
            WHERE application_id = %s
            ORDER BY file_type, uploaded_at DESC
        """
        
        cursor.execute(query, (application_id,))
        results = cursor.fetchall()
        
        # Convert to regular dict and parse JSON fields
        data_requests = []
        for row in results:
            data_request = dict(row)
            data_request['questions'] = json.loads(data_request['questions']) if data_request['questions'] else []
            data_request['categories'] = json.loads(data_request['categories']) if data_request['categories'] else []
            data_request['subcategories'] = json.loads(data_request['subcategories']) if data_request['subcategories'] else []
            data_request['columnMappings'] = json.loads(data_request['column_mappings']) if data_request['column_mappings'] else {}
            data_requests.append(data_request)
        
        return jsonify(data_requests), 200
        
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Flask API'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)