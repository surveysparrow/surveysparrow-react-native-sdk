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
      console.log('TrackScreen Suceeded');
      start();
    } else {
      console.log('TrackScreen Failed');
    }
  } catch (error) {
    console.log('Error in trackScreen: ', error);
  }
};

export const trackEvent = async (screen: string, event: TrackEventProps) => {
  try {
    const response = await sendTrackEventRequest(screen, event);
    if (response.valid) {
      start();
      console.log('TrackEvent Suceeded');
    } else {
      console.log('TrackEvent Failed');
    }
  } catch (error) {
    console.log('Error in trackEvent: ', error);
  }
};

export const initializeSpotChecks = ({
  domainName,
  targetToken,
  userDetails,
  variables,
  customProperties,
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
