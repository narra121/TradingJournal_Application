import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type { ApiTrade, ApiTradeCreate, ApiTradeUpdate } from '@/app/types/trade-aws'

export interface ListTradesParams {
  symbol?: string
  status?: string
  startDate?: string
  endDate?: string
  tag?: string
  page?: number
  pageSize?: number
}

export interface ListTradesResponse {
  items: ApiTrade[]
  total?: number
  nextCursor?: string
}

export interface BulkCreateResponse {
  data: {
    created: number
    skipped: Array<{ index: number; tradeId?: string; reason: string }>
    errors: Array<{ index: number; tradeId?: string; code?: string; message: string }>
    items: ApiTrade[]
  }
  error: null | { code?: string; message: string }
  meta: any
}

export interface BulkDeleteResponse {
  deletedRequested: number
  errors: Array<{ tradeId: string; message: string; code?: string }>
}

export const createTrade = (payload: ApiTradeCreate, token: string) => apiPost<ApiTrade>('/trades', payload, { authToken: token })
export const createTradesBulk = (items: ApiTradeCreate[], token: string) => apiPost<BulkCreateResponse>('/trades', { items }, { authToken: token })
export const bulkDeleteTrades = (tradeIds: string[], token: string) => apiPost<BulkDeleteResponse>('/trades/bulk-delete', { tradeIds }, { authToken: token })
export const getTrade = (id: string, token: string) => apiGet<ApiTrade>(`/trades/${id}`, { authToken: token })
export const updateTrade = (id: string, payload: ApiTradeUpdate, token: string) => apiPut<ApiTrade>(`/trades/${id}`, payload, { authToken: token })
export const deleteTrade = (id: string, token: string) => apiDelete<void>(`/trades/${id}`, { authToken: token })
export const listTrades = (params: ListTradesParams, token: string) => apiGet<ListTradesResponse>('/trades', { authToken: token, query: params })

// Extract trades from an image (base64). Endpoint: POST /trades/extract (base URL already includes /v1)
export interface ExtractTradesResponseEnvelope {
  data: { items: Array<Partial<ApiTrade>> }
  meta?: { elapsedMs?: number; parseSteps?: string[] }
  error: null | { code: string; message: string }
}

export const extractTradesFromImage = (imageBase64: string, token?: string) =>
  apiPost<ExtractTradesResponseEnvelope>('/trades/extract', { imageBase64 }, { authToken: token })