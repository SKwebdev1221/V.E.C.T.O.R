from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import List
import pickle
import os
from dotenv import load_dotenv  
import asyncio

load_dotenv()

from gmail.gmail_fetch import get_emails

app = FastAPI(title="V.E.C.T.O.R Spam Classifier", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models with error handling
try:
    model = pickle.load(open(os.getenv("MODEL_PATH", "model/spam_model.pkl"), "rb"))
    tfidf = pickle.load(open(os.getenv("TFIDF_PATH", "model/tfidf.pkl"), "rb"))
except FileNotFoundError:
    model = None
    tfidf = None

class TextInput(BaseModel):
    text: str

# =========================================
# Health Check
# =========================================
@app.get("/health")
async def health():
    return {"status": "healthy", "models_loaded": model is not None}

# =========================================
# API 1: Fetch & Classify Emails from Gmail
# =========================================
@app.get("/emails", response_model=List[dict])
async def emails():
    if not os.path.exists(os.getenv("GMAIL_TOKEN_PATH", "gmail/token.json")):
        raise HTTPException(status_code=401, detail="Gmail token missing. Run /auth/gmail first.")
    
    emails_list = await asyncio.to_thread(get_emails)
    
    results = []
    if model and tfidf:
        for mail in emails_list:
            vec = tfidf.transform([mail])
            pred = model.predict(vec)[0]
            results.append({
                "text": mail,
                "prediction": "Spam" if pred == 1 else "Not Spam",
                "confidence": float(model.predict_proba(vec)[0].max())
            })
    else:
        results = [{"text": mail, "prediction": "Models not loaded", "confidence": 0.0} for mail in emails_list]
    
    return results

# =========================================
# API 2: Classify Single Email
# =========================================
@app.post("/classify", response_model=dict)
async def classify(input: TextInput):
    if not model or not tfidf:
        raise HTTPException(status_code=500, detail="Models not loaded. Run python train.py")
    
    vec = tfidf.transform([input.text])
    pred = model.predict(vec)[0]
    probs = model.predict_proba(vec)[0]
    
    return {
        "text": input.text,
        "prediction": "Spam" if pred == 1 else "Not Spam",
        "confidence": float(probs.max()),
        "probabilities": {"spam": float(probs[1]), "ham": float(probs[0])}
    }

# =========================================
# Auth: Check Gmail Token
# =========================================
@app.get("/auth/gmail/status")
async def gmail_status():
    token_path = os.getenv("GMAIL_TOKEN_PATH", "gmail/token.json")
    return {"token_exists": os.path.exists(token_path)}

# Note: Full OAuth flow needs frontend redirect (credentials.json for quickstart)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

