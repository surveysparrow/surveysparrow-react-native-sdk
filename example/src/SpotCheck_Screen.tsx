import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from './App';
import { trackEvent, trackScreen } from 'spotcheck';

type AnotherScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Spot'
>;

type Props = {
  navigation: AnotherScreenNavigationProp;
};

const SpotScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    trackScreen('HomeScreen');
  });
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          trackEvent('HomeScreen', { onEvent: {} });
        }}
      >
        <Text style={{ color: 'black', fontSize: 20 }}>Onevent</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SpotScreen;