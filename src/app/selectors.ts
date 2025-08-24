import { RootState } from './store'
import { ApiTrade } from './types'
import { createSelector } from 'reselect'

// Return last N trades sorted by updatedAt/openDate desc
const selectAwsTrades = (state: RootState) => state.AwsTrades.items

export const makeSelectRecentTrades = (limit = 10) => createSelector([selectAwsTrades], (items): ApiTrade[] => {
	return [...items]
		.sort((a,b) => {
			const aDate = a.updatedAt || a.openDate || ''
			const bDate = b.updatedAt || b.openDate || ''
			return bDate.localeCompare(aDate)
		})
		.slice(0, limit)
})

// Default recent trades selector (limit 10)
export const selectRecentTrades = makeSelectRecentTrades()

interface MonthlyPnl { name: string; total: number }

// Aggregate net pnl per month for current year
export const selectMonthlyPnl = createSelector([selectAwsTrades], (items): MonthlyPnl[] => {
	const now = new Date()
	const year = now.getFullYear()
	const months: number[] = Array.from({ length: 12 }, (_, i) => i)
	const agg: Record<number, number> = {}
	for (const m of months) agg[m] = 0
	items.forEach(t => {
		const dStr = t.closeDate || t.openDate
		if (!dStr) return
		const d = new Date(dStr)
		if (d.getFullYear() !== year) return
		const m = d.getMonth()
		const pnl = (t.netPnl ?? t.pnl ?? 0) as number
		if (typeof pnl === 'number' && !isNaN(pnl)) agg[m] += pnl
	})
	const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
	return months.map(m => ({ name: monthNames[m], total: Number(agg[m].toFixed(2)) }))
})

export type { MonthlyPnl }
