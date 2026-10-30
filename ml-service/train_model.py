import os
import json
import re
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, 'dataset', 'tickets_dataset.csv')
    model_dir = os.path.join(base_dir, 'model')
    os.makedirs(model_dir, exist_ok=True)

    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    df['cleaned_text'] = df['text'].apply(clean_text)

    X = df['cleaned_text']
    y = df['category']

    # Stratified split 80/20 for better training data representation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\nTraining set size: {len(X_train)} | Test set size: {len(X_test)}")

    # Unigram TF-IDF with English stop words removal reduces sparsity significantly on small text datasets
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 1),
        stop_words='english',
        sublinear_tf=True,
        norm='l2'
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Multinomial Naive Bayes performs exceptionally well on text classification with limited training data
    nb_classifier = MultinomialNB(alpha=0.3)
    nb_classifier.fit(X_train_vec, y_train)
    y_pred_nb = nb_classifier.predict(X_test_vec)
    acc_nb = accuracy_score(y_test, y_pred_nb)

    # Logistic Regression with tuned C
    lr_classifier = LogisticRegression(C=3.0, max_iter=1000, random_state=42, solver='lbfgs')
    lr_classifier.fit(X_train_vec, y_train)
    y_pred_lr = lr_classifier.predict(X_test_vec)
    acc_lr = accuracy_score(y_test, y_pred_lr)

    print(f"MultinomialNB Accuracy: {acc_nb:.4f}")
    print(f"LogisticRegression Accuracy: {acc_lr:.4f}")

    # Select the better performing model
    if acc_nb >= acc_lr:
        best_model = nb_classifier
        y_pred = y_pred_nb
        model_name = "Multinomial Naive Bayes (TF-IDF)"
        acc = acc_nb
    else:
        best_model = lr_classifier
        y_pred = y_pred_lr
        model_name = "Logistic Regression (TF-IDF)"
        acc = acc_lr

    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)

    print("\n================== BEST MODEL EVALUATION RESULTS ==================")
    print(f"Model Type:        {model_name}")
    print(f"Overall Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"Weighted Precision: {prec:.4f}")
    print(f"Weighted Recall:    {rec:.4f}")
    print(f"Weighted F1-Score:  {f1:.4f}")
    print("===================================================================")
    print("\nDetailed Classification Report:")
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    print(classification_report(y_test, y_pred, zero_division=0))

    classes = sorted(list(set(y)))
    cm = confusion_matrix(y_test, y_pred, labels=classes)

    model_path = os.path.join(model_dir, 'classifier.joblib')
    vectorizer_path = os.path.join(model_dir, 'vectorizer.joblib')
    metrics_path = os.path.join(model_dir, 'metrics.json')

    joblib.dump(best_model, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    metrics_data = {
        "model_type": model_name,
        "accuracy": round(float(acc), 4),
        "weighted_precision": round(float(prec), 4),
        "weighted_recall": round(float(rec), 4),
        "weighted_f1": round(float(f1), 4),
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "classes": classes,
        "classification_report": report_dict,
        "confusion_matrix": cm.tolist()
    }

    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_data, f, indent=2)

    print(f"\nModel artifacts successfully saved to {model_dir}")
    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
