import axios from 'axios';
import { store, updateState, type SpotcheckState } from './SpotCheckState';
import uuid from 'react-native-uuid';
import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const { AdjusterModule } = NativeModules;

// Function to set SOFT_INPUT_ADJUST_NOTHING
const disableAdjust = () => {
  AdjusterModule.setAdjustNothing();
};

// Function to set SOFT_INPUT_ADJUST_RESIZE
const enableAdjustResize = () => {
  AdjusterModule.setAdjustResize();
};

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
  try {
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
          spotChecksMode: mode,
          avatarEnabled: appearance?.avatar?.enabled ?? false,
          avatarUrl: appearance?.avatar?.avatarUrl ?? '',
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

      updatedState.spotcheckURL = fullSpotcheckURL;

      store.dispatch(updateState(updatedState));

      try {
        const userAgent = await getUserAgent();
        const response = await axios.get(fullSpotcheckURL, {
          headers: {
            'User-Agent': userAgent,
          },
        });
        const themeInfo = response.data.config.generatedCSS;
        const theme_payload = { type: 'THEME_UPDATE_SPOTCHECK', themeInfo };

        const getWebViewRef = () =>
          chat
            ? store.getState().spotcheck.chatWebViewRef
            : store.getState().spotcheck.classicWebViewRef;

        const getIsLoading = () =>
          chat
            ? store.getState().spotcheck.isChatLoading
            : store.getState().spotcheck.isClassicLoading;

        let webViewRef = getWebViewRef();
        let isLoading = getIsLoading();

        const INJECTED_JAVASCRIPT = `
          (function() {
            window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
              {
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
              }
            )} }));
            window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(theme_payload)} }));
          })();
        `;

        const injectJavaScript = () =>
          webViewRef?.current.injectJavaScript(INJECTED_JAVASCRIPT);

        if (webViewRef) {
          if (!isLoading) {
            injectJavaScript();
            start();
            return true;
          } else {
            const unsubscribe = store.subscribe(() => {
              const {
                isChatLoading,
                isClassicLoading,
                chatWebViewRef,
                classicWebViewRef,
              } = store.getState().spotcheck;

              if ((!isChatLoading && chat) || (!isClassicLoading && !chat)) {
                unsubscribe();
                (chat
                  ? chatWebViewRef
                  : classicWebViewRef
                )?.current.injectJavaScript(INJECTED_JAVASCRIPT);
                start();
              }
            });
            return true;
          }
        } else {
          const unsubscribeWebView = store.subscribe(() => {
            webViewRef = getWebViewRef();
            if (webViewRef) {
              if (!getIsLoading()) {
                unsubscribeWebView();
                injectJavaScript();
                start();
              }
            }
          });
          return true;
        }
      } catch (error: any) {
        throw new Error(error.message);
      }
    }
    throw new Error('');
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const start = () => {
  setTimeout(async () => {
    store.dispatch(updateState({ isVisible: true }));
    if (Platform.OS === 'android' && AdjusterModule) {
      disableAdjust();
    }
  }, store.getState().spotcheck.afterDelay * 1000);
};

export const handleSurveyEnd = () => {
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
    screenHeight: 0,
    keyBoardHeight: 0,
    textPosition: 0,
    spotChecksMode: '',
    avatarEnabled: false,
    avatarUrl: '',
  };

  store.dispatch(updateState(updatedState));

  if (Platform.OS === 'android' && AdjusterModule) {
    enableAdjustResize();
  }
};

async function getUserAgent() {
  let userAgent = 'Mozilla/5.0 ';
  const isTabletDevice = DeviceInfo.isTablet();

  if (Platform.OS === 'android') {
    userAgent += `(Linux; Android ${Platform.Version}; ${isTabletDevice ? 'Tablet' : 'Mobile'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36`;
  } else if (Platform.OS === 'ios') {
    userAgent += `(${await DeviceInfo.getDeviceName()} - ${DeviceInfo.getModel()} CPU iOS ${Platform.Version.toString().replace(/\./g, '_')} like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36`;
  }

  return userAgent;
}

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
