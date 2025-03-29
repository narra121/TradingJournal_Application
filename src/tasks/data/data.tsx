// import {
//   ArrowDown,
//   ArrowRight,
//   ArrowUp,
//   CheckCircle,
//   Circle,
//   CircleOff,
//   HelpCircle,
//   Timer,
// } from "lucide-react"

// export const labels = [
//   {
//     value: "bug",
//     label: "Bug",
//   },
//   {
//     value: "feature",
//     label: "Feature",
//   },
//   {
//     value: "documentation",
//     label: "Documentation",
//   },
// ]

// export const statuses = [
//   {
//     value: "backlog",
//     label: "Backlog",
//     icon: HelpCircle,
//   },
//   {
//     value: "todo",
//     label: "Todo",
//     icon: Circle,
//   },
//   {
//     value: "in progress",
//     label: "In Progress",
//     icon: Timer,
//   },
//   {
//     value: "done",
//     label: "Done",
//     icon: CheckCircle,
//   },
//   {
//     value: "canceled",
//     label: "Canceled",
//     icon: CircleOff,
//   },
// ]

// export const priorities = [
//   {
//     label: "Low",
//     value: "low",
//     icon: ArrowDown,
//   },
//   {
//     label: "Medium",
//     value: "medium",
//     icon: ArrowRight,
//   },
//   {
//     label: "High",
//     value: "high",
//     icon: ArrowUp,
//   },
// ]
// ../data/data.ts
import {
  LucideIcon,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  ArrowBigUpIcon,
  ArrowBigDown,
  DollarSign,
  Calendar,
  Tag,
  Hash,
} from "lucide-react";
import { createSelector } from "reselect";
import { RootState } from "@/app/store";
import { TradeDetails } from "@/app/types";

interface FilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

// Status filter options
export const statuses: FilterOption[] = [
  { value: "tp", label: "TP", icon: CheckCircle },
  { value: "sl", label: "SL", icon: XCircle },
];

// Side filter options
export const sides: FilterOption[] = [
  { value: "buy", label: "Buy", icon: ArrowBigUpIcon },
  { value: "sell", label: "Sell", icon: ArrowBigDown },
];

// PnL status filter options
export const pnlStatuses: FilterOption[] = [
  { value: "positive", label: "Profit", icon: TrendingUp },
  { value: "negative", label: "Loss", icon: TrendingDown },
  { value: "neutral", label: "Neutral", icon: MinusCircle }, // For PnL = 0
];

// Symbol filter options - will be populated from Redux store
export const symbolsSelector = createSelector(
  [(state: RootState) => state.TradeData.trades],
  (trades) => {
    const symbols = new Set<string>();
    trades.forEach((trade) => {
      if (trade.trade?.symbol) {
        symbols.add(trade.trade.symbol.toUpperCase());
      }
    });
    return Array.from(symbols).map((symbol) => ({
      value: symbol.toLowerCase(),
      label: symbol.toUpperCase(),
      icon: Tag,
    }));
  }
);

// Quantity filter options - will be populated from Redux store
export const quantitiesSelector = createSelector(
  [(state: RootState) => state.TradeData.trades],
  (trades) => {
    const quantities = new Set<number>();
    trades.forEach((trade) => {
      if (trade.trade?.qty) {
        quantities.add(Number(trade.trade.qty));
      }
    });
    return Array.from(quantities)
      .sort((a, b) => a - b)
      .map((qty) => ({
        value: qty.toString(),
        label: `${qty} Lots`,
        icon: Hash,
      }));
  }
);

// PnL range filter options - will be populated from Redux store
export const pnlRangesSelector = createSelector(
  [(state: RootState) => state.TradeData.trades],
  (trades) => {
    const pnls = trades
      .map((trade) => Number(trade.trade?.pnl || 0))
      .filter((pnl) => !isNaN(pnl));

    if (pnls.length === 0) return [];

    const minPnl = Math.min(...pnls);
    const maxPnl = Math.max(...pnls);

    // Create ranges based on min and max PnL
    const ranges = [];

    // Negative ranges
    if (minPnl < 0) {
      ranges.push({
        value: `${minPnl},0`,
        label: `$${minPnl.toFixed(2)} to $0`,
        icon: DollarSign,
      });
    }

    // Positive ranges
    if (maxPnl > 0) {
      ranges.push({
        value: `0,${maxPnl}`,
        label: `$0 to $${maxPnl.toFixed(2)}`,
        icon: DollarSign,
      });
    }

    return ranges;
  }
);

// Strategy labels
export const labels: FilterOption[] = [
  { value: "strategy1", label: "Strategy 1" },
  { value: "strategy2", label: "Strategy 2" },
  { value: "manual", label: "Manual Trade" },
];
