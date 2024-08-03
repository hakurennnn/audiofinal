import * as FileSystem from 'expo-file-system';

// Create user directory
export async function createUserDirectory() {
  const userDirectory = FileSystem.documentDirectory + 'user/';
  try {
    await FileSystem.makeDirectoryAsync(userDirectory, { intermediates: true });
    console.log('User directory created');
  } catch (error) {
    console.error('Error creating user directory', error);
  }
}

// Save user data
export async function saveUserData(data) {
  const userFile = FileSystem.documentDirectory + 'user/userData.json';
  try {
    await FileSystem.writeAsStringAsync(userFile, JSON.stringify(data));
    console.log('User data saved');
  } catch (error) {
    console.error('Error saving user data', error);
  }
}
