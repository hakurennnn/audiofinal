import os
import numpy as np
import librosa
import tensorflow as tf
import tensorflow_hub as hub
from tensorflow.keras.models import load_model
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

vggish_model_handle = 'https://tfhub.dev/google/vggish/1'
vggish_layer = hub.KerasLayer(vggish_model_handle, trainable=False)
model = load_model('bestbigru.h5')

def process_audio_file(file_path):
    try:
        audio, _ = librosa.load(file_path, sr=22050)
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        if np.max(audio) < 0.01:
            print(f"File {file_path} is silent or low volume, skipping.")
            return None
        audio = librosa.util.normalize(audio)
        return audio
    except Exception as e:
        print(f"Error loading file {file_path}: {e}")
        return None

def extract_vggish_features(audio_data):
    return vggish_layer(tf.convert_to_tensor(audio_data, dtype=tf.float32)).numpy()

def extract_custom_features(audio_data):
    mfcc_features = librosa.feature.mfcc(y=audio_data, sr=22050, n_mfcc=20)
    mfcc_features = np.mean(mfcc_features.T, axis=0)
    chroma_features = librosa.feature.chroma_stft(y=audio_data, sr=22050)
    chroma_features = np.mean(chroma_features.T, axis=0)

    spectral_contrast = librosa.feature.spectral_contrast(y=audio_data, sr=22050)
    spectral_contrast = np.mean(spectral_contrast.T, axis=0)

    mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=22050)
    mel_spectrogram = np.mean(mel_spectrogram.T, axis=0)

    combined_features = np.concatenate([
        mfcc_features,
        chroma_features,
        spectral_contrast,
        mel_spectrogram,
    ])

    return combined_features

def pad_to_length(array, target_length, axis=0):
    current_length = array.shape[axis]
    if current_length < target_length:
        pad_width = [(0, 0)] * array.ndim
        pad_width[axis] = (0, target_length - current_length)
        array = np.pad(array, pad_width, mode='constant')
    elif current_length > target_length:
        slices = [slice(None)] * array.ndim
        slices[axis] = slice(0, target_length)
        array = array[tuple(slices)]
    return array

def predict_audio(file_path):
    audio = process_audio_file(file_path)
    if audio is None:
        return "Invalid audio file"

    max_len = 22050 * 20
    target_length = 28

    segments = [audio[i * max_len:(i + 1) * max_len] for i in range(int(np.ceil(len(audio) / max_len)))]
    segments = [np.pad(seg, (0, max_len - len(seg)), 'constant') if len(seg) < max_len else seg for seg in segments]

    with ThreadPoolExecutor(max_workers=8) as executor:
        vggish_features = list(tqdm(executor.map(extract_vggish_features, segments), total=len(segments)))

    vggish_features = np.array(vggish_features)
    if len(vggish_features.shape) == 3 and vggish_features.shape[0] == 1:
        vggish_features = np.squeeze(vggish_features, axis=0)
    vggish_features = pad_to_length(vggish_features, target_length, axis=0)
    print(f"VGGish feature extraction completed. Shape: {vggish_features.shape}")

    with ThreadPoolExecutor(max_workers=8) as executor:
        custom_features = list(tqdm(executor.map(extract_custom_features, segments), total=len(segments)))

    custom_features = np.array(custom_features)
    if len(custom_features.shape) == 3 and custom_features.shape[0] == 1:
        custom_features = np.squeeze(custom_features, axis=0)
    custom_features_expanded = np.repeat(custom_features[:, np.newaxis, :], target_length, axis=1)
    custom_features_expanded = pad_to_length(custom_features_expanded, target_length, axis=1)
    print(f"Custom feature extraction completed. Shape: {custom_features_expanded.shape}")

    if len(vggish_features.shape) == 2:
        vggish_features = np.expand_dims(vggish_features, axis=0)

    if len(custom_features_expanded.shape) == 2:
        custom_features_expanded = np.expand_dims(custom_features_expanded, axis=0)

    features = np.concatenate([vggish_features, custom_features_expanded], axis=-1)
    print(f"Combined feature extraction completed. Shape: {features.shape}")

    predictions = []
    for feature in features:
        feature = np.expand_dims(feature, axis=0)
        prediction = model.predict(feature)
        predictions.append(prediction)

    average_prediction = np.mean(predictions)
    predicted_class = 'REAL' if average_prediction > 0.5 else 'FAKE'
    return predicted_class

def predict_folder(folder_path):
    file_paths = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith('.wav')]
    predictions = {}

    for file_path in tqdm(file_paths, desc="Processing files"):
        predictions[file_path] = predict_audio(file_path)

    return predictions

new_audio_file_path = 'audio-1707329162814.mp3'
predicted_class = predict_audio(new_audio_file_path)
print(f"The predicted class for the new audio file is: {predicted_class}")