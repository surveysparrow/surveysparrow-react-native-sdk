import React, { useLayoutEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SettingsScreen from './SettingsScreen';
import Spotcheck from 'surveysparrow-react-native-sdk';
import { SpotcheckProps } from 'surveysparrow-react-native-sdk';
import { initializeSpotChecks } from 'surveysparrow-react-native-sdk';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  useLayoutEffect(() => {
    initializeSpotChecks({
      ...{
        domainName: 'your-domain-name',
        targetToken: 'your-target-token',
        userDetails: {},
        variables: {},
        customProperties: {},
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
