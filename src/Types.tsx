interface UserDetails {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: number;
  [key: string]: any;
}

interface Variables {
  sparrowLang?: string;
  [key: string]: any;
}

interface CustomProperties {
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

export interface TrackEventProps {
  [key: string]: any;
}

export interface SsSpotcheckListener {
  onSurveyLoaded?: (response: Record<string, any>) => Promise<void>;
  onSurveyResponse?: (response: Record<string, any>) => Promise<void>;
  onPartialSubmission?: (response: Record<string, any>) => Promise<void>;
  onCloseButtonTap?: () => Promise<void>;
}
