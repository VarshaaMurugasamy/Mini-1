import os
import json
import re
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'classifier.joblib')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'vectorizer.joblib')
METRICS_PATH = os.path.join(MODEL_DIR, 'metrics.json')

classifier = None
vectorizer = None
metrics = {}

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def load_model_assets():
    global classifier, vectorizer, metrics
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            classifier = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            print("Classifier and Vectorizer successfully loaded.")
        else:
            print(f"Model files not found in {MODEL_DIR}. Please run train_model.py first.")

        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r', encoding='utf-8') as f:
                metrics = json.load(f)
            print("Model metrics loaded.")
    except Exception as e:
        print(f"Error loading model assets: {e}")

load_model_assets()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "service": "AI Root Cause Category Classifier",
        "model_loaded": classifier is not None and vectorizer is not None,
        "classes": [str(c) for c in classifier.classes_] if classifier is not None else []
    }), 200

@app.route('/metrics', methods=['GET'])
def get_metrics():
    if not metrics:
        return jsonify({"message": "Metrics not yet generated. Please train the model."}), 404
    return jsonify(metrics), 200

@app.route('/predict', methods=['POST'])
def predict_category():
    if classifier is None or vectorizer is None:
        return jsonify({
            "error": "Model is not trained or loaded. Please train the model first."
        }), 503

    data = request.get_json(force=True, silent=True) or {}
    text = data.get('text', '').strip()
    title = data.get('title', '').strip()

    combined_text = f"{title} {text}".strip()
    if not combined_text:
        return jsonify({
            "predicted_category": "Other / Unknown",
            "confidence": 0.0,
            "confidence_level": "low",
            "is_low_confidence": True,
            "reason": "Empty description provided"
        }), 200

    cleaned = clean_text(combined_text)
    if len(cleaned.split()) < 2:
        return jsonify({
            "predicted_category": "Other / Unknown",
            "confidence": 0.20,
            "confidence_level": "low",
            "is_low_confidence": True,
            "reason": "Text is too short or ambiguous to classify reliably with high confidence."
        }), 200

    vec = vectorizer.transform([cleaned])
    probabilities = classifier.predict_proba(vec)[0]
    classes = classifier.classes_

    class_prob_map = {str(classes[i]): round(float(probabilities[i]), 4) for i in range(len(classes))}
    
    top_idx = int(probabilities.argmax())
    top_class = str(classes[top_idx])
    top_confidence = round(float(probabilities[top_idx]), 4)

    threshold = float(data.get('threshold', 0.25))
    is_low_conf = top_confidence < threshold

    confidence_level = "high" if top_confidence >= 0.65 else ("medium" if top_confidence >= 0.40 else "low")
    
    final_category = top_class
    if is_low_conf:
        final_category = "Other / Unknown"

    return jsonify({
        "predicted_category": final_category,
        "raw_predicted_category": top_class,
        "confidence": top_confidence,
        "confidence_level": confidence_level,
        "is_low_confidence": is_low_conf,
        "class_probabilities": class_prob_map,
        "model_architecture": metrics.get("model_type", "TF-IDF + Text Classifier"),
        "processed_text": cleaned
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting ML Microservice on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
