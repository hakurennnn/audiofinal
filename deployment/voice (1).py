#flask routes
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


@app.route('/enroll', methods=["GET", "POST"])
def enroll():
    global username
    global user_directory

    if request.method == 'POST':
        data = request.get_json()

        username = data['username']
        password = data['password']
        repassword = data['repassword']

        user_directory = "Users/" + username + "/"

        # Create target directory & all intermediate directories if don't exists
        if not os.path.exists(user_directory):
            os.makedirs(user_directory)
            print("[ * ] Directory ", username,  " Created ...")
        else:
            print("[ * ] Directory ", username,  " already exists ...")
            print("[ * ] Overwriting existing directory ...")
            shutil.rmtree(user_directory, ignore_errors=False, onerror=None)
            os.makedirs(user_directory)
            print("[ * ] Directory ", username,  " Created ...")

        return redirect(url_for('voice'))

    else:
        return render_template('enroll.html')


@app.route('/auth', methods=['POST', 'GET'])
def auth():
    global username
    global user_directory
    global filename

    user_exist = False

    if request.method == 'POST':

        data = request.get_json()
        print(data)

        user_directory = 'Models/'
        username = data['username']
        password = data['password']

        print("[ DEBUG ] : What is the user directory at auth : ", user_directory)
        print("os.fsencode(user_directory : ", os.fsencode(user_directory))
        directory = os.fsencode(user_directory)
        print("directory : ", os.listdir(directory)[1:])

        for file in os.listdir(directory):
            print("file : ", file)
            filename = os.fsdecode(file)
            if filename.startswith(username):
                print("filename : ", filename)
                user_exist = True
                break
            else:
                pass

        if user_exist:
            print("[ * ] The user profile exists ...")
            return "User exist"

        else:
            print("[ * ] The user profile does not exists ...")
            return "Doesn't exist"

    else:
        print('its coming here')
        return render_template('auth.html')


@app.route('/vad', methods=['GET', 'POST'])
def vad():
    if request.method == 'POST':
        global random_words

        f = open('./static/audio/background_noise.wav', 'wb')
        f.write(request.data)
        f.close()

        background_noise = speech_recognition.AudioFile(
            './static/audio/background_noise.wav')
        with background_noise as source:
            speech_recognition.Recognizer().adjust_for_ambient_noise(source, duration=5)

        print("Voice activity detection complete ...")

        random_words = RandomWords().random_words(count=5)
        print(random_words)

        return "  ".join(random_words)

    else:
        background_noise = speech_recognition.AudioFile(
            './static/audio/background_noise.wav')
        with background_noise as source:
            speech_recognition.Recognizer().adjust_for_ambient_noise(source, duration=5)

        print("Voice activity detection complete ...")

        random_words = RandomWords().random_words(count=5)
        print(random_words)

        return "  ".join(random_words)


@app.route('/voice', methods=['GET', 'POST'])
def voice():
    global user_directory
    global filename_wav

    print("[ DEBUG ] : User directory at voice : ", user_directory)

    if request.method == 'POST':
        #    global random_string
        global random_words
        global username

        filename_wav = user_directory + "-".join(random_words) + '.wav'
        f = open(filename_wav, 'wb')
        f.write(request.data)
        f.close()

        with open(filename_wav, 'rb') as audio_file:
             recognised_words = speech_to_text.recognize(audio_file, content_type='audio/wav').get_result()

        recognised_words = str(recognised_words['results'][0]['alternatives'][0]['transcript'])
        

        print("IBM Speech to Text thinks you said : " + recognised_words)
        print("IBM Fuzzy partial score : " + str(fuzz.partial_ratio(random_words, recognised_words)))
        print("IBM Fuzzy score : " + str(fuzz.ratio(random_words, recognised_words)))       

        if fuzz.ratio(random_words, recognised_words) < 65:
            print(
                "\nThe words you have spoken aren't entirely correct. Please try again ...")
            os.remove(filename_wav)
            return "fail"
        else:
            pass

        return "pass"

    else:
        return render_template('voice.html')


