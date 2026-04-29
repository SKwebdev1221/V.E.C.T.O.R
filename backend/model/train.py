import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import re
import os
import random

# Only load the needed columns to avoid issues with trailing commas
df = pd.read_csv(r"D:\Users\Sahil V Kesarkar\V.E.C.T.O.R\backend\data\enron_spam_data.csv", usecols=['Subject', 'Message', 'Spam/Ham'])

def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def augment_text(text):
    words = text.split()
    if len(words) < 5:
        return text
    if random.random() < 0.3:
        i = random.randint(0, len(words)-1)
        words.pop(i)
    if random.random() < 0.3:
        i = random.randint(0, len(words)-2)
        words[i], words[i+1] = words[i+1], words[i]
    return " ".join(words)

df['Subject'] = df['Subject'].fillna('')
df['Message'] = df['Message'].fillna('')
df['text'] = (df['Subject'] + " " + df['Message']).apply(clean_text)

df = df.dropna(subset=['Spam/Ham'])
df = df[df['Spam/Ham'].isin(['spam','ham'])]
df['label'] = df['Spam/Ham'].map({'spam':1,'ham':0})

X = df['text'].astype(str)
y = df['label'].astype(int)

aug_X = []
aug_y = []

for text,label in zip(X,y):
    aug_X.append(text)
    aug_y.append(label)
    if label == 1:
        aug_X.append(augment_text(text))
        aug_y.append(label)

X = np.array(aug_X, dtype=object)
y = np.array(aug_y)

X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2,random_state=42,stratify=y)

MAX_VOCAB_SIZE = 25000
MAX_SEQUENCE_LENGTH = 300
EMBEDDING_DIM = 128

vectorize_layer = layers.TextVectorization(
    max_tokens=MAX_VOCAB_SIZE,
    output_mode='int',
    output_sequence_length=MAX_SEQUENCE_LENGTH,
    standardize=None
)

vectorize_layer.adapt(X_train)

inputs = tf.keras.Input(shape=(1,),dtype=tf.string)
x = vectorize_layer(inputs)
x = layers.Embedding(MAX_VOCAB_SIZE,EMBEDDING_DIM,mask_zero=True)(x)

x = layers.Conv1D(128,5,activation='relu',padding='same')(x)
x = layers.BatchNormalization()(x)
x = layers.MaxPooling1D(2)(x)
x = layers.Dropout(0.3)(x)

x = layers.Conv1D(64,3,activation='relu',padding='same')(x)
x = layers.BatchNormalization()(x)
x = layers.MaxPooling1D(2)(x)
x = layers.Dropout(0.3)(x)

x = layers.Bidirectional(layers.LSTM(64,return_sequences=True))(x)
x = layers.Dropout(0.3)(x)
x = layers.Bidirectional(layers.LSTM(32))(x)
x = layers.Dropout(0.3)(x)

x = layers.Dense(64,activation='relu')(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.4)(x)

outputs = layers.Dense(1,activation='sigmoid')(x)

model = models.Model(inputs,outputs)

model.compile(
    loss='binary_crossentropy',
    optimizer=tf.keras.optimizers.Adam(1e-3),
    metrics=['accuracy',tf.keras.metrics.AUC(name='auc')]
)

checkpoint_cb = callbacks.ModelCheckpoint("spam_dl_model.keras",monitor='val_auc',mode='max',save_best_only=True)
early_stop_cb = callbacks.EarlyStopping(monitor='val_auc',patience=5,restore_best_weights=True)
reduce_lr_cb = callbacks.ReduceLROnPlateau(monitor='val_loss',factor=0.5,patience=2,min_lr=1e-6)

model.fit(
    X_train,y_train,
    validation_data=(X_test,y_test),
    epochs=20,
    batch_size=64,
    callbacks=[checkpoint_cb,early_stop_cb,reduce_lr_cb],
    verbose=1
)

y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob>=0.5).astype(int)

print(classification_report(y_test,y_pred))
print(confusion_matrix(y_test,y_pred))
print(roc_auc_score(y_test,y_pred_prob))

model.save("spam_dl_model_final.keras")