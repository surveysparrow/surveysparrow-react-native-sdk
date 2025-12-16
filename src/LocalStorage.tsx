import { NativeModules } from 'react-native';
import { captureP1Error } from './HelperFunctions';

const { SurveysparrowReactNativeSdk } = NativeModules;

export const putString = (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    SurveysparrowReactNativeSdk.putString(key, value)
      .then((success: boolean) => {
        if (success) {
          resolve();
        } else {
          reject(new Error('Could not save string'));
        }
      })
      .catch(reject);
  });
};

export const getString = (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    SurveysparrowReactNativeSdk.getString(key)
      .then((value: string | null) => {
        if (value !== null) {
          resolve(value);
        } else {
          resolve(null);
        }
      })
      .catch(reject);
  });
};

export const saveData = async (value: string) => {
  try {
    await putString('SurveySparrowUUID', value);
  } catch (error) {
    captureP1Error(error, 'UNKNOWN', {
      action: 'saveData',
      value,
    });
    console.error('Error saving data:', error);
  }
};

export const loadData = async () => {
  try {
    const value = await getString('SurveySparrowUUID');
    return value;
  } catch (error) {
    captureP1Error(error, 'UNKNOWN', {
      action: 'loadData',
    });
    console.error('Error retrieving data:', error);
    return null;
  }
};
