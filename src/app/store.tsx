import { configureStore } from "@reduxjs/toolkit";
import { tradesSlice } from "./traceSlice";
import authSliceReducer from "./authSlice";
import uiSlice from "./uiSlice";

const store = configureStore({
  reducer: {
    TradeData: tradesSlice.reducer,
    Auth: authSliceReducer,
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
