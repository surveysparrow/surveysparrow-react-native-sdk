import axios from 'axios';
import { store, updateState, type SpotcheckState } from './SpotCheckState';
import uuid from 'react-native-uuid';
import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

let ReactNativeClient: any = null;
let Scope: any = null;
let dedupeIntegration: any = null;
let functionToStringIntegration: any = null;
let inboundFiltersIntegration: any = null;
let defaultStackParser: any = null;
let makeFetchTransport: any = null;
let httpContextIntegration: any = null;
let breadcrumbsIntegration: any = null;
let deviceContextIntegration: any = null;
let reactNativeInfoIntegration: any = null;
let nativeReleaseIntegration: any = null;
let eventOriginIntegration: any = null;
let sdkInfoIntegration: any = null;
let expoContextIntegration: any = null;

let isSentryAvailable = false;

try {
  const sentryReactNative = require('@sentry/react-native');
  ReactNativeClient = sentryReactNative.ReactNativeClient;
  deviceContextIntegration = sentryReactNative.deviceContextIntegration;
  reactNativeInfoIntegration = sentryReactNative.reactNativeInfoIntegration;
  nativeReleaseIntegration = sentryReactNative.nativeReleaseIntegration;
  eventOriginIntegration = sentryReactNative.eventOriginIntegration;
  sdkInfoIntegration = sentryReactNative.sdkInfoIntegration;
  expoContextIntegration = sentryReactNative.expoContextIntegration;

  const sentryCore = require('@sentry/core');
  Scope = sentryCore.Scope;
  dedupeIntegration = sentryCore.dedupeIntegration;
  functionToStringIntegration = sentryCore.functionToStringIntegration;
  inboundFiltersIntegration = sentryCore.inboundFiltersIntegration;

  const sentryReact = require('@sentry/react');
  defaultStackParser = sentryReact.defaultStackParser;
  makeFetchTransport = sentryReact.makeFetchTransport;
  httpContextIntegration = sentryReact.httpContextIntegration;
  breadcrumbsIntegration = sentryReact.breadcrumbsIntegration;

  isSentryAvailable = true;
} catch (e) {
  isSentryAvailable = false;
}

const { AdjusterModule } = NativeModules;

