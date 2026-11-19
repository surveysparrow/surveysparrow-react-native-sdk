import { combineReducers, configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: any = {
  isLoaded: false,
  schemas: {
    wrapper: null,
    webviewComponent: null,
    closeButton: null,
  },
};

const componentSlice = createSlice({
  name: 'componentStore',
  initialState,
  reducers: {
    updateState(state, action: PayloadAction<Partial<any>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { updateState } = componentSlice.actions;

const componentReducer = combineReducers({
  componentState: componentSlice.reducer,
});

export const componentStore = configureStore({
  reducer: componentReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type ComponentState = ReturnType<typeof componentStore.getState>;

export type ComponentStoreDispatch = typeof componentStore.dispatch;
