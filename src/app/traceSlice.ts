import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { db, storage } from "./firebase"; // Import Firestore and Storage instances
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { Import } from "lucide-react";
import { Root } from "react-dom/client";
import { RootState } from "./store";

export interface ImageType {
  url: string;
  timeframe: string;
  description: string;
}

export interface TradeDetails {
  openDate: string;
  closeDate: string;
  symbol: string;
  side: string;
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  status: string;
  tradeId: string;
}

export interface Trade {
  tradeId?: string;
  trade: TradeDetails;
  images: ImageType[];
  psychology: {
    isGreedy: boolean;
    isFomo: boolean;
    isRevenge: boolean;
    emotionalState: string;
    notes: string;
  };
  analysis: {
    riskRewardRatio: number;
    setupType: string;
    mistakes: string[];
  };
  metrics: {
    riskPerTrade: number;
    stopLossDeviation: number;
    targetDeviation: number;
    marketConditions: string;
    tradingSession: string;
  };
}

interface TradesState {
  trades: Trade[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
const initialTradeState: Trade = {
  tradeId: "",
  trade: {
    openDate: "",
    closeDate: "",
    symbol: "",
    side: "",
    entry: 0,
    exit: 0,
    qty: 0,
    pnl: 0,
    status: "",
    tradeId: "",
  },
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
};

const initialState: TradesState = {
  trades: [],
  status: "idle",
  error: null,
};
let unsubscribe: (() => void) | null = null; // Store the unsubscribe function

export const subscribeToTrades = createAsyncThunk(
  "trades/subscribeToTrades",
  async (
    filters: { startDate?: string; endDate?: string; symbol?: string },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.Auth.user?.uid; // Ensure user is authenticated

      if (!userId) {
        return rejectWithValue("User is not authenticated");
      }

      // Cancel existing subscription if any
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      let tradesQuery = query(collection(db, `users/${userId}/trades`));

      // Apply optional filters (example: date range, symbol)
      // if (filters.startDate) {
      //   tradesQuery = query(
      //     tradesQuery,
      //     where("openTime", ">=", filters.startDate)
      //   );
      // }
      // if (filters.endDate) {
      //   tradesQuery = query(
      //     tradesQuery,
      //     where("openTime", "<=", filters.endDate)
      //   );
      // }
      // if (filters.symbol) {
      //   tradesQuery = query(tradesQuery, where("symbol", "==", filters.symbol));
      // }

      // Subscribe to real-time updates
      unsubscribe = onSnapshot(
        tradesQuery,
        (snapshot) => {
          const trades: Trade[] = [];
          snapshot.forEach((doc) => {
            let a = doc.data();
            trades.push({ tradeId: doc.id, ...a } as Trade);
          });

          console.log("Trades:", trades);
          dispatch(
            tradesSlice.actions.setTrades(
              trades.filter((item): item is Trade => item !== undefined) // Filter out undefined trades
            )
          ); // Update Redux store
        },
        (error) => {
          console.error("Error fetching trades:", error);
          return rejectWithValue(error.message);
        }
      );
      return unsubscribe;
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
      const tradesCollection = collection(db, "trades");

      if (Array.isArray(trades)) {
        // Batch insert for multiple trades
        const batch = writeBatch(db);
        trades.forEach((tradeDetail: TradeDetails) => {
          // Ensure type is TradeDetails
          if (tradeDetail === undefined) {
            throw new Error("trade is undefined");
          }
          // if (!trade.tradeId) // tradeId is in TradeDetails now
          //   throw new Error("tradeId is required for each trade");
          const tradeDocRef = doc(
            db,
            `users/${userId}/trades`,
            tradeDetail.tradeId
          );
          batch.set(tradeDocRef, {
            tradeId: tradeDetail.tradeId,
            trade: tradeDetail,
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
          } as Trade);
        });
        await batch.commit();

        // Transform TradeDetails[] to Trade[]
        const newTrades: Trade[] = trades.map((tradeDetail) => ({
          tradeId: tradeDetail.tradeId,
          trade: tradeDetail,
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

        return newTrades;
      }
    } catch (error: any) {
      return;
    }
  }
);

export const updateTradeInFirestore = createAsyncThunk(
  "trades/updateTradeInFirestore",
  async (trade: Trade, { rejectWithValue, getState }) => {
    if (!trade.tradeId) {
      return rejectWithValue(
        "Trade ID is required to update the trade in Firestore."
      );
    }
    try {
      const state = getState() as RootState;
      const userId = state.Auth.user?.uid;
      // First, delete any old images that are no longer in the trade's image list
      // const tradeDoc = doc(db, "trades", trade.tradeId);
      const tradeDocRef = doc(db, `users/${userId}/trades`, trade.tradeId);

      //Update firestore
      await updateDoc(tradeDocRef, trade as any);
      return trade; // Return the updated trade for local state update
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
    if (!userId) throw new Error("User is not authenticated");
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
    addTrade: (state, action: PayloadAction<Trade>) => {
      state.trades.push(action.payload);
    },
    ImportTrades: (state, action: PayloadAction<Trade[]>) => {
      state.trades = state.trades.concat(action.payload);
    },
    updateTrade: (state, action: PayloadAction<Trade>) => {},
    deleteTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(
        (trade) => trade.tradeId !== action.payload
      );
    },
    setCsvData: (state, action: PayloadAction<Trade[]>) => {
      state.trades = action.payload;
      state.status = "succeeded";
    },
    setTrades: (state, action: PayloadAction<Trade[]>) => {
      state.trades = action.payload;
    },
    addImage: (
      state,
      action: PayloadAction<{ tradeId: string; image: ImageType }>
    ) => {},
  },
  extraReducers: (builder) => {
    builder
      // REMOVED: No longer update local state here; rely on Firestore listener
      // .addCase(addTradeToFirestore.fulfilled, (state, action) => {
      //   if (action.payload) {
      //     state.trades.push(...action.payload); // Push the transformed Trade objects
      //   }
      // })
      .addCase(
        updateTradeInFirestore.fulfilled,
        (state: any, action: PayloadAction<Trade>) => {
          if (action.payload) {
            const index = state.trades.findIndex(
              (trade: any) => trade.tradeId === action.payload.tradeId
            );
            if (index !== -1) {
              state.trades[index] = action.payload;
            }
          }
        }
      )
      .addCase(
        deleteTradeFromFirestore.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.trades = state.trades.filter(
            (trade) => trade.tradeId !== action.payload
          );
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
          state.error = null;
        }
      )
      .addMatcher(
        (action: any) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.status = "failed";
          state.error = action.payload || "An unknown error occurred";
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
          state.error = null;
        }
      );
  },
});
