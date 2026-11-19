export interface SsSpotcheckListener {
  onSurveyLoaded?: (response: Record<string, any>) => Promise<void>;
  onSurveyResponse?: (response: Record<string, any>) => Promise<void>;
  onPartialSubmission?: (response: Record<string, any>) => Promise<void>;
  onCloseButtonTap?: () => Promise<void>;
}

export interface UserDetails {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: number;
  [key: string]: any;
}

export interface Variables {
  sparrowLang?: string;
  [key: string]: any;
}

export interface CustomProperties {
  [key: string]: any;
}

export interface SpotcheckProps {
  domainName: string;
  targetToken: string;
  userDetails?: UserDetails;
  variables?: Variables;
  customProperties?: CustomProperties;
  listener?: SsSpotcheckListener;
}

export interface TrackScreenOptions {
  variables?: Variables;
  customProperties?: CustomProperties;
  userDetails?: UserDetails;
}

// Also accepts the legacy shape: the event map itself (e.g. { MobileClick: {} }).
export interface TrackEventProps {
  screen?: string;
  event?: Record<string, any>;
  options?: TrackScreenOptions;
  [key: string]: any;
}

export interface TrackScreenProps {
  screen: string;
  options?: TrackScreenOptions;
  [key: string]: any;
}

export interface VisitorInfo {
  deviceType: string;
  operatingSystem: string;
  screenResolution: {
    width: number;
    height: number;
  };
  currentDate: Date;
  timezone: string;
}
