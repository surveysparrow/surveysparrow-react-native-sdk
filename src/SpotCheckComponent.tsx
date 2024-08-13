import { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  type ScaledSize,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import {
  type AppDispatch,
  type RootState,
  setTargetToken,
  setDomainName,
  setUserDetails,
  setVariables,
  setCustomProperties,
  setSpotcheckID,
  setCurrentQuestionHeight,
  setCloseButtonStyle,
  setSpotcheckContactID,
  setSpotcheckURL,
  setSpotcheckPosition,
  setIsLoading,
  store,
  setIsVisible,
} from './SpotCheckState';
import type { SpotcheckProps } from './Types';
import { closeSpotCheck, handleSurveyEnd } from './HelperFunctions';

export const SpotcheckComponent: React.FC<SpotcheckProps> = ({
  domainName,
  targetToken,
  userDetails = {},
  variables = {},
  customProperties = {},
}) => {
  const dispatch: AppDispatch = useDispatch();
  const spotcheck = useSelector((state: RootState) => state.spotcheck);

  useEffect(() => {
    dispatch(setTargetToken(targetToken));
    dispatch(setDomainName(domainName));
    dispatch(setUserDetails(userDetails));
    dispatch(setVariables(variables));
    dispatch(setCustomProperties(customProperties));
  }, [
    customProperties,
    dispatch,
    domainName,
    targetToken,
    userDetails,
    variables,
  ]);

  return (
    <Modal
      visible={spotcheck.isVisible}
      animationType="fade"
      transparent={true}
    >
      <View
        style={
          spotcheck.isFullScreenMode
            ? style.fullScreenMode
            : spotcheck.spotcheckPosition === 'bottom'
              ? style.bottom
              : spotcheck.spotcheckPosition === 'top'
                ? style.top
                : style.center
        }
      >
        <View>
          {spotcheck.isCloseButtonEnabled &&
            ((spotcheck.currentQuestionHeight > 0 &&
              !spotcheck.isFullScreenMode) ||
              (spotcheck.isFullScreenMode && !spotcheck.isLoading)) && (
              <TouchableOpacity
                onPress={() => {
                  closeSpotCheck(
                    spotcheck.domainName,
                    spotcheck.spotcheckContactID,
                    spotcheck.traceId,
                    spotcheck.triggerToken
                  );
                  dispatch(setSpotcheckID(0));
                  dispatch(setCurrentQuestionHeight(0));
                  dispatch(setCloseButtonStyle({}));
                  dispatch(setSpotcheckContactID(0));
                  dispatch(setSpotcheckURL(''));
                  dispatch(setSpotcheckPosition('bottom'));
                  dispatch(setIsLoading(true));
                  handleSurveyEnd();
                }}
                style={style.closeButtonContainer}
              >
                <View style={style.closeButtonOverlay}>
                  <View
                    style={{
                      position: 'absolute',
                      width: 18,
                      height: 1.6,
                      backgroundColor: spotcheck.closeButtonStyle?.ctaButton,
                      transform: [{ rotate: '45deg' }],
                    }}
                  />

                  <View
                    style={{
                      position: 'absolute',
                      width: 18,
                      height: 1.6,
                      backgroundColor: spotcheck.closeButtonStyle?.ctaButton,
                      transform: [{ rotate: '-45deg' }],
                    }}
                  />
                </View>
              </TouchableOpacity>
            )}

          <WebViewComponent />
        </View>
        {spotcheck.isLoading && <CircularProgress />}
      </View>
    </Modal>
  );
};

const CircularProgress = ({ size = 40, strokeWidth = 5 }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('Circular');
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [rotateValue]);

  const rotateInterpolation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={style.progressOverlay}>
      <Animated.View
        style={{
          borderRightColor: 'rgba(0,0,0,1)',
          borderTopColor: 'rgba(0,0,0,1)',
          borderBottomColor: 'rgba(255,255,255,1)',
          borderLeftColor: 'rgba(255,255,255,1)',
          borderWidth: strokeWidth,
          borderRadius: size / 2,
          width: size,
          height: size,
          transform: [{ rotate: rotateInterpolation }],
        }}
      />
    </View>
  );
};

const WebViewComponent: React.FC = () => {
  const spotchecks = useSelector((state: RootState) => state.spotcheck);
  const webViewRef = useRef(null);
  const [screenDimensions, setScreenDimensions] = useState<ScaledSize>(
    Dimensions.get('window')
  );
  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const { width, height } = screenDimensions;

  const handleOnMessage = (event: WebViewMessageEvent) => {
    try {
      const jsonResponse = JSON.parse(event.nativeEvent.data);

      if (jsonResponse.type === 'spotCheckData') {
        const question_height = jsonResponse.data.currentQuestionSize.height;

        store.dispatch(setCurrentQuestionHeight(question_height));
      } else if (jsonResponse.type === 'surveyCompleted') {
        console.log('Survey submitted');
        handleSurveyEnd();
      }
    } catch (e) {
      console.log('Error decoding JSON:', e);
    }
  };

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0)',
        width: width,
        height: !spotchecks.isFullScreenMode
          ? Math.min(
              spotchecks.currentQuestionHeight,
              spotchecks.maxHeight * height
            )
          : spotchecks.isLoading
            ? 0
            : height,
      }}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: spotchecks.spotcheckURL }}
        javaScriptEnabled={true}
        onLoadStart={() => {
          store.dispatch(setIsLoading(true));
        }}
        onLoad={() => {
          store.dispatch(setIsLoading(false));
        }}
        onMessage={handleOnMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          store.dispatch(setIsVisible(false));
          store.dispatch(setIsLoading(false));
        }}
        injectedJavaScript={`window.flutterSpotCheckData = {
              postMessage: function(data) {
                window.ReactNativeWebView.postMessage(data);
              }
            };
          `}
      />
    </View>
  );
};

const style = StyleSheet.create({
  fullScreenMode: {
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0.33)',
    height: '100%',
  },
  bottom: {
    flex: 1,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0.33)',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  top: {
    flex: 1,
    left: 0,
    right: 0,
    top: 0,
    position: 'absolute',
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0.33)',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'column',
  },
  center: {
    flex: 1,
    left: 0,
    right: 0,
    position: 'absolute',
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0.33)',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  closeButtonContainer: {
    position: 'absolute',
    zIndex: 999999,
    right: 20,
    top: 20,
    height: 20,
    width: 20,
  },
  closeButtonOverlay: {
    justifyContent: 'center',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0)',
  },

  progressOverlay: {
    flex: 1,
    left: 0,
    right: 0,
    position: 'absolute',
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0)',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
});
