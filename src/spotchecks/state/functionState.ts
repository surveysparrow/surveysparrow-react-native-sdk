import { combineReducers, configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: any = {
  isLoaded: false,
  initializeSpotcheckComponent: null,
  trackScreen: null,
  trackEvent: null,
  closeSpotcheckComponent: null,
  webviewComponent: {
    handleWebViewMessage: null,
    handleWebViewError: null,
    handleWebViewInjection: null,
    classicWebViewRefCallback: null,
    chatWebViewRefCallback: null,
  },
  closeButton: {
    handleCloseButton: null,
    getCloseButtonStyles: null,
  },
  wrapper: {
    getWrapperStyles: null,
  },
}

const functionSlice = createSlice({
    name: 'functionStore',
    initialState,
    reducers: {
      updateState(state, action: PayloadAction<Partial<any>>) {
        Object.assign(state, action.payload);
      },
    },
  });
  
  export const { updateState } = functionSlice.actions;
  
  const functionReducer = combineReducers({
    functionState: functionSlice.reducer,
  });
  
  export const functionStore = configureStore({
    reducer: functionReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
  
  export type functionState = ReturnType<typeof functionStore.getState>;
  
  export type functionStoreDispatch = typeof functionStore.dispatch;