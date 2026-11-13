import { combineReducers, configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Dimensions } from 'react-native';
import { getVisitorInfo } from '../helpers';

// Native bridge shim; stays in the SDK (tied to ReactNativeWebView).
const NATIVE_BRIDGE_JS = `
  window.__ssScreenHeight = window.__ssScreenHeight || ${Dimensions.get('window').height};
  window.flutterSpotCheckData = {
    postMessage: function(data) {
      window.ReactNativeWebView.postMessage(data);
    }
  };
`;

// Built-in page script; the backend can replace it via init config.webViewScript.
const DEFAULT_PAGE_JS = `
  document.addEventListener('focusin', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      var rect = event.target.getBoundingClientRect();
      var yPosition = rect.y + window.scrollY;
      var scaledY = (yPosition / window.innerHeight) * (window.__ssScreenHeight || window.innerHeight);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'position', y: scaledY }));
    }
  });

  (function() {
    var obs = new MutationObserver(function() {
      var input = document.querySelector(".ss-language-selector__select__input input");
      if (input) input.setAttribute("readonly", true);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  })();

  (function() {
    var s = document.createElement("style");
    s.innerHTML = ".close-btn-chat--spotchecks { display: none !important; }";
    (document.head || document.documentElement).appendChild(s);
  })();
`;

export const buildInjectedJavaScript = (pageJs: string) => `${NATIVE_BRIDGE_JS}\n${pageJs}`;

const initialState: any = {
  allSpotChecksInToken: [],
  customEventsSpotChecks: [],
  filteredSpotChecks: [],
  showSpotCheck: false,

  currentSpotcheck: {
    spotcheckURL: '',
    spotcheckID: 0,
    spotcheckContactID: 0,
    triggerToken: '',
    screenName: '',
    afterDelay: 0,
    isChat: false,
    appearance: {},
  },

  params: {
    targetToken: '',
    domainName: '',
    userDetails: {},
    variables: {},
    customProperties: {},
    visitor: getVisitorInfo(),
    framework: 'react-native',
    userAgent: '',
    traceId: '',
  },

  spotCheckDetails: {
    keyBoardHeight: 0,
    textPosition: 0,
    isMounted: false,
    isVisible: false,
    isExiting: false,
    currentQuestionHeight: 0,
    miniCardHeight: 0,
    sideTabButtonWidth: 0,
    isFullScreenMode: false,
    spotCheckType: null,
    position: 'bottom',
    mode: '',
    closeButton: {
      isEnabled: false,
      color: "#000000",
      isMiniCard: false,
    },
    isSpotCheckButton: false,
    spotCheckButtonConfig: {},
    showSurveyContent: true,
    avatarEnabled: false,
    avatarUrl: '',
    isRTLLanguage: false,
  },

  webViewDetails: {
    isChatEnabled: false,
    isClassicEnabled: false,
    isClassicLoading: true,
    isChatLoading: true,
    chatUrl: null,
    classicUrl: null,
    isCurrentSpotcheckChat: null,
    canShowClassic: false,
    canShowChat: false,
    webViewInjectionData: null,
    scrollEnabled: true,
    webViewConfig: {
      injectedJavaScript: buildInjectedJavaScript(DEFAULT_PAGE_JS),
      webviewDebuggingEnabled: __DEV__,
      geolocationEnabled: true,
      mediaPlaybackRequiresUserAction: false,
      originWhitelist: ["*"],
      allowsInlineMediaPlayback: true,
      javaScriptEnabled: true,
      domStorageEnabled: true,
    },
    chatWebViewRef: null,
    classicWebViewRef: null,
  },
};


const spotcheckSlice = createSlice({
  name: 'SpotCheckState',
  initialState,
  reducers: {
    updateState(state, action: PayloadAction<Partial<any>>) {
      state = {
        ...state,
        ...action.payload,
        currentSpotcheck: {
          ...state.currentSpotcheck,
          ...(action.payload.currentSpotcheck || {}),
        },
        spotCheckDetails: {
          ...state.spotCheckDetails,
          ...(action.payload.spotCheckDetails || {}),
        },
        webViewDetails: {
          ...state.webViewDetails,
          ...(action.payload.webViewDetails || {}),
        },
        params: {
          ...state.params,
          ...(action.payload.params || {}),
        },
      };
      return state;
    },
  },
});

export const { updateState } = spotcheckSlice.actions;

const rootReducer = combineReducers({
  SpotCheckState: spotcheckSlice.reducer,
});

export const spotcheckStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type SpotcheckState = ReturnType<typeof spotcheckStore.getState>;

export type SpotcheckDispatch = typeof spotcheckStore.dispatch;