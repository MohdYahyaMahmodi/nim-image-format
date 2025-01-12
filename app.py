"""
app.py

A minimal Flask web server to:
1) Render index.html
2) Provide /encode endpoint to upload an image and get .nim

Directory structure assumption:
  my_nim_project/
    |- app.py
    |- nim_encoder.py
    |- templates/
       |- index.html
    |- static/
       |- nimview.js
       |- styles.css

Run:
  python app.py

Visit:
  http://127.0.0.1:5000
"""

import os
import io
from flask import Flask, request, jsonify, make_response, render_template, send_file
from nim_encoder import encode_to_nim

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    """
    Render the main index.html page (user interface).
    """
    return render_template("index.html")

@app.route("/encode", methods=["POST"])
def encode_image():
    """
    Endpoint to encode an uploaded image into .nim.

    Expects 'imageFile' as form-data (file upload).
    Returns .nim as a downloadable file or JSON error.
    """
    if "imageFile" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    f = request.files["imageFile"]
    if f.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        image_bytes = f.read()
        nim_data = encode_to_nim(image_bytes)

        filename_no_ext = os.path.splitext(f.filename)[0] or "image"
        # Return as a file download
        response = make_response(nim_data)
        response.headers["Content-Disposition"] = (
            f'attachment; filename="{filename_no_ext}.nim"'
        )
        response.mimetype = "application/octet-stream"
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    # Development server
    app.run(debug=True, port=5000)
