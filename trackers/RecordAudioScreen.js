import { Text, TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Circle, Svg } from 'react-native-svg';

export default function RecordAudioScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedOpacityCircle2 = useRef(new Animated.Value(0)).current;
  const animatedOpacityAnimatedCircle = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    async function getPermission() {
      const { granted } = await Audio.requestPermissionsAsync();
      setAudioPermission(granted);
    }
    getPermission();
  }, []);

  useEffect(() => {
    const circumference = 30 * 2 * Math.PI;
    if (recordingStatus === 'recording') {
      Animated.timing(animatedValue, {
        toValue: circumference,
        duration: 30995,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [recordingStatus]);

  useEffect(() => {
    let timer;
    if (recordingStatus === 'recording') {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime < 30) {
            return newTime;
          } else {
            clearInterval(timer);
            stopRecording();
            return 30;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recordingStatus]);

  useEffect(() => {
    if (recordingStatus === 'idle' && elapsedTime === 0) {
      Animated.parallel([
        Animated.timing(animatedOpacityCircle2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacityAnimatedCircle, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (recordingStatus === 'recording') {
      Animated.parallel([
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
      ]).start();
    }
  }, [recordingStatus, elapsedTime]);

  const calculateBitrate = async (filePath) => {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      const fileSize = info.size;
      const { durationMillis } = await recording.getStatusAsync();
      const duration = durationMillis / 1000;
      const bitrate = (fileSize * 8) / duration;
      console.log(`Bitrate: ${bitrate.toFixed(2)} bps`);
    } catch (error) {
      console.error('Failed to calculate bitrate', error);
    }
  };

  async function startRecording() {
    try {
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await newRecording.startAsync();
        setRecording(newRecording);
        setRecordingStatus('recording');
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    try {
      if (recordingStatus === 'recording') {
        await recording.stopAndUnloadAsync();
        const recordingUri = recording.getURI();
        const ordinalNumber = recordingsList.length + 1;
        const fileName = `record_audio_${ordinalNumber}.wav`;

        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        const filePath = FileSystem.documentDirectory + 'recordings/' + fileName;
        await FileSystem.moveAsync({
          from: recordingUri,
          to: filePath,
        });

        const { durationMillis } = await recording.getStatusAsync();
        const durationSeconds = (durationMillis / 1000).toFixed(2);

        setRecordingsList((prevRecordings) => [
          ...prevRecordings,
          { uri: filePath, name: fileName, duration: durationSeconds },
        ]);

        await calculateBitrate(filePath);

        setRecording(null);
        setRecordingStatus('idle');
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  async function handleRecordButtonPress() {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  // Header Date
  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting;
  // Determine the greeting based on the time
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentTime.toLocaleDateString(undefined, dateOptions);


  return (
    <View style={styles.container}>
      <View style={styles.topheader}>
          {/* Date and Greetings */}
          <View style={styles.dateGreetingsContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.greetings}>{greeting}</Text>
          </View>
        </View>
      
      {/*Circle 1*/}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <Circle 
        cx="50" 
        cy="40" 
        r="30" 
        fill="none" 
        stroke="#0B3954" 
        strokeWidth="8"/>
      </Svg>

      {/* Circle 2 */}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
      <AnimatedCircle
        cx="50"
        cy="40"
        r="30"
        fill="none"
        stroke="#E7E7E7"
        strokeWidth="3"
        opacity={animatedOpacityCircle2}
      />
      </Svg>

    {/* Animated Circle */}
    <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer} >
      <AnimatedCircle
        cx="40"
        cy="50"
        r="30"
        fill="none"
        stroke="#FF9700"
        strokeWidth="3"
        strokeDasharray={`${30 * 2 * Math.PI}`}
        strokeDashoffset={animatedValue}
        strokeLinecap='round'
        transform="rotate(-270, 50, 50)"
        opacity={animatedOpacityAnimatedCircle}
      />
    </Svg>

      <View style = {styles.playbackContainer}>

      <Text style={styles.timerText}>{elapsedTime}</Text>
      </View>

      {/*Layout */}
      <View style = {styles.footer}>
      <Text style={styles.recordingNameText}>
          {recordingStatus == 'recording' ? `record audio - ${recordingsList.length + 1}` :  `record audio - ${recordingsList.length + 1}`}
      </Text>
      <Text style={styles.recordingStatusText}>{`Recording status: ${recordingStatus}`}</Text>
      
      {/* Record Button */}
      <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
        <FontAwesome5 name={recording ? 'stop-circle' : 'circle'} size={44} color="white" />
      </TouchableOpacity>

      {/* View All Button */}
      {/* <TouchableOpacity style = {styles.viewAll} onPress={goToAudioList} >
        <View style={styles.iconContainer}>
          <FontAwesome5 name="list-ul" size={25} color="#FF9700"/>
          <Text style = {styles.IconText}>
            View All
          </Text>
        </View>
      </TouchableOpacity> */}

      {/* Upload Button */}
      {/* <TouchableOpacity style = {styles.uploadButton} onPress={goToUploadAudioScreen} >
        <View style={styles.iconContainer}>
          <FontAwesome5 name="download" size={25} color="#FF9700"/>
          <Text style = {styles.IconText}>
            Upload
          </Text>
        </View>
      </TouchableOpacity> */}
      </View>
    </View>
  );
}
const AnimatedCircle = Animated.createAnimatedComponent(Circle); //Circle Animation

const styles = StyleSheet.create({
container: {
flex: 1,
},
/* Recording */
button: {
alignItems: 'center',
justifyContent: 'center',
bottom: 13,
width: 65,
height: 65,
borderRadius: 64,
backgroundColor: "#FF9700",
},
recordingStatusText: {
marginBottom: 15,
color: 'white',
transform: [{translateY: -10}]
},
recordingNameText: {
fontWeight: 'bold',
color: 'white',
fontSize: 25,
transform: [{translateY: -15}]
},
/* Audio Button Layout */
playbackContainer : {
marginBottom: 'auto',
alignItems: 'center',
justifyContent: 'center',
},
footer :{
backgroundColor: '#0B3954',
height: 200,
alignItems: 'center',
justifyContent: 'center',
top:25,
borderTopLeftRadius: 40,
borderTopRightRadius: 40,
},
/* View All Layout */
viewAll: {
left: -120,
bottom: 15,
},
uploadButton: {
left: 120,
bottom: 65
},
IconText:{
paddingTop: 5,
fontWeight: 'bold',
fontSize: 13,
color: '#FF9700',
alignItems: 'center',
justifyContent: 'center',
},
iconContainer: {
alignItems: 'center',
justifyContent: 'center',
},
/* Timer Text */
timerText: {
fontSize: 50,
transform: [{translateY: 290}],
},
svgContainer: {
position: 'absolute', // Make SVG position absolute to float over other components
top: 0,
left: 0,
right: 0,
bottom: 100,
alignItems: 'center',
justifyContent: 'center',
},
/* Header */
topheader: {
flex: 1,
position: 'absolute', 
top: 0,
left: 0,
right: 0,
bottom: '85%',
borderBottomLeftRadius: 30,
borderBottomRightRadius: 30,

justifyContent: 'space-between',
paddingHorizontal: 20,
},
dateGreetingsContainer: {
alignItems: 'flex-start',
flex: 1,
marginHorizontal: 10,
marginTop: 25,
},
date: {
marginTop: 25,
color: '#FF9700',
fontSize: 13,
},
greetings: {
color: '#0B3954',
fontSize: 25    ,
fontWeight: 'bold',
},
});