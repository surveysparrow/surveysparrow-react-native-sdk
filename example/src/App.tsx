import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Spotchecks from './SpotCheck';
import HomeScreen from './NewScreen';

import SpotScreen from './SpotCheck_Screen';

export type RootStackParamList = {
  Home: undefined;
  Spot: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Spot"
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Spot" component={SpotScreen} />
      </Stack.Navigator>
      <Spotchecks />
    </NavigationContainer>
  );
}
