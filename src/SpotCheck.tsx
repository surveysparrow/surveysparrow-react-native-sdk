import React from 'react';
import { Provider } from 'react-redux';
import { store, updateState } from './SpotCheckState';
import type {
  SpotcheckProps,
  SsSpotcheckListener,
  TrackEventProps,
} from './Types';
import { SpotcheckComponent } from './SpotCheckComponent';
import { sendTrackScreenRequest, sendTrackEventRequest } from './TrackAPIs';

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

const spotchecksListener: SsSpotcheckListener = {};

export const initializeSpotChecks = ({
  domainName,
  targetToken,
  userDetails = {},
  variables = {},
  customProperties = {},
  listener = spotchecksListener,
}: SpotcheckProps) => {
  store.dispatch(
    updateState({
      domainName,
      targetToken,
      userDetails,
      variables,
      customProperties,
      listener,
    })
  );
};

export default Spotcheck;
