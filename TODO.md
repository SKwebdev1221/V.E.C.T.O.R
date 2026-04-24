# Spam Email Detector DL Model - Task Plan

## Goal

Build a nice spam email detector using text embeddings and feature extraction DL model, trained on Enron spam data (`backend/data/enron_spam_data.csv`). Model code in `backend/train.py`, backend API in `backend/app.py`.

## Steps

- [x] Step 1: Rewrite `backend/train.py` with robust DL model (Embedding + Conv1D + BiLSTM + Dense).
- [x] Step 2: Update `backend/app.py` to load and use the new Keras model instead of sklearn pickles.
- [x] Step 3: Update `backend/requirements-new.txt` to ensure all DL dependencies are present.
- [x] Step 4: Test training script execution (optional, depending on environment).

## Information Gathered

- Dataset: `backend/data/enron_spam_data.csv` has columns `Unnamed: 0`, `Subject`, `Message`, `Spam/Ham`, `Date`.
- Current `train.py` has a very basic TF model (Embedding + GlobalAveragePooling1D).
- Current `app.py` still uses old sklearn pickle models (`spam_model.pkl`, `tfidf.pkl`).
- Requirements already include `tensorflow`, but app needs alignment.
