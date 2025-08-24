// Generic API client wrapper for AWS backend
import { API_BASE_URL } from '@/lib/config'

export interface ApiErrorShape {
  message: string
  code?: string
  details?: any
}

export class ApiError extends Error {
  code?: string
  status: number
  details?: any
  constructor(status: number, shape: ApiErrorShape) {
    super(shape.message || `API Error ${status}`)
    this.status = status
    this.code = shape.code
    this.details = shape.details
  }
}

async function parseJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { raw: text } }
}

export interface RequestOptions extends RequestInit {
  authToken?: string | null
  query?: Record<string, any>
}

function buildUrl(path: string, query?: Record<string, any>) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([k,v]) => {
      if (v === undefined || v === null || v === '') return
      url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { authToken, query, headers, ...rest } = opts
  const url = buildUrl(path, query)
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(authToken ? { Authorization: authToken } : {}),
    },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new ApiError(res.status, data as ApiErrorShape)
  return data as T
}

export const apiGet = <T=any>(path: string, opts: RequestOptions = {}) => apiRequest<T>(path, { ...opts, method: 'GET' })
export const apiPost = <T=any>(path: string, body?: any, opts: RequestOptions = {}) => apiRequest<T>(path, { ...opts, method: 'POST', body: JSON.stringify(body) })
export const apiPut = <T=any>(path: string, body?: any, opts: RequestOptions = {}) => apiRequest<T>(path, { ...opts, method: 'PUT', body: JSON.stringify(body) })
export const apiDelete = <T=any>(path: string, opts: RequestOptions = {}) => apiRequest<T>(path, { ...opts, method: 'DELETE' })
