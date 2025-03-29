import { createSelector } from "@reduxjs/toolkit";
import { format, parseISO, isValid, startOfDay } from "date-fns"; // Import date-fns functions
import { RootState } from "./store";
import { Trade, TradeDetails } from "./traceSlice";

// Base selector for trades array
const selectAllTrades = (state: RootState) => state.TradeData.trades;

// Memoized selector for trades details (already exists, slightly modified for clarity)
export const selectTradeDetails = createSelector([selectAllTrades], (trades) =>
  trades
    .map((trade) => trade.trade)
    .filter((item): item is TradeDetails => item !== undefined)
);

// Memoized selector for UI state (Corrected structure)
export const selectUIState = createSelector(
  [(state: RootState) => state.UI],
  (ui) => ({
    isEditOpen: ui.isEditOpen,
    selectedItem: ui.selectedItem,
  })
);

// Selector factory to get options for a specific column
export const selectFacetedFilterOptions = () =>
  createSelector(
    [
      selectAllTrades, // Input selector 1: All trades
      (_state: RootState, columnId: keyof TradeDetails | undefined) => columnId, // Input selector 2: Column ID passed as argument
    ],
    (trades, columnId) => {
      if (!columnId || !trades) {
        return [];
      }

      const isDateColumn = columnId === "openDate" || columnId === "closeDate";
      const uniqueValues = new Set<string>();

      trades.forEach((trade: Trade) => {
        const rawValue = trade.trade[columnId];
        if (rawValue !== null && rawValue !== undefined) {
          if (isDateColumn) {
            // Format date part only for date columns
            let date = parseISO(String(rawValue));
            if (!isValid(date)) {
              date = new Date(String(rawValue)); // Fallback
            }
            if (isValid(date)) {
              uniqueValues.add(format(startOfDay(date), "yyyy-MM-dd")); // Store as YYYY-MM-DD for sorting/filtering
            }
          } else {
            uniqueValues.add(String(rawValue));
          }
        }
      });

      // Sort values (dates will sort correctly as YYYY-MM-DD)
      const sortedValues = Array.from(uniqueValues).sort();

      // Map to label/value, formatting date labels nicely
      return sortedValues.map((value) => {
        let label = value;
        if (isDateColumn) {
          // Format the date label for display
          const date = parseISO(value); // Value is YYYY-MM-DD
          if (isValid(date)) {
            label = format(date, "dd MMM yyyy");
          }
        }
        return {
          label: label,
          value: value, // Keep value as YYYY-MM-DD for dates
        };
      });
    }
  );
