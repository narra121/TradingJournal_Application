// AWS API Trade & Auth Types generated from JSON Schemas in /schemas
// Do not import Firebase types here. This is the canonical target model.

export type TradeSide = 'BUY' | 'SELL'
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PARTIAL' | 'CANCELLED' | 'TP' | 'SL' | 'BE'
export type TradeGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface ApiPsychologyFlags {
  greed?: boolean
  fear?: boolean
  fomo?: boolean
  revenge?: boolean
  overconfidence?: boolean
  patience?: boolean
}

export interface ApiTradeImageBase {
  id?: string
  url?: string
  timeframe?: string | null
  description?: string | null
}
 
// When sending create/update we optionally include base64Data
export interface ApiTradeImageCreate extends ApiTradeImageBase {
  base64Data?: string // data:image/... prefix
}

export interface ApiTradeBaseFields {
  symbol: string
  side: TradeSide
  quantity: number
  openDate: string // YYYY-MM-DD
  closeDate?: string | null
  entryPrice?: number | null
  exitPrice?: number | null
  stopLoss?: number | null
  takeProfit?: number | null
  commission?: number | null
  fees?: number | null
  riskAmount?: number | null
  riskRewardRatio?: number | null
  achievedRiskRewardRatio?: number | null
  setupType?: string | null
  timeframe?: string | null
  marketCondition?: string | null
  tradingSession?: string | null
  tradeGrade?: TradeGrade | null
  confidence?: number | null
  setupQuality?: number | null
  execution?: number | null
  emotionalState?: string | null
  psychology?: ApiPsychologyFlags
  preTradeNotes?: string | null
  postTradeNotes?: string | null
  mistakes?: string[]
  lessons?: string[]
  newsEvents?: string[]
  economicEvents?: string[]
  status?: TradeStatus | null
  tags?: string[]
  images?: ApiTradeImageCreate[]
}

export interface ApiTradeCreate extends ApiTradeBaseFields {}
export interface ApiTradeUpdate extends Partial<ApiTradeBaseFields> {}

// Full trade returned by API (includes server derived fields)
export interface ApiTrade extends ApiTradeBaseFields {
  userId: string
  tradeId: string
  pnl?: number | null
  netPnl?: number | null
  realizedPartialPnl?: number | null
  remainingQuantity?: number | null
  createdAt?: string
  updatedAt?: string
  partialCloses?: ApiPartialClose[]
  images?: ApiTradeImage[]
  status: TradeStatus // server always sets
}

export interface ApiPartialClose {
  id: string
  quantity: number
  price: number
  date: string // ISO datetime
  realizedPnl?: number
}

export interface ApiTradeImage extends ApiTradeImageBase {
  id: string
  url: string
}

// Stats object (GET /v1/stats)
export interface ApiStats {
  userId: string
  tradeCount: number
  realizedPnL: number
  wins: number
  losses: number
  bestWin: number
  worstLoss: number
  sumWinPnL: number
  sumLossPnL: number
  lastUpdated: string
  winRate: number
  avgWin: number
  avgLoss: number
  expectancy: number
}

// Auth token response (login)
export interface AuthLoginResponse {
  IdToken: string
  AccessToken: string
  RefreshToken: string
  ExpiresIn: number
  TokenType: string
}

// Minimal decoded Id token subset we rely on
export interface IdTokenClaims {
  sub: string
  email?: string
  exp?: number
  iat?: number
  [k: string]: unknown
}

// Legacy to AWS mapping helper (non-runtime dependency on firebase types avoided by using 'any')
export function mapLegacyTradeToApiPartial(legacy: any): Partial<ApiTrade> {
  if (!legacy) return {}
  const trade = legacy.trade || {}
  return {
    tradeId: trade.tradeId,
    symbol: trade.symbol,
    side: trade.side,
    openDate: trade.openDate,
    closeDate: trade.closeDate || null,
    entryPrice: trade.entry,
    exitPrice: trade.exit ?? null,
    quantity: trade.qty,
    pnl: trade.pnl,
    status: trade.status,
    images: (legacy.images || []).map((i: any) => ({
      id: i.id,
      url: i.url,
      timeframe: i.timeframe ?? null,
      description: i.description ?? null,
    })),
    psychology: {
      greed: legacy.psychology?.isGreedy || false,
      fomo: legacy.psychology?.isFomo || false,
      revenge: legacy.psychology?.isRevenge || false,
      fear: false,
      overconfidence: false,
      patience: false,
    },
    emotionalState: legacy.psychology?.emotionalState,
    postTradeNotes: legacy.psychology?.notes,
    riskRewardRatio: legacy.analysis?.riskRewardRatio ?? null,
    setupType: legacy.analysis?.setupType ?? null,
    mistakes: legacy.analysis?.mistakes ?? [],
    marketCondition: legacy.metrics?.marketConditions ?? null,
    tradingSession: legacy.metrics?.tradingSession ?? null,
    riskAmount: legacy.metrics?.riskPerTrade ?? null,
  }
}

export function isApiTrade(value: any): value is ApiTrade {
  return !!value && typeof value === 'object' && typeof value.tradeId === 'string' && typeof value.symbol === 'string'
}
