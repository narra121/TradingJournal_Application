import { ApiTrade } from '@/app/types/trade-aws';

// Derived trade analytics shapes
export interface StrategySummary {
  strategy: string;
  trades: number;
  wins: number;
  tpHits: number;
  avgR: number;
  medianDurationMin: number;
}

// Utility helpers
function minutesBetween(a: Date, b: Date) { return (b.getTime() - a.getTime()) / 60000; }
function median(values: number[]): number { if(!values.length) return 0; const sorted=[...values].sort((a,b)=>a-b); const mid=Math.floor(sorted.length/2); return sorted.length%2? sorted[mid] : (sorted[mid-1]+sorted[mid])/2 }

// Main aggregation for strategy-centric charts
export function aggregateStrategy(trades: ApiTrade[]): StrategySummary[] {
  const map = new Map<string, ApiTrade[]>();
  trades.forEach(t => {
    const key = (t.setupType || 'unknown').toLowerCase();
    if(!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  const summaries: StrategySummary[] = [];
  for (const [strategy, list] of map.entries()) {
    const enriched = list.map(t => {
      const durationMin = (t.openDate && t.closeDate) ? minutesBetween(new Date(t.openDate), new Date(t.closeDate)) : NaN;
      const risk = t.riskAmount || 0;
      const rMultiple = risk ? (t.pnl ?? 0) / risk : NaN;
      const tpHit = t.status === 'TP' || (t.takeProfit != null && t.exitPrice != null && t.exitPrice === t.takeProfit);
      return { durationMin, rMultiple, win: (t.pnl ?? 0) > 0, tpHit };
    });
    const durationVals = enriched.map(e=>e.durationMin).filter(n=>Number.isFinite(n)) as number[];
    const rVals = enriched.map(e=>e.rMultiple).filter(n=>Number.isFinite(n)) as number[];
    const summary: StrategySummary = {
      strategy,
      trades: list.length,
      wins: enriched.filter(e=>e.win).length,
      tpHits: enriched.filter(e=>e.tpHit).length,
      avgR: rVals.length ? rVals.reduce((s,v)=>s+v,0)/rVals.length : 0,
      medianDurationMin: median(durationVals)
    };
    summaries.push(summary);
  }
  return summaries.sort((a,b)=> b.trades - a.trades);
}

export interface EquityPoint { date: string; equity: number; drawdownPct: number; }
// Treat TP / SL / PARTIAL / CLOSED as terminal for equity & expectancy
const isTerminal = (t: ApiTrade) => ['CLOSED','TP','SL','PARTIAL'].includes((t.status || '').toUpperCase());

export function buildEquityCurve(trades: ApiTrade[]): EquityPoint[] {
  const closed = trades
    .filter(t=> isTerminal(t) && (t.closeDate || t.openDate))
    .sort((a,b)=> new Date(a.closeDate || a.openDate!).getTime() - new Date(b.closeDate || b.openDate!).getTime());
  let equity = 0; let peak = 0;
  const points: EquityPoint[] = [];
  closed.forEach(t => {
    const add = typeof t.netPnl === 'number' ? t.netPnl : Number(t.netPnl || 0);
    equity += add;
    if (equity > peak) peak = equity;
    const drawdownPct = peak ? ( (equity - peak) / peak ) * 100 : 0;
    const date = t.closeDate || t.openDate!;
    points.push({ date, equity: Math.round(equity*100)/100, drawdownPct: Math.round(drawdownPct*100)/100 });
  });
  return points;
}

// Rolling expectancy (mean R * winRate) over last N trades
export interface ExpectancyPoint { index: number; expectancy: number; }
export function buildRollingExpectancy(trades: ApiTrade[], window = 20): ExpectancyPoint[] {
  const closed = trades.filter(t=> isTerminal(t) && typeof t.pnl === 'number' && t.riskAmount).sort((a,b)=> new Date(a.closeDate || a.openDate).getTime() - new Date(b.closeDate || b.openDate).getTime());
  const points: ExpectancyPoint[] = [];
  for (let i=0;i<closed.length;i++) {
    const slice = closed.slice(Math.max(0, i-window+1), i+1);
    const rs = slice.map(t => (t.riskAmount ? (t.pnl as number)/t.riskAmount : 0));
    const wins = rs.filter(r=> r>0).length;
    const meanR = rs.length ? rs.reduce((s,v)=>s+v,0)/rs.length : 0;
    const hitRate = rs.length ? wins/rs.length : 0;
    const expectancy = meanR * hitRate - ( (1-hitRate) * Math.abs( (rs.filter(r=> r<0).length ? (rs.filter(r=> r<0).reduce((s,v)=>s+v,0)/rs.filter(r=> r<0).length) : -1) ) );
    points.push({ index: i+1, expectancy: Math.round(expectancy*100)/100 });
  }
  return points;
}

// Placeholder for heatmap & additional aggregations; implement as needed
export interface SessionHeatCell { session: string; weekday: number; trades: number; avgR: number; }
export function buildSessionHeatmap(trades: ApiTrade[]): SessionHeatCell[] {
  const cells = new Map<string, { trades:number; rSum:number; rCount:number }>();
  trades.forEach(t => {
    if(!t.openDate) return; const dt = new Date(t.openDate);
    const weekday = dt.getDay();
    const key = `${t.tradingSession || 'unknown'}|${weekday}`;
    const risk = t.riskAmount || 0;
    const r = risk ? (t.pnl ?? 0) / risk : 0;
    const cur = cells.get(key) || { trades:0, rSum:0, rCount:0 };
    cur.trades +=1; cur.rSum += r; cur.rCount += 1; cells.set(key, cur);
  });
  const out: SessionHeatCell[] = [];
  for (const [k,v] of cells.entries()) {
    const [session, weekday] = k.split('|');
    out.push({ session, weekday: Number(weekday), trades: v.trades, avgR: v.rCount? v.rSum/v.rCount:0 });
  }
  return out;
}
