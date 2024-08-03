#!/uspeech_recognition/bin/env python3
"""
This is a demo for a voice biometrics application
"""

# ------------------------------------------------------------------------------------------------------------------------------------#
#                                                  Installing Packages Needed                                                         #
# ------------------------------------------------------------------------------------------------------------------------------------#


# This is used to dump the models into an object
import pickle
import datetime
import os                                               # For creating directories
import shutil                                           # For deleting directories
# from collections import defaultdict

import matplotlib.pyplot as plt
import numpy
import scipy.cluster
import scipy.io.wavfile
# For the speech detection alogrithms
import speech_recognition
# For the fuzzy matching algorithms
from fuzzywuzzy import fuzz
# For using the MFCC feature selection
from python_speech_features import mfcc
# For generating random words
from random_word import RandomWords
from sklearn import preprocessing
# For using the Gausian Mixture Models
from sklearn.mixture import GaussianMixture

# from watson_developer_cloud import SpeechToTextV1
from ibm_watson import SpeechToTextV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

# for model integration and testing
import librosa
import numpy as np
import tensorflow as tf
from tqdm import tqdm
import unittest
from concurrent.futures import ThreadPoolExecutor
import tensorflow_hub as hub
import requests
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Input, Dense, Dropout, Bidirectional, GRU, Conv1D, MaxPooling1D, BatchNormalization
import tempfile
from pydub import AudioSegment

# This is the file where the credentials are stored
import config

# Set up the IAM authenticator with the API key
authenticator = IAMAuthenticator(config.APIKEY)

# Initialize the Speech to Text service with the authenticator
speech_to_text = SpeechToTextV1(authenticator=authenticator)

# Set the service URL
speech_to_text.set_service_url(config.URL)

from flask import Flask, render_template, request, jsonify, url_for, redirect, abort, session, json
vggish_model_handle = 'https://tfhub.dev/google/vggish/1'
vggish_layer = hub.KerasLayer(vggish_model_handle, trainable=True)
PORT = 8080

# Global Variables
random_words = []
random_string = ""
username = ""
user_directory = "Users/Test"
filename = ""
filename_wav = ""

app = Flask(__name__)
SUPPORTED_EXTENSIONS = ('.wav', '.mp3', '.m4a', '.aac')

def allowed_file(filename):
    return filename.lower().endswith(SUPPORTED_EXTENSIONS)

def create_model(input_shape):
    model = Sequential()
    model.add(Input(shape=input_shape))

    # Custom CNN layers with increased filters
    model.add(Conv1D(64, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=2))
    model.add(Dropout(0.3))

    model.add(Conv1D(128, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=2))
    model.add(Dropout(0.3))

    model.add(Conv1D(256, kernel_size=3, activation='relu', padding='same'))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=1))
    model.add(Dropout(0.3))

    # Bidirectional GRU layers with increased units
    model.add(Bidirectional(GRU(128, return_sequences=True)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))

    model.add(Bidirectional(GRU(64)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))

    # Fully connected layers with increased units
    model.add(Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)))
    model.add(BatchNormalization())
    model.add(Dropout(0.5))

    model.add(Dense(128, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)))
    model.add(BatchNormalization())
    model.add(Dropout(0.5))

    model.add(Dense(1, activation='sigmoid'))

    return model

input_shape = (28, 295) 
model = create_model(input_shape)
model.load_weights('bestbigru.h5')

@app.route('/')
@app.route('/home')
def home():
    return render_template('main.html')

def extract_vggish_features(audio_data):
    return vggish_layer(tf.convert_to_tensor(audio_data, dtype=tf.float32)).numpy()

