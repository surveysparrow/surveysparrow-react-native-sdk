import axios from 'axios';
import { store, updateState, type SpotcheckState } from './SpotCheckState';
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

    let updatedState: Partial<SpotcheckState> = {};

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

      updatedState = {
        spotcheckPosition:
          position === 'top_full'
            ? 'top'
            : position === 'center_center'
              ? 'center'
              : 'bottom',
        isCloseButtonEnabled: closeButton ?? true,
        closeButtonStyle: colors?.overrides ?? {},
        maxHeight: maxHeight ? parseFloat(maxHeight) / 100 : 0,
        spotCheckType:
          ischatSurvey(currentSpotcheck?.survey?.surveyType) &&
          mode === 'fullScreen'
            ? 'chat'
            : 'classic',
        isFullScreenMode: mode === 'fullScreen',
        isBannerImageOn: bannerImage?.enabled ?? false,
      };

      chat = updatedState.spotCheckType === 'chat';
    }

    const spotCheckId = responseJson?.spotCheckId ?? 0;
    const spotCheckContactId =
      responseJson?.spotCheckContactId ??
      responseJson?.spotCheckContact?.id ??
      0;
    const triggerToken = responseJson?.triggerToken ?? '';

    updatedState = {
      ...updatedState,
      spotcheckID: spotCheckId,
      spotcheckContactID: spotCheckContactId,
      triggerToken,
    };

    const baseSpotcheckURL = `https://${domainName}/s/spotcheck/${triggerToken}/${chat ? 'config' : 'bootstrap'}?spotcheckContactId=${spotCheckContactId}&traceId=${traceId}&spotcheckUrl=${screen}`;

    let fullSpotcheckURL = baseSpotcheckURL;
    Object.entries(variables).forEach(([key, value]) => {
      fullSpotcheckURL += `&${key}=${value}`;
    });

    console.log(fullSpotcheckURL);
    updatedState.spotcheckURL = fullSpotcheckURL;

    store.dispatch(updateState(updatedState));

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
    store.dispatch(updateState({ isVisible: true }));
  }, store.getState().spotcheck.afterDelay * 1000);
};

export const handleSurveyEnd = () => {
  const updatedState: Partial<SpotcheckState> = {
    isVisible: false,
    isCloseButtonEnabled: false,
    isFullScreenMode: false,
    spotcheckID: 0,
    currentQuestionHeight: 0,
    closeButtonStyle: {},
    spotcheckContactID: 0,
    spotcheckURL: '',
    spotcheckPosition: 'bottom',
    isMounted: false,
    spotCheckType: '',
  };

  store.dispatch(updateState(updatedState));

  const webViewRef =
    store.getState().spotcheck.spotCheckType === 'chat'
      ? store.getState().spotcheck.chatWebViewRef
      : store.getState().spotcheck.classicWebViewRef;

  webViewRef?.current?.injectJavaScript(`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify({ type: 'UNMOUNT_APP' })}
        }));
      })();
    `);
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
