// VoiceAuthen.js
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import Auth from '../assets/Voice2.png';
import hori from '../assets/hori.png';
import axios from 'axios'; // Import axios
import config from '../config'; // Import config

const VoiceAuthen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [detailMessage, setDetailMessage] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');

  const goToLandingPage = () => {
    console.log('[VoiceAuthen] Navigating to LandingPage');
    navigation.navigate('LandingPage');
  };

  const goToRecordAuthen = () => {
    console.log('[VoiceAuthen] Navigating to RecordAuthen');
    navigation.navigate('RecordAuthen');
  };

  useEffect(() => {
    const fetchClassificationResult = async () => {
      console.log('[VoiceAuthen] Fetching classification result from:', `${config.apiUrl}/audio_results`);
      try {
        const response = await axios.get(`${config.apiUrl}/audio_results`);
        console.log('[VoiceAuthen] Response Status:', response.status);
        console.log('[VoiceAuthen] Response Headers:', response.headers);
        console.log('[VoiceAuthen] Response Data:', response.data);

        const result = response.data;

        if (!result || result.length === 0) {
          throw new Error('Invalid response structure or empty audios array.');
        }

        const prediction = result[0].prediction;
        console.log('[VoiceAuthen] Prediction:', prediction);

        // Map predictions to messages
        const messages = [
          {
            main: 'Identity Verified',
            sub: 'Human Voice',
            detail: 'Authenticated',
            redirect: 'Redirecting to main page',
          },
          {
            main: 'Identity Denied',
            sub: 'AI-Generated Voice',
            detail: "You're not the real owner",
            redirect: 'Please try again. Redirecting to main page.',
          },
        ];

        console.log('[VoiceAuthen] Messages:', messages);

        // Map 'FAKE' to 'AI-Generated Voice' and 'REAL' to 'Human Voice'
        const predictionToMessageMap = {
          'FAKE': 'AI-Generated Voice',
          'REAL': 'Human Voice'
        };

        const selectedSub = predictionToMessageMap[prediction];
        const selectedMessage = messages.find(message => message.sub === selectedSub);

        console.log('[VoiceAuthen] Selected Message:', selectedMessage);

        if (selectedMessage) {
          setMessage(selectedMessage.main);
          setStatusMessage(selectedMessage.sub);
          setDetailMessage(selectedMessage.detail);
          setRedirectMessage(selectedMessage.redirect);

          if (selectedMessage.main === 'Identity Verified') {
            console.log('[VoiceAuthen] Identity Verified. Redirecting to LandingPage in 10 seconds.');
            setTimeout(() => {
              goToLandingPage();
            }, 10000); // 10 seconds
          } else {
            console.log('[VoiceAuthen] Identity Denied. Redirecting to RecordAuthen in 10 seconds.');
            setTimeout(() => {
              goToRecordAuthen();
            }, 10000);
          }
        } else {
          console.error('[VoiceAuthen] Unexpected result. No matching message found.');
          setMessage('Error');
          setStatusMessage('Unknown result');
          setDetailMessage('An error occurred while verifying voice.');
          setRedirectMessage('Redirecting to previous page.');
          setTimeout(() => {
            goToRecordAuthen();
          }, 10000);
        }
      } catch (error) {
        console.error('[VoiceAuthen] Error fetching classification result:', error.message);
        console.error(error);
        setMessage('Error');
        setStatusMessage('Network error');
        setDetailMessage('An error occurred while communicating with the server.');
        setRedirectMessage('Redirecting to previous page.');
        setTimeout(() => {
          goToRecordAuthen();
        }, 10000);
      }
    };

    fetchClassificationResult();
  }, []);
  return (
    <View style={styles.container}>

      <View style={styles.titleContainer}>
        <Text style={styles.journalTitlesub}>RESULT</Text>
      </View>

      <View style={styles.fillOut}>

        <View style={styles.bg}>
          <Image source={Auth} style={styles.logo} />
          <Text style={styles.desc}> {message} </Text>
          <Text style={styles.desc1}> {statusMessage} </Text>
        </View>
      </View> 

      <Text style={styles.detail}> {detailMessage} </Text>
      <Text style={styles.redirect}>「 {redirectMessage} 」</Text>
      <View style={styles.footnote}>
        
        <Image source={hori} style={styles.footnotelogo} />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  fillOut: {
    marginBottom: 50,
    flex: 1,
    position: 'absolute', 
    top: '10%', 
    bottom: '9%',
    left: '7%',
    right: '7%',
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 5,
    height: 480,
    borderColor: 'gainsboro',
    borderWidth: 1,
    borderBottomWidth: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bg:{
    flex: 1,
    top: '15%',
    bottom: '9%',
    left: '7%',
    right: '7%',  
    position: 'absolute', 
    backgroundColor: '#0B3954',
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderColor: 'gainsboro',
    borderWidth: 1,
    borderBottomWidth: 5,
    borderRadius: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  journalTitlesub: {
    fontSize: 30,
    position: 'absolute',
    top: 10,
    fontWeight: 'bold',
    color: '#0B3954',
    zIndex: 1, 
  },
  logo: {
    top: 30,
    left: 70,
    width: 150,
    height: 150,
  },
  desc: {
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    top: 30,
    color: '#FF9700',
    textAlign: 'center',
  },
  desc1: {
    fontSize: 30,
    fontWeight: '600',
    top: 55,
    color: '#FF9700',
    textAlign: 'center',
  },
  detail: {
    fontSize: 18,
    top: 375,
    fontWeight: '600',
    color: '#a19c9c',
    textAlign: 'center',
  },
  redirect: {
    fontSize: 14,
    top: 415,
    color: '#a19c9c',
    textAlign: 'center',
  },
  footnote: {
    flex: 1,
    top: '85%',
    position: 'absolute', 
    backgroundColor: '#0B3954',
    paddingHorizontal: '100%',
    height: 150
  },
  footnotelogo: {
    top: 10,
    position: 'absolute',
    width: 350,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
  },
});

export default VoiceAuthen;
