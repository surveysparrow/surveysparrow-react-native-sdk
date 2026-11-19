import React, { useLayoutEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SettingsScreen from './SettingsScreen';
import Spotcheck from 'surveysparrow-react-native-sdk';
import { SpotcheckProps, SsSpotcheckListener } from 'surveysparrow-react-native-sdk';
import { initializeSpotChecks } from 'surveysparrow-react-native-sdk';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();


const listener: SsSpotcheckListener = {
  onSurveyLoaded: async (response:Record<string,any>) => {

    console.log('Survey Loaded', response);
  },
  onSurveyResponse: async (response:Record<string,any>) => {
    console.log('Survey Response', response);
  },
  onPartialSubmission: async (response:Record<string,any>) => {
    console.log('Partial Submission', response);
  },
  onCloseButtonTap: async () => {
    console.log('Close Button Tapped');
  },
};


export default function App() {
  useLayoutEffect(() => {
    initializeSpotChecks({
      ...{
        domainName: 'your-domain-name',
        targetToken: 'your-target-token',
        userDetails: {},
        variables: {},
        customProperties: {},
        listener: listener,
      } as SpotcheckProps
    });
  },[]);

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      <Spotcheck/>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
