// SignUpPage.js
import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Modal, TouchableHighlight } from 'react-native';
import UserProfile from '../assets/UserProfile.png';
import { createUser, findUser } from '../UserModel';

const SignUpPage = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !username || !password || !confirmPassword) {
      alert('Please fill out all fields.');
      return;
    }
  
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
  
    try {
      const existingUser = await findUser(username, email);
      if (!existingUser) {
        await createUser(username, email, password);
        setShowModal(true);
      } else {
        alert('Username or Email already exists.');
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      alert('An error occurred. Please try again.');
    }
  };  

  const closeModal = () => {
    setShowModal(false);
    navigation.navigate('LogInPage');
  };

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <View style={styles.accent} />
      </View>
      <View style={styles.fillOut}>
        <Image source={UserProfile} style={styles.user} />
        <Text style={styles.header}>Create an Account</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="ex. Juan Dela Cruz"
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="ex. juandelacruz@gmail.com"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="ex. juandelacruz123"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>You're all set!</Text>
              <TouchableHighlight underlayColor="#fff" onPress={closeModal}>
                <Text style={styles.modalLinkText}>Proceed to <Text style={styles.logInLink}>Log In</Text></Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
        <TouchableOpacity onPress={() => navigation.navigate('LogInPage')}>
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Log in</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -50
  },
  frame: {
    flex: 1,
    position: 'relative', 
    backgroundColor: 'white', 
  },
  user: {
    width: 90, // changed from 70
    height: 90,
    bottom: 50, // changes in top spaces
    left: '36%',
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
    marginBottom: 50, // changed, no margin bottom originally
    flex: 1,
    position: 'absolute', 
    top: '15%', 
    bottom: '9%',
    left: '7%',
    right: '7%',
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 5,
    height: 670
  },
  header: {
    marginBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0B3954',
    marginTop: -35
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B3954',
    left: '20%',

  },
  label: {
    fontSize: 12,
    color: '#0B3954',
    paddingTop: 5,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginBottom: 10,

  },
  signUpButton: {
    backgroundColor: '#0B3954',
    paddingVertical: 10,
    borderRadius: 40,
    marginTop: 20,
    alignItems: 'center',
    bottom:'3%'
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    paddingHorizontal: 10,
  },
  checkboxText: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    bottom: '15%'
  },
  loginLinkText: {
    fontSize: 16,
    color: '#333',
  },
  loginLink: {
    fontSize: 16,
    color: '#0B3954',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B3954',
    marginBottom: 20,
  },
  modalLinkText: {
    fontSize: 16,
    color: '#0B3954',
    fontWeight: 'bold',
  },
  logInLink: {
    fontSize: 16,
    color: '#0B3954',
    fontWeight: 'bold',
    textDecorationLine: 'underline', 
  },
});

export default SignUpPage;  