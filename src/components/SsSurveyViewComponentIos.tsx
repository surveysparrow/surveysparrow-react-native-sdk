import React, { FC } from 'react';
import {
  View,
  requireNativeComponent,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

const CounterView = requireNativeComponent('SsSurveyView');

interface paramValue {
  name: string;
  value: string;
}

interface Props {
  config: {
    domain: string;
    token: string;
    surveyType: string;
    customParams?: Array<paramValue>;
  };
  onSurveyComplete(value: any): any;
  styles: StyleProp<ViewStyle>;
}

const SsSurveyViewComponentIos: FC<Props> = ({
  styles,
  onSurveyComplete,
  config: { domain, token, surveyType, customParams = [] },
}) => {
  const _onSurveyAnswerUpdate = (e: any) => {
    onSurveyComplete(e.nativeEvent.result);
  };

  return (
    <View style={styles}>
      <CounterView
        //@ts-ignore
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
