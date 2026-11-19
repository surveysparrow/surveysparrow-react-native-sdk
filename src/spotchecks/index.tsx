import React, { Component, type ErrorInfo } from "react";
import { Provider } from "react-redux";
import WebViewComponent from "./components/WebViewComponent";
import { Wrapper } from "./components/Wrapper";
import { getAllSpotcheckFunctions, getUserAgent, getDeviceFacts } from "./helpers";
import type {
  SpotcheckProps,
  TrackEventProps,
  TrackScreenOptions,
  TrackScreenProps,
} from "./helpers/types";
import { spotcheckStore, updateState, buildInjectedJavaScript } from "./state/spotcheckState";
import { execute, markInitialized, setListener } from "./helpers/executables";
import { SpotCheckButton } from "./components/SpotCheckButton";
// Registers CloseButton in the component registry.
import "./components/CloseButton";
import { useSpotcheckNavigation } from "./helpers/NavigationHandler";
import { initializeSentry, captureP0Error, addBreadcrumb } from "./helpers/sentry";
import { FRAMEWORK } from "./helpers/version";

function resolveTrackOptions(input?: TrackScreenOptions): Required<
  Pick<TrackScreenOptions, "variables" | "customProperties" | "userDetails">
> {
  return {
    variables: input?.variables ?? {},
    customProperties: input?.customProperties ?? {},
    userDetails: input?.userDetails ?? {},
  };
}

export { SDK_VERSION } from './helpers/version';

initializeSentry();

interface ErrorBoundaryState {
  hasError: boolean;
}

class SpotcheckErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureP0Error(error, 'APP_CRASH', {
      type: 'appCrash',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const SpotCheckContent: React.FC = () => {
  useSpotcheckNavigation();

  return (
    <>
      <Wrapper>
        <WebViewComponent />
      </Wrapper>
      <SpotCheckButton />
    </>
  );
};

export const SpotCheck: React.FC = () => {
  return (
    <Provider store={spotcheckStore}>
      <SpotcheckErrorBoundary>
        <SpotCheckContent />
      </SpotcheckErrorBoundary>
    </Provider>
  );
};

// Backend-owned page script; the built-in one stays when missing.
const applyWebViewScript = (script: unknown) => {
  if (typeof script !== 'string' || !script.trim()) return;
  const { webViewDetails } = spotcheckStore.getState().SpotCheckState;
  spotcheckStore.dispatch(updateState({
    webViewDetails: {
      webViewConfig: {
        ...webViewDetails.webViewConfig,
        injectedJavaScript: buildInjectedJavaScript(script),
      },
    },
  }));
};

// Init retry: a failed init (e.g. offline at launch) is retried on the next track call.
const INIT_RETRY_GAP_MS = 10000;
let lastInitParams: SpotcheckProps | null = null;
let initStatus: "idle" | "running" | "done" | "failed" = "idle";
let lastInitAttempt = 0;

const retryInitIfFailed = () => {
  if (initStatus !== "failed" || !lastInitParams) return;
  if (Date.now() - lastInitAttempt < INIT_RETRY_GAP_MS) return;
  initializeSpotChecks(lastInitParams).catch(() => {});
};

export const initializeSpotChecks = async (params: SpotcheckProps) => {
  lastInitParams = params;
  initStatus = "running";
  lastInitAttempt = Date.now();
  // Setup: store params early so Sentry fallback has domainName
  try {
    if (params.listener) {
      setListener(params.listener);
    }

    const userAgent = await getUserAgent();
    if (params.domainName) {
      spotcheckStore.dispatch(updateState({ params: { userAgent, domainName: params.domainName } }));
    } else {
      spotcheckStore.dispatch(updateState({ params: { userAgent } }));
    }
  } catch (error: any) {
    // Legacy never threw into the host app; failures go to Sentry and the console.
    captureP0Error(error, 'SDK_INITIALIZATION', {
      action: 'initializeSpotChecks:setup',
      errorMessage: error?.message,
    });
    console.error("Error initializing spotchecks:", error);
    initStatus = "failed";
    return;
  }

  // Init: fetch functions and initialize (has its own Sentry)
  try {
    const device = await getDeviceFacts();
    const initData = await getAllSpotcheckFunctions(params.domainName);
    applyWebViewScript(initData?.config?.webViewScript);
    await execute("initializeSpotcheckComponent", { ...params, framework: FRAMEWORK, device });
    await markInitialized();
    initStatus = "done";
  } catch (error: any) {
    console.error("Error initializing spotchecks:", error);
    initStatus = "failed";
  }
};

export async function trackScreen(
  screen: string,
  options?: TrackScreenOptions
): Promise<void>;
export async function trackScreen(props: TrackScreenProps): Promise<void>;
export async function trackScreen(
  screenOrProps: string | TrackScreenProps,
  optionsArg?: TrackScreenOptions
): Promise<void> {
  const screen =
    typeof screenOrProps === "string" ? screenOrProps : screenOrProps.screen;
  const options = resolveTrackOptions(
    typeof screenOrProps === "string"
      ? optionsArg
      : screenOrProps.options
  );
  addBreadcrumb('trackScreen', { screen });
  retryInitIfFailed();
  try {
    await execute("trackScreen", { screen, options });
  } catch (error: any) {
    // Legacy only logged; never throw into the host app.
    console.error("Error tracking screen:", error);
  }
}

export async function trackEvent(
  screen: string,
  event: Record<string, any>,
  options?: TrackScreenOptions
): Promise<void>;
export async function trackEvent(props: TrackEventProps): Promise<void>;
export async function trackEvent(
  screenOrProps: string | TrackEventProps,
  eventArg?: Record<string, any>,
  optionsArg?: TrackScreenOptions
): Promise<void> {
  let screen: string;
  let event: Record<string, any>;
  let options: ReturnType<typeof resolveTrackOptions>;
  if (typeof screenOrProps === "string") {
    screen = screenOrProps;
    if (eventArg === undefined) {
      console.error("trackEvent: `event` is required");
      return;
    }
    event = eventArg;
    options = resolveTrackOptions(optionsArg);
  } else {
    if (!screenOrProps.screen) {
      console.error("trackEvent: `screen` is required");
      return;
    }
    screen = screenOrProps.screen;
    if (screenOrProps.event == null) {
      console.error("trackEvent: `event` is required");
      return;
    }
    event = screenOrProps.event;
    options = resolveTrackOptions(screenOrProps.options);
  }
  addBreadcrumb('trackEvent', { screen, event: Object.keys(event || {}).join(',') });
  retryInitIfFailed();
  try {
    await execute("trackEvent", { screen, event, options });
  } catch (error: any) {
    console.error("Error tracking event:", error);
  }
}


// Closes any open spotcheck and its button (screen changes the SDK can't detect).
export async function closeSpotChecks(): Promise<void> {
  addBreadcrumb('closeSpotChecks', {});
  await execute('handleNavigationChange', { reason: 'close' });
}

export type {
  CustomProperties,
  SpotcheckProps,
  SsSpotcheckListener,
  TrackEventProps,
  TrackScreenProps,
  UserDetails,
  Variables,
} from "./helpers/types";
