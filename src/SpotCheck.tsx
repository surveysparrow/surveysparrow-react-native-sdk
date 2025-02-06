import React from 'react';
import { Provider } from 'react-redux';
import { store } from './SpotCheckState';

import type { SpotcheckProps, TrackEventProps } from './Types';

import { SpotcheckComponent } from './SpotCheckComponent';
import { sendTrackScreenRequest, sendTrackEventRequest } from './TrackAPIs';

const Spotcheck: React.FC<SpotcheckProps> = ({
  domainName,
  targetToken,
  userDetails = {},
  variables = {},
  customProperties = {},
}) => {
  return (
    <Provider store={store}>
      <SpotcheckComponent
        domainName={domainName}
        targetToken={targetToken}
        userDetails={userDetails}
        variables={variables}
        customProperties={customProperties}
      />
    </Provider>
  );
};

export const trackScreen = async (screen: string) => {
  try {
    const response = await sendTrackScreenRequest(screen);
    if (response.valid) {
      console.log('TrackScreen Suceeded');
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
      console.log('TrackEvent Suceeded');
    } else {
      console.log('TrackEvent Failed');
    }
  } catch (error) {
    console.log('Error in trackEvent: ', error);
  }
};

export default Spotcheck;
