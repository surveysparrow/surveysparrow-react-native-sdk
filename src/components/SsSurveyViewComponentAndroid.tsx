import React, { FC, useEffect, useRef } from 'react';
import {
  requireNativeComponent,
  View,
  UIManager,
  findNodeHandle,
  StyleProp,
  ViewStyle,
} from 'react-native';

const SurveyModuleView = requireNativeComponent('SsSurveyFragment');

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

const SsSurveyViewComponentAndroid: FC<Props> = ({
  styles,
  onSurveyComplete,
  config: { domain, token, surveyType, customParams = [] },
}) => {
  let nativeComponentRef = useRef<any>(null);
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
        // @ts-ignore
        onUpdate={(event) => {
          const data = event.nativeEvent;
          onSurveyComplete(data);
        }}
      />
    </View>
  );
};

export default SsSurveyViewComponentAndroid;
