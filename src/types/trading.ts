export interface TradingMetrics {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  averageHoldingTime: number;
}

export interface AggregatedTradeData {
  period: string;
  trades: number;
  winRate: number;
  profit: number;
  volume: number;
  symbols: string[];
}

export interface TradeData {
  ticket: string;
  opening_time_utc: string;
  closing_time_utc: string;
  type: string;
  lots: string;
  original_position_size: string;
  symbol: string;
  opening_price: string;
  closing_price: string;
  stop_loss: string;
  take_profit: string;
  commission_usd: string;
  swap_usd: string;
  profit_usd: string;
  equity_usd: string;
  margin_level: string;
  close_reason: string;
}

// Add other type definitions here as needed
