import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { RootState } from '@/app/store'
import { Loader2 } from "lucide-react"

// Redirects unauthenticated users to /login
export function ProtectedRoute() {
  const idToken = useSelector((s: RootState)=> s.AwsAuth.idToken)
  const bootstrapped = useSelector((s: RootState)=> s.AwsAuth.bootstrapped)
  const loading = useSelector((s: RootState)=> s.AwsAuth.loading)
  if (!bootstrapped || loading) return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
  if (!idToken) return <Navigate to="/login" replace />
  return <Outlet />
}

// Redirects authenticated users away from auth pages
export function PublicOnlyRoute() {
  const idToken = useSelector((s: RootState)=> s.AwsAuth.idToken)
  const bootstrapped = useSelector((s: RootState)=> s.AwsAuth.bootstrapped)
  const loading = useSelector((s: RootState)=> s.AwsAuth.loading)
  if (!bootstrapped || loading) return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
  if (idToken) return <Navigate to="/app" replace />
  return <Outlet />
}
