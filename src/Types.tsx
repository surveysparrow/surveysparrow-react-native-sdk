interface UserDetails {
  uuid?: string;
  email?: string;
  Firstname?: string;
  Lastname?: string;
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
}

export interface TrackEventProps {
  [key: string]: any;
}
