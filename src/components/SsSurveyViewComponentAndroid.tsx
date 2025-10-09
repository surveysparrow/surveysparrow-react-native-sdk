import React, { FC, useRef, useState } from 'react';
import { View, StyleProp, ViewStyle, Animated, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { IResponseData } from '../types/responseData';

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
  const webViewRef = useRef<WebView>(null);
  const [progress, setProgress] = useState(new Animated.Value(0));

  const generateUrl = () => {
    let params = '';
    if (customParams.length > 0) {
      params = '?' + customParams.map((p) => `${p.name}=${p.value}`).join('&');
    }
    const typeSegment = surveyType === 'nps' ? 'n' : 's';
    return `https://${domain}/${typeSegment}/android/${token}${params}`;
  };

  const handleProgress = (newProgress: number) => {
    Animated.timing(progress, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'surveyCompleted') {
        onSurveyComplete(data);
      }
    } catch (e) {
      console.warn('Error from surveysparrow SDK, ', e);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles, { position: 'relative', overflow: 'hidden' }]}>
      <Animated.View
        style={{
          height: 3,
          backgroundColor: '#007AFF',
          width: progressWidth,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 999999,
        }}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: generateUrl() }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadProgress={({ nativeEvent }) =>
          handleProgress(nativeEvent.progress)
        }
        onMessage={handleMessage}
        startInLoadingState={true}
        injectedJavaScript={`
          window.SsAndroidSdk = {
            shareData: function(data) {
              window.ReactNativeWebView.postMessage(data);
            }
          };
        `}
        onShouldStartLoadWithRequest={(request) => {
          if (!request.url.includes('https://surveysparrow.com/thankyou')) {
            if (Platform.OS === 'android') {
              import('react-native').then(({ Linking }) =>
                Linking.openURL(request.url)
              );
            } else {
              import('react-native').then(({ Linking }) =>
                Linking.openURL(request.url)
              );
            }
            return false;
          }
          return true;
        }}
      />
    </View>
  );
};

export default SsSurveyViewComponentAndroid;
