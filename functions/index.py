#index.py
import firebase_functions as functions
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import librosa
import tempfile
import os
import tensorflow_hub as hub
from concurrent.futures import ThreadPoolExecutor

# Initialize Flask app
app = Flask(__name__)

# Load the model
print("Loading model...")
model = tf.keras.models.load_model('bestbigru.h5')
vggish_model_handle = 'https://tfhub.dev/google/vggish/1'
vggish_layer = hub.KerasLayer(vggish_model_handle, trainable=True)
print("Model and VGGish layer loaded")

def extract_vggish_features(audio_data):
    print("Extracting VGGish features")
    features = vggish_layer(tf.convert_to_tensor(audio_data, dtype=tf.float32)).numpy()
    print("VGGish features shape:", features.shape)
    return features

def extract_features(audio_data):
    print("Extracting custom features")
    mfcc_features = librosa.feature.mfcc(y=audio_data, sr=22050, n_mfcc=20)
    mfcc_features = np.mean(mfcc_features.T, axis=0)
    chroma_features = librosa.feature.chroma_stft(y=audio_data, sr=22050)
    chroma_features = np.mean(chroma_features.T, axis=0)
    spectral_contrast = librosa.feature.spectral_contrast(y=audio_data, sr=22050)
    spectral_contrast = np.mean(spectral_contrast.T, axis=0)
    mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=22050)
    mel_spectrogram = np.mean(mel_spectrogram.T, axis=0)
    combined_features = np.concatenate([mfcc_features, chroma_features, spectral_contrast, mel_spectrogram])
    print("Custom features shape:", combined_features.shape)
    return combined_features

@app.route('/process', methods=['POST'])
def process_audio():
    print("Received request for /process")
    files = request.files.getlist('files')
    if not files:
        print("No files found in the request")
        return jsonify({"error": "No files provided"}), 400

    audios = []

    for file in files:
        if not allowed_file(file.filename):
            print(f"File type {file.filename} is not allowed. Supported types are {SUPPORTED_EXTENSIONS}")
            continue

        try:
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, file.filename)
            file.save(temp_path)
            print(f"Saved file to temporary location: {temp_path}")
            
            # Load the audio file using librosa
            audio, _ = librosa.load(temp_path, sr=22050)
            audios.append(audio)
            
            # Remove the temporary file
            os.remove(temp_path)
        except Exception as e:
            print(f"Error loading {file.filename}: {e}")
            continue

    if not audios:
        return jsonify({"error": "No valid audio files were loaded"}), 400

    max_len = 22050 * 5
    audios_padded = [np.pad(audio, (0, max_len - len(audio)), 'constant') if len(audio) < max_len else audio[:max_len] for audio in audios]
    print(f"Padded audios length: {len(audios_padded)}")

    with ThreadPoolExecutor(max_workers=8) as executor:
        print("Extracting VGGish features...")
        vggish_features = list(executor.map(extract_vggish_features, audios_padded))
    vggish_features = np.array(vggish_features)
    vggish_features = np.squeeze(vggish_features)
    print("VGGish features extracted")

    with ThreadPoolExecutor(max_workers=8) as executor:
        print("Extracting custom features...")
        custom_features = list(executor.map(extract_features, audios_padded))
    custom_features = np.array(custom_features)
    print("Custom features extracted")

    if vggish_features.ndim == 2:
        vggish_features = np.expand_dims(vggish_features, axis=0)
    
    num_time_frames = vggish_features.shape[1]
    custom_features_expanded = np.repeat(custom_features[:, np.newaxis, :], num_time_frames, axis=1)

    features = np.concatenate([vggish_features, custom_features_expanded], axis=2)
    print(f"Features shape: {features.shape}")

    # Make predictions
    print("Making predictions...")
    predictions = model.predict(features)
    predicted_classes = (predictions > 0.5).astype("int32").flatten()
    labels = ['FAKE', 'REAL']
    predicted_labels = [labels[pred] for pred in predicted_classes]

    print(f"Predicted labels: {predicted_labels}")

    return jsonify({
        "message": "Features extracted and classified successfully",
        "predictions": predicted_labels
    })

def allowed_file(filename):
    return filename.lower().endswith(SUPPORTED_EXTENSIONS)

def api(request):
    return functions.FlaskResponse(app, request)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
