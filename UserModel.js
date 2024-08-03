// UserModel.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to validate user credentials
export const validateUser = async (username, password) => {
  try {
    const storedUser = await AsyncStorage.getItem(username);
    if (storedUser) {
      const { password: storedPassword } = JSON.parse(storedUser);
      return storedPassword === password;
    }
    return false;
  } catch (error) {
    console.error('Error validating user:', error);
    return false;
  }
};

// Function to create a new user
export const createUser = async (username, email, password) => {
  try {
    const user = {
      email,
      password,
    };
    await AsyncStorage.setItem(username, JSON.stringify(user));
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// Function to find if a user exists
export const findUser = async (username, email) => {
  try {
    const storedUser = await AsyncStorage.getItem(username);
    if (storedUser) {
      const { email: storedEmail } = JSON.parse(storedUser);
      return storedEmail === email;
    }
    return false;
  } catch (error) {
    console.error('Error finding user:', error);
    return false;
  }
};
