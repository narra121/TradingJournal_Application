import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store'
import { ApiTrade } from './types'

// We assume S3 presigned URLs expire in ~15 minutes (900s). We'll refresh if older than 12 minutes to give buffer.
const EXPIRY_MS = 12 * 60 * 1000

export interface CachedTradeImages {
  tradeId: string
  images: { id: string; url: string; timeframe?: string | null; description?: string | null }[]
  fetchedAt: number
}

interface ImageUrlState {
  cache: Record<string, CachedTradeImages>
  status: 'idle' | 'refreshing'
  error: string | null
}

const initialState: ImageUrlState = { cache: {}, status: 'idle', error: null }

export const refreshTradeImages = createAsyncThunk('imageUrls/refresh', async (tradeId: string, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if(!token) throw new Error('Not authenticated')
    // Reuse existing getTrade endpoint via fetch since we don't have a dedicated thunk
    const res = await fetch(`${(state as any).AwsAuth?.apiBase || ''}/trades/${tradeId}`, { headers: { Authorization: `Bearer ${token}` } })
    if(!res.ok) throw new Error(`HTTP ${res.status}`)
    const trade: ApiTrade = await res.json()
    return { tradeId, images: (trade.images||[]).map(i=> ({ id: i.id, url: i.url, timeframe: i.timeframe||null, description: i.description||null })) }
  } catch(e:any) { return rejectWithValue(e.message || 'Refresh failed') }
})

const imageUrlSlice = createSlice({
  name: 'imageUrls',
  initialState,
  reducers: {
    upsertFromTrade(state, action: PayloadAction<{ tradeId: string; images: CachedTradeImages['images'] }>) {
      state.cache[action.payload.tradeId] = { tradeId: action.payload.tradeId, images: action.payload.images, fetchedAt: Date.now() }
    }
  },
  extraReducers: builder => {
    builder.addCase(refreshTradeImages.pending, (s)=> { s.status='refreshing'; s.error=null })
    builder.addCase(refreshTradeImages.fulfilled, (s,a:any)=> { s.status='idle'; s.cache[a.payload.tradeId] = { tradeId: a.payload.tradeId, images: a.payload.images, fetchedAt: Date.now() } })
    builder.addCase(refreshTradeImages.rejected, (s,a:any)=> { s.status='idle'; s.error=a.payload as string })
  }
})

export const { upsertFromTrade } = imageUrlSlice.actions
export default imageUrlSlice.reducer

export const selectCachedImages = (state: RootState, tradeId: string) => state.ImageUrls.cache[tradeId]
export const isImageCacheFresh = (state: RootState, tradeId: string) => {
  const c = state.ImageUrls.cache[tradeId];
  if(!c) return false; return Date.now() - c.fetchedAt < EXPIRY_MS;
}
