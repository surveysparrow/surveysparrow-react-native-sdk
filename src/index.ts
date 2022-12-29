import { Platform } from 'react-native';
import SsSurveyViewComponentAndroid from './components/SsSurveyViewComponentAndroid';
import SsSurveyViewComponentIos from './components/SsSurveyViewComponentIos';
import {
  SsSurvey as IosSsSurvey,
  onSurveyResponseListener as IosOnsSurveyResponseListener,
  ScheduleSsSurvey as IosScheduleSsSurvey,
  ClearScheduleSsSurvey as IosClearScheduleSsSurvey,
} from './components/SsSurveyModuleIos';
import {
  SsSurvey as AndroidSsSurvey,
  onSurveyResponseListener as AndroidOnSurveyResponseListener,
  ScheduleSsSurvey as AndroidScheduleSsSurvey,
  ClearScheduleSsSurvey as AndroidClearScheduleSsSurvey,
} from './components/SsSurveyModuleAndroid';

const invokeSurveySparrow =
  Platform.OS === 'android' ? AndroidSsSurvey : IosSsSurvey;
const onSurveyResponseListener =
  Platform.OS === 'android'
    ? AndroidOnSurveyResponseListener
    : IosOnsSurveyResponseListener;
const scheduleSurveySparrow =
  Platform.OS === 'android' ? AndroidScheduleSsSurvey : IosScheduleSsSurvey;
const clearSurveySparrow =
  Platform.OS === 'android'
    ? AndroidClearScheduleSsSurvey
    : IosClearScheduleSsSurvey;
const SurveySparrow =
  Platform.OS === 'android'
    ? SsSurveyViewComponentAndroid
    : SsSurveyViewComponentIos;

export {
  SurveySparrow,
  invokeSurveySparrow,
  scheduleSurveySparrow,
  clearSurveySparrow,
  onSurveyResponseListener,
};
