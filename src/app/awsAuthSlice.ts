import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthLoginResponse, IdTokenClaims } from './types'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/config'

interface AwsAuthState {
  idToken: string | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null // epoch seconds
  user: { sub: string; email?: string } | null
  loading: boolean
  error: string | null
  refreshScheduled?: boolean
  bootstrapped: boolean
}

const initialState: AwsAuthState = {
  idToken: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
  loading: false,
  error: null,
  refreshScheduled: false,
  bootstrapped: false,
}

function decodeJwt(token: string): IdTokenClaims | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  if (!API_BASE_URL) throw new Error('API_BASE_URL not configured')
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`)
  return data as T
}

export const awsLogin = createAsyncThunk(
  'awsAuth/login',
  async (payload: { email: string; password: string }) => {
    const data = await apiPost<AuthLoginResponse>('/auth/login', payload)
    return data
  }
)

export const awsRefresh = createAsyncThunk(
  'awsAuth/refresh',
  async (payload: { refreshToken: string }) => {
    const data = await apiPost<Omit<AuthLoginResponse, 'RefreshToken'>>('/auth/refresh', payload)
    return data
  }
)

// Schedule automatic refresh (simple singleton timer in module scope)
let expiryWarningTimer: number | null = null
let logoutTimer: number | null = null

// Show a toast when entering the buffer window, then auto logout at real expiry.
function scheduleExpiryFlow(dispatch: any, state: AwsAuthState, bufferSeconds = 60) {
  if (!state.expiresAt) return
  const nowSec = Math.floor(Date.now()/1000)
  const secondsUntilExpiry = state.expiresAt - nowSec
  if (expiryWarningTimer) { window.clearTimeout(expiryWarningTimer); expiryWarningTimer = null }
  if (logoutTimer) { window.clearTimeout(logoutTimer); logoutTimer = null }
  if (secondsUntilExpiry <= 0) {
  // Defer dispatch to avoid nested dispatch inside reducer execution
  setTimeout(() => dispatch(awsLogout()), 0)
    return
  }
  const warnDelay = secondsUntilExpiry - bufferSeconds
  if (warnDelay <= 0) {
    // Already inside buffer – show immediately
    toast.warning(`Session expires in ${secondsUntilExpiry}s`, { id: 'session-expiry' })
  } else {
    expiryWarningTimer = window.setTimeout(() => {
      toast.warning(`Session will expire in ${bufferSeconds}s`, { id: 'session-expiry' })
    }, warnDelay * 1000)
  }
  logoutTimer = window.setTimeout(() => {
    toast.error('Session expired – logging out', { id: 'session-expiry' })
  // Defer to ensure we're outside any reducer call stack
  setTimeout(() => dispatch(awsLogout()), 0)
  }, secondsUntilExpiry * 1000)
}

const awsAuthSlice = createSlice({
  name: 'awsAuth',
  initialState,
  reducers: {
    awsLogout(state) {
      Object.assign(state, initialState)
      localStorage.removeItem('tj.idToken')
      localStorage.removeItem('tj.refreshToken')
      localStorage.removeItem('tj.expiresAt')
    },
  bootstrapFromStorage(state) {
      const idToken = localStorage.getItem('tj.idToken')
      const refreshToken = localStorage.getItem('tj.refreshToken')
      const expiresAtStr = localStorage.getItem('tj.expiresAt')
      if (!idToken || !refreshToken || !expiresAtStr) { state.bootstrapped = true; return }
      const claims = decodeJwt(idToken)
      state.idToken = idToken
      state.refreshToken = refreshToken
      state.accessToken = null
      state.expiresAt = Number(expiresAtStr)
      if (claims?.sub) state.user = { sub: claims.sub, email: claims.email as string | undefined }
      state.bootstrapped = true
      // Schedule (or immediate) refresh using global store dispatcher if available
  scheduleExpiryFlow((action: any) => (action?.type ? (globalThis as any).store?.dispatch(action) : undefined), state)
    },
  markBootstrapped(state) { state.bootstrapped = true },
  markRefreshScheduled(state) { state.refreshScheduled = true },
  },
  extraReducers: (builder) => {
    builder
      .addCase(awsLogin.pending, (s) => { s.loading = true; s.error = null })
      .addCase(awsLogin.fulfilled, (s, a: PayloadAction<AuthLoginResponse>) => {
        s.loading = false
        s.idToken = a.payload.IdToken
        s.accessToken = a.payload.AccessToken
        s.refreshToken = a.payload.RefreshToken
        s.expiresAt = Math.floor(Date.now()/1000) + a.payload.ExpiresIn
  const claims = decodeJwt(a.payload.IdToken)
        if (claims?.sub) s.user = { sub: claims.sub, email: claims.email as string | undefined }
        localStorage.setItem('tj.idToken', s.idToken!)
        localStorage.setItem('tj.refreshToken', s.refreshToken!)
        localStorage.setItem('tj.expiresAt', String(s.expiresAt))
  s.refreshScheduled = false
  s.bootstrapped = true
  // schedule
  scheduleExpiryFlow((action: any) => (action.type ? (globalThis as any).store?.dispatch(action) : undefined), s)
      })
      .addCase(awsLogin.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Login failed' })
      .addCase(awsRefresh.fulfilled, (s, a) => {
        // refresh does not return new refresh token
        s.idToken = a.payload.IdToken
        s.accessToken = a.payload.AccessToken
        s.expiresAt = Math.floor(Date.now()/1000) + a.payload.ExpiresIn
  const claims = decodeJwt(a.payload.IdToken)
        if (claims?.sub) s.user = { sub: claims.sub, email: claims.email as string | undefined }
        localStorage.setItem('tj.idToken', s.idToken!)
        localStorage.setItem('tj.expiresAt', String(s.expiresAt))
  s.refreshScheduled = false
  scheduleExpiryFlow((action: any) => (action.type ? (globalThis as any).store?.dispatch(action) : undefined), s)
      })
  }
})

export const { awsLogout, bootstrapFromStorage, markRefreshScheduled, markBootstrapped } = awsAuthSlice.actions
export default awsAuthSlice.reducer
