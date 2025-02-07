import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { trackEvent, trackScreen } from 'surveysparrow-react-native-sdk';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from './App';

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Settings'
>;

type Props = {
  navigation: SettingsScreenNavigationProp;
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => { trackScreen('SettingsScreen'); }, []);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Text>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Setting Screen</Text>
      </View>
      <TouchableOpacity
        onPress={async () => {
          await trackEvent('SettingsScreen', {'MobileClick': {}});
        }
          
        }
        style={styles.content}
      >
        <Text style={styles.link}>Track Event</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    left: 10,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
    marginVertical: 10,
    fontSize: 16,
  },
});

export default SettingsScreen;
