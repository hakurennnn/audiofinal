// axiosConfig.js
import axios from 'axios';

// Create an instance of Axios with default configuration
const axiosInstance = axios.create({
  baseURL: 'http://192.168.0.105:8080', // Directly set the server address
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can modify or add headers here
    // Example: config.headers['Authorization'] = `Bearer ${yourToken}`;
    console.log('Request sent:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Error response:', error.response);
    // Handle specific status codes or errors here
    if (error.response && error.response.status === 400) {
      // Example: Handle Bad Request
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
