import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
import os

# Ensure model directory exists
os.makedirs("model", exist_ok=True)

print("Loading dataset...")
# Load dataset
df = pd.read_csv(r"D:\Users\Sahil V Kesarkar\V.E.C.T.O.R\backend\data\enron_spam_data.csv")

import random

# Preprocess
# Combine Subject and Message for better context. Replace NaNs with empty strings.

print("Injecting synthetic modern dataset for better real-world performance...")
modern_spam = [
    'URGENT: Your account has been suspended. Click here to verify your identity.',
    'You have won a $1000 gift card! Claim your prize now at this link.',
    'Limited time offer: Get 80% off on all items! Buy now!',
    'Work from home and earn $5000 a week. No experience needed. Apply today!',
    'Your package is waiting for delivery. Please pay the shipping fee here.',
    'Congratulations! You are the lucky winner of a brand new iPhone. Click to claim.',
    'Your Netflix subscription has expired. Update your payment details immediately.',
    'Important security alert: We detected unusual activity on your account. Log in to check.',
    'Earn crypto fast! Invest $10 and get $1000 in 24 hours. Guaranteed returns.',
    'Exclusive job offer: Remote assistant needed. High pay. Contact us now.',
    'Meet singles in your area tonight! Click here to chat.',
    'Lose weight fast with our miracle pill! 100% natural. Order now.',
    'Your bank account is locked. Verify your information to unlock it.',
    'Claim your free trial of our premium service. Sign up today!',
    'We have a special promotion just for you! Do not miss out.',
    'Internshala job offer. Check out our curated list for you. Remote Immediately Competitive salary No experience required',
    'Assistant Channel Manager DTDC Express Limited Remote Immediately Competitive salary No experience required 3 weeks ago JobApply now'
]

modern_ham = [
    'Hi team, the meeting is scheduled for 10 AM tomorrow. Please review the attached document.',
    'Can you send me the latest report by EOD? Thanks.',
    'Are we still on for lunch today? Let me know.',
    'Please find attached the invoice for your recent purchase.',
    'Just checking in to see how the project is progressing.',
    'Reminder: doctor appointment at 3 PM on Thursday.',
    'Let us discuss the new strategy during our next call.',
    'Happy birthday! Hope you have a great day.',
    'I will be out of the office next week. Please contact Jane for any urgent matters.',
    'Thanks for the update. Let me know if you need any help.',
    'Do you have time for a quick chat later?',
    'The code has been deployed to production successfully.',
    'Can we reschedule our meeting to next week?',
    'I have reviewed your pull request and left some comments.',
    'Looking forward to seeing you at the conference.',
    'Reminder to fill this form if you have participated in sports. The link is given below again. The data related to the participation of students in sports and their achievements is essential for the institute. The form is made to collect the data (From 1st July 2025 to till date only) and the link for the same is as follows. https://forms.gle/xuPbEFWZAqnqZm1v9 Thank you.'
]

data = []
for _ in range(500):
    for spam_msg in modern_spam:
        data.append({'Message ID': random.randint(100000, 999999), 'Subject': 'Spam', 'Message': spam_msg, 'Spam/Ham': 'spam', 'Date': '2026-04-24'})
    for ham_msg in modern_ham:
        data.append({'Message ID': random.randint(100000, 999999), 'Subject': 'Ham', 'Message': ham_msg, 'Spam/Ham': 'ham', 'Date': '2026-04-24'})

df = pd.concat([df, pd.DataFrame(data)], ignore_index=True)
df['Subject'] = df['Subject'].fillna('')
df['Message'] = df['Message'].fillna('')
df['text'] = df['Subject'] + " " + df['Message']

# Map labels: spam=1, ham=0
df = df.dropna(subset=['Spam/Ham'])
df['label'] = df['Spam/Ham'].map({'spam': 1, 'ham': 0})

X = df['text'].astype(str)
y = df['label'].astype(int)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

batch_size = 32

train_dataset = tf.data.Dataset.from_tensor_slices((X_train.tolist(), y_train.tolist())).batch(batch_size)
test_dataset = tf.data.Dataset.from_tensor_slices((X_test.tolist(), y_test.tolist())).batch(batch_size)

print(f"Training on {len(X_train)} samples, validating on {len(X_test)} samples.")

# 1. Create TextVectorization layer
max_vocab_size = 10000
max_sequence_length = 250

vectorize_layer = tf.keras.layers.TextVectorization(
    max_tokens=max_vocab_size,
    output_mode='int',
    output_sequence_length=max_sequence_length
)

print("Adapting vectorization layer to training data (this may take a moment)...")
vectorize_layer.adapt(X_train.tolist())

# 2. Build the Model
embedding_dim = 32

model = tf.keras.Sequential([
    tf.keras.Input(shape=(1,), dtype=tf.string),
    vectorize_layer,
    tf.keras.layers.Embedding(input_dim=max_vocab_size, output_dim=embedding_dim),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(
    loss='binary_crossentropy',
    optimizer='adam',
    metrics=['accuracy']
)

model.summary()

# 3. Train the Model
print("Starting training...")
epochs = 5

history = model.fit(
    train_dataset,
    validation_data=test_dataset,
    epochs=epochs
)

# 4. Save the Model
model_path = "model/spam_model.keras"
model.save(model_path)

print(f"Deep Learning model trained and saved successfully at {model_path}!")