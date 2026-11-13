import { NativeModules } from 'react-native';
import uuid from 'react-native-uuid';
import { captureP1Error } from './sentry';

const { SurveysparrowReactNativeSdk } = NativeModules;
const UUID_KEY = 'SurveySparrowUUID';

const generateTraceId = () => `${uuid.v4()}-${Date.now()}`;

export const saveData = async (value: string) => {
  try {
    await SurveysparrowReactNativeSdk.putString(UUID_KEY, value);
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', { action: 'saveData', errorMessage: error?.message });
  }
};

export const loadData = async (isuuid: boolean = false) => {
  try {
    if (isuuid) return generateTraceId();
    return await SurveysparrowReactNativeSdk.getString(UUID_KEY);
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', { action: 'loadData', isuuid, errorMessage: error?.message });
    return null;
  }
};
