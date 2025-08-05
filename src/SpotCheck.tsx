import React from 'react';
import { Provider } from 'react-redux';
import { store, updateState } from './SpotCheckState';
import type {
  CustomProperties,
  SpotcheckProps,
  TrackEventProps,
  UserDetails,
  Variables,
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

export const trackScreen = async (
  screen: string,
  options: {
    variables?: Variables;
    customProperties?: CustomProperties;
    userDetails?: UserDetails;
  } = {
    variables: {},
    customProperties: {},
    userDetails: {},
  }
) => {
  try {
    const response = await sendTrackScreenRequest(screen, options);
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
