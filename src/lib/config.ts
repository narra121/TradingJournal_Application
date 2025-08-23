// Centralized runtime configuration & feature flags
export const BACKEND_MODE = (import.meta.env.VITE_BACKEND_MODE as 'firebase' | 'aws' | undefined) || 'firebase'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const isAwsBackend = () => BACKEND_MODE === 'aws'

if (BACKEND_MODE === 'aws' && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('[config] AWS backend selected but VITE_API_BASE_URL is not set.')
}