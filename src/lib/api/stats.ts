import { apiGet } from './client'
import type { ApiStats } from '@/app/types/trade-aws'

export const getStats = (token: string) => apiGet<ApiStats>('/stats', { authToken: token })
