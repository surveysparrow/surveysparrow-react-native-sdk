import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store, updateState } from './SpotCheckState';
import type {
  CustomProperties,
  SpotcheckProps,
  SsSpotcheckListener,
  TrackEventProps,
  UserDetails,
  Variables,
} from './Types';
import { SpotcheckComponent } from './SpotCheckComponent';
import { sendTrackScreenRequest, sendTrackEventRequest } from './TrackAPIs';
import {
  initializeSentry,
  captureSDKError,
  captureP0Error,
  captureP1Error,
  type ErrorSource,
} from './HelperFunctions';

initializeSentry();

export { captureSDKError, captureP0Error, captureP1Error };
export type { ErrorSource };

interface ErrorBoundaryState {
  hasError: boolean;
}

class SpotcheckErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureP0Error(error, 'APP_CRASH', {
      type: 'appCrash',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const Spotcheck: React.FC = () => {
  return (
    <SpotcheckErrorBoundary>
      <Provider store={store}>
        <SpotcheckComponent />
      </Provider>
    </SpotcheckErrorBoundary>
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
      if (response?.userLogs) {
        console.log(`Screen Tracking Failed. ${response.error}`);
      } else if (response?.error?.length > 0) {
        throw new Error(response.error.toString());
      } else if (response?.error === undefined) {
        throw new Error('Tracking failed without an explicit error.');
      } else {
        console.log(`Screen Tracking Failed.`);
      }
    }
  } catch (error: any) {
    captureP1Error(error, 'TRACK_SCREEN', {
      screen,
      options,
      errorMessage: error.message,
    });
    console.log(`Screen Tracking Failed. ${error.message}`);
  }
};

export const trackEvent = async (screen: string, event: TrackEventProps) => {
  try {
    const response = await sendTrackEventRequest(screen, event);
    if (response.valid) {
      console.log('TrackEvent succeeded.');
    } else {
      if (response?.userLogs) {
        console.log(`Event Tracking Failed. ${response.error}`);
      } else if (response?.error?.length > 0) {
        throw new Error(response.error.toString());
      } else if (response?.error === undefined) {
        throw new Error('Tracking failed without an explicit error.');
      } else {
        console.log(`Event Tracking Failed.`);
      }
    }
  } catch (error: any) {
    captureP1Error(error, 'TRACK_EVENT', {
      screen,
      event,
      errorMessage: error.message,
    });
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
  try {
    if (!targetToken) {
      captureP0Error(
        new Error('Missing required parameters: targetToken'),
        'SDK_INITIALIZATION',
        { domainName, targetToken }
      );
      return;
    }

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
  } catch (error: any) {
    captureP0Error(error, 'SDK_INITIALIZATION', {
      domainName,
      targetToken,
      errorMessage: error.message,
    });
  }
};

export default Spotcheck;
