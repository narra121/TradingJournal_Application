import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getStats } from '@/lib/api/stats'
import { RootState } from './store'
import type { ApiStats } from './types'

interface StatsState {
  data: ApiStats | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  lastFetched: number | null
}

const initialState: StatsState = { data: null, status: 'idle', error: null, lastFetched: null }

export const fetchStats = createAsyncThunk('stats/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState
    const token = state.AwsAuth.idToken
    if (!token) throw new Error('Not authenticated')
    return await getStats(token)
  } catch (e: any) { return rejectWithValue(e.message || 'Failed to fetch stats') }
})

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: { clear: (s) => Object.assign(s, initialState) },
  extraReducers: (b) => {
    b.addCase(fetchStats.pending, s => { s.status='loading'; s.error=null })
     .addCase(fetchStats.fulfilled, (s,a: PayloadAction<ApiStats>) => { s.status='succeeded'; s.data=a.payload; s.lastFetched=Date.now() })
     .addCase(fetchStats.rejected, (s,a) => { s.status='failed'; s.error=a.payload as string })
  }
})

export const { clear } = statsSlice.actions
export default statsSlice.reducer
export const selectStats = (state: RootState) => state.Stats.data
export const selectStatsStatus = (state: RootState) => state.Stats.status
