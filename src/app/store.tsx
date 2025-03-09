import { configureStore } from "@reduxjs/toolkit";
import { tradesSlice } from "./traceSlice";
import authSliceReducer from "./authSlice";

const store = configureStore({
  reducer: {
    TradeData: tradesSlice.reducer,
    Auth: authSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
