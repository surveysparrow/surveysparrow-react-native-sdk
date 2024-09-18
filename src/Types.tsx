interface UserDetails {
  [key: string]: any;
}

interface Variables {
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
  sparrowLang?: string;
}

export interface Event {
  [key: string]: any;
}
