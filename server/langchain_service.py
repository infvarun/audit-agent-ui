from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class QuestionAnalysisService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            temperature=0.3,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert AI assistant that specializes in analyzing audit questions and generating optimized data collection prompts. Your task is to analyze audit questions and provide:

1. **Efficient AI Prompt**: Create a concise, effective prompt that would help an AI system answer the original question using available data sources.

2. **Tool Suggestion**: Recommend the most appropriate data collection tool from these options:
   - "sql_server": For database queries, data extraction, system configurations
   - "gnosis_path": For knowledge management, documentation, procedures
   - "servicenow": For IT service management, incidents, change requests
   - "nas_path": For file systems, document storage, network shares

3. **Reasoning**: Explain why the suggested tool is most appropriate for this question.

Respond with valid JSON in this exact format:
{{
  "aiPrompt": "your generated prompt here",
  "toolSuggestion": "tool_name",
  "connectorReason": "explanation of why this tool is appropriate"
}}

Make the AI prompt efficient and focused on data collection rather than general analysis."""),
            ("human", """Question: {question}
Category: {category}
Subcategory: {subcategory}

Analyze this audit question and provide the JSON response.""")
        ])
        
        self.json_parser = JsonOutputParser()

    async def analyze_question(self, question: str, category: str = "", subcategory: str = "") -> Dict[str, Any]:
        """Analyze a single audit question and return AI prompt and tool suggestion"""
        try:
            # Create the prompt
            prompt = self.analysis_prompt.format_messages(
                question=question,
                category=category,
                subcategory=subcategory
            )
            
            # Get response from LLM
            response = await self.llm.ainvoke(prompt)
            
            # Parse JSON response
            try:
                result = json.loads(response.content)
                
                # Validate required fields
                if not all(key in result for key in ["aiPrompt", "toolSuggestion", "connectorReason"]):
                    raise ValueError("Missing required fields in response")
                
                # Validate tool suggestion
                valid_tools = ["sql_server", "gnosis_path", "servicenow", "nas_path"]
                if result["toolSuggestion"] not in valid_tools:
                    result["toolSuggestion"] = "sql_server"  # Default fallback
                
                return result
                
            except json.JSONDecodeError:
                # Fallback response if JSON parsing fails
                return {
                    "aiPrompt": f"Analyze and provide data to answer: {question}",
                    "toolSuggestion": "sql_server",
                    "connectorReason": "Default selection - SQL Server is commonly used for audit data extraction"
                }
            
        except Exception as e:
            print(f"Error analyzing question: {str(e)}")
            # Fallback response for any other errors
            return {
                "aiPrompt": f"Analyze and provide data to answer: {question}",
                "toolSuggestion": "sql_server",
                "connectorReason": "Error occurred during analysis, using default tool selection"
            }

    async def analyze_questions_batch(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze multiple questions in batch"""
        results = []
        
        for question_data in questions:
            question = question_data.get("question", "")
            category = question_data.get("category", "")
            subcategory = question_data.get("subcategory", "")
            
            analysis = await self.analyze_question(question, category, subcategory)
            
            # Add original question data
            result = {
                "id": question_data.get("id", ""),
                "originalQuestion": question,
                "category": category,
                "subcategory": subcategory,
                "prompt": analysis["aiPrompt"],
                "toolSuggestion": analysis["toolSuggestion"],
                "connectorReason": analysis["connectorReason"],
                "connectorToUse": analysis["toolSuggestion"]
            }
            
            results.append(result)
        
        return results

# Global service instance
question_analysis_service = QuestionAnalysisService()

def get_question_analysis_service():
    return question_analysis_service