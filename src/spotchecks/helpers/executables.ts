import { functionStore } from "../state/functionState";
import { spotcheckStore, updateState } from "../state/spotcheckState";
import { saveData, loadData } from "./storage";
import type { SsSpotcheckListener } from "./types";
import { captureP0Error, captureP1Error, addBreadcrumb, safeAddBreadcrumb, isReported, registerExecute } from "./sentry";
import { Adjuster } from "./Adjuster";
import { SDK_VERSION } from "./version";

const pauseDefaultKeyboardBehavior = () => {
  try {
    Adjuster.setAdjustNothing();
  } catch {}
};

const resumeDefaultKeyboardBehavior = () => {
  try {
    Adjuster.setAdjustResize();
  } catch {}
};

let spotcheckListener: SsSpotcheckListener = {};

export const setListener = (listener: SsSpotcheckListener) => {
  spotcheckListener = listener || {};
};

export const dispatchWrapper = (stateUpdate: any) => {
  try {
    spotcheckStore.dispatch(updateState(stateUpdate));
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', {
      action: 'dispatchWrapper',
      errorMessage: error?.message,
    });
  }
};

type PendingCall = { functionName: string; params?: any };

const pendingExecutes: PendingCall[] = [];
const MAX_PENDING_EXECUTES = 20;

function isTrackScreenOrEvent(functionName: string): boolean {
  return functionName === "trackScreen" || functionName === "trackEvent";
}

export const flushPendingExecutes = async () => {
  while (pendingExecutes.length > 0) {
    const item = pendingExecutes.shift();
    if (item) {
      await execute(item.functionName, item.params);
    }
  }
};

// Track calls wait until initializeSpotcheckComponent has finished.
let isInitialized = false;

export const markInitialized = async () => {
  isInitialized = true;
  await flushPendingExecutes();
};

// Reporting failures are not reported again (avoids loops).
const isSentryFunction = (functionName: string) => functionName.startsWith('sentry.');

// Style getters run on every render; they would push useful breadcrumbs out.
const isBreadcrumbWorthy = (functionName: string) =>
  !isSentryFunction(functionName) && !/\.get\w*Styles$/.test(functionName);

// Message type only; never survey content.
const describeParams = (functionName: string, params?: any) => {
  if (functionName !== 'webviewComponent.handleWebViewMessage') return {};
  try {
    const data = params?.event?.nativeEvent?.data;
    return { messageType: data === 'captureImage' ? data : JSON.parse(data)?.type };
  } catch {
    return {};
  }
};

// True when the backend sent this function (dotted path), e.g. for schema `$execute`.
export const hasFunction = (functionName: string): boolean => {
  let current: any = functionStore.getState().functionState;
  for (const part of functionName.split('.')) {
    current = current?.[part];
  }
  return typeof current === 'string';
};

export const execute = async (functionName: string, params?: any) => {
  let func: any;
  let payload: any;

  try {
    const functionState = functionStore.getState();

    if (isTrackScreenOrEvent(functionName) && !isInitialized) {
      pendingExecutes.push({ functionName, params });
      // Cap the queue while init keeps failing; oldest calls go first.
      if (pendingExecutes.length > MAX_PENDING_EXECUTES) pendingExecutes.shift();
      return null;
    }

    if (!functionState.functionState.isLoaded) {
      return null;
    }

    const pathParts = functionName.split('.');
    let functionString = functionState.functionState;
    
    for (const part of pathParts) {
      functionString = functionString?.[part];
    }

    if (!functionString || typeof functionString !== 'string') {
      console.error(`Function ${functionName} not found`);
      return null;
    }

    payload = {
      params:{...params, sdkVersion: SDK_VERSION},
      state: spotcheckStore.getState(),
      dispatchWrapper,
      storage: { saveData, loadData },
      listener: spotcheckListener,
      sentry: { captureP0Error, captureP1Error, addBreadcrumb: safeAddBreadcrumb },
      keyboard: { pauseDefaultKeyboardBehavior, resumeDefaultKeyboardBehavior },
    };

    func = eval(`(${functionString})`);
    if (isBreadcrumbWorthy(functionName)) {
      addBreadcrumb('execute', { functionName, ...describeParams(functionName, params) });
    }
  } catch (error: any) {
    if (isSentryFunction(functionName)) return null;
    captureP1Error(error, 'GENERAL', {
      action: 'execute:setup',
      functionName,
      errorMessage: error?.message,
    });
    return null;
  }

  try {
    const result = await func(payload);
    return result;
  } catch (error: any) {
    if (isSentryFunction(functionName)) return null;
    // Skip when the function already reported this error itself.
    if (!isReported(error)) {
      captureP1Error(error, "GENERAL", {
        action: "execute:runtime",
        functionName,
        errorMessage: error?.message,
      });
    }
    console.error(`[execute] ${functionName}:`, error);
    return null;
  }
}

registerExecute(execute);
