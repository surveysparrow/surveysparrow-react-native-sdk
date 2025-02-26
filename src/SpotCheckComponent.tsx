import { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  type ScaledSize,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  type AppDispatch,
  type RootState,
  updateState,
} from './SpotCheckState';
import {
  closeSpotCheck,
  handleSurveyEnd,
  ischatSurvey,
} from './HelperFunctions';
import axios from 'axios';
import WebView from 'react-native-webview';

export const SpotcheckComponent: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const spotcheck = useSelector((state: RootState) => state.spotcheck);

  useEffect(() => {
    const initializeWidget = async () => {
      try {
        if (spotcheck.targetToken !== '' && spotcheck.domainName !== '') {
          const SDK = 'REACT NATIVE';
          const response = await axios.get(
            `https://${spotcheck.domainName}/api/internal/spotcheck/widget/${spotcheck.targetToken}/init?sdk=${SDK}`
          );
          var classicIframe = false;
          var chatIframe = false;
          if (response?.data?.filteredSpotChecks)
            dispatch(
              updateState({
                filteredSpotChecks: response.data.filteredSpotChecks,
              })
            );

          response.data.filteredSpotChecks.forEach((spotcheck: any) => {
            if (spotcheck.appearance.mode === 'card') {
              classicIframe = true;
            } else if (
              spotcheck.appearance.mode === 'fullScreen' &&
              ischatSurvey(spotcheck?.survey?.surveyType)
            ) {
              chatIframe = true;
            } else if (spotcheck.appearance.mode === 'fullScreen') {
              classicIframe = true;
            }
          });

          dispatch(
            updateState({
              chatUrl: chatIframe
                ? `https://${spotcheck.domainName}/eui-template/chat`
                : '',

              classicUrl: classicIframe
                ? `https://${spotcheck.domainName}/eui-template/classic`
                : '',
            })
          );

          if (Platform.OS === 'android') {
            const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
            if (cameraPermission) {
              await PermissionsAndroid.request(cameraPermission);
            }
          }
        }
      } catch (error) {
        console.log('Error initializing widget:', error);
      }
    };

    initializeWidget();
  }, [spotcheck.domainName, spotcheck.targetToken]);

  return (
    <SafeAreaView
      style={
        spotcheck.isFullScreenMode && spotcheck.isVisible
          ? style.fullScreenMode
          : spotcheck.isVisible && spotcheck.isMounted
            ? spotcheck.spotcheckPosition === 'bottom'
              ? style.bottom
              : spotcheck.spotcheckPosition === 'top'
                ? style.top
                : spotcheck.spotcheckPosition === 'center'
                  ? style.center
                  : style.nothing
            : style.nothing
      }
    >
      <KeyboardAvoidingView behavior="padding" enabled>
        {spotcheck.isCloseButtonEnabled &&
          ((spotcheck.currentQuestionHeight > 0 &&
            !spotcheck.isFullScreenMode) ||
            (spotcheck.isFullScreenMode &&
              ((!spotcheck.isClassicLoading &&
                spotcheck.spotCheckType === 'classic') ||
                (!spotcheck.isChatLoading &&
                  spotcheck.spotCheckType === 'chat')))) && (
            <TouchableOpacity
              onPress={() => {
                closeSpotCheck(
                  spotcheck.domainName,
                  spotcheck.spotcheckContactID,
                  spotcheck.traceId,
                  spotcheck.triggerToken
                );
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

        {spotcheck.classicUrl.length > 0 && (
          <View
            style={
              spotcheck.spotcheckURL.length > 0 &&
              spotcheck.spotCheckType === 'classic'
                ? {}
                : {
                    left: '-100%',
                    right: '-100%',
                    width: 1,
                    height: 1,
                    position: 'absolute',
                    zIndex: 1,
                  }
            }
          >
            <WebViewComponents
              webviewType="classic"
              url={spotcheck.classicUrl}
            />
          </View>
        )}

        {spotcheck.chatUrl.length > 0 && (
          <View
            style={
              spotcheck.spotcheckURL.length > 0 &&
              spotcheck.spotCheckType === 'chat'
                ? {}
                : {
                    left: '-100%',
                    right: '-100%',
                    width: 1,
                    height: 1,
                    position: 'absolute',
                    zIndex: 1,
                  }
            }
          >
            <WebViewComponents webviewType="chat" url={spotcheck.chatUrl} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface WebViewComponentProps {
  webviewType: 'classic' | 'chat';
  url: string;
}

const WebViewComponents: React.FC<WebViewComponentProps> = ({
  webviewType,
  url,
}) => {
  const dispatch = useDispatch();
  const spotchecks = useSelector((state: RootState) => state.spotcheck);
  const [WebviewScroll, setWebviewScroll] = useState<boolean>(true);
  const webViewRef = useRef(null);
  const [screenDimensions, setScreenDimensions] = useState<ScaledSize>(
    Dimensions.get('window')
  );

  useEffect(() => {
    Keyboard.addListener('keyboardWillShow', () => {
      setWebviewScroll(false);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      setWebviewScroll(true);
      setWebviewScroll(false);
    });
  }, []);

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

  useEffect(() => {
    if (webViewRef.current) {
      dispatch(
        updateState(
          webviewType === 'classic'
            ? { classicWebViewRef: webViewRef }
            : { chatWebViewRef: webViewRef }
        )
      );
    }
  }, [dispatch, webviewType]);

  const handleOnMessage = async (event: any) => {
    try {
      if (event.nativeEvent?.data !== 'captureImage') {
        const jsonResponse = JSON.parse(event.nativeEvent?.data);

        if (jsonResponse.type === 'spotCheckData') {
          if (jsonResponse.data.currentQuestionSize) {
            dispatch(
              updateState({
                currentQuestionHeight:
                  jsonResponse.data.currentQuestionSize.height,
              })
            );
          } else if (jsonResponse.data.isCloseButtonEnabled) {
            dispatch(
              updateState({
                isCloseButtonEnabled: jsonResponse.data.isCloseButtonEnabled,
              })
            );
          }
        } else if (jsonResponse.type === 'surveyCompleted') {
          console.log('Survey submitted');
          handleSurveyEnd();
        } else if (
          jsonResponse.type === 'slideInFrame' &&
          jsonResponse?.data.mounted
        ) {
          dispatch(updateState({ isMounted: true }));
        }
      }
    } catch (e) {
      console.log('Error decoding JSON:', e);
    }
  };

  return (
    <View
      style={{
        width: width,
        height: !spotchecks.isFullScreenMode
          ? Math.min(
              height,
              Math.min(
                spotchecks.currentQuestionHeight,
                spotchecks.maxHeight * height
              ) +
                (spotchecks.isBannerImageOn &&
                spotchecks.currentQuestionHeight !== 0
                  ? Math.min(width, height) < 600
                    ? 250
                    : 0
                  : 0)
            )
          : (
                webviewType === 'chat'
                  ? spotchecks.isChatLoading
                  : spotchecks.isClassicLoading
              )
            ? 0
            : height,
      }}
    >
      <WebView
        scrollEnabled={WebviewScroll}
        ref={webViewRef}
        source={{ uri: url }}
        javaScriptEnabled={true}
        debuggingEnabled={true}
        geolocationEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        onLoad={() => {
          dispatch(
            updateState(
              webviewType === 'classic'
                ? { isClassicLoading: false }
                : { isChatLoading: false }
            )
          );
        }}
        onMessage={handleOnMessage}
        onError={() => {
          dispatch(
            updateState({
              isVisible: false,
              ...(webviewType === 'classic'
                ? { isClassicLoading: true }
                : { isChatLoading: true }),
            })
          );
        }}
        injectedJavaScript={`
          (function() {
          
            const observer = new MutationObserver((mutations, obs) => {
              const input = document.querySelector(".ss-language-selector__select__input input");
              if (input) {
                input.setAttribute("readonly", true);
              }
            });
        
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
          })();
        
          window.flutterSpotCheckData = {
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
  nothing: {
    left: '-100%',
    right: '-100%',
    width: 1,
    height: 1,
    position: 'absolute',
    zIndex: 1,
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
    top: 5,
    right: 0,
    width: 9,
    height: 9,
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
