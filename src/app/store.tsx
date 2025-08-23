import { configureStore } from "@reduxjs/toolkit";
// Removed firebase traceSlice import
import authSliceReducer from "./authSlice";
import uiSlice from "./uiSlice";
import awsAuthReducer from './awsAuthSlice'

const store = configureStore({
  reducer: {
  // TradeData: tradesSlice.reducer, // removed with firebase
  Auth: authSliceReducer, // legacy firebase auth
  AwsAuth: awsAuthReducer, // new aws cognito-backed auth state
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
