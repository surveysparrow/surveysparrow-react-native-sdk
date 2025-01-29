import { NativeModules } from 'react-native';

const { SpotCheck } = NativeModules;

export const saveString = (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    SpotCheck.saveString(key, value)
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
    SpotCheck.getString(key)
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
    await saveString('SurveySparrowUUID', value);
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const loadData = async () => {
  try {
    const value = await getString('SurveySparrowUUID');
    return value;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};
