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
}

export interface TrackEventProps {
  [key: string]: any;
}
