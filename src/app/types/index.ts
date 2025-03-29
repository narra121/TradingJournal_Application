export interface User {
  email: string | null;
  uid: string | null;
  name: string | null;
  photoURL: string | null;
  // Add other user properties as needed (displayName, photoURL, etc.)
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

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

export interface TradesState {
  trades: Trade[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface UIState {
  selectedItem: TradeDetails | null;
  isDetailsOpen: boolean;
  isEditOpen: boolean;
}
