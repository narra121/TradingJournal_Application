import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ApiTrade, ApiTradeCreate, ApiTradeUpdate, ApiPartialClose } from './types'
import { createTrade as apiCreateTrade, updateTrade as apiUpdateTrade, deleteTrade as apiDeleteTrade, listTrades as apiListTrades, extractTradesFromImage, createTradesBulk as apiCreateTradesBulk, bulkDeleteTrades } from '@/lib/api/trades'
import { RootState } from './store'
import { v4 as uuidv4 } from 'uuid'

interface AwsTradesState {
  items: ApiTrade[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  lastFetched: number | null
  optimistic: Record<string, ApiTrade | null>
  extract: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
    lastElapsedMs?: number
    lastParseSteps?: string[]
  }
}

const initialState: AwsTradesState = { items: [], status: 'idle', error: null, lastFetched: null, optimistic: {}, extract: { status: 'idle', error: null } }

// Helper: round all numeric fields we care about to two decimals (quantity, prices, fees, metrics, scores)
function roundTwo(n: any): number | null | undefined {
  if (n === null || n === undefined || n === '') return n;
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100) / 100;
}
function normalizeCreate(body: ApiTradeCreate): ApiTradeCreate {
  return {
    ...body,
    quantity: roundTwo(body.quantity) as number, // required field
    entryPrice: roundTwo(body.entryPrice),
    exitPrice: roundTwo(body.exitPrice),
    stopLoss: roundTwo(body.stopLoss),
    takeProfit: roundTwo(body.takeProfit),
    commission: roundTwo(body.commission),
    fees: roundTwo(body.fees),
    riskAmount: roundTwo(body.riskAmount),
    confidence: roundTwo(body.confidence),
    setupQuality: roundTwo(body.setupQuality),
    execution: roundTwo(body.execution),
  }
}

export const listTrades = createAsyncThunk('awsTrades/list', async (params: { symbol?: string; status?: string; startDate?: string; endDate?: string } | undefined, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    const data = await apiListTrades(params || {}, token)
    return data.items
  } catch (e: any) { return rejectWithValue(e.message || 'List failed') }
})

export const createTrade = createAsyncThunk('awsTrades/create', async (body: ApiTradeCreate, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    const normalized = normalizeCreate(body)
  const trade = await apiCreateTrade({ ...normalized, clientRequestId: uuidv4(), idempotencyKey: (body as any).idempotencyKey || uuidv4() } as any, token)
    return trade
  } catch (e: any) { return rejectWithValue(e.message || 'Create failed') }
})

export const createTradesBulk = createAsyncThunk('awsTrades/createBulk', async (items: ApiTradeCreate[], { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    const payload = items.map(i => {
      const normalized = normalizeCreate(i)
      return { ...normalized, clientRequestId: uuidv4(), idempotencyKey: (i as any).idempotencyKey || uuidv4() }
    }) as any
  const res: any = await apiCreateTradesBulk(payload, token)
  return res // full envelope { data:{ created, skipped, errors, items[] }, error, meta }
  } catch (e:any) { return rejectWithValue(e.message || 'Bulk create failed') }
})

export const updateTrade = createAsyncThunk('awsTrades/update', async ({ tradeId, changes }: { tradeId: string; changes: ApiTradeUpdate }, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    const trade = await apiUpdateTrade(tradeId, changes, token)
    return trade
  } catch (e: any) { return rejectWithValue(e.message || 'Update failed') }
})

export const deleteTrade = createAsyncThunk('awsTrades/delete', async (tradeId: string, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    await apiDeleteTrade(tradeId, token)
    return tradeId
  } catch (e: any) { return rejectWithValue(e.message || 'Delete failed') }
})

export const bulkDelete = createAsyncThunk('awsTrades/bulkDelete', async (tradeIds: string[], { getState, rejectWithValue }) => {
  try {
    if(tradeIds.length>50) throw new Error('Max 50 tradeIds per call')
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    const res = await bulkDeleteTrades(tradeIds, token)
    return res
  } catch(e:any) { return rejectWithValue(e.message || 'Bulk delete failed') }
})

export const extractTrades = createAsyncThunk('awsTrades/extract', async (imageBase64: string, { getState, rejectWithValue }) => {
  try {
  const state = getState() as RootState
  const token = state.AwsAuth.idToken
  if (!token) throw new Error('Not authenticated')
  const res = await extractTradesFromImage(imageBase64, token)
    return res
  } catch (e: any) { return rejectWithValue(e.message || 'Extract failed') }
})

