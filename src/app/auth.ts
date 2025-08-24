import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store'
import { bootstrapFromStorage, awsRefresh, awsLogout, markRefreshScheduled } from './awsAuthSlice'

// Hook to bootstrap auth state from localStorage once on app start
export function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  useEffect(() => { dispatch(bootstrapFromStorage()) }, [dispatch])
}

// Hook to automatically refresh the Id/Access token before expiry
export function useAutoRefreshAuth() {
  const dispatch = useAppDispatch()
  const { refreshToken, expiresAt, refreshScheduled, loading } = useAppSelector(s => s.AwsAuth)

  // Schedule future refresh
  useEffect(() => {
    if (!refreshToken || !expiresAt || refreshScheduled) return
    const now = Math.floor(Date.now()/1000)
    const secondsLeft = expiresAt - now
    if (secondsLeft <= 0) { dispatch(awsLogout()); return }
    const refreshInMs = Math.max((secondsLeft - 60) * 1000, 5000)
    const id = setTimeout(() => {
      dispatch(markRefreshScheduled())
      dispatch(awsRefresh({ refreshToken }))
    }, refreshInMs)
    return () => clearTimeout(id)
  }, [refreshToken, expiresAt, refreshScheduled, dispatch])

  // Immediate refresh if almost expired
  useEffect(() => {
    if (!refreshToken || !expiresAt || loading) return
    const now = Math.floor(Date.now()/1000)
    if (expiresAt - now < 30 && !refreshScheduled) {
      dispatch(markRefreshScheduled())
      dispatch(awsRefresh({ refreshToken }))
    }
  }, [refreshToken, expiresAt, loading, refreshScheduled, dispatch])
}
