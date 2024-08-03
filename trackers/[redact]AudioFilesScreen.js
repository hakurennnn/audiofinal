import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AudioFilesScreen = ({ route }) => {
  const navigation = useNavigation();
  const { recordingsList } = route.params || { recordingsList: [] }; // Handle the case where route.params might be undefined

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recordings</Text>
      <ScrollView style={styles.recordingsList}>
        {recordingsList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Empty Playback List, Please Record an Audio</Text>
          </View>
        ) : (
          recordingsList.map((recording, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recordingItem}
              onPress={() => navigation.navigate('PlaybackScreen', { recording })}
            >
              <Text style={styles.recordingText}>{recording.name}</Text>
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
    margin: 20,
  },
  recordingsList: {
    width: '100%',
  },
  recordingItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  recordingText: {
    fontSize: 16,
    color: 'black',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '50%',
  },
  emptyText: {
    fontSize: 16,
    color: 'grey',
  },
});

export default AudioFilesScreen;
