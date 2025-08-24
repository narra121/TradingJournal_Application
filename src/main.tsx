import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import Page from "./LoginPage";
import { SignUpPage } from './signup'
import { ForgotPasswordPage } from './forgot/index'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import store from "./app/store";
import useAuthBootstrap from '@/hooks/useAuthBootstrap'
import { Toaster } from '@/ui/sonner'
import DashboardPage from '@/dashboard/DashboardPage'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
// import { AuthDebug } from '@/components/AuthDebug'

const AppRoot = () => {
  useAuthBootstrap()
  return (
    <div className="relative min-h-svh">
    <HashRouter>
  {/* Locale toggle removed; app fixed to English */}
      <Routes>
        <Route element={<PublicOnlyRoute />}> 
          <Route path="/login" element={<Page />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute />}> 
          <Route path="/app" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  {/* <AuthDebug /> */}
    </div>
  )
}

const container = document.getElementById('root')!
// Reuse existing root during fast refresh to avoid duplicate createRoot warning
// (React attaches an internal _reactRootContainer; we keep our own ref for clarity)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let root: any = (window as any).__APP_ROOT__
if (!root) {
  root = createRoot(container)
  ;(window as any).__APP_ROOT__ = root
}
root.render(
  <StrictMode>
    <Provider store={store}>
      <AppRoot />
      <Toaster />
    </Provider>
  </StrictMode>
)
