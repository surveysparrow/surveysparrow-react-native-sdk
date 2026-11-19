import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from './App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <View>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.buttonText}>Profile Screen</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonText}>Settings Screen</Text>
      </TouchableOpacity>
      </View>
      <View></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    color: 'blue',
    marginVertical: 10,
  },
});

export default HomeScreen;
