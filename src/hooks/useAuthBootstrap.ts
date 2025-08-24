import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { bootstrapFromStorage, awsRefresh, markBootstrapped } from '@/app/awsAuthSlice'

// Hook to bootstrap auth tokens from localStorage on first mount and schedule refresh
export function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const { idToken, refreshToken, expiresAt } = useAppSelector(s => s.AwsAuth)
  useEffect(() => {
    if (!idToken && !refreshToken) {
      dispatch(bootstrapFromStorage())
      dispatch(markBootstrapped())
    } else {
      dispatch(markBootstrapped())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!refreshToken || !expiresAt) return
    const secondsLeft = expiresAt - Math.floor(Date.now()/1000)
    if (secondsLeft <= 0) return
    const timeout = setTimeout(() => {
      dispatch(awsRefresh({ refreshToken }))
    }, Math.max((secondsLeft - 60), 5) * 1000)
    return () => clearTimeout(timeout)
  }, [dispatch, refreshToken, expiresAt])
}

export default useAuthBootstrap
