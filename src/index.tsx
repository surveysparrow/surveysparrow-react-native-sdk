import {
  SpotCheck,
  initializeSpotChecks,
  trackScreen,
  trackEvent,
  closeSpotChecks,
} from './spotchecks';

export { initializeSpotChecks, trackScreen, trackEvent, closeSpotChecks };
// Named alias so `import { Spotcheck }` works alongside the default export.
export { SpotCheck as Spotcheck };
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
