import joblib
import json
import os
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer
from flask import Flask, request, jsonify

app = Flask(__name__)
# Load model & vectorizer
def model_fn(model_dir):
    model = joblib.load(os.path.join("/Users/vishnusaibollam/Desktop/my-app", "mymodel.joblib"))
    vectorizer = joblib.load(os.path.join("/Users/vishnusaibollam/Desktop/my-app", "feature.joblib"))
    return model, vectorizer

# Handle inference requests
def input_fn(request_body, request_content_type):
    if request_content_type == "application/json":
        data = json.loads(request_body)
        return data["text"]
    raise ValueError("Unsupported content type")

@app.route("/invocations",methods=["POST"])
def predict_fn(input_data, model):
    nb_model, vectorizer = model
    input_vector = vectorizer.transform([input_data])
    prediction = nb_model.predict(input_vector)
    return {"prediction": int(prediction[0])}

@app.route("/ping", methods=["GET"])
def ping():
    return "OK", 200