def extract_features(audio_data):
    print("[extract_features] : Exctracting featureses ...")
    mfcc_features = librosa.feature.mfcc(y=audio_data, sr=22050, n_mfcc=20)
    mfcc_features = np.mean(mfcc_features.T, axis=0)
    chroma_features = librosa.feature.chroma_stft(y=audio_data, sr=22050)
    chroma_features = np.mean(chroma_features.T, axis=0)
    spectral_contrast = librosa.feature.spectral_contrast(y=audio_data, sr=22050)
    spectral_contrast = np.mean(spectral_contrast.T, axis=0)
    mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=22050)
    mel_spectrogram = np.mean(mel_spectrogram.T, axis=0)
    combined_features = np.concatenate([mfcc_features, chroma_features, spectral_contrast, mel_spectrogram])
    return combined_features

@app.route('/process_audio', methods=['POST'])
def process_audio():
    files = request.files.getlist('audio_files')
    audios = []

    for file in files:
        # Check if the file has an allowed extension
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type {file.filename} is not allowed. Supported types are {SUPPORTED_EXTENSIONS}"}), 400

        try:
            # Save the uploaded file to a temporary location
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, file.filename)
            print(f"Saving file to temporary path: {temp_path}")
            file.save(temp_path)
            print(f"File saved: {temp_path}")
            
            # Load the audio file using librosa
            print(f"Loading audio file: {temp_path}")
            audio, _ = librosa.load(temp_path, sr=22050)
            print(f"Audio loaded from file: {temp_path}, Audio shape: {audio.shape}")
            audios.append(audio)
            
            # Remove the temporary file after loading
            os.remove(temp_path)
            print(f"Temporary file removed: {temp_path}")
        except Exception as e:
            print(f"Error loading {file.filename}: {e}")
            return jsonify({"error": f"Failed to load audio file {file.filename}"}), 400

    if not audios:
        print("No valid audio files were loaded")
        return jsonify({"error": "No valid audio files were loaded"}), 400

    max_len = 22050 * 5  # 5 seconds at 22050 Hz
    audios_padded = []
    for audio in audios:
        if len(audio) < max_len:
            padded_audio = np.pad(audio, (0, max_len - len(audio)), 'constant')
        else:
            padded_audio = audio[:max_len]
        audios_padded.append(padded_audio)
        print(f"Audio padded: Original length: {len(audio)}, Padded length: {len(padded_audio)}")

    with ThreadPoolExecutor(max_workers=8) as executor:
        vggish_features = list(tqdm(executor.map(extract_vggish_features, audios_padded), total=len(audios_padded)))
    vggish_features = np.array(vggish_features)
    vggish_features = np.squeeze(vggish_features)
    print(f"VGGish feature extraction completed. Shape: {vggish_features.shape}")

    with ThreadPoolExecutor(max_workers=8) as executor:
        custom_features = list(tqdm(executor.map(extract_features, audios_padded), total=len(audios_padded)))
    custom_features = np.array(custom_features)
    print(f"Custom feature extraction completed. Shape: {custom_features.shape}")

    # Ensure vggish_features and custom_features_expanded have the same number of dimensions
    if vggish_features.ndim == 2:
        vggish_features = np.expand_dims(vggish_features, axis=0)
    
    num_time_frames = vggish_features.shape[1]
    custom_features_expanded = np.repeat(custom_features[:, np.newaxis, :], num_time_frames, axis=1)
    print(f"Custom features expanded. Shape: {custom_features_expanded.shape}")

    features = np.concatenate([vggish_features, custom_features_expanded], axis=2)
    print(f"Combined feature extraction completed. Shape: {features.shape}")

    predictions = model.predict(features)
    predicted_classes = (predictions > 0.5).astype("int32")
    predicted_classes = predicted_classes.flatten()  # Flatten the array

    print(f"Predictions: {predicted_classes.tolist()}")

    # Map predictions to labels
    labels = ['FAKE', 'REAL']
    predicted_labels = [labels[pred] for pred in predicted_classes]

    print(f"Predicted labels: {predicted_labels}")

    return jsonify({
        "message": "Features extracted and classified successfully",
        "features_shape": features.shape,
        "predictions": predicted_labels
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)