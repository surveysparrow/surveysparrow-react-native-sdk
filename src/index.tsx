import Spotcheck from './SpotCheck';
import { trackScreen, trackEvent } from './SpotCheck';
import { onSpotcheckNavigationChange } from './NavigationHandler';
import type {
  TrackEventProps,
  SpotcheckProps,
  UserDetails,
  Variables,
  CustomProperties,
  SsSpotcheckListener,
} from './Types';
import { initializeSpotChecks } from './SpotCheck';

export { initializeSpotChecks };
export { trackScreen, trackEvent };
export { onSpotcheckNavigationChange };
export default Spotcheck;
export type {
  TrackEventProps,
  SpotcheckProps,
  UserDetails,
  Variables,
  CustomProperties,
  SsSpotcheckListener,
};
