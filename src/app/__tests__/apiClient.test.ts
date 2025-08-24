import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet } from '../../lib/api/client'

describe('api client', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn(async () => ({ ok: true, status:200, text: async () => JSON.stringify({ hello:'world' }) }))
  })
  it('performs GET and parses json', async () => {
    const data = await apiGet('/test')
    expect(data).toEqual({ hello:'world' })
  })
})