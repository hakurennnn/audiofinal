//LoginPage.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfile from '../assets/UserProfile.png';
import { validateUser } from '../UserModel';

const LogInPage = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogIn = async () => {
    if (username === '' || password === '') {
      alert('Please fill in both fields');
      return;
    }

    const isValid = await validateUser(username, password);
    if (isValid) {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      navigation.navigate('EnrollAuthen'); // Navigate to EnrollAuthen
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <View style={styles.accent} />
      </View>
      <View style={styles.fillOut}>
        <Image source={UserProfile} style={styles.user} />
        <Text style={styles.subTitles}>Username or Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.subTitles}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.logInButton} onPress={handleLogIn}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        <View style={styles.horizontalLine} />
        <TouchableOpacity onPress={() => navigation.navigate('SignUpPage')}>
          <View style={styles.loginLinkContainer}>
            <Text style={styles.SignupLinkText}>Don't have an account? </Text>
            <Text style={styles.SignupLink}>Sign up</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    bottom: '0%',
    height: 500
  },
  frame: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'white', 
    paddingHorizontal: 10,
  },
  user: {
    width: 90, // changed from 70
    height: 90,
    bottom: 70, // changes in top spaces
    left: '36.5%',
    marginLeft: -10
  },
  accent: {
    flex: 1,
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    bottom: '70%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#0B3954', 
  },
  fillOut: {
    flex: 1,
    position: 'absolute', 
    top: '20%', 
    bottom: '30%',
    left: '7%',
    right: '7%',
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 40,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0B3954',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginBottom: 10,
    bottom: 45
  },
  signUpButton: {
    backgroundColor: '#0B3954',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitles: {
    color: '#0B3954',
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
    top: -45
  },
  logInButton: {
    backgroundColor: '#0B3954',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
    bottom: '0.9%',
    top: -55
  },
  horizontalLine: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 2,
    marginVertical: 20,
    top: -50
  },
  logInWithText: {
    color: '#0B3954',
    top: '-20%'
  },
  socialMediaIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: '10%'
  },
  logInWithContainer: {
    alignItems: 'center',
    paddingBottom: 40, 
  },
  SignupLink: {
    fontSize: 16,
    color: '#0B3954',
    fontWeight: 'bold',
    top: -50
  },
  SignupLinkText: {
    fontSize: 16,
    color: '#0B3954',
    top: -50
  },
  icon: {
    width: 200,
    height: 36.5,
    alignItems: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    bottom: '10%'
  }
});

export default LogInPage;