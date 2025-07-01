import Spotcheck from './SpotCheck';
import { trackScreen, trackEvent } from './SpotCheck';
import type {
  TrackEventProps,
  SpotcheckProps,
  SsSpotcheckListener,
} from './Types';
import { initializeSpotChecks } from './SpotCheck';

export { initializeSpotChecks };
export { trackScreen, trackEvent };
export default Spotcheck;
export type { TrackEventProps, SpotcheckProps, SsSpotcheckListener };
