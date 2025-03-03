import joblib
import json
import os
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer
from flask import Flask, request, jsonify

app = Flask(__name__)
# Load model & vectorizer
def model_fn(model_dir):
    model_path = os.path.join(model_dir, "mymodel.joblib")
    vectorizer_path = os.path.join(model_dir, "feature.joblib")
    model= joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    return model, vectorizer

nb_model, vectorizer = model_fn("/opt/ml/model")

# Handle inference requests
def input_fn(request_body, request_content_type):
    if request_content_type == "application/json":
        data = json.loads(request_body)
        return data["text"]
    raise ValueError("Unsupported content type")

@app.route("/ping", methods=["GET"])
def ping():
    """Health check endpoint.""" 
    return jsonify({"status": "OK"}), 200

@app.route("/invocations",methods=["POST"])
def invocation():
    try:
        input_data = request.get_data(as_text = True)
        
        text = input_fn(input_data, request.content_type)
        
        input_vector = vectorizer.transform([text])
        
        prediction = nb_model.predict(input_vector)
        
        return jsonify({"prediction": prediction[0]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500