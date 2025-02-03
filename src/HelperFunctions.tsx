import axios from 'axios';
import {
  store,
  setIsVisible,
  setIsCloseButtonEnabled,
  setIsFullScreenMode,
  setSpotcheckID,
  setCurrentQuestionHeight,
  setCloseButtonStyle,
  setSpotcheckContactID,
  setSpotcheckURL,
  setSpotcheckPosition,
  setIsBannerImageOn,
  setMaxHeight,
  setTriggerToken,
  setSpotCheckType,
  setIsMounted,
} from './SpotCheckState';
import uuid from 'react-native-uuid';

export function generateTraceId() {
  const uuidString = uuid.v4();
  const timestamp = Date.now();
  return `${uuidString}-${timestamp}`;
}

export const setAppearance = async (
  responseJson: any,
  screen: string,
  domainName: string,
  traceId: string,
  variables: Record<string, any>
) => {
  if (responseJson) {
    const currentSpotcheck = store
      .getState()
      .spotcheck.filteredSpotChecks.find((spotcheck) => {
        if (
          spotcheck.id === responseJson?.spotCheckId ||
          spotcheck.id === responseJson?.id
        ) {
          return spotcheck;
        } else {
          return null;
        }
      });

    let chat;
    const appearance = responseJson?.appearance;
    if (appearance) {
      const tposition = appearance?.position;
      switch (tposition) {
        case 'top_full':
          store.dispatch(setSpotcheckPosition('top'));
          break;
        case 'center_center':
          store.dispatch(setSpotcheckPosition('center'));
          break;
        case 'bottom_full':
          store.dispatch(setSpotcheckPosition('bottom'));
          break;
        default:
          store.dispatch(setSpotcheckPosition('bottom'));
          break;
      }

      store.dispatch(setIsCloseButtonEnabled(appearance?.closeButton ?? true));
      store.dispatch(setCloseButtonStyle(appearance.colors?.overrides ?? {}));

      const cardProp = appearance.cardProperties;
      if (cardProp?.maxHeight) {
        const mxHeight =
          typeof cardProp.maxHeight === 'string'
            ? parseFloat(cardProp.maxHeight)
            : cardProp.maxHeight;

        store.dispatch(setMaxHeight(mxHeight / 100));
      } else {
        store.dispatch(setMaxHeight(0));
      }

      chat =
        ischatSurvey(currentSpotcheck?.survey?.surveyType) &&
        appearance?.mode === 'fullScreen';

      if (chat) {
        store.dispatch(setSpotCheckType('chat'));
      } else if (!chat) store.dispatch(setSpotCheckType('classic'));
      store.dispatch(setIsFullScreenMode(appearance?.mode === 'fullScreen'));
      store.dispatch(
        setIsBannerImageOn(appearance?.bannerImage?.enabled ?? false)
      );
    }

    store.dispatch(
      setSpotcheckID(
        responseJson?.spotCheckId ?? responseJson?.spotCheckId ?? 0
      )
    );
    store.dispatch(
      setSpotcheckContactID(
        responseJson?.spotCheckContactId ??
          responseJson?.spotCheckContact?.id ??
          0
      )
    );
    store.dispatch(setTriggerToken(responseJson?.triggerToken ?? ''));
    let baseSpotcheckURL;
    if (chat)
      baseSpotcheckURL = `https://${domainName}/s/spotcheck/${store.getState().spotcheck.triggerToken}/config?spotcheckContactId=${store.getState().spotcheck.spotcheckContactID}&traceId=${traceId}&spotcheckUrl=${screen}`;
    else
      baseSpotcheckURL = `https://${domainName}/s/spotcheck/${store.getState().spotcheck.triggerToken}/bootstrap?spotcheckContactId=${store.getState().spotcheck.spotcheckContactID}&traceId=${traceId}&spotcheckUrl=${screen}`;

    let fullSpotcheckURL = baseSpotcheckURL;
    Object.entries(variables).forEach(([key, value]) => {
      fullSpotcheckURL += `&${key}=${value}`;
    });
    if (store.getState().spotcheck.sparrowLang.length > 0) {
      fullSpotcheckURL += `&sparrowLang=${store.getState().spotcheck.sparrowLang}`;
    }

    console.log(fullSpotcheckURL);

    store.dispatch(setSpotcheckURL(fullSpotcheckURL));

    try {
      const response = await axios.get(fullSpotcheckURL);
      const themeInfo = response.data.config.generatedCSS;
      const theme_payload = { type: 'THEME_UPDATE_SPOTCHECK', themeInfo };

      if (chat) {
        if (store.getState().spotcheck.chatWebViewRef != null) {
          const payload = {
            type: 'RESET_STATE',
            state: {
              ...(response.data || {}),
              skip: true,
              spotCheckAppearance: {
                ...(responseJson?.appearance || {}),
                targetType: 'MOBILE',
              },
              spotcheckUrl: screen,
              traceId,
              elementBuilderParams: {
                ...(variables || {}),
              },
            },
          };

          if (store.getState().spotcheck.chatWebViewRef) {
            const INJECTED_JAVASCRIPT = `
          (function() {
            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(payload)}
            }));

            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(theme_payload)}
            }));
          })();
        `;

            if (!store.getState().spotcheck.isChatLoading) {
              store
                .getState()
                .spotcheck.chatWebViewRef?.current.injectJavaScript(
                  INJECTED_JAVASCRIPT
                );
              start();
            } else {
              const unsubscribe = store.subscribe(() => {
                const { isChatLoading, chatWebViewRef } =
                  store.getState().spotcheck;

                if (!isChatLoading) {
                  unsubscribe();
                  chatWebViewRef?.current.injectJavaScript(INJECTED_JAVASCRIPT);
                  start();
                }
              });
            }
          } else {
            console.warn('WebView reference is not available');
          }
        }
      } else {
        if (store.getState().spotcheck.classicWebViewRef != null) {
          const payload = {
            type: 'RESET_STATE',
            state: {
              ...(response.data || {}),
              skip: true,
              spotCheckAppearance: {
                ...(responseJson?.appearance || {}),
                targetType: 'MOBILE',
              },
              spotcheckUrl: screen,
              traceId,
              elementBuilderParams: {
                ...(variables || {}),
              },
            },
          };

          if (store.getState().spotcheck.classicWebViewRef) {
            const INJECTED_JAVASCRIPT = `
          (function() {
            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(payload)}
            }));

            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(theme_payload)}
            }));

          })();
        `;

            if (!store.getState().spotcheck.isClassicLoading) {
              store
                .getState()
                .spotcheck.classicWebViewRef.current.injectJavaScript(
                  INJECTED_JAVASCRIPT
                );
              start();
            } else {
              const unsubscribe = store.subscribe(() => {
                const { isClassicLoading, classicWebViewRef } =
                  store.getState().spotcheck;

                if (!isClassicLoading) {
                  unsubscribe();
                  classicWebViewRef?.current.injectJavaScript(
                    INJECTED_JAVASCRIPT
                  );
                  start();
                }
              });
            }
          } else {
            console.warn('WebView reference is not available');
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};

export const start = () => {
  setTimeout(async () => {
    store.dispatch(setIsVisible(true));
  }, store.getState().spotcheck.afterDelay * 1000);
};

export const handleSurveyEnd = () => {
  store.dispatch(setIsVisible(false));
  store.dispatch(setIsCloseButtonEnabled(false));
  store.dispatch(setIsFullScreenMode(false));
  store.dispatch(setSpotcheckID(0));
  store.dispatch(setCurrentQuestionHeight(0));
  store.dispatch(setCloseButtonStyle({}));
  store.dispatch(setSpotcheckContactID(0));
  store.dispatch(setSpotcheckURL(''));
  store.dispatch(setSpotcheckPosition('bottom'));
  store.dispatch(setIsMounted(false));
  if (store.getState().spotcheck.spotCheckType === 'chat')
    store.getState().spotcheck.chatWebViewRef?.current.injectJavaScript(`
          (function() {
            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify({ type: 'UNMOUNT_APP' })}
            }));
          })();
        `);
  else
    store.getState().spotcheck.classicWebViewRef?.current.injectJavaScript(`
          (function() {
            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify({ type: 'UNMOUNT_APP' })}
            }));
          })();
        `);
  store.dispatch(setSpotCheckType(''));
};

export const closeSpotCheck = async (
  domainName: string,
  spotcheckContactID: number,
  traceId: string,
  triggerToken: string
) => {
  try {
    const payload = {
      traceId: traceId,
      triggerToken: triggerToken,
    };

    const response = await fetch(
      `https://${domainName}/api/internal/spotcheck/dismiss/${spotcheckContactID}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        console.log('SpotCheck Closed');
      }
    } else {
      console.log(`Error: ${response.status}`);
    }
  } catch (error) {
    console.log('Error parsing JSON:', error);
  }
};

export const ischatSurvey = (type: String) => {
  return (
    type === 'Conversational' ||
    type === 'CESChat' ||
    type === 'NPSChat' ||
    type === 'CSATChat'
  );
};
