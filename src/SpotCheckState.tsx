import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SpotcheckState {
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
  isLoading: boolean;
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
  isFullScreenMode: true,
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
  isLoading: true,
};

const spotcheckSlice = createSlice({
  name: 'spotcheck',
  initialState,
  reducers: {
    setIsVisible(state, action: PayloadAction<boolean>) {
      state.isVisible = action.payload;
    },
    setSpotcheckPosition(state, action: PayloadAction<string>) {
      state.spotcheckPosition = action.payload;
    },
    setSpotcheckURL(state, action: PayloadAction<string>) {
      state.spotcheckURL = action.payload;
    },
    setSpotcheckID(state, action: PayloadAction<number>) {
      state.spotcheckID = action.payload;
    },
    setSpotcheckContactID(state, action: PayloadAction<number>) {
      state.spotcheckContactID = action.payload;
    },
    setAfterDelay(state, action: PayloadAction<number>) {
      state.afterDelay = action.payload;
    },
    setMaxHeight(state, action: PayloadAction<number>) {
      state.maxHeight = action.payload;
    },
    setCurrentQuestionHeight(state, action: PayloadAction<number>) {
      state.currentQuestionHeight = action.payload;
    },
    setIsFullScreenMode(state, action: PayloadAction<boolean>) {
      state.isFullScreenMode = action.payload;
    },
    setIsBannerImageOn(state, action: PayloadAction<boolean>) {
      state.isBannerImageOn = action.payload;
    },
    setTriggerToken(state, action: PayloadAction<string>) {
      state.triggerToken = action.payload;
    },
    setCloseButtonStyle(state, action: PayloadAction<Record<string, string>>) {
      state.closeButtonStyle = action.payload;
    },
    setIsCloseButtonEnabled(state, action: PayloadAction<boolean>) {
      state.isCloseButtonEnabled = action.payload;
    },
    setTargetToken(state, action: PayloadAction<string>) {
      state.targetToken = action.payload;
    },
    setDomainName(state, action: PayloadAction<string>) {
      state.domainName = action.payload;
    },
    setUserDetails(state, action: PayloadAction<Record<string, any>>) {
      state.userDetails = action.payload;
    },
    setVariables(state, action: PayloadAction<Record<string, any>>) {
      state.variables = action.payload;
    },
    setCustomProperties(state, action: PayloadAction<Record<string, any>>) {
      state.customProperties = action.payload;
    },
    setTraceId(state, action: PayloadAction<string>) {
      state.traceId = action.payload;
    },
    setCustomEventsSpotChecks(
      state,
      action: PayloadAction<Record<string, any>[]>
    ) {
      state.customEventsSpotChecks = action.payload;
    },
    setIsSpotPassed(state, action: PayloadAction<boolean>) {
      state.isSpotPassed = action.payload;
    },
    setIsChecksPassed(state, action: PayloadAction<boolean>) {
      state.isChecksPassed = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setIsVisible,
  setSpotcheckPosition,
  setSpotcheckURL,
  setSpotcheckID,
  setSpotcheckContactID,
  setAfterDelay,
  setMaxHeight,
  setCurrentQuestionHeight,
  setIsFullScreenMode,
  setIsBannerImageOn,
  setTriggerToken,
  setCloseButtonStyle,
  setIsCloseButtonEnabled,
  setTargetToken,
  setDomainName,
  setUserDetails,
  setVariables,
  setCustomProperties,
  setTraceId,
  setCustomEventsSpotChecks,
  setIsSpotPassed,
  setIsChecksPassed,
  setIsLoading,
} = spotcheckSlice.actions;

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
