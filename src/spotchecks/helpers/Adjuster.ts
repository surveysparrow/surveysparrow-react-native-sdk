import { NativeModules, Platform } from 'react-native';

const { AdjusterModule } = NativeModules;

// Same soft-input behaviour as the legacy RN SDK.
export const Adjuster = {
  setAdjustNothing: (): void => {
    if (Platform.OS === 'android') AdjusterModule?.setAdjustNothing?.();
  },
  setAdjustResize: (): void => {
    if (Platform.OS === 'android') AdjusterModule?.setAdjustResize?.();
  },
};
