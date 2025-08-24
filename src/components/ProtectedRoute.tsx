import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { RootState } from '@/app/store'

// Redirects unauthenticated users to /login
export function ProtectedRoute() {
  const idToken = useSelector((s: RootState)=> s.AwsAuth.idToken)
  const bootstrapped = useSelector((s: RootState)=> s.AwsAuth.bootstrapped)
  const loading = useSelector((s: RootState)=> s.AwsAuth.loading)
  if (!bootstrapped || loading) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  if (!idToken) return <Navigate to="/login" replace />
  return <Outlet />
}

// Redirects authenticated users away from auth pages
export function PublicOnlyRoute() {
  const idToken = useSelector((s: RootState)=> s.AwsAuth.idToken)
  const bootstrapped = useSelector((s: RootState)=> s.AwsAuth.bootstrapped)
  const loading = useSelector((s: RootState)=> s.AwsAuth.loading)
  if (!bootstrapped || loading) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  if (idToken) return <Navigate to="/app" replace />
  return <Outlet />
}
