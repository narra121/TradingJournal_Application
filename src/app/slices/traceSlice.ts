import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  query,
  onSnapshot,
} from "firebase/firestore";

import { RootState } from "../store";
import { ImageType, TradeDetails, Trade, TradesState } from "../types";
import { db } from "../firebase";

const initialState: TradesState = {
  trades: [],
  status: "idle",
  error: null,
};

let unsubscribe: (() => void) | null = null;

export const subscribeToTrades = createAsyncThunk<
  any,
  { startDate?: string; endDate?: string; symbol?: string } | undefined,
  { rejectValue: string }
>(
  "trades/subscribeToTrades",
  async (filters = {}, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.Auth.user?.uid;

      if (!userId) {
        return rejectWithValue("User is not authenticated");
      }

      // Cancel existing subscription
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const tradesQuery = query(collection(db, `users/${userId}/trades`));

      return new Promise((resolve, reject) => {
        unsubscribe = onSnapshot(
          tradesQuery,
          (snapshot) => {
            const trades: Trade[] = snapshot.docs
              .map(
                (doc) =>
                  ({
                    tradeId: doc.id,
                    ...doc.data(),
                  } as Trade)
              )
              .filter(Boolean);

            dispatch(tradesSlice.actions.setTrades(trades));
            resolve(unsubscribe);
          },
          (error) => {
            console.error("Error fetching trades:", error);
            reject(rejectWithValue(error.message));
          }
        );
      });
    } catch (error: any) {
      console.error("Error in subscribeToTrades:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const addTradeToFirestore = createAsyncThunk(
  "trades/addTradeToFirestore",
  async (trades: TradeDetails[], { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const userId = state.Auth.user?.uid;

      if (!userId) {
        return rejectWithValue("User is not authenticated");
      }

      const batch = writeBatch(db);

      trades.forEach((trade) => {
        if (!trade || !trade.tradeId) {
          console.warn("Skipping invalid trade:", trade);
          return;
        }

        const tradeDocRef = doc(db, `users/${userId}/trades`, trade.tradeId);
        batch.set(tradeDocRef, {
          tradeId: trade.tradeId,
          trade,
          images: [],
          psychology: {
            isGreedy: false,
            isFomo: false,
            isRevenge: false,
            emotionalState: "",
            notes: "",
          },
          analysis: {
            riskRewardRatio: 0,
            setupType: "",
            mistakes: [],
          },
          metrics: {
            riskPerTrade: 0,
            stopLossDeviation: 0,
            targetDeviation: 0,
            marketConditions: "",
            tradingSession: "",
          },
        });
      });

      await batch.commit();
      return trades;
    } catch (error: any) {
      console.error("Error adding trades:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateTradeInFirestore = createAsyncThunk(
  "trades/updateTradeInFirestore",
  async (trade: Trade, { rejectWithValue, getState }) => {
    if (!trade.tradeId) {
      return rejectWithValue("Trade ID is required to update the trade.");
    }

    try {
      const state = getState() as RootState;
      const userId = state.Auth.user?.uid;

      if (!userId) {
        return rejectWithValue("User is not authenticated");
      }

      const tradeDocRef = doc(db, `users/${userId}/trades`, trade.tradeId);
      await updateDoc(tradeDocRef, trade as any);

      return trade;
    } catch (error: any) {
      return rejectWithValue(error.message || "An unknown error occurred");
    }
  }
);

export const deleteTradeFromFirestore = createAsyncThunk(
  "trades/deleteTradeFromFirestore",
  async (tradeId: string, { rejectWithValue, getState }) => {
    const state = getState() as RootState;
    const userId = state.Auth.user?.uid;

    if (!userId) {
      return rejectWithValue("User is not authenticated");
    }

    try {
      const tradeDocRef = doc(db, `users/${userId}/trades`, tradeId);
      await deleteDoc(tradeDocRef);
      return tradeId;
    } catch (error: any) {
      return rejectWithValue(error.message || "An unknown error occurred");
    }
  }
);

export const tradesSlice = createSlice({
  name: "trades",
  initialState,
  reducers: {
    setTrades: (state, action: PayloadAction<Trade[]>) => {
      state.trades = action.payload;
      state.status = "succeeded";
    },
    addTrade: (state, action: PayloadAction<Trade>) => {
      state.trades.push(action.payload);
    },
    updateTrade: (state, action: PayloadAction<Trade>) => {
      const index = state.trades.findIndex(
        (trade) => trade.tradeId === action.payload.tradeId
      );
      if (index !== -1) {
        state.trades[index] = action.payload;
      }
    },
    deleteTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(
        (trade) => trade.tradeId !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToTrades.pending, (state) => {
        state.status = "loading";
      })
      .addCase(subscribeToTrades.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addTradeToFirestore.fulfilled, (state, action) => {
        if (action.payload) {
          const newTrades = action.payload.map((tradeDetails) => ({
            tradeId: tradeDetails.tradeId,
            trade: tradeDetails,
            images: [],
            psychology: {
              isGreedy: false,
              isFomo: false,
              isRevenge: false,
              emotionalState: "",
              notes: "",
            },
            analysis: {
              riskRewardRatio: 0,
              setupType: "",
              mistakes: [],
            },
            metrics: {
              riskPerTrade: 0,
              stopLossDeviation: 0,
              targetDeviation: 0,
              marketConditions: "",
              tradingSession: "",
            },
          }));
          state.trades = [...state.trades, ...newTrades];
        }
      })
      .addCase(updateTradeInFirestore.fulfilled, (state, action) => {
        const index = state.trades.findIndex(
          (trade) => trade.tradeId === action.payload?.tradeId
        );
        if (index !== -1 && action.payload) {
          state.trades[index] = action.payload;
        }
      })
      .addCase(deleteTradeFromFirestore.fulfilled, (state, action) => {
        state.trades = state.trades.filter(
          (trade) => trade.tradeId !== action.payload
        );
      });
  },
});
