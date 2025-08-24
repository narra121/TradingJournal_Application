// Centralized runtime configuration (AWS-only)
// Explicitly require VITE_API_BASE_URL to be provided via environment (.env.[mode])
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!API_BASE_URL) {
  throw new Error('[config] VITE_API_BASE_URL is not defined. Create an .env.development / .env.production file with this value.')
}

// Guard: prevent accidentally shipping a dev stage API in a production build
if (import.meta.env.MODE === 'production' && /\/dev\//.test(API_BASE_URL)) {
  // eslint-disable-next-line no-console
  console.error('[config] Refusing to run production build against DEV API URL. Please set a prod VITE_API_BASE_URL.')
  throw new Error('DEV API URL used in production build')
}

// (Optional) Warn if using prod API in development (informational only)
if (import.meta.env.MODE !== 'production' && /\/prod\//.test(API_BASE_URL)) {
  // eslint-disable-next-line no-console
  console.warn('[config] Using PROD API while in development mode.')
}
