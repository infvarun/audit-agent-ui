#!/usr/bin/env python3
"""
Create a sample Excel file for testing the Step 2 component
"""
import pandas as pd
import os

def create_sample_excel():
    # Sample data for testing
    data = {
        'Question Number': ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', 'F1.1', 'F1.2'],
        'Process': ['Access Control', 'Access Control', 'Data Security', 'Data Security', 'Backup & Recovery', 'Backup & Recovery', 'Incident Response', 'Incident Response'],
        'Sub-Process': ['User Authentication', 'Role Management', 'Encryption', 'Data Classification', 'Backup Procedures', 'Recovery Testing', 'Incident Detection', 'Response Planning'],
        'Question': [
            'What user authentication mechanisms are implemented?',
            'How are user roles and permissions managed?',
            'What encryption standards are used for data at rest?',
            'How is sensitive data classified and handled?',
            'What backup procedures are in place?',
            'How often is recovery testing performed?',
            'What incident detection systems are implemented?',
            'What incident response procedures are documented?'
        ],
        'Priority': ['High', 'Medium', 'High', 'High', 'Medium', 'Low', 'High', 'Medium'],
        'Status': ['Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending']
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to Excel
    filename = 'sample_audit_questions.xlsx'
    df.to_excel(filename, index=False)
    print(f"Sample Excel file created: {filename}")
    return filename

if __name__ == "__main__":
    create_sample_excel()