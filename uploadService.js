//uploadService.js
import axiosInstance from './axiosConfig';

const uploadAudioFiles = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('audio_files', file));

  try {
    const response = await axiosInstance.post('/process_audio', formData);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error uploading audio files:', error);
  }
};

export default uploadAudioFiles;
