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
      .spotcheck.filteredSpotChecks.find(
        (spotcheck) =>
          spotcheck.id === responseJson?.spotCheckId ||
          spotcheck.id === responseJson?.id
      );

    const appearance = responseJson?.appearance;
    let chat = false;

    if (appearance) {
      const {
        position,
        closeButton,
        colors,
        cardProperties,
        mode,
        bannerImage,
      } = appearance;
      const { maxHeight } = cardProperties || {};

      store.dispatch(
        setSpotcheckPosition(
          position === 'top_full'
            ? 'top'
            : position === 'center_center'
              ? 'center'
              : 'bottom'
        )
      );
      store.dispatch(setIsCloseButtonEnabled(closeButton ?? true));
      store.dispatch(setCloseButtonStyle(colors?.overrides ?? {}));
      store.dispatch(setMaxHeight(maxHeight ? parseFloat(maxHeight) / 100 : 0));

      chat =
        ischatSurvey(currentSpotcheck?.survey?.surveyType) &&
        mode === 'fullScreen';
      store.dispatch(setSpotCheckType(chat ? 'chat' : 'classic'));
      store.dispatch(setIsFullScreenMode(mode === 'fullScreen'));
      store.dispatch(setIsBannerImageOn(bannerImage?.enabled ?? false));
    }

    const spotCheckId = responseJson?.spotCheckId ?? 0;
    const spotCheckContactId =
      responseJson?.spotCheckContactId ??
      responseJson?.spotCheckContact?.id ??
      0;
    const triggerToken = responseJson?.triggerToken ?? '';

    store.dispatch(setSpotcheckID(spotCheckId));
    store.dispatch(setSpotcheckContactID(spotCheckContactId));
    store.dispatch(setTriggerToken(triggerToken));

    const baseSpotcheckURL = `https://${domainName}/s/spotcheck/${triggerToken}/${chat ? 'config' : 'bootstrap'}?spotcheckContactId=${spotCheckContactId}&traceId=${traceId}&spotcheckUrl=${screen}`;

    let fullSpotcheckURL = baseSpotcheckURL;
    Object.entries(variables).forEach(([key, value]) => {
      fullSpotcheckURL += `&${key}=${value}`;
    });

    console.log(fullSpotcheckURL);
    store.dispatch(setSpotcheckURL(fullSpotcheckURL));

    try {
      const response = await axios.get(fullSpotcheckURL);
      const themeInfo = response.data.config.generatedCSS;
      const theme_payload = { type: 'THEME_UPDATE_SPOTCHECK', themeInfo };

      const webViewRef = chat
        ? store.getState().spotcheck.chatWebViewRef
        : store.getState().spotcheck.classicWebViewRef;
      const isLoading = chat
        ? store.getState().spotcheck.isChatLoading
        : store.getState().spotcheck.isClassicLoading;

      if (webViewRef) {
        const payload = {
          type: 'RESET_STATE',
          state: {
            ...(response.data || {}),
            skip: true,
            spotCheckAppearance: {
              ...(appearance || {}),
              targetType: 'MOBILE',
            },
            spotcheckUrl: screen,
            traceId,
            elementBuilderParams: {
              ...(variables || {}),
            },
          },
        };

        const INJECTED_JAVASCRIPT = `
          (function() {
            window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
            window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(theme_payload)} }));
          })();
        `;

        const injectJavaScript = () =>
          webViewRef?.current.injectJavaScript(INJECTED_JAVASCRIPT);

        if (!isLoading) {
          injectJavaScript();
          start();
        } else {
          const unsubscribe = store.subscribe(() => {
            const {
              isChatLoading,
              isClassicLoading,
              chatWebViewRef,
              classicWebViewRef,
            } = store.getState().spotcheck;

            if (!(isChatLoading || isClassicLoading)) {
              unsubscribe();
              (chat
                ? chatWebViewRef
                : classicWebViewRef
              )?.current.injectJavaScript(INJECTED_JAVASCRIPT);
              start();
            }
          });
        }
      } else {
        console.warn('WebView reference is not available');
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
