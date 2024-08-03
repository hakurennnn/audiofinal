import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import Auth from '../assets/Voice2.png';
import hori from '../assets/hori.png';

const VoiceAuthen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [detailMessage, setDetailMessage] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');

  const goToLandingPage = () => {
    navigation.navigate('LandingPage');
  };

  const goToRecordAuthen = () => {
    navigation.navigate('RecordAuthen');
  };

  useEffect(() => {
    // Function to fetch classification result from Flask backend
    const fetchClassificationResult = async () => {
      try {
        const response = await fetch('http://localhost:8080/process_audio', {
          method: 'POST',
          body: new FormData().append('audio_files', /* your audio file here */),
        });
        
        const result = await response.json();
        const prediction = result.audios[0].prediction[0] > 0.5 ? 'REAL' : 'FAKE'; // Adjust threshold as needed

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

        const selectedMessage = messages.find(message => message.sub === prediction);

        if (selectedMessage) {
          setMessage(selectedMessage.main);
          setStatusMessage(selectedMessage.sub);
          setDetailMessage(selectedMessage.detail);
          setRedirectMessage(selectedMessage.redirect);

          if (selectedMessage.main === 'Identity Verified') {
            setTimeout(() => {
              goToLandingPage();
            }, 10000); // 10 seconds 
          } else {
            setTimeout(() => {
              goToRecordAuthen();
            }, 10000);
          }
        } else {
          // Handle unexpected result
          setMessage('Error');
          setStatusMessage('Unknown result');
          setDetailMessage('An error occurred while verifying voice.');
          setRedirectMessage('Redirecting to previous page.');
          setTimeout(() => {
            goToRecordAuthen();
          }, 10000);
        }
      } catch (error) {
        console.error('Error fetching classification result:', error);
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
