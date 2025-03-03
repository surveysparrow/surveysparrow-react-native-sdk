import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SpotcheckState {
  isVisible: boolean;
  spotcheckPosition: string;
  spotcheckURL: string;
  spotcheckID: number;
  spotcheckContactID: number;
  afterDelay: number;
  maxHeight: number;
  currentQuestionHeight: number;
  isFullScreenMode: boolean;
  isBannerImageOn: boolean;
  triggerToken: string;
  closeButtonStyle: Record<string, string>;
  isCloseButtonEnabled: boolean;
  isSpotPassed: boolean;
  isChecksPassed: boolean;
  customEventsSpotChecks: Record<string, any>[];
  targetToken: string;
  domainName: string;
  userDetails: Record<string, any>;
  variables: Record<string, any>;
  customProperties: Record<string, any>;
  traceId: string;
  isClassicLoading: boolean;
  isChatLoading: boolean;
  classicUrl: string;
  chatUrl: string;
  classicWebViewRef: any | null;
  chatWebViewRef: any | null;
  filteredSpotChecks: Record<string, any>[];
  spotCheckType: String;
  isMounted: boolean;
  textPosition: number;
  screenHeight: number;
  keyBoardHeight: number;
}

const initialState: SpotcheckState = {
  isVisible: false,
  spotcheckPosition: 'bottom',
  spotcheckURL: '',
  spotcheckID: 0,
  spotcheckContactID: 0,
  afterDelay: 0.0,
  maxHeight: 0.5,
  currentQuestionHeight: 0,
  isFullScreenMode: false,
  isBannerImageOn: false,
  triggerToken: '',
  closeButtonStyle: {},
  isCloseButtonEnabled: false,
  isSpotPassed: false,
  isChecksPassed: false,
  customEventsSpotChecks: [],
  targetToken: '',
  domainName: '',
  userDetails: {},
  variables: {},
  customProperties: {},
  traceId: '',
  isClassicLoading: true,
  isChatLoading: true,
  classicUrl: '',
  chatUrl: '',
  classicWebViewRef: null,
  chatWebViewRef: null,
  filteredSpotChecks: [],
  spotCheckType: '',
  isMounted: false,
  textPosition: 0,
  screenHeight: 0,
  keyBoardHeight: 0,
};

const spotcheckSlice = createSlice({
  name: 'spotcheck',
  initialState,
  reducers: {
    updateState(state, action: PayloadAction<Partial<SpotcheckState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { updateState } = spotcheckSlice.actions;

const rootReducer = combineReducers({
  spotcheck: spotcheckSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
