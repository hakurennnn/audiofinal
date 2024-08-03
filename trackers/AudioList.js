import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AudioList = ({ route }) => {
  const navigation = useNavigation();
  const { recordingsList } = route.params || { recordingsList: [] };

  return (
    <View style={styles.container}>
      <View style={styles.topheader}></View>
      <Text style={styles.header}>Audio List</Text>
      
      <ScrollView style={styles.recordingsList}>
        {recordingsList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Empty Playback List </Text>
            <Text style={styles.emptyText}>Please Record or Upload an Audio</Text>
          </View>
        ) : (
          recordingsList.map((recording, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recordingItem}
              onPress={() => navigation.navigate('PlaybackScreen', { recording })}>
              <Text style={styles.recordingText}>{recording.name} </Text>
              <Text style={styles.durationText}>{recording.duration} s</Text> 
            </TouchableOpacity> 
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
container: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#F5FCFF',
},
header: {
fontSize: 24,
fontWeight: 'bold',
color: 'white',
margin: 40,
},
recordingsList: {
width: '100%',
},
recordingItem: {
padding: 16,
width: '95%',
left: '2%',
margin: 5,
backgroundColor:'white', 
borderColor: 'gainsboro',
borderWidth: 1,
borderBottomWidth: 5,
borderRadius: 10,
},
recordingText: {
left: 5,
fontSize: 16,
fontWeight: '600',
color: '#0B3954',
},
emptyContainer: {
alignItems: 'center',
justifyContent: 'center',
marginTop: '50%',
},
emptyText: {
fontSize: 20,
paddingBottom: 20,
color: 'gainsboro',
},
durationText: {
fontSize: 14,
textAlign: 'right',
fontWeight: '400',
color: '#FF9700',

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
backgroundColor: '#0B3954',
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

export default AudioList;
