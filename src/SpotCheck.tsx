import React from 'react';
import { Provider } from 'react-redux';
import { store } from './SpotCheckState';

import type { SpotcheckProps } from './Types';
import { start } from './HelperFunctions';
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

export const TrackScreen = async (screen: string) => {
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

export const TrackEvent = async (screen: string, event: Event) => {
  try {
    const response = await sendTrackEventRequest(screen, event);
    if (response.valid) {
      console.log('TrackEvent Suceeded');
      start();
    } else {
      console.log('TrackEvent Failed');
    }
  } catch (error) {
    console.log('Error in trackEvent: ', error);
  }
};

export default Spotcheck;
