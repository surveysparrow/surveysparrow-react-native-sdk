import { NativeModules, DeviceEventEmitter } from 'react-native';

const { SsSurveyModule } = NativeModules;

export interface paramValue {
  name: string;
  value: string;
}

export const SsSurvey = ({
  domain,
  token,
  surveyType,
  customParams = [],
  thankYouPageTimeLimit = 3000,
}: {
  domain: string;
  token: string;
  surveyType: string;
  customParams?: Array<paramValue>;
  thankYouPageTimeLimit?: number;
}) => {
  SsSurveyModule.openSurvey({
    domain,
    token,
    surveyType,
    customParams,
    thankYouPageTimeLimit,
  });
};

export const onSurveyResponseListener = DeviceEventEmitter;

export const ScheduleSsSurvey = ({
  domain,
  token,
  surveyType,
  customParams = [],
  thankYouPageTimeLimit = 2000,
  alertTitle = 'Rate us',
  alertMessage = 'Share your feedback and let us know how we are doing',
  alertPositiveText = 'Rate Now',
  alertNegativeText = 'Later',
  startAfter = 259200000,
  repeatInterval = 432000000,
  repeatSurvey = false,
  incrementalRepeat = false,
}: {
  domain: string;
  token: string;
  surveyType: string;
  customParams?: Array<paramValue>;
  thankYouPageTimeLimit?: number;
  alertTitle?: string;
  alertMessage?: string;
  alertPositiveText?: string;
  alertNegativeText?: string;
  startAfter?: number;
  repeatInterval?: number;
  repeatSurvey?: boolean;
  incrementalRepeat?: boolean;
}) => {
  SsSurveyModule.scheduleSsSurvey({
    domain,
    token,
    surveyType,
    customParams,
    thankYouPageTimeLimit,
    alertTitle,
    alertMessage,
    alertPositiveText,
    alertNegativeText,
    startAfter,
    repeatInterval,
    repeatSurvey,
    incrementalRepeat,
  });
};

export const ClearScheduleSsSurvey = ({
  domain,
  token,
}: {
  domain: string;
  token: string;
}) => {
  SsSurveyModule.clearScheduleSsSurvey({
    domain,
    token,
  });
};