const disableAdjust = () => {
  AdjusterModule.setAdjustNothing();
};

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
    if (!responseJson) throw new Error('Invalid response');

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

      const isChatType =
        ischatSurvey(currentSpotcheck?.survey?.surveyType) &&
        mode === 'fullScreen';

      updatedState = {
        spotcheckPosition:
          position === 'top_full' || position === 'center_top'
            ? 'top'
            : position === 'center_center'
              ? 'center'
              : 'bottom',
        isCloseButtonEnabled: closeButton ?? true,
        closeButtonStyle: colors?.overrides ?? {},
        maxHeight: maxHeight ? parseFloat(maxHeight) / 100 : 0,
        spotCheckType: isChatType ? 'chat' : 'classic',
        isFullScreenMode: mode === 'fullScreen',
        isBannerImageOn: bannerImage?.enabled ?? false,
        spotChecksMode: mode,
        avatarEnabled: appearance?.avatar?.enabled ?? false,
        avatarUrl: appearance?.avatar?.avatarUrl ?? '',
        isSpotCheckButton: appearance?.type === 'spotcheckButton',
        spotCheckButtonConfig:
          appearance?.type === 'spotcheckButton'
            ? (currentSpotcheck?.appearance?.buttonConfig ?? {})
            : {},
        showSurveyContent: appearance?.type !== 'spotcheckButton',
        screenName: screen,
        isChat: isChatType,
        appearance: appearance,
      };

      chat = isChatType;
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

    const existingURL = store.getState().spotcheck.spotcheckURL;
    let fullSpotcheckURL = existingURL;

    if (!fullSpotcheckURL && domainName && triggerToken) {
      const baseSpotcheckURL = `https://${domainName}/s/spotcheck/${triggerToken}/${
        chat ? 'config' : 'bootstrap'
      }?spotcheckContactId=${spotCheckContactId}&traceId=${traceId}&spotcheckUrl=${screen}&isSpotCheck=true`;
      fullSpotcheckURL = Object.entries(variables).reduce(
        (acc, [key, value]) =>
          acc +
          `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        baseSpotcheckURL
      );
      updatedState.spotcheckURL = fullSpotcheckURL;
    }

    setTimeout(async () => {
      store.dispatch(updateState(updatedState));
      if (!updatedState.isSpotCheckButton) await fetchSpotcheckAPI();
    }, store.getState().spotcheck.afterDelay * 1000);

    return true;
  } catch (error: any) {
    throw new Error(error?.message ?? 'setAppearance error');
  }
};

export const fetchSpotcheckAPI = async () => {
  try {
    const state = store.getState().spotcheck;
    const {
      spotcheckURL,
      isChat,
      screenName,
      chatWebViewRef,
      classicWebViewRef,
      isChatLoading,
      isClassicLoading,
      appearance,
      traceId,
      variables,
    } = state;

    if (!spotcheckURL) throw new Error('Missing Spotcheck URL');

    const userAgent = await getUserAgent();
    const response = await axios.get(spotcheckURL, {
      headers: { 'User-Agent': userAgent },
    });

    const themeInfo = response?.data?.config?.generatedCSS;
    const themePayload = { type: 'THEME_UPDATE_SPOTCHECK', themeInfo };

    const INJECTED_JAVASCRIPT = `
      (function() {
        window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
          {
            type: 'RESET_STATE',
            state: {
              ...(response?.data || {}),
              skip: true,
              spotCheckAppearance: {
                ...(appearance || {}),
                targetType: 'MOBILE',
              },
              spotcheckUrl: screenName,
              traceId,
              elementBuilderParams: {
                ...(variables || {}),
              },
            },
          }
        )} }));
        window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
          themePayload
        )} }));
      })();
    `;

    const webViewRef = isChat ? chatWebViewRef : classicWebViewRef;
    const isLoading = isChat ? isChatLoading : isClassicLoading;
    const inject = () => webViewRef?.injectJavaScript(INJECTED_JAVASCRIPT);

    if (webViewRef && !isLoading) {
      inject();
      start();
      return true;
    }

    const unsubscribe = store.subscribe(() => {
      const s = store.getState().spotcheck;
      const ready =
        (s.isChat && !s.isChatLoading) || (!s.isChat && !s.isClassicLoading);
      if (ready) {
        unsubscribe();
        const ref = s.isChat ? s.chatWebViewRef : s.classicWebViewRef;
        ref?.injectJavaScript(INJECTED_JAVASCRIPT);
        start();
      }
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const start = () => {
  store.dispatch(updateState({ isVisible: true }));
  if (Platform.OS === 'android' && AdjusterModule) {
    disableAdjust();
  }
};

export const handleSurveyEnd = (navigationChange: boolean = false) => {
  const webViewRef =
    store.getState().spotcheck.spotCheckType === 'chat'
      ? store.getState().spotcheck.chatWebViewRef
      : store.getState().spotcheck.classicWebViewRef;

  webViewRef?.injectJavaScript(`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify({ type: 'UNMOUNT_APP' })}
        }));
      })();
    `);

  if (!store.getState().spotcheck.isSpotCheckButton || navigationChange) {
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
      isSpotCheckButton: false,
      spotCheckButtonConfig: {},
      isThankyouPageSubmission: false,
      showSurveyContent: true,
      screenName: '',
      isChat: false,
      appearance: {},
    };

    store.dispatch(updateState(updatedState));
  } else {
    const updatedState: Partial<SpotcheckState> = {
      isVisible: false,
      currentQuestionHeight: 0,
      isMounted: false,
      isThankyouPageSubmission: false,
      showSurveyContent: false,
    };

    store.dispatch(updateState(updatedState));
  }

  if (Platform.OS === 'android' && AdjusterModule) {
    enableAdjustResize();
  }
};

async function getUserAgent() {
  let userAgent = 'Mozilla/5.0 ';
  const isTabletDevice = DeviceInfo.isTablet();

  if (Platform.OS === 'android') {
    userAgent += `(Linux; Android ${Platform.Version}; ${
      isTabletDevice ? 'Tablet' : 'Mobile'
    }) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36`;
  } else if (Platform.OS === 'ios') {
    userAgent += `(${await DeviceInfo.getDeviceName()} - ${DeviceInfo.getModel()} CPU iOS ${Platform.Version.toString().replace(
      /\./g,
      '_'
    )} like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36`;
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
        await store.getState().spotcheck.listener?.onCloseButtonTap?.();
      }
    } else {
      captureP0Error(
        new Error(`Close spotcheck failed with status ${response.status}`),
        'CLOSE_SPOTCHECK',
        { spotcheckContactID, status: response.status }
      );
    }
  } catch (error) {
    captureP0Error(error, 'CLOSE_SPOTCHECK', {
      domainName,
      spotcheckContactID,
    });
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

export interface SdkErrorPayload {
  errorMessage: string;
  sdkType: string;
  sdkVersion: string;
  tags: Record<string, any>;
  contexts: Record<string, any>;
  extra: Record<string, any>;
  sentryEvent?: Record<string, any>;
  breadcrumbs?: any;
}

export const logSdkError = async (
  domainName: string,
  payload: SdkErrorPayload
): Promise<boolean> => {
  if (!domainName) {
    return false;
  }

  try {
    await axios.post(
      `https://${domainName}/api/internal/spotcheck/sdkErrors`,
      payload
    );
    return true;
  } catch (loggingError) {
    return false;
  }
};

