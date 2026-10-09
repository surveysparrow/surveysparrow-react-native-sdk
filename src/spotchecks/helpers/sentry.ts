// Sentry as error enrichment engine — errors route to SurveySparrow's API, not Sentry servers.
// All Sentry imports are optional — SDK works without @sentry/* packages.

import { spotcheckStore } from '../state/spotcheckState';
import { SDK_VERSION, FRAMEWORK } from './version';

let ReactNativeClient: any = null;
let Scope: any = null;
let dedupeIntegration: any = null;
let functionToStringIntegration: any = null;
let inboundFiltersIntegration: any = null;
let defaultStackParser: any = null;
let makeFetchTransport: any = null;
let httpContextIntegration: any = null;
let breadcrumbsIntegration: any = null;
let reactNativeInfoIntegration: any = null;
let nativeReleaseIntegration: any = null;
let eventOriginIntegration: any = null;
let sdkInfoIntegration: any = null;
let expoContextIntegration: any = null;

let isSentryAvailable = false;

try {
  const sentryReactNative = require('@sentry/react-native');
  ReactNativeClient = sentryReactNative.ReactNativeClient;
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

  // Tested on @sentry/react-native 6+; older majors use the basic report.
  const major = parseInt(String(sentryReactNative.SDK_VERSION || '0'), 10);
  const required = [
    ReactNativeClient, dedupeIntegration, functionToStringIntegration, inboundFiltersIntegration,
    defaultStackParser, makeFetchTransport, httpContextIntegration, breadcrumbsIntegration,
    reactNativeInfoIntegration, nativeReleaseIntegration, eventOriginIntegration,
    sdkInfoIntegration, expoContextIntegration,
  ];
  isSentryAvailable = major >= 6
    && typeof Scope === 'function'
    && typeof Scope.prototype?.setClient === 'function'
    && required.every((fn) => typeof fn === 'function');
} catch (e) {
  isSentryAvailable = false;
}


const MAX_BREADCRUMBS = 30;
const sdkBreadcrumbs: any[] = [];

export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  sdkBreadcrumbs.push({ category: 'spotcheck', message, data, timestamp: Date.now() / 1000 });
  if (sdkBreadcrumbs.length > MAX_BREADCRUMBS) sdkBreadcrumbs.shift();
};

const mergeBreadcrumbs = (sentryBreadcrumbs?: any[]) =>
  [...(sentryBreadcrumbs || []), ...sdkBreadcrumbs]
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0))
    .slice(-50);

// Routes an event to the backend; never throws.
const sendToBackend = async (normalizedEvent: any) => {
  try {
    const { execute } = require('./executables');
    const result = await execute('sentry.processSentryError', {
      event: normalizedEvent,
      sdkType: FRAMEWORK,
      sdkVersion: SDK_VERSION,
    });
    if (result) return;

    const { domainName, targetToken } = spotcheckStore.getState().SpotCheckState?.params || {};
    if (!domainName) return;
    await fetch(`https://${domainName}/api/internal/spotcheck/sdkErrors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorMessage: normalizedEvent.errorMessage,
        sdkType: FRAMEWORK,
        sdkVersion: SDK_VERSION,
        level: normalizedEvent.tags?.error_priority === 'P0' ? 'fatal' : 'error',
        tags: normalizedEvent.tags,
        extra: normalizedEvent.extra,
        breadcrumbs: normalizedEvent.breadcrumbs,
        contexts: { user: { spotcheck_token: targetToken || '', spotcheck_domain_name: domainName } },
      }),
    }).catch(() => {});
  } catch {
    // Reporting must never break the host app.
  }
};

// Used when @sentry/* is not installed in the host app.
const reportWithoutSentry = (
  error: Error | unknown,
  priority: 'P0' | 'P1',
  source: string,
  extra?: Record<string, any>
) => {
  const err = error as any;
  sendToBackend({
    errorMessage: err?.message || String(error),
    tags: {
      error_priority: priority,
      severity: priority === 'P0' ? 'CRITICAL' : 'HIGH',
      errorType: source,
    },
    contexts: {},
    extra: extra || {},
    breadcrumbs: mergeBreadcrumbs(),
    exceptions: [{ type: err?.name || 'Error', value: err?.message || String(error), stack: String(err?.stack || '').slice(0, 2000) }],
    timestamp: Date.now() / 1000,
    platform: 'javascript',
  });
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
      // Never touch the host app's native Sentry SDK.
      enableNative: false,
      enableAutoSessionTracking: false,
      integrations: [
        inboundFiltersIntegration(),
        functionToStringIntegration(),
        breadcrumbsIntegration(),
        dedupeIntegration(),
        httpContextIntegration(),
        nativeReleaseIntegration(),
        eventOriginIntegration(),
        sdkInfoIntegration(),
        reactNativeInfoIntegration(),
        expoContextIntegration(),
      ],
      beforeSend: async (event: any) => {
        await sendToBackend({
          errorMessage:
            event.message ||
            event.exception?.values?.[0]?.value ||
            'Unknown error',
          tags: event.tags || {},
          contexts: event.contexts || {},
          extra: event.extra || {},
          breadcrumbs: mergeBreadcrumbs(event.breadcrumbs),
          exceptions: event.exception?.values?.map((e: any) => ({
            type: e.type,
            value: e.value,
            stacktrace: e.stacktrace?.frames?.slice(-10),
          })),
          eventId: event.event_id,
          timestamp: event.timestamp,
          platform: event.platform,
          release: event.release,
          environment: event.environment,
          sdk: event.sdk,
        });
        return null;
      },
    });

    // Base Client init only; ReactNativeClient.init() would call NATIVE.initNativeSdk.
    const baseInit = Object.getPrototypeOf(ReactNativeClient.prototype)?.init;
    if (typeof baseInit === 'function') baseInit.call(client);

    const scope = new Scope();
    scope.setClient(client);

    sdkClient = client;
    sdkScope = scope;
  } catch (e) {
    isSentryAvailable = false;
  }
};

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
    reportWithoutSentry(error, 'P0', source, extra);
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
      Object.entries(extra).forEach(([k, v]: [string, any]) => {
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
    reportWithoutSentry(error, 'P1', source, extra);
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
      Object.entries(extra).forEach(([k, v]: [string, any]) => {
        eventScope.setExtra(k, v);
      });
    }

    eventScope.captureException(error);
  }
};
