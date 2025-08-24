import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
// Removed firebase traceSlice import
import uiSlice from "./uiSlice";
import awsAuthReducer from './awsAuthSlice'
import awsTradesReducer from './awsTradesSlice'
import statsReducer from './statsSlice'

const store = configureStore({
  reducer: {
  // TradeData: tradesSlice.reducer, // removed with firebase
  AwsAuth: awsAuthReducer, // new aws cognito-backed auth state
  AwsTrades: awsTradesReducer,
  Stats: statsReducer,
    UI: uiSlice,
  },
  // Customize middleware to ignore non-serializable unsubscribe function
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["trades/subscribeToTrades/fulfilled"],
        // Ignore this field in the action payload for the specific action
        // ignoredActionPaths: ['payload'], // Alternative: ignore the payload path directly
      },
    }),
});

// Expose store globally (used by scheduled token refresh fallback)
;(globalThis as any).store = store

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store;
