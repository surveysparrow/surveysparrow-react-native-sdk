import React, { FC, useEffect, useRef } from 'react';
import {
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle,
  StyleProp,
  ViewStyle,
  HostComponent,
} from 'react-native';
import type { IResponseData } from '../types/responseData';

interface ISurveyModuleViewProps {
  onUpdate: (event: { nativeEvent: IResponseData }) => void;
}
const SurveyModuleView: HostComponent<ISurveyModuleViewProps> =
  requireNativeComponent('SsSurveyFragment');

export interface paramValue {
  name: string;
  value: string;
}

export interface Props {
  config: {
    domain: string;
    token: string;
    surveyType: string;
    customParams?: Array<paramValue>;
  };
  onSurveyComplete(value: IResponseData): any;
  styles: StyleProp<ViewStyle>;
}

const SsSurveyViewComponentAndroid: FC<Props> = ({
  styles,
  onSurveyComplete,
  config: { domain, token, surveyType, customParams = [] },
}) => {
  let nativeComponentRef = useRef(null);
  useEffect(() => {
    const findId = () => {
      const androidViewId = findNodeHandle(nativeComponentRef.current);
      if (androidViewId) {
        UIManager.dispatchViewManagerCommand(
          androidViewId, // @ts-ignore
          UIManager.SsSurveyFragment.Commands.create.toString(),
          [androidViewId, { domain, token, surveyType, customParams }]
        );
      }
    };
    setTimeout(() => {
      findId();
    }, 200);
  }, [customParams, domain, surveyType, token]);

  return (
    <View style={styles} nativeID="surveyView">
      <SurveyModuleView
        ref={nativeComponentRef}
        onUpdate={(event) => {
          const data = event.nativeEvent;
          onSurveyComplete(data);
        }}
      />
    </View>
  );
};

export default SsSurveyViewComponentAndroid;
