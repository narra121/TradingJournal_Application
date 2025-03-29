import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TradeDetails, UIState } from "../types";

const initialState: UIState = {
  selectedItem: {
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
  isDetailsOpen: false,
  isEditOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<TradeDetails | null>) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    setIsDetailsOpen: (state, action: PayloadAction<boolean>) => {
      state.isDetailsOpen = action.payload;
    },
    toggleDetailsOpen: (state) => {
      state.isDetailsOpen = !state.isDetailsOpen;
    },
    setIsEditOpen: (state, action: PayloadAction<boolean>) => {
      state.isEditOpen = action.payload;
    },
    toggleEditOpen: (state) => {
      state.isEditOpen = !state.isEditOpen;
    },
  },
});

export const {
  setSelectedItem,
  clearSelectedItem,
  setIsDetailsOpen,
  toggleDetailsOpen,
  setIsEditOpen,
  toggleEditOpen,
} = uiSlice.actions;

export default uiSlice.reducer;

// Example usage in a component:
// import { useDispatch, useSelector } from 'react-redux';
// import {
//     setSelectedItem,
//     setIsDetailsOpen,
//     setIsEditOpen,
//   } from './uiSlice'; // Adjust path as necessary
//
//  const MyComponent = () => {
//    const dispatch = useDispatch();
//    const selectedItem = useSelector((state: RootState) => state.ui.selectedItem); // You'll need a RootState type
//    const isDetailsOpen = useSelector((state: RootState) => state.ui.isDetailsOpen);
//    const isEditOpen = useSelector((state: RootState) => state.ui.isEditOpen);
//
//    const handleSelectTrade = (trade: TradeDetails) => {
//       dispatch(setSelectedItem(trade));
//       dispatch(setIsDetailsOpen(true));
//    };
//
//   //clear selection
//    const handleClearSelection = () => {
//         dispatch(setSelectedItem(null))
//    }
//
//  //open edit
//  const handleEditTrade= () => {
//        dispatch(setIsEditOpen(true))
//   }
//     // ... rest of your component ...
//   };

//You would also need to integrate this slice into your Redux store.  For example, in your store.ts (or similar):
// import { configureStore } from '@reduxjs/toolkit';
// import uiReducer from './uiSlice'; // Adjust path as necessary
//
// export const store = configureStore({
//  reducer: {
//     ui: uiReducer,
//    // ... other reducers ...
//   },
// });
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
