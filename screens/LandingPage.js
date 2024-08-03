import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image } from 'react-native';

import ActionsScreen from '../Unused Code/ActionsScreen';
import Notifications from '../Unused Code/NotificationsScreen';
import Profile from '../Unused Code/ProfileScreen';

import TrackerIcon from '../assets/TrackerIcon.png';
import NotificationIcon from '../assets/NotificationIcon.png';
import ProfileIcon from '../assets/ProfileIcon.png';

import UploadAudioScreen from '../trackers/UploadAudioScreen';
import RecordAudioScreen from '../trackers/RecordAudioScreen';
import PlaybackScreen from '../trackers/PlaybackScreen';
import AudioList from '../trackers/AudioList';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ActionsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="RecordAudioScreen" component={RecordAudioScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UploadAudioScreen" component={UploadAudioScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ActionsScreen" component={ActionsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PlaybackScreen" component={PlaybackScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AudioList" component={AudioList} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const LandingPage = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 70,
          paddingBottom:10,
          elevation: 40,
          backgroundColor: '#0B3954'
        },
      }}
    >
      <Tab.Screen
        name="Authenticate"
        component={ActionsStack}
        
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Image source={TrackerIcon} style={{ tintColor: color, width: size, height: size }} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Image source={NotificationIcon} style={{ tintColor: color, width: size, height: size }} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Identity"
        component={Profile}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Image source={ProfileIcon} style={{ tintColor: color, width: size, height: size }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default LandingPage;
