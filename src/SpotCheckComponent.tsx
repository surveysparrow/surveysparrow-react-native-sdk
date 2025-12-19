import { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  type ScaledSize,
  Platform,
  Keyboard,
  type ViewStyle,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  type AppDispatch,
  type RootState,
  updateState,
} from './SpotCheckState';
import {
  closeSpotCheck,
  fetchSpotcheckAPI,
  handleSurveyEnd,
  ischatSurvey,
  captureP0Error,
} from './HelperFunctions';
import axios from 'axios';
import WebView from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpotCheckButton from './SpotCheckButton';
import { useSpotcheckNavigation } from './NavigationHandler';

export const SpotcheckComponent: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const spotcheck = useSelector((state: RootState) => state.spotcheck);
  const [screenDimensions, setScreenDimensions] = useState<ScaledSize>(
    Dimensions.get('window')
  );
  const insets = useSafeAreaInsets();

  const spotcheckRef = useRef(spotcheck);

  useEffect(() => {
    spotcheckRef.current = spotcheck;
  }, [spotcheck]);
  useSpotcheckNavigation(spotcheckRef);
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        if (spotcheck.targetToken !== '' && spotcheck.domainName !== '') {
          const response = await axios.get(
            `https://${spotcheck.domainName}/api/internal/spotcheck/widget/${spotcheck.targetToken}/init`
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
            if (
              spotcheck.appearance.mode === 'card' ||
              spotcheck.appearance.mode === 'miniCard'
            ) {
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
                ? `https://${spotcheck.domainName}/eui-template/chat?isSpotCheck=true`
                : '',

              classicUrl: classicIframe
                ? `https://${spotcheck.domainName}/eui-template/classic?isSpotCheck=true`
                : '',
            })
          );
        }
      } catch (error) {
        captureP0Error(error, 'SPOTCHECK_INITIALIZATION', {
          component: 'SpotcheckComponent',
          action: 'initializeWidget',
          targetToken: spotcheck.targetToken,
        });
      }
    };

    initializeWidget();
  }, [spotcheck.domainName, spotcheck.targetToken]);

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

  const getTopValue = (baseOffset = 0) =>
    Math.min(
      -spotcheck.keyBoardHeight +
        (spotcheck.keyBoardHeight > 0 &&
        (spotcheck.currentQuestionHeight || spotcheck.isFullScreenMode)
          ? height - baseOffset
          : 0),
      0
    );
  const getBaseStyle = (extraStyles: Partial<ViewStyle> = {}): ViewStyle => ({
    flex: 1,
    position: 'absolute',
    zIndex: 999999,
    backgroundColor: 'rgba(0,0,0,0.33)',
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    ...extraStyles,
  });

  return (
    <>
      <View
        style={
          spotcheck.showSurveyContent
            ? spotcheck.isFullScreenMode && spotcheck.isVisible
              ? getBaseStyle({
                  top:
                    spotcheck.spotCheckType === 'chat'
                      ? -spotcheck.keyBoardHeight
                      : getTopValue(spotcheck.textPosition + 100),
                  paddingTop: insets.top,
                  paddingBottom: insets.bottom,
                })
              : spotcheck.isVisible && spotcheck.isMounted
                ? {
                    bottom: getBaseStyle({
                      top:
                        spotcheck.keyBoardHeight > 0 &&
                        spotcheck.currentQuestionHeight
                          ? Math.min(
                              -spotcheck.keyBoardHeight +
                                (spotcheck.keyBoardHeight > 0
                                  ? Math.max(
                                      spotcheck.currentQuestionHeight -
                                        spotcheck.textPosition -
                                        350,
                                      0
                                    )
                                  : 0),
                              0
                            )
                          : 0,
                      justifyContent: 'flex-end',
                      paddingBottom: insets.bottom,
                    }),
                    top: getBaseStyle({
                      top: Math.min(
                        getTopValue(
                          spotcheck.screenHeight +
                            (spotcheck.avatarEnabled ? 56 : 0) +
                            (spotcheck.isCloseButtonEnabled &&
                            spotcheck.spotChecksMode === 'miniCard'
                              ? 40
                              : 0)
                        ) +
                          (spotcheck.keyBoardHeight > 0
                            ? Math.max(
                                spotcheck.currentQuestionHeight -
                                  spotcheck.textPosition -
                                  350,
                                0
                              )
                            : 0),
                        0
                      ),
                      justifyContent: 'flex-start',
                      paddingTop: insets.top,
                    }),
                    center: getBaseStyle({
                      top: Math.min(
                        getTopValue(
                          spotcheck.screenHeight +
                            (spotcheck.avatarEnabled ? 56 : 0) +
                            (spotcheck.isCloseButtonEnabled &&
                            spotcheck.spotChecksMode === 'miniCard'
                              ? 40
                              : 0)
                        ) /
                          2 +
                          (spotcheck.keyBoardHeight > 0
                            ? Math.max(
                                spotcheck.currentQuestionHeight -
                                  spotcheck.textPosition -
                                  450,
                                (height - spotcheck.screenHeight) / 2 <
                                  spotcheck.keyBoardHeight
                                  ? -100
                                  : 0
                              )
                            : 0),
                        0
                      ),
                      justifyContent: 'center',
                      paddingTop: insets.top,
                      paddingBottom: insets.bottom,
                    }),
                  }[spotcheck.spotcheckPosition] || style.nothing
                : style.nothing
            : style.nothing
        }
      >
        <View>
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
                style={
                  spotcheck.spotChecksMode === 'miniCard'
                    ? style.miniCardCloseButtonContainer
                    : style.closeButtonContainer
                }
              >
                <View
                  style={
                    spotcheck.spotChecksMode === 'miniCard'
                      ? style.miniCardCloseButtonOverlay
                      : style.closeButtonOverlay
                  }
                >
                  <View
                    style={
                      spotcheck.spotChecksMode === 'miniCard'
                        ? {
                            position: 'absolute',
                            width: 15,
                            height: 1.5,
                            backgroundColor: 'black',
                            top: '50%',
                            left: 0,
                            transform: [
                              { translateY: -0.75 },
                              { rotate: '45deg' },
                            ],
                          }
                        : {
                            position: 'absolute',
                            width: 18,
                            height: 1.6,
                            backgroundColor:
                              spotcheck.closeButtonStyle?.ctaButton,
                            transform: [{ rotate: '45deg' }],
                          }
                    }
                  />
                  <View
                    style={
                      spotcheck.spotChecksMode === 'miniCard'
                        ? {
                            position: 'absolute',
                            width: 15,
                            height: 1.5,
                            backgroundColor: 'black',
                            top: '50%',
                            left: 0,
                            transform: [
                              { translateY: -0.75 },
                              { rotate: '-45deg' },
                            ],
                          }
                        : {
                            position: 'absolute',
                            width: 18,
                            height: 1.6,
                            backgroundColor:
                              spotcheck.closeButtonStyle?.ctaButton,
                            transform: [{ rotate: '-45deg' }],
                          }
                    }
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
                height={height}
                width={width}
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
              <WebViewComponents
                webviewType="chat"
                url={spotcheck.chatUrl}
                height={height}
                width={width}
              />
            </View>
          )}

          <View
            style={
              !(
                spotcheck.avatarEnabled &&
                spotcheck.spotChecksMode === 'miniCard'
              ) && {
                paddingBottom: spotcheck.spotChecksMode === 'miniCard' ? 8 : 0,
              }
            }
          >
            {spotcheck.avatarEnabled &&
              spotcheck.spotChecksMode === 'miniCard' && (
                <Image
                  source={{ uri: spotcheck.avatarUrl }}
                  style={style.avatarContainer}
                />
              )}
          </View>
        </View>
      </View>
      {spotcheck.isSpotCheckButton && !spotcheck.showSurveyContent && (
        <SpotCheckButton
          config={spotcheck.spotCheckButtonConfig}
          onPress={async () => {
            await fetchSpotcheckAPI();
            dispatch(updateState({ showSurveyContent: true }));
          }}
        />
      )}
    </>
  );
};

