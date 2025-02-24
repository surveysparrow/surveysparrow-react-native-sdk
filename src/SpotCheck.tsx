import React from 'react';
import { Provider } from 'react-redux';
import { store, updateState } from './SpotCheckState';
import type { SpotcheckProps, TrackEventProps } from './Types';
import { SpotcheckComponent } from './SpotCheckComponent';
import { sendTrackScreenRequest, sendTrackEventRequest } from './TrackAPIs';
import { start } from './HelperFunctions';

const Spotcheck: React.FC = () => {
  return (
    <Provider store={store}>
      <SpotcheckComponent />
    </Provider>
  );
};

export const trackScreen = async (screen: string) => {
  try {
    const response = await sendTrackScreenRequest(screen);
    if (response.valid) {
      console.log('Screen Tracking succeeded.');
      start();
    } else {
      if ('error' in response) {
        throw new Error(response.error.toString());
      } else {
        throw new Error('Tracking failed without an explicit error.');
      }
    }
  } catch (error: any) {
    console.log(`Screen Tracking Failed. ${error.message}`);
  }
};

export const trackEvent = async (screen: string, event: TrackEventProps) => {
  try {
    const response = await sendTrackEventRequest(screen, event);
    if (response.valid) {
      console.log('TrackEvent succeeded.');
      start();
    } else {
      if ('error' in response) {
        throw new Error(response.error.toString());
      } else {
        throw new Error('Tracking failed without an explicit error.');
      }
    }
  } catch (error: any) {
    console.log(`Event Tracking Failed. ${error.message}`);
  }
};

export const initializeSpotChecks = ({
  domainName,
  targetToken,
  userDetails = {},
  variables = {},
  customProperties = {},
}: SpotcheckProps) => {
  store.dispatch(
    updateState({
      domainName,
      targetToken,
      userDetails,
      variables,
      customProperties,
    })
  );
};

export default Spotcheck;
