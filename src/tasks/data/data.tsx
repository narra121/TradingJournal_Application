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
} from "lucide-react";

interface Status {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export const statuses: Status[] = [
  { value: "tp", label: "TP", icon: CheckCircle },
  { value: "sl", label: "SL", icon: XCircle },
];

interface Side {
  value: string;
  label: string;
  icon?: LucideIcon;
}
//New object for the sides
export const sides: Side[] = [
  { value: "buy", label: "Buy", icon: ArrowBigUpIcon },
  { value: "sell", label: "Sell", icon: ArrowBigDown },
];

interface Label {
  // Assuming you had labels in your original code, let's add a structure
  value: string;
  label: string;
}

export const labels: Label[] = [
  // Example Labels - Adjust to your needs
  { value: "strategy1", label: "Strategy 1" },
  { value: "strategy2", label: "Strategy 2" },
  { value: "manual", label: "Manual Trade" },
  // Add more labels as you have them
];
interface PnLStatus {
  value: "positive" | "negative" | "neutral";
  label: string;
  icon: LucideIcon;
}

export const pnlStatuses: PnLStatus[] = [
  { value: "positive", label: "Profit", icon: TrendingUp },
  { value: "negative", label: "Loss", icon: TrendingDown },
  { value: "neutral", label: "Neutral", icon: MinusCircle }, // For PnL = 0
];
