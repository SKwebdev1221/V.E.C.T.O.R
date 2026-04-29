import os
import re
import asyncio
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf

load_dotenv()

# Note: The gmail module is missing from the project, so we comment it out for now.
# from gmail.gmail_fetch import get_emails

app = FastAPI(title="V.E.C.T.O.R Spam Classifier", version="2.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Text preprocessing (must match training)
def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Load DL model with error handling
MODEL_PATH = os.getenv("MODEL_PATH", "backend/model/spam_model.keras")
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✅ Loaded DL model from {MODEL_PATH}")
    else:
        print(f"⚠️ Model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

class TextInput(BaseModel):
    text: str

# =========================================
# Health Check
# =========================================
@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

# =========================================
# API 1: Fetch & Classify Emails from Gmail
# =========================================
# @app.get("/emails", response_model=List[dict])
# async def emails():
#     if not os.path.exists(os.getenv("GMAIL_TOKEN_PATH", "backend/gmail/token.json")):
#         raise HTTPException(status_code=401, detail="Gmail token missing. Run /auth/gmail first.")
#
#     # emails_list = await asyncio.to_thread(get_emails)
#     emails_list = [] # Mocked since get_emails is missing
#
#     results = []
#     if model:
#         for mail in emails_list:
#             cleaned = clean_text(mail)
#             pred_prob = float(model.predict([cleaned], verbose=0)[0][0])
#             pred_label = "Spam" if pred_prob >= 0.5 else "Not Spam"
#             results.append({
#                 "text": mail,
#                 "prediction": pred_label,
#                 "confidence": round(max(pred_prob, 1 - pred_prob), 4)
#             })
#     else:
#         results = [{"text": mail, "prediction": "Model not loaded", "confidence": 0.0} for mail in emails_list]
#
#     return results

# =========================================
# API 2: Classify Single Email
# =========================================
@app.post("/classify", response_model=dict)
async def classify(input: TextInput):
    if not model:
        raise HTTPException(status_code=500, detail="DL model not loaded. Run python backend/train.py first.")

    cleaned = clean_text(input.text)
    pred_prob = float(model.predict(tf.constant([cleaned]), verbose=0)[0][0])
    pred_label = "Spam" if pred_prob >= 0.5 else "Not Spam"

    return {
        "score": round(pred_prob, 4),
        "label": pred_label,
        "confidence": round(max(pred_prob, 1 - pred_prob), 4)
    }

# =========================================
# Auth: Check Gmail Token
# =========================================
@app.get("/auth/gmail/status")
async def gmail_status():
    token_path = os.getenv("GMAIL_TOKEN_PATH", "backend/gmail/token.json")
    return {"token_exists": os.path.exists(token_path)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

