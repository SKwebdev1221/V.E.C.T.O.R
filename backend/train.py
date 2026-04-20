import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import MultinomialNB

# Load dataset
df = pd.read_csv(r"D:\Users\Sahil V Kesarkar\V.E.C.T.O.R\backend\data\combined_data copy.csv")

# Preprocess
df = df[['text', 'label']].dropna()

le = LabelEncoder() 
df['label'] = le.fit_transform(df['label'])

X = df['text']
y = df['label']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# TF-IDF
tfidf = TfidfVectorizer(max_features=5000, stop_words='english')
X_train_tfidf = tfidf.fit_transform(X_train)

# Model
model = MultinomialNB()
model.fit(X_train_tfidf, y_train)

# Save model
pickle.dump(model, open("model/spam_model.pkl", "wb"))
pickle.dump(tfidf, open("model/tfidf.pkl", "wb"))

print("✅ Model trained and saved successfully!")