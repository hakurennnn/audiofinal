import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome5 } from '@expo/vector-icons';
import { Circle, Svg } from 'react-native-svg';

const PlaybackScreen = ({ route }) => {
  const [playbackObject, setPlaybackObject] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({}); //Play Audio
  const [isRepeatMode, setIsRepeatMode] = useState(false); // Playback
  const [elapsedTime, setElapsedTime] = useState(0); // Timer state
  const { recording } = route.params;
  const animatedValue = useRef(new Animated.Value(0)).current; // Animated value for circle animation

  useEffect(() => {
    // Initialize playback object
    const initPlaybackObject = async () => {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true },
        updatePlaybackStatus
      );
      setPlaybackObject(sound);
    };
    initPlaybackObject();
    return () => playbackObject?.unloadAsync();
  }, [recording.uri]);
   
/*     return () => {
      if (playbackObject) {
        playbackObject.unloadAsync();
      }
    };
  }, [recording.uri]); */

  /* Timer */
  useEffect(() => {
    let timer;
    if (playbackStatus.isPlaying) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
      setElapsedTime(0); // Reset timer when playback stops
    }
    return () => clearInterval(timer);
  }, [playbackStatus.isPlaying]);
  
  /* Forward/Backward Timer Setting */
  useEffect(() => {
    if (playbackStatus.positionMillis !== undefined) {
      const newElapsedTime = Math.floor(playbackStatus.positionMillis / 1000);
      setElapsedTime(newElapsedTime);
    }
  }, [playbackStatus.positionMillis]);

  /* Animation Circle */
  useEffect(() => {
    let timer;
    const circumference = 30 * 2 * Math.PI;
    if (playbackStatus.positionMillis !== undefined) {
      const elapsedTimeInSeconds = playbackStatus.positionMillis / 1000;
      const animationProgress = (elapsedTimeInSeconds % 30);
      const animatedStrokeOffset = circumference - (circumference * animationProgress / 30);

      Animated.timing(animatedValue, {
        toValue: animatedStrokeOffset,
        duration: 500,
        useNativeDriver: true
      }).start();

      if (playbackStatus.isPlaying) {
        timer = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
      } else {
        clearInterval(timer);
      }
    }
    if (playbackStatus.didJustFinish) {
      Animated.timing(animatedValue, {
        toValue: circumference, // Reset to full
        duration: 1000,
        useNativeDriver: true
      }).start(() => {
        setElapsedTime(0);
      });
    }
    return () => clearInterval(timer);
  }, [playbackStatus.positionMillis, playbackStatus.isPlaying, playbackStatus.didJustFinish]);


  const updatePlaybackStatus = (status) => {
    if (status.didJustFinish && isRepeatMode) {
      playbackObject.setPositionAsync(0).then(() => {
        playbackObject.playAsync();
        setIsRepeatMode(false); // Audio will repeat once
      });
    }
    setPlaybackStatus(status);
  };

  /* Media Control */
  const controlPlayback = async (action) => {
    if (!playbackObject) return;

    switch (action) {
      case 'play':
        if (playbackStatus.isPlaying) {
          await playbackObject.pauseAsync();
        } else {
          await playbackObject.playAsync();
        }
        break;
      case 'forward':
        await playbackObject.setPositionAsync(playbackStatus.positionMillis + 1000);
        break;
      case 'backward':
        await playbackObject.setPositionAsync(Math.max(0, playbackStatus.positionMillis - 1000));
        break;
      case 'repeat':
        await playbackObject.stopAsync();
        await playbackObject.setPositionAsync(0);
        await playbackObject.playAsync();
        break;
    }
  };
/* bck */
  return (
    <View style={styles.container}>
      {/*Circle 1*/}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <Circle 
        cx="50" 
        cy="20" 
        r="30" 
        fill="none" 
        stroke="#0B3954" 
        strokeWidth="8"
      />
      </Svg>

      {/*Circle 2*/}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <Circle 
        cx="50" 
        cy="20" 
        r="30" 
        fill="none" 
        stroke="#E7E7E7" 
        strokeWidth="3"
      />
      </Svg>

      {/* Animated Circle */}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <AnimatedCircle 
        cx="50" 
        cy="20" 
        r="30" 
        fill="none" 
        stroke="#FF9700" 
        strokeWidth="3"
        strokeLinecap='round'
        strokeDasharray={`${30 * 2 * Math.PI}`}
        strokeDashoffset={animatedValue}
      />
      </Svg>
      
      
      <View style={styles.layout}>
        <Text style={styles.timerText}>{elapsedTime}</Text>
        <Text style={styles.header}>{recording.name}</Text>
      </View>

      <View style={styles.controls}>
      {/* Repeat Toggle */}
      <TouchableOpacity onPress={() => controlPlayback('repeat')}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="sync-alt" size={25} color="#0B3954"/>
            <Text style = {styles.IconText}>
            Repeat
          </Text>
          </View>
        </TouchableOpacity>
      </View>  

      <View style={styles.controls}>
        {/* Forward +5s */}
        <TouchableOpacity onPress={() => controlPlayback('forward')} >
        <View style={styles.iconContainer}>
          <FontAwesome5 name="redo-alt" size={25} color="#0B3954"/>
          <Text style = {styles.IconText}>
            +1s
          </Text>
        </View>
        </TouchableOpacity>

        {/* Play & Pause */}
        <TouchableOpacity onPress={() => controlPlayback('play')}>
          <View style={[styles.IconCircle, styles.iconContainer]}>
            <FontAwesome5
              name={playbackStatus.isPlaying ? "pause" : "play"}
              size={20}
              color="#fff"
            />
          </View>
        </TouchableOpacity>

        {/* Backward -5s */}
        <TouchableOpacity onPress={() => controlPlayback('backward')} >
        <View style={styles.iconContainer}>
          <FontAwesome5 name="undo-alt" size={25} color="#0B3954"/>
          <Text style = {styles.IconText}>
            -1s
          </Text>
        </View>
        </TouchableOpacity>

      </View>
    </View>
  );
};
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
container: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#F5FCFF',
},
header: {
fontSize: 24,
transform: [{translateY: -275}],
},
/* Controls Layout */
controls: {
flexDirection: 'row',
justifyContent: 'space-around',
paddingTop: 20,
width: '100%',
marginTop: 20,
},
layout:{
height: 200,
alignItems: 'center',
justifyContent: 'center'
},
/* Icon Layout */
IconLayout:{
alignItems: 'center',
justifyContent: 'center',
},
IconCircle: {
backgroundColor: '#0B3954',
borderRadius: 25,
width: 50,
height: 50,
alignItems: 'center',
justifyContent: 'center',
transform: [{translateY: -5}],
},
IconText:{
paddingTop: 5,
fontWeight: 'bold',
fontSize: 13,
color: '#0B3954',
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
transform: [{translateY: -15}],
},
svgContainer: {
position: 'absolute', // Make SVG position absolute to float over other components
top: 0,
left: 0,
right: 0,
bottom: 0,
alignItems: 'center',
justifyContent: 'center',
},
});

export default PlaybackScreen;