interface WebViewComponentProps {
  webviewType: 'classic' | 'chat';
  url: string;
  height: number;
  width: number;
}

const WebViewComponents: React.FC<WebViewComponentProps> = ({
  webviewType,
  url,
  height,
  width,
}) => {
  const dispatch = useDispatch();
  const spotchecks = useSelector((state: RootState) => state.spotcheck);
  const [WebviewScroll, setWebviewScroll] = useState<boolean>(true);
  const webViewRef = useRef(null);

  useEffect(() => {
    Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      (event) => {
        dispatch(updateState({ keyBoardHeight: event.endCoordinates.height }));
        setWebviewScroll(false);
      }
    );

    Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        dispatch(updateState({ keyBoardHeight: 0 }));
        setWebviewScroll(true);
        setWebviewScroll(false);
      }
    );
  }, []);

  useEffect(() => {
    if (
      webViewRef.current &&
      ((webviewType === 'classic' && !spotchecks?.classicWebViewRef?.current) ||
        (webviewType === 'chat' && !spotchecks?.chatWebViewRef?.current))
    ) {
      dispatch(
        updateState(
          webviewType === 'classic'
            ? { classicWebViewRef: webViewRef.current }
            : { chatWebViewRef: webViewRef.current }
        )
      );
    }
  }, [dispatch, webviewType]);

  useEffect(() => {
    var data_height = !spotchecks.isFullScreenMode
      ? Math.min(
          height * 0.9,
          Math.min(
            spotchecks.currentQuestionHeight,
            spotchecks.maxHeight * (height * 0.9)
          ) +
            (spotchecks.isBannerImageOn &&
            spotchecks.currentQuestionHeight !== 0
              ? Math.min(width, height) < 600
                ? 100
                : 0
              : 0)
        )
      : (
            webviewType === 'chat'
              ? spotchecks.isChatLoading
              : spotchecks.isClassicLoading
          )
        ? 0
        : Platform.OS === 'ios' && DeviceInfo.hasNotch()
          ? height * 0.9
          : Platform.OS === 'ios'
            ? height * 0.965
            : height * 0.985;

    if (spotchecks.spotChecksMode === 'miniCard' && spotchecks.avatarEnabled) {
      data_height = data_height - 56;
    }

    if (
      spotchecks.spotChecksMode === 'miniCard' &&
      spotchecks.isCloseButtonEnabled
    ) {
      data_height = data_height - 40;
    }

    dispatch(
      updateState({
        screenHeight: data_height,
      })
    );
  }, [
    height,
    spotchecks.avatarEnabled,
    spotchecks.currentQuestionHeight,
    spotchecks.isBannerImageOn,
    spotchecks.isChatLoading,
    spotchecks.isClassicLoading,
    spotchecks.isCloseButtonEnabled,
    spotchecks.isFullScreenMode,
    spotchecks.maxHeight,
    spotchecks.spotChecksMode,
    webviewType,
    width,
  ]);

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
        } else if (jsonResponse.type === 'classicLoadEvent') {
          dispatch(
            updateState({
              isClassicLoading: false,
            })
          );
        } else if (jsonResponse.type === 'chatLoadEvent') {
          dispatch(
            updateState({
              isChatLoading: false,
            })
          );
        } else if (jsonResponse.type === 'surveyCompleted') {
          await spotchecks.listener?.onSurveyResponse?.(jsonResponse.data);
          handleSurveyEnd();
        } else if (jsonResponse.type === 'surveyLoadStarted') {
          await spotchecks.listener?.onSurveyLoaded?.(jsonResponse.data);
        } else if (jsonResponse.type === 'partialSubmission') {
          await spotchecks.listener?.onPartialSubmission?.(jsonResponse.data);
        } else if (jsonResponse.type === 'thankYouPageSubmission') {
          dispatch(
            updateState({
              isThankyouPageSubmission: true,
            })
          );

          if (spotchecks.listener?.onSurveyResponse) {
            await spotchecks.listener.onSurveyResponse(jsonResponse.data);
          }

          if (
            spotchecks.spotChecksMode === 'miniCard' &&
            !spotchecks.isCloseButtonEnabled
          ) {
            setTimeout(() => {
              handleSurveyEnd();
            }, 4000);
          } else {
            dispatch(
              updateState({
                isCloseButtonEnabled: true,
              })
            );
          }
        } else if (
          jsonResponse.type === 'slideInFrame' &&
          jsonResponse?.data.mounted
        ) {
          dispatch(updateState({ isMounted: true }));
        } else if (jsonResponse.type === 'position') {
          dispatch(updateState({ textPosition: jsonResponse.y }));
        }
      }
    } catch (e) {
      captureP0Error(e, 'WEBVIEW_ERROR', {
        action: 'handleOnMessage',
        rawData: event.nativeEvent?.data,
      });
    }
  };

  return (
    <View
      style={{
        width: width - (spotchecks.spotChecksMode === 'miniCard' ? 24 : 0),
        height: spotchecks.screenHeight,
        alignSelf: 'center',
        borderRadius: spotchecks.spotChecksMode === 'miniCard' ? 12 : 0,
        overflow: 'hidden',
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
          captureP0Error(
            new Error('WebView loading error'),
            'WEBVIEW_ERROR',
            {
              action: 'WebView Loading Error',
              webviewType,
              url,
            }
          );
        }}
        injectedJavaScript={`

            document.addEventListener('focusin', function(event) {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
              var rect = event.target.getBoundingClientRect();
              var yPosition = rect.y + window.scrollY;

              var webViewHeight = window.innerHeight;
              var scaledY = (yPosition / webViewHeight) * ${height}; 

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'position',
                y: scaledY
              }));
            }
          });

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
  nothing: {
    left: '-100%',
    right: '-100%',
    width: 1,
    height: 1,
    position: 'absolute',
    zIndex: 1,
  },

  closeButtonContainer: {
    position: 'absolute',
    zIndex: 999999,
    right: 20,
    top: 20,
    height: 20,
    width: 20,
  },

  miniCardCloseButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginVertical: 8,

    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
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

  miniCardCloseButtonOverlay: {
    width: 15,
    height: 15,
    position: 'relative',
  },

  avatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    width: 48,
    height: 48,
    borderRadius: 26,
    marginVertical: 8,
  },
});
