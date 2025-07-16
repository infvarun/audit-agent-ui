#!/usr/bin/env python3
"""
Create a realistic Excel file based on the provided image for testing Step 2 functionality
"""
import pandas as pd
import os

def create_realistic_excel():
    # Data based on the image provided
    data = {
        'ID': [
            '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '1.1', '1.2', '1.3',
            '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '4.1', '4.2', '4.3', '5.1'
        ],
        'Process': [
            'General', 'General', 'General', 'General', 'General', 'General', 'General',
            'Computer Operations', 'Computer Operations', 'Computer Operations',
            'Database Management', 'Database Management', 'Database Management',
            'Security Controls', 'Security Controls', 'Security Controls',
            'Change Management', 'Change Management', 'Change Management',
            'Backup & Recovery'
        ],
        'Sub-process': [
            'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
            'Manage Operations', 'System Monitoring', 'Performance Management',
            'Data Administration', 'Access Control', 'Data Quality',
            'Access Management', 'Vulnerability Assessment', 'Incident Response',
            'Configuration Management', 'Release Management', 'Testing Procedures',
            'Backup Procedures'
        ],
        'Data Request': [
            'The completed Common Requirements Set Assessment with the description/documentation of the control(s) that satisfy each requirement',
            'Completed Software Matrix for in-scope applications/processes. Identify development, testing, staging and production environments for Impala 2.0',
            'Please provide an IT organization chart for your group, indicating role/function/activities/accountability/responsibility of all colleagues and contractors as well as support groups. This should include individuals considered developers or database administrators (if applicable)',
            'Please provide an inventory (title, owner, scope) of Standard Operating Procedures (SOPs) that are utilized in your IT environment (if not otherwise requested)',
            'Complete the SOD Matrix in Data Request in "IT SOD" tab',
            'Please complete the "IT Contacts" tab',
            'Please prepare an overview of the in-scope application to assist the CA IT audit team in understanding the functions of the application, the purpose of the application in supporting the business, integration with other applications',
            'Please provide a list of any daily, weekly, monthly, or quarterly system operations (e.g., jobs, batch jobs, processing) performed by your application management',
            'Please provide documentation of monitoring procedures and tools used to monitor system performance, availability, and capacity',
            'Please provide evidence of system performance reports and capacity planning documentation',
            'Please provide database administration policies and procedures documentation',
            'Please provide documentation of database user access controls and privilege management',
            'Please provide evidence of data quality monitoring and validation procedures',
            'Please provide user access management policies and procedures for the application',
            'Please provide evidence of vulnerability assessment reports and remediation tracking',
            'Please provide incident response procedures and escalation matrix',
            'Please provide change management policies and procedures documentation',
            'Please provide evidence of release management process and approval workflows',
            'Please provide testing procedures and test result documentation',
            'Please provide backup and recovery procedures documentation'
        ],
        'Due Contact': [
            'Yong', 'Yong', 'Yong', 'Yong', 'Yong', 'Yong', 'Varun', 'Varun', 'Varun', 'Varun',
            'Mike', 'Mike', 'Mike', 'Sarah', 'Sarah', 'Sarah', 'David', 'David', 'David', 'Alex'
        ],
        'Auditor': [
            'TBD', 'TBD', 'TBD', 'TBD', 'TBD', 'Josh', 'Josh', 'TBD', 'TBD', 'TBD',
            'Lisa', 'Lisa', 'Lisa', 'Mark', 'Mark', 'Mark', 'Emma', 'Emma', 'Emma', 'John'
        ]
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to Excel
    filename = 'realistic_audit_questions.xlsx'
    df.to_excel(filename, index=False)
    print(f"Realistic Excel file created: {filename}")
    
    # Also create a follow-up questions file
    followup_data = {
        'ID': ['F1.1', 'F1.2', 'F1.3', 'F2.1', 'F2.2', 'F3.1', 'F3.2', 'F3.3'],
        'Process': [
            'Follow-up General', 'Follow-up General', 'Follow-up General',
            'Follow-up Security', 'Follow-up Security',
            'Follow-up Operations', 'Follow-up Operations', 'Follow-up Operations'
        ],
        'Sub-process': [
            'Documentation Review', 'Process Validation', 'Gap Analysis',
            'Security Assessment', 'Risk Evaluation',
            'Operational Review', 'Monitoring Assessment', 'Performance Analysis'
        ],
        'Data Request': [
            'Please provide additional documentation for any gaps identified in the initial assessment',
            'Please validate the processes documented in the initial submission',
            'Please provide analysis of any gaps between current state and required controls',
            'Please provide additional security documentation based on initial findings',
            'Please provide risk assessment documentation for identified vulnerabilities',
            'Please provide additional operational procedures not covered in initial submission',
            'Please provide enhanced monitoring procedures based on audit findings',
            'Please provide performance metrics and KPIs for the reviewed processes'
        ],
        'Due Contact': ['Yong', 'Varun', 'Mike', 'Sarah', 'David', 'Alex', 'Lisa', 'Mark'],
        'Auditor': ['Josh', 'Josh', 'Lisa', 'Mark', 'Mark', 'Emma', 'Emma', 'John']
    }
    
    df_followup = pd.DataFrame(followup_data)
    filename_followup = 'followup_audit_questions.xlsx'
    df_followup.to_excel(filename_followup, index=False)
    print(f"Follow-up Excel file created: {filename_followup}")
    
    return filename, filename_followup

if __name__ == "__main__":
    create_realistic_excel()