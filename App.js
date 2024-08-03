// Import necessary modules and components
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import StartScreen from './screens/StartScreen';
import LogInPage from './screens/LogInPage';
import SignUpPage from './screens/SignUpPage';
import VoiceAuthen from './Authenticator/VoiceAuthen';
import EnrollAuthen from './Authenticator/EnrollAuthen';
import RecordAuthen from './Authenticator/RecordAuthen';
import AccountsAuthen from './Authenticator/AccountsAuth';
import LandingPage from './screens/LandingPage';


const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StartScreen" component={StartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LogInPage" component={LogInPage} options={{ headerShown: false }} />
        <Stack.Screen name="SignUpPage" component={SignUpPage} options={{ headerShown: false }} />
        <Stack.Screen name="EnrollAuthen" component={EnrollAuthen} options={{ headerShown: false }} />
        <Stack.Screen name="RecordAuthen" component={RecordAuthen} options={{ headerShown: false }} />
        <Stack.Screen name="AccountsAuthen" component={AccountsAuthen} options={{ headerShown: false }} />
        <Stack.Screen name="VoiceAuthen" component={VoiceAuthen} options={{ headerShown: false }} />
        <Stack.Screen name="LandingPage" component={LandingPage} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
