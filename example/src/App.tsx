import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Spotcheck from 'spotcheck';
import HomeScreen from './NewScreen';
import SpotScreen from './SpotCheck_Screen';
import React from 'react';

export type RootStackParamList = {
  Home: undefined;
  SpotCheck: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SpotCheck" component={SpotScreen} />
      </Stack.Navigator>
      <Spotcheck
        domainName="Your-Domain-Name"
        targetToken="Your-Target-Token"
        customProperties={{}}
        variables={{}}
        userDetails={{}}
        sparrowLang=""
      />
    </NavigationContainer>
  );
}
