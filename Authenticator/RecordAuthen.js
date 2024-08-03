// EnrollAuthen.js
import { Text, TouchableOpacity, View, Animated, Image, StyleSheet } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Circle, Svg } from 'react-native-svg';
import smol from '../assets/smollogo.png';
import hori from '../assets/hori.png';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import config from '../config';

export default function EnrollAuthen() {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [sound, setSound] = useState(null);
  const [timerId, setTimerId] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedOpacityCircle2 = useRef(new Animated.Value(0)).current;
  const animatedOpacityAnimatedCircle = useRef(new Animated.Value(0)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const [showProcessing, setShowProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(false);
  const navigation = useNavigation();

  const goToLandingPage = () => {
    console.log('Navigating to LandingPage');
    navigation.navigate('LandingPage');
  };

  const goToRecordAuthen = () => {
    console.log('Navigating to RecordAuthen');
    navigation.navigate('RecordAuthen');
  };

  const goToVoiceAuthen = () => {
    console.log('Navigating to AccountsAuthen');
    navigation.navigate('VoiceAuthen');
  };

  useEffect(() => {
    async function getPermission() {
      try {
        const permission = await Audio.requestPermissionsAsync();
        console.log('Audio Permission Granted:', permission.granted);
        setAudioPermission(permission.granted);
      } catch (error) {
        console.error('Error requesting audio permission:', error);
      }
    }
    getPermission();
    return () => {
      if (recording) {
        console.log('Stopping recording on cleanup');
        stopRecording();
      }
    };
  }, []);

  useEffect(() => {
    const circumference = 30 * 2 * Math.PI;

    if (recordingStatus === 'idle' && elapsedTime === 0 && recordingsList.length > 0) {
      console.log('Starting animation');
      setAnimationComplete(false);
      setShowProcessing(true);
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: circumference,
          duration: 30000,
          useNativeDriver: true
        }),
        Animated.timing(animatedOpacityCircle2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacityAnimatedCircle, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('Animation complete');
        setAnimationComplete(true);
        setShowProcessing(false);
      });
    } else if (recordingStatus === 'recording') {
      console.log('Stopping animation');
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(animatedOpacityCircle2, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacityAnimatedCircle, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [recordingStatus, elapsedTime, recordingsList.length]);

  useEffect(() => {
    let timer;
    if (recordingStatus === 'recording') {
      console.log('Starting recording timer');
      timer = setInterval(() => {
        setElapsedTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime < 30) {
            console.log('Elapsed Time:', newTime);
            return newTime;
          } else {
            clearInterval(timer);
            console.log('Stopping recording after 30 seconds');
            stopRecording();
            return 30;
          }
        });
      }, 1000);
    }
    return () => {
      console.log('Cleaning up recording timer');
      clearInterval(timer);
    };
  }, [recordingStatus]);

  useEffect(() => {
    if (recordingStatus === 'recording') {
      console.log('Starting ripple animation');
      Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      console.log('Stopping ripple animation');
      rippleAnimation.stopAnimation();
    }
  }, [recordingStatus]);

  async function startRecording() {
    try {
      if (audioPermission) {
        console.log('Setting audio mode for recording');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
      }
      const newRecording = new Audio.Recording();
      console.log('Starting new recording');
  
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');
      setElapsedTime(0);
  
      const id = setTimeout(() => {
        console.log('Timeout reached, stopping recording');
        stopRecording();
      }, 30000);
      setTimerId(id);
      
    } catch (error) {
      console.error('Failed to start recording', error);
      alert('Failed to start recording. Please try again.');
    }
  }
  
  async function stopRecording() {
    try {
      if (timerId) {
        clearTimeout(timerId);
        console.log('[stopRecording] : Cleaning up recording timer');
      }
  
      if (recordingStatus === 'recording') {
        console.log('[stopRecording] : Stopping Recording');
        await recording.stopAndUnloadAsync();
        console.log('[stopRecording] : Recording stopped and unloaded');
  
        const recordingUri = recording.getURI();
        console.log('[stopRecording] : Recording URI:', recordingUri);
  
        const fileExtension = recordingUri.split('.').pop().toLowerCase();
        console.log('[stopRecording] : File Extension:', fileExtension);
  
        const ordinalNumber = recordingsList.length + 1;
        const fileName = `record audio - ${ordinalNumber}.${fileExtension}`;
        console.log('[stopRecording] : Generated File Name:', fileName);
  
        // Ensure the directory exists
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        console.log('[stopRecording] : Ensured recordings directory exists');
  
        const filePath = FileSystem.documentDirectory + 'recordings/' + fileName;
        console.log('[stopRecording] : Moving recording file to:', filePath);
  
        await FileSystem.moveAsync({
          from: recordingUri,
          to: filePath
        });
        console.log('[stopRecording] : File moved successfully');
  
        setRecordingsList(prevRecordings => [...prevRecordings, {
          uri: filePath,
          name: fileName,
        }]);
        console.log('[stopRecording] : Updated recordings list');
  
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: filePath });
        setSound(newSound);
        await newSound.playAsync();
        console.log('[stopRecording] : Playing the recording');
  
        setRecording(null);
        setRecordingStatus('idle');
        setElapsedTime(0);
        console.log('[stopRecording] : Recording state reset');
  
        const mimeType = {
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg',
          'm4a': 'audio/mp4',
          'aac': 'audio/aac',
          '3gp': 'audio/3gpp'
        }[fileExtension] || 'audio/mpeg';
        console.log('[stopRecording] : MIME Type:', mimeType);
  
        const formData = new FormData();
        formData.append('audio_files', {
          uri: filePath,
          name: fileName,
          type: mimeType
        });
        console.log('[stopRecording] : Form data prepared for upload');
  
        try {
          console.log('[stopRecording] : Uploading audio file to Flask server...');
          const response = await axios.post(`${config.apiUrl}/process_audio`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
  
          console.log('[stopRecording] : Response from Flask:', response.data);
          console.log('[stopRecording] : Response Status:', response.status);
          console.log('[stopRecording] : Response Headers:', response.headers);
  
        } catch (error) {
          console.error('[stopRecording] : Failed to upload audio file');
          console.error('[stopRecording] : Error message:', error.message);
          console.error('[stopRecording] : Error code:', error.code);
          console.error('[stopRecording] : Error config:', error.config);
          console.error('[stopRecording] : Error request:', error.request);
          console.error('[stopRecording] : Error response:', error.response);
          alert('Failed to upload audio file. Please try again.');
        }
      }
    } catch (error) {
      console.error('[stopRecording] : Failed to stop recording', error);
      alert('Failed to stop recording. Please try again.');
    }
  }
  
  function handleRecordButtonPress() {
    console.log('Record button pressed');
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);
  
  
  return (
    <View style={styles.container}>

      <View style={styles.titleContainer}>
        <Text style={styles.journalTitlesub}>AUTHENTICATE</Text>
      </View>

      <View style={styles.fillOut}>
        
      <TouchableOpacity
        style={styles.enrollbutton}
        onPress={goToVoiceAuthen} 
      >
        <Text style={styles.buttonText}>VERIFY VOICE</Text>
      </TouchableOpacity>

      {/* <Text style={styles.descHeader}>Audio Capture</Text> */}
      <Text style={styles.desc}>Press to Record</Text>

      {/* Circle 2 */}
      <Svg height="110%" width="110%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <AnimatedCircle
          cx="56.5"
          cy="61"
          r="30"
          fill="transparent"
          stroke="#0B3954"
          strokeWidth="3"
          opacity={animatedOpacityCircle2}
        />
      </Svg>

      {/* Animated Circle */}
      <Svg height="110%" width="110%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <AnimatedCircle
          cx="61"
          cy="43.5"
          r="30"
          fill="transparent"
          stroke="#FF9700"
          strokeWidth="3"
          strokeDasharray={`${30 * 2 * Math.PI}`}
          strokeDashoffset={animatedValue}
          transform="rotate(-270, 50, 50)"
          opacity={animatedOpacityAnimatedCircle}
        />
      </Svg>

      
      <View style={styles.playbackContainer}>
        {/* Ripple Effect */}
        <Animated.View style={[styles.ripple, {
          opacity: rippleAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 0],
          }),
          transform: [
            {
              scale: rippleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              }),
            },
          ],
        }]} />

        {/* Record Button */}
        <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
          <FontAwesome5 name={recording ? 'stop-circle' : 'circle'} size={90} color="white" />
        </TouchableOpacity>
      </View>

        {/* Animation Fedinout text - Processing */}
        {showProcessing && (
        <View style={styles.indicator}>
          <Text style={styles.descOutput4}>「 VERIFYING VOICE PRINT 」</Text>
        </View>
      )}


        {/* Animation Fadeinout text - After 30 sec processing */}
        {/* {!recording && animationComplete && (
        <View style={styles.titleContainer}>
          <Text style={styles.descOutput}>Authenticity : </Text>
          <Text style={styles.descOutput2}>「 ENROLLING VOICE PERMIT 」</Text>
        </View>
        )} */}

        {/* Animation Fadeinout text - After 30 sec processing*/}
        {/* {!recording && animationComplete && (
        <View style={styles.titleContainer}>
          <Text style={styles.descOutput3}>Redirecting to the Main Menu after 5-seconds</Text>
        </View>
        )} */}
        </View>

        <View style={styles.footnote}>
          <Image source={hori} style={styles.logo} />
        </View>
        
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle); // Circle Animation

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  /* Recording */
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 70,
    width: 158,
    height: 158,
    borderRadius: 100,
    backgroundColor: "#0B3954",
    position: 'absolute',
    top: 90
  },
  fillOut: {
    marginBottom: 50, // changed, no margin bottom originally
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
    height: 550,
    borderColor: 'gainsboro',
    borderWidth: 1,
    borderBottomWidth: 10,
    borderRadius: 10,
  },
  svgContainer: {
    position: 'absolute', // Make SVG position absolute to float over other components
  },
  /* Text */
  desc: {
    fontSize: 15,
    color: '#a19c9c',
    textAlign: 'justify',
    left: 90,
    paddingTop: 20,
  },
  descHeader: {
    fontSize: 22,
    fontWeight: '500',
    color: '#a19c9c',
    marginHorizontal: 20,
    paddingTop: 20,
  },
  descOutput: {
    fontSize: 20,
    fontWeight: '500',
    color: '#a19c9c',
    textAlign: 'justify',
  },
  descOutput2: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FF9700',
  },
  descOutput3: {
    fontSize: 15,
    top: -50,
    color: '#a19c9c',
  },
  descOutput4: {
    fontSize: 18,
    fontWeight: '500',
    top: 300,
    color: '#0B3954',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 90,
    marginBottom: 20,
  },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  journalTitlesub: {
    fontSize: 30,
    position: 'absolute',
    top: 10,
    fontWeight: 'bold',
    color: '#0B3954',
    zIndex: 1, // Ensure the text is above the fillOut view
  },
  /* Logo */
  logo: {
    top: 10,
    position: 'absolute',
    width: 350,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
  },
  /* Animation */
  ripple: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: '#0B3954',
    top: 90,
    left: 70, 
  },
  footnote: {
    flex: 1,
    top: '85%',
    position: 'absolute', 
    backgroundColor: '#0B3954',
    paddingHorizontal: '100%',
    height: 150
  },
  /* Button */
  enrollbutton: {
    top: 30,
    backgroundColor: '#0B3954',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15, 
    margin: 25,
    zIndex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    paddingLeft: 22,
    zIndex: 1,
  },
 });
