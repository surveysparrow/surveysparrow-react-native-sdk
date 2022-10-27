import { NativeModules, NativeEventEmitter } from 'react-native';
import type { SurveyTypes } from '../types/survey';

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
  surveyType: SurveyTypes;
  customParams?: Array<paramValue>;
  thankYouPageTimeLimit?: number;
}) => {
  const second = ((thankYouPageTimeLimit % 60000) / 1000).toFixed(0);
  SsSurveyModule.openSurvey({
    domain,
    token,
    surveyType,
    customParams,
    thankYouPageTimeLimit: second,
  });
};

export const onSurveyResponseListener = new NativeEventEmitter(SsSurveyModule);

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
  surveyType: SurveyTypes;
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
  const second = ((thankYouPageTimeLimit % 60000) / 1000).toFixed(0);
  SsSurveyModule.scheduleSsSurvey({
    domain,
    token,
    surveyType,
    customParams,
    thankYouPageTimeLimit: second,
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
  SsSurveyModule.clearscheduleSsSurvey({
    domain,
    token,
  });
};
