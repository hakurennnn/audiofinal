#flask voice.py
import numpy as np
import tensorflow as tf
import librosa
from pydub import AudioSegment
from flask import Flask, render_template, request, jsonify
from cors_config import init_cors
import os
import tempfile
import traceback
import json

# Global Variables
PORT = 8080
SUPPORTED_EXTENSIONS = ('.wav', '.mp3', '.m4a', '.aac', '.3gp')

app = Flask(__name__)
init_cors(app)

def allowed_file(filename):
    return filename.lower().endswith(SUPPORTED_EXTENSIONS)

def create_model(input_shape):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=input_shape),
        tf.keras.layers.Conv1D(64, kernel_size=3, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Conv1D(128, kernel_size=3, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Conv1D(256, kernel_size=3, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=1),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Bidirectional(tf.keras.layers.GRU(128, return_sequences=True)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Bidirectional(tf.keras.layers.GRU(64)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(128, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    return model

input_shape = (28, 295)
model = create_model(input_shape)
model.load_weights('bestbigru.h5')

@app.route('/')
@app.route('/home')
def home():
    return render_template('main.html')

def load_audio_with_pydub(file_path):
    try:
        audio = AudioSegment.from_file(file_path)
        sr = audio.frame_rate
        audio_data = np.array(audio.get_array_of_samples(), dtype=np.float32)
        if audio.channels == 2:  # Convert stereo to mono if necessary
            audio_data = audio_data.reshape(-1, 2).mean(axis=1)
        print(f"[load_audio_with_pydub] : Successfully loaded audio file {file_path} with sample rate {sr}")
        return audio_data, sr
    except Exception as e:
        print(f"[load_audio_with_pydub] : Error loading audio file with pydub: {e}")
        traceback.print_exc()
        raise

def extract_custom_features(audio_data):
    try:
        # Ensure audio is resampled to 16kHz for consistency
        audio_data = librosa.resample(audio_data, orig_sr=22050, target_sr=16000)
        
        mfcc_features = librosa.feature.mfcc(y=audio_data, sr=16000, n_mfcc=20)
        mfcc_features = np.mean(mfcc_features.T, axis=0)

        chroma_features = librosa.feature.chroma_stft(y=audio_data, sr=16000)
        chroma_features = np.mean(chroma_features.T, axis=0)

        spectral_contrast = librosa.feature.spectral_contrast(y=audio_data, sr=16000)
        spectral_contrast = np.mean(spectral_contrast.T, axis=0)

        mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=16000)
        mel_spectrogram = np.mean(mel_spectrogram.T, axis=0)

        combined_features = np.concatenate([
            mfcc_features,
            chroma_features,
            spectral_contrast,
            mel_spectrogram,
        ])
        
        print(f"[extract_custom_features] : Successfully extracted custom features with shape {combined_features.shape}")
        return combined_features
    except Exception as e:
        print(f"[extract_custom_features] : Error extracting custom features: {e}")
        traceback.print_exc()
        raise

@app.route('/process_audio', methods=['POST'])
def process_audio():
    print("[process_audio] : Processing audio files")
    files = request.files.getlist('audio_files')
    audios = []

    if not files:
        print("[process_audio] : No files found in the request")
        return jsonify({"error": "No files found in the request"}), 400

    for file in files:
        filename = file.filename
        if not allowed_file(filename):
            error_msg = f"[process_audio] : File type {filename} is not allowed. Supported types are {SUPPORTED_EXTENSIONS}"
            print(error_msg)
            return jsonify({"error": error_msg}), 400

        try:
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, filename)
            file.save(temp_path)

            try:
                audio_data, sr = load_audio_with_pydub(temp_path)
                print(f"[process_audio] : Audio data loaded with sample rate {sr}")

                # Extract custom features
                custom_features = extract_custom_features(audio_data)
                print(f"[process_audio] : Custom features extracted with shape {custom_features.shape}")

                # Reshape features for prediction
                num_time_frames = input_shape[1]
                custom_features_expanded = np.repeat(custom_features[:, np.newaxis], num_time_frames, axis=1)
                custom_features_expanded = np.expand_dims(custom_features_expanded, axis=0)  # Add batch dimension

                # Make prediction
                prediction = model.predict(custom_features_expanded)
                predicted_class = int(prediction > 0.5)  # Convert sigmoid output to binary class
                print(f"[process_audio] : Prediction made: {prediction}")

                # Map predictions to labels
                labels = ['FAKE', 'REAL']
                predicted_label = labels[predicted_class]

                audios.append({"filename": filename, "prediction": predicted_label})
            except Exception as e:
                print(f"[process_audio] : Error processing file {filename}: {e}")
                traceback.print_exc()
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"[process_audio] : Temporary file {temp_path} deleted")

    save_results(audios)

    response = jsonify({
        "message": "Features extracted and classified successfully",
        "audios": audios
    })
    print(f"[process_audio] : Response: {response.get_data(as_text=True)}")
    return response

def save_results(audios):
    try:
        results_path = 'results.json'
        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                all_results = json.load(f)
        else:
            all_results = []

        all_results.extend(audios)

        with open(results_path, 'w') as f:
            json.dump(all_results, f)
        print(f"[save_results] : Results successfully saved to {results_path}")
    except Exception as e:
        print(f"[save_results] : Error saving results: {e}")
        traceback.print_exc()

@app.route('/audio_results', methods=['GET'])
def get_audio_results():
    try:
        results_path = 'results.json'
        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                audios = json.load(f)
            print(f"[get_audio_results] : Successfully retrieved results")
            return jsonify(audios)
        else:
            print(f"[get_audio_results] : No results found at {results_path}")
            return jsonify({"message": "No results found"}), 404
    except Exception as e:
        print(f"[get_audio_results] : Error retrieving results: {e}")
        traceback.print_exc()
        return jsonify({"error": "Error retrieving results"}), 500

if __name__ == '__main__':
    try:
        print("[main] : Starting Flask server...")
        app.run(host='0.0.0.0', port=PORT, debug=True)
        print(f"[main] : Flask server started on port {PORT}")
    except Exception as e:
        print(f"[main] : Error starting Flask server: {e}")
        traceback.print_exc()
