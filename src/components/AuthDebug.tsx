import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'

export function AuthDebug() {
  const auth = useSelector((s: RootState)=> s.AwsAuth)
  return (
    <pre className="fixed bottom-2 left-2 z-50 bg-black/80 text-white text-[10px] p-2 rounded max-w-xs overflow-auto whitespace-pre-wrap">
      {JSON.stringify({
        idToken: !!auth.idToken,
        refreshToken: !!auth.refreshToken,
        expiresAt: auth.expiresAt,
        user: auth.user,
        loading: auth.loading,
        error: auth.error,
        bootstrapped: auth.bootstrapped
      }, null, 2)}
    </pre>
  )
}
