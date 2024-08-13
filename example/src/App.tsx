import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Spotchecks from './SpotCheck';
import HomeScreen from './NewScreen';

import SpotScreen from './SpotCheck_Screen';

export type RootStackParamList = {
  Home: undefined;
  SpotCheck: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Spotchecks />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SpotCheck" component={SpotScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
