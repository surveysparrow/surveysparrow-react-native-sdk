import React, { FC } from 'react';
import {
  View,
  requireNativeComponent,
  StyleProp,
  ViewStyle,
  StyleSheet,
  HostComponent,
} from 'react-native';
import type { IResponseData } from '../types/responseData';

interface ISurveyModuleViewProps {
  onUpdate: (e: {
    nativeEvent: {
      result: IResponseData;
    };
  }) => void;
  surveyDomain: {
    domain: string;
    token: string;
    surveyType: string;
    customParams: paramValue[];
  };
  style: ViewStyle;
}
const CounterView: HostComponent<ISurveyModuleViewProps> =
  requireNativeComponent('SsSurveyView');

export interface paramValue {
  name: string;
  value: string;
}

export interface IConfig {
  domain: string;
  token: string;
  surveyType: string;
  customParams?: Array<paramValue>;
}
export interface Props {
  config: IConfig;
  onSurveyComplete(value: IResponseData): any;
  styles: StyleProp<ViewStyle>;
}

const SsSurveyViewComponentIos: FC<Props> = ({
  styles,
  onSurveyComplete,
  config: { domain, token, surveyType, customParams = [] },
}) => {
  const _onSurveyAnswerUpdate = (e: {
    nativeEvent: { result: IResponseData };
  }) => {
    onSurveyComplete(e.nativeEvent.result);
  };

  return (
    <View style={styles}>
      <CounterView
        onUpdate={_onSurveyAnswerUpdate}
        surveyDomain={{ domain, token, surveyType, customParams }}
        style={compStyle.fullView}
      />
    </View>
  );
};
const compStyle = StyleSheet.create({
  fullView: {
    width: '100%',
    height: '100%',
  },
});

export default SsSurveyViewComponentIos;