let sdkScope: any = null;
let sdkClient: any = null;

export const initializeSentry = () => {
  if (!isSentryAvailable) {
    return;
  }

  if (sdkScope && sdkClient) return;

  try {
    const client = new ReactNativeClient({
      dsn: 'https://dummy@sentry.io/0',
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      enableNative: true,
      enableAutoSessionTracking: false,
      integrations: [
        inboundFiltersIntegration(),
        functionToStringIntegration(),
        breadcrumbsIntegration(),
        dedupeIntegration(),
        httpContextIntegration(),
        deviceContextIntegration(),
        nativeReleaseIntegration(),
        eventOriginIntegration(),
        sdkInfoIntegration(),
        reactNativeInfoIntegration(),
        expoContextIntegration(),
      ],
      beforeSend: async (event: any) => {
        const state = store.getState().spotcheck;
        const error_priority = String(event.tags?.error_priority || 'P1');
        const errorType = event.tags?.errorType || 'GENERAL';
        const severity = error_priority === 'P0' ? 'CRITICAL' : 'HIGH';
        const level = error_priority === 'P0' ? 'fatal' : 'error';

        const payload: SdkErrorPayload = {
          errorMessage: `${
            event.message ||
            event.exception?.values?.[0]?.value ||
            'Unknown error'
          }`,
          sdkType: 'react-native',
          sdkVersion: '1.0.10-beta.4',
          tags: {
            level,
            error_priority,
            errorType,
            severity,
            ...event.tags,
          },
          contexts: {
            user: {
              spotcheck_token: state.targetToken || '',
              spotcheck_domain_name: state.domainName || '',
            },
            ...(event.contexts || {}),
          },
          breadcrumbs: event.breadcrumbs,
          extra: {
            error_message: event.message || event.exception?.values?.[0]?.value,
            variables: state.variables || {},
            custom_properties: state.customProperties || {},
            user_details: state.userDetails || {},
            exception: event.exception?.values?.map((e: any) => ({
              type: e.type,
              value: e.value,
              stacktrace: e.stacktrace?.frames?.slice(-10),
            })),
            breadcrumbs: event.breadcrumbs,
          },
          sentryEvent: {
            event_id: event.event_id,
            timestamp: event.timestamp,
            platform: event.platform,
            release: event.release,
            environment: event.environment,
            sdk: event.sdk,
          },
        };

        if (state.domainName) {
          await logSdkError(state.domainName, payload);
        }

        return null;
      },
    });

    client.init();

    const scope = new Scope();
    scope.setClient(client);

    sdkClient = client;
    sdkScope = scope;
  } catch (e) {
    isSentryAvailable = false;
  }
};

export type ErrorPriority = 'P0' | 'P1';

export type ErrorSource =
  | 'SDK_INITIALIZATION'
  | 'SPOTCHECK_INITIALIZATION'
  | 'TRACK_SCREEN'
  | 'TRACK_EVENT'
  | 'WEBVIEW_ERROR'
  | 'CLOSE_SPOTCHECK'
  | 'APP_CRASH'
  | 'GENERAL';

export const captureP0Error = (
  error: Error | unknown,
  source: ErrorSource,
  extra?: Record<string, any>
) => {
  if (!isSentryAvailable) {
    return;
  }

  if (!sdkScope || !sdkClient) {
    initializeSentry();
  }

  if (sdkScope) {
    const eventScope = sdkScope.clone();

    eventScope.setTag('error_priority', 'P0');
    eventScope.setTag('severity', 'CRITICAL');
    eventScope.setTag('errorType', source);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        eventScope.setExtra(k, v);
      });
    }

    eventScope.captureException(error);
  }
};

export const captureP1Error = (
  error: Error | unknown,
  source: ErrorSource,
  extra?: Record<string, any>
) => {
  if (!isSentryAvailable) {
    return;
  }

  if (!sdkScope || !sdkClient) {
    initializeSentry();
  }

  if (sdkScope) {
    const eventScope = sdkScope.clone();

    eventScope.setTag('error_priority', 'P1');
    eventScope.setTag('severity', 'HIGH');
    eventScope.setTag('errorType', source);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        eventScope.setExtra(k, v);
      });
    }

    eventScope.captureException(error);
  }
};
