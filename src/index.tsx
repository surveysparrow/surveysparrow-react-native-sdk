import {
  SpotCheck,
  initializeSpotChecks,
  trackScreen,
  trackEvent,
  closeSpotChecks,
} from './spotchecks';

export { initializeSpotChecks, trackScreen, trackEvent, closeSpotChecks };
export default SpotCheck;

export type {
  CustomProperties,
  SpotcheckProps,
  SsSpotcheckListener,
  TrackEventProps,
  TrackScreenProps,
  UserDetails,
  Variables,
} from './spotchecks';
