from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os
from dotenv import load_dotenv

load_dotenv()

async def get_emails(limit: int = 5):
    token_path = os.getenv("GMAIL_TOKEN_PATH", "token.json")
    creds = Credentials.from_authorized_user_file(token_path)
    
    service = build('gmail', 'v1', credentials=creds)
    
    results = service.users().messages().list(userId='me', maxResults=limit).execute()
    messages = results.get('messages', [])
    
    email_texts = []
    
    for msg in messages:
        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        
        # Get full body + subject
        payload = msg_data['payload']
        headers = payload.get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        
        # Simple body extract (snippet fallback)
        body = payload.get('body', {}).get('data', '')
        if body:
            try:
                body = body.decode('utf-8')  # Base64 decode if needed
            except:
                body = msg_data['snippet']
        else:
            body = msg_data['snippet']
        
        email_texts.append(f"Subject: {subject}\\n\\n{body[:1000]}")  # Truncate long bodies
    
    return email_texts