@app.route('/biometrics', methods=['GET', 'POST'])
def biometrics():
    global user_directory
    print("[ DEBUG ] : User directory is : ", user_directory)

    if request.method == 'POST':
        pass
    else:
        # MFCC
        print("Into the biometrics route.")

        directory = os.fsencode(user_directory)
        features = numpy.asarray(())

        for file in os.listdir(directory):
            filename_wav = os.fsdecode(file)
            if filename_wav.endswith(".wav"):
                print("[biometrics] : Reading audio files for processing ...")
                (rate, signal) = scipy.io.wavfile.read(user_directory + filename_wav)

                extracted_features = extract_features(rate, signal)

                if features.size == 0:
                    features = extracted_features
                else:
                    features = numpy.vstack((features, extracted_features))

            else:
                continue

        # GaussianMixture Model
        print("[ * ] Building Gaussian Mixture Model ...")

        gmm = GaussianMixture(n_components=16,
                            max_iter=200,
                            covariance_type='diag',
                            n_init=3)

        gmm.fit(features)
        print("[ * ] Modeling completed for user :" + username +
            " with data point = " + str(features.shape))

        # dumping the trained gaussian model
        # picklefile = path.split("-")[0]+".gmm"
        print("[ * ] Saving model object ...")
        pickle.dump(gmm, open("Models/" + str(username) +
                            ".gmm", "wb"), protocol=None)
        print("[ * ] Object has been successfully written to Models/" +
            username + ".gmm ...")
        print("\n\n[ * ] User has been successfully enrolled ...")

        features = numpy.asarray(())

        return "User has been successfully enrolled ...!!"


@app.route("/verify", methods=['GET'])
def verify():
    global username
    global filename
    global user_directory
    global filename_wav

    print("[ DEBUG ] : user directory : " , user_directory)
    print("[ DEBUG ] : filename : " , filename)
    print("[ DEBUG ] : filename_wav : " , filename_wav)

    # ------------------------------------------------------------------------------------------------------------------------------------#
    #                                                                   LTSD and MFCC                                                     #
    # ------------------------------------------------------------------------------------------------------------------------------------#

    # (rate, signal) = scipy.io.wavfile.read(audio.get_wav_data())
    (rate, signal) = scipy.io.wavfile.read(filename_wav)

    extracted_features = extract_features(rate, signal)

    # ------------------------------------------------------------------------------------------------------------------------------------#
    #                                                          Loading the Gaussian Models                                                #
    # ------------------------------------------------------------------------------------------------------------------------------------#

    gmm_models = [os.path.join(user_directory, user)
                  for user in os.listdir(user_directory)
                  if user.endswith('.gmm')]

    # print("GMM Models : " + str(gmm_models))

    # Load the Gaussian user Models
    models = [pickle.load(open(user, 'rb')) for user in gmm_models]

    user_list = [user.split("/")[-1].split(".gmm")[0]
                 for user in gmm_models]

    log_likelihood = numpy.zeros(len(models))

    for i in range(len(models)):
        gmm = models[i]  # checking with each model one by one
        scores = numpy.array(gmm.score(extracted_features))
        log_likelihood[i] = scores.sum()

    print("Log liklihood : " + str(log_likelihood))

    identified_user = numpy.argmax(log_likelihood)

    print("[ * ] Identified User : " + str(identified_user) +
          " - " + user_list[identified_user])

    auth_message = ""

    if user_list[identified_user] == username:
        print("[ * ] You have been authenticated!")
        auth_message = "success"
    else:
        print("[ * ] Sorry you have not been authenticated")
        auth_message = "fail"

    return auth_message


def calculate_delta(array):
    """Calculate and returns the delta of given feature vector matrix
    (https://appliedmachinelearning.blog/2017/11/14/spoken-speaker-identification-based-on-gaussian-mixture-models-python-implementation/)"""

    print("[Delta] : Calculating delta")

    rows, cols = array.shape
    deltas = numpy.zeros((rows, 20))
    N = 2
    for i in range(rows):
        index = []
        j = 1
        while j <= N:
            if i-j < 0:
                first = 0
            else:
                first = i-j
            if i+j > rows - 1:
                second = rows - 1
            else:
                second = i+j
            index.append((second, first))
            j += 1
        deltas[i] = (array[index[0][0]]-array[index[0][1]] +
                     (2 * (array[index[1][0]]-array[index[1][1]]))) / 10
    return deltas


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

UPLOAD_FOLDER = 'uploads/'  # Define where to save uploaded files
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload-voice', methods=['POST'])
def upload_voice():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        # Process the file here (e.g., save to database, analyze, etc.)
        return jsonify({'message': 'File uploaded successfully'}), 200

@app.route('/process_audio', methods=['POST'])
def process_audio():
    files = request.files.getlist('audio_files')
    audios = []

    for file in files:
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
