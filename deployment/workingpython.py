import os
import shutil
import tempfile
import numpy as np
import librosa
import tensorflow as tf
import tensorflow_hub as hub
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout, Bidirectional, GRU, Conv1D, MaxPooling1D, BatchNormalization
from tensorflow.keras.optimizers import Adam
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import argparse

# Define the path to your model weights
MODEL_PATH = 'bestbigru.h5'
vggish_model_handle = 'https://tfhub.dev/google/vggish/1'
vggish_layer = hub.KerasLayer(vggish_model_handle, trainable=True)

# Supported file extensions
SUPPORTED_EXTENSIONS = ('.wav', '.mp3', '.m4a', '.aac')

def allowed_file(filename):
    return filename.lower().endswith(SUPPORTED_EXTENSIONS)

def create_model(input_shape):
    model = Sequential()
    model.add(Input(shape=(input_shape[1], input_shape[2])))

    # Custom CNN layers
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

    # Bidirectional GRU layers
    model.add(Bidirectional(GRU(128, return_sequences=True)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))

    model.add(Bidirectional(GRU(64)))
    model.add(BatchNormalization())
    model.add(Dropout(0.4))

    # Fully connected layers
    model.add(Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)))
    model.add(BatchNormalization())
    model.add(Dropout(0.5))

    model.add(Dense(128, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001)))
    model.add(BatchNormalization())
    model.add(Dropout(0.5))

    model.add(Dense(1, activation='sigmoid'))

    # Compile the model
    initial_learning_rate = 0.0005
    optimizer = Adam(learning_rate=initial_learning_rate)
    model.compile(optimizer=optimizer, loss='binary_crossentropy', metrics=['accuracy'])

    return model

def extract_vggish_features(audio_data):
    return vggish_layer(tf.convert_to_tensor(audio_data, dtype=tf.float32)).numpy()

def extract_features(audio_data):
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

def process_audio(files):
    audios = []

    for file in files:
        if not allowed_file(file):
            print(f"File type {file} is not allowed. Supported types are {SUPPORTED_EXTENSIONS}")
            continue

        try:
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, os.path.basename(file))
            
            # Copy the file to a temporary location
            shutil.copy(file, temp_path)
            
            # Load the audio file using librosa
            audio, _ = librosa.load(temp_path, sr=22050)
            audios.append(audio)
            
            # Remove the temporary file
            os.remove(temp_path)
        except Exception as e:
            print(f"Error loading {file}: {e}")
            continue

    if not audios:
        print("No valid audio files were loaded")
        return

    max_len = 22050 * 5
    audios_padded = []
    for audio in audios:
        if len(audio) < max_len:
            padded_audio = np.pad(audio, (0, max_len - len(audio)), 'constant')
        else:
            padded_audio = audio[:max_len]
        audios_padded.append(padded_audio)

    with ThreadPoolExecutor(max_workers=8) as executor:
        vggish_features = list(tqdm(executor.map(extract_vggish_features, audios_padded), total=len(audios_padded)))
    vggish_features = np.array(vggish_features)
    vggish_features = np.squeeze(vggish_features)

    with ThreadPoolExecutor(max_workers=8) as executor:
        custom_features = list(tqdm(executor.map(extract_features, audios_padded), total=len(audios_padded)))
    custom_features = np.array(custom_features)

    if vggish_features.ndim == 2:
        vggish_features = np.expand_dims(vggish_features, axis=0)
    
    num_time_frames = vggish_features.shape[1]
    custom_features_expanded = np.repeat(custom_features[:, np.newaxis, :], num_time_frames, axis=1)

    features = np.concatenate([vggish_features, custom_features_expanded], axis=2)

    # Define the model
    model = create_model(features.shape)
    # Load the weights
    model.load_weights(MODEL_PATH)
    
    # Make predictions
    predictions = model.predict(features)
    predicted_classes = (predictions > 0.5).astype("int32")
    predicted_classes = predicted_classes.flatten()

    labels = ['FAKE', 'REAL']
    predicted_labels = [labels[pred] for pred in predicted_classes]

    print(f"Predictions: {predicted_labels}")

def main():
    parser = argparse.ArgumentParser(description='Process audio files for voice biometrics.')
    parser.add_argument('files', metavar='F', type=str, nargs='+', help='List of audio files to process')
    args = parser.parse_args()

    process_audio(args.files)

if __name__ == '__main__':
    main()