const awsTradesSlice = createSlice({
  name: 'awsTrades',
  initialState,
  reducers: {
    upsertLocal(state, action: PayloadAction<ApiTrade>) {
      const idx = state.items.findIndex(t => t.tradeId === action.payload.tradeId)
      if (idx === -1) {
        state.items.push(action.payload)
      } else {
        state.items[idx] = action.payload
      }
    },
    addPartialCloseLocal(state, action: PayloadAction<{ tradeId: string; close: ApiPartialClose }>) {
      const t = state.items.find(tr => tr.tradeId === action.payload.tradeId)
      if (!t) return
      if (!t.partialCloses) t.partialCloses = []
      t.partialCloses.push(action.payload.close)
      // naive realized pnl aggregation if price & quantity present
      if (t.entryPrice && action.payload.close.price && action.payload.close.quantity) {
        const diff = (action.payload.close.price - t.entryPrice) * (t.side === 'SELL' ? -1 : 1)
        const realized = diff * action.payload.close.quantity
        t.realizedPartialPnl = (t.realizedPartialPnl || 0) + realized
        t.remainingQuantity = (t.remainingQuantity ?? t.quantity) - action.payload.close.quantity
      }
    },
    removePartialCloseLocal(state, action: PayloadAction<{ tradeId: string; closeId: string }>) {
      const t = state.items.find(tr => tr.tradeId === action.payload.tradeId)
      if (!t || !t.partialCloses) return
      const idx = t.partialCloses.findIndex(c => c.id === action.payload.closeId)
      if (idx !== -1) {
        const removed = t.partialCloses[idx]
        t.partialCloses.splice(idx,1)
        if (removed && t.entryPrice && removed.price && removed.quantity) {
          const diff = (removed.price - t.entryPrice) * (t.side === 'SELL' ? -1 : 1)
          const realized = diff * removed.quantity
          t.realizedPartialPnl = (t.realizedPartialPnl || 0) - realized
          t.remainingQuantity = (t.remainingQuantity ?? t.quantity) + removed.quantity
        }
      }
    },
    clear(state) { Object.assign(state, initialState) },
    startOptimisticUpdate(state, action: PayloadAction<{ tradeId: string; changes: Partial<ApiTrade> }>) {
      const { tradeId, changes } = action.payload
      const idx = state.items.findIndex(t => t.tradeId === tradeId)
      if (idx === -1) return
      state.optimistic[tradeId] = { ...state.items[idx] }
      state.items[idx] = { ...state.items[idx], ...changes }
    },
    rollbackOptimistic(state, action: PayloadAction<{ tradeId: string }>) {
      const snap = state.optimistic[action.payload.tradeId]
      if (snap) {
        const idx = state.items.findIndex(t=>t.tradeId===action.payload.tradeId)
        if (idx !== -1) state.items[idx] = snap
      }
      delete state.optimistic[action.payload.tradeId]
    }
  },
  extraReducers: builder => {
    builder
      .addCase(listTrades.pending, s => { s.status = 'loading'; s.error = null })
      .addCase(listTrades.fulfilled, (s,a) => { s.status='succeeded'; s.items = a.payload; s.lastFetched = Date.now() })
      .addCase(listTrades.rejected, (s,a) => { s.status='failed'; s.error = a.payload as string })
      .addCase(createTrade.fulfilled, (s,a) => { s.items.push(a.payload) })
  .addCase(createTradesBulk.fulfilled, (s,a: any) => {
    const items: ApiTrade[] = a.payload?.data?.items || []
    items.forEach(t=> { s.items.push(t) })
  })
      .addCase(updateTrade.fulfilled, (s,a) => { const i=s.items.findIndex(t=>t.tradeId===a.payload.tradeId); if(i!==-1) s.items[i]=a.payload; delete s.optimistic[a.payload.tradeId] })
      .addCase(deleteTrade.fulfilled, (s,a) => { s.items = s.items.filter(t=>t.tradeId!==a.payload) })
  .addCase(bulkDelete.fulfilled, (s,a:any) => { const failed = new Set((a.payload?.errors||[]).map((e:any)=> e.tradeId)); s.items = s.items.filter(t=> failed.has(t.tradeId) || !a.meta?.arg?.includes?.(t.tradeId) ) })
      .addCase(extractTrades.pending, s=> { s.extract.status='loading'; s.extract.error=null })
      .addCase(extractTrades.fulfilled, (s,a:any)=> {
        s.extract.status='succeeded'
        s.extract.lastElapsedMs = a.payload.meta?.elapsedMs
        s.extract.lastParseSteps = a.payload.meta?.parseSteps
        // Do not auto-merge into live items; caller decides. Optionally could stage.
      })
      .addCase(extractTrades.rejected, (s,a:any)=> { s.extract.status='failed'; s.extract.error=a.payload as string })
      .addCase(updateTrade.rejected, (s,a: any) => {
        const tradeId = a.meta?.arg?.tradeId
        if (tradeId) {
          const snap = s.optimistic[tradeId]
            if (snap) {
              const idx = s.items.findIndex(t=>t.tradeId===tradeId)
              if (idx!==-1) s.items[idx] = snap
              delete s.optimistic[tradeId]
            }
        }
      })
  }
})

export const { upsertLocal, clear, startOptimisticUpdate, rollbackOptimistic } = awsTradesSlice.actions
export default awsTradesSlice.reducer

export const selectAwsTrades = (state: RootState) => state.AwsTrades.items
export const selectAwsTradesStatus = (state: RootState) => state.AwsTrades.status
export const selectAwsTradesError = (state: RootState) => state.AwsTrades.error
