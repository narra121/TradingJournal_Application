import { ApiTrade } from '@/app/types';

export interface StrategySummary { strategy: string; trades: number; wins: number; tpHits: number; avgR: number; medianDurationMin: number; }
const minutesBetween = (a: Date, b: Date) => (b.getTime() - a.getTime())/60000;
const median = (vals: number[]) => { if(!vals.length) return 0; const s=[...vals].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2? s[m] : (s[m-1]+s[m])/2 };

export function aggregateStrategy(trades: ApiTrade[]): StrategySummary[] {
  const map = new Map<string, ApiTrade[]>();
  trades.forEach(t=> { const k=(t.setupType||'unknown').toLowerCase(); if(!map.has(k)) map.set(k,[]); map.get(k)!.push(t); });
  const out: StrategySummary[] = [];
  for (const [strategy, list] of map.entries()) {
    const enriched = list.map(t => {
      const durationMin = (t.openDate && t.closeDate) ? minutesBetween(new Date(t.openDate), new Date(t.closeDate)) : NaN;
      const risk = t.riskAmount || 0;
      const rMultiple = risk ? (t.pnl ?? 0)/risk : NaN;
  const tpHit = (t.takeProfit != null && t.exitPrice != null && t.exitPrice === t.takeProfit) || ((t.pnl ?? 0) > 0 && t.takeProfit != null && t.exitPrice != null && ((t.side==='BUY' && t.exitPrice >= t.takeProfit) || (t.side==='SELL' && t.exitPrice <= t.takeProfit)));
      return { durationMin, rMultiple, win: (t.pnl ?? 0) > 0, tpHit };
    });
    const dVals = enriched.map(e=>e.durationMin).filter(Number.isFinite) as number[];
    const rVals = enriched.map(e=>e.rMultiple).filter(Number.isFinite) as number[];
    out.push({
      strategy,
      trades: list.length,
      wins: enriched.filter(e=>e.win).length,
      tpHits: enriched.filter(e=>e.tpHit).length,
      avgR: rVals.length ? rVals.reduce((s,v)=>s+v,0)/rVals.length : 0,
      medianDurationMin: median(dVals)
    });
  }
  return out.sort((a,b)=> b.trades - a.trades);
}

export interface EquityPoint { date: string; equity: number; drawdownPct: number; }
export function buildEquityCurve(trades: ApiTrade[]): EquityPoint[] {
  const closed = trades.filter(t=> t.closeDate && typeof t.netPnl === 'number').sort((a,b)=> new Date(a.closeDate!).getTime() - new Date(b.closeDate!).getTime());
  let equity=0, peak=0; const pts: EquityPoint[] = [];
  closed.forEach(t=> { equity += (t.netPnl as number); if(equity>peak) peak=equity; const dd = peak? ((equity-peak)/peak)*100:0; pts.push({ date: t.closeDate!, equity: Math.round(equity*100)/100, drawdownPct: Math.round(dd*100)/100 }); });
  return pts;
}

export interface ExpectancyPoint { index: number; expectancy: number; }
export function buildRollingExpectancy(trades: ApiTrade[], window=20): ExpectancyPoint[] {
  const closed = trades.filter(t=> t.status==='CLOSED' && typeof t.pnl==='number' && t.riskAmount).sort((a,b)=> new Date(a.closeDate||a.openDate).getTime() - new Date(b.closeDate||b.openDate).getTime());
  const pts: ExpectancyPoint[] = [];
  for (let i=0;i<closed.length;i++) {
    const slice = closed.slice(Math.max(0,i-window+1), i+1);
    const rs = slice.map(t => (t.riskAmount ? (t.pnl as number)/t.riskAmount : 0));
    const wins = rs.filter(r=> r>0).length;
    const meanR = rs.length ? rs.reduce((s,v)=>s+v,0)/rs.length : 0;
    const hitRate = rs.length ? wins/rs.length : 0;
    const losers = rs.filter(r=> r<0);
    const avgLoss = losers.length ? losers.reduce((s,v)=>s+v,0)/losers.length : -1;
    const expectancy = meanR * hitRate + (1-hitRate)*avgLoss; // simplified expectancy
    pts.push({ index: i+1, expectancy: Math.round(expectancy*100)/100 });
  }
  return pts;
}

export interface SessionHeatCell { session: string; weekday: number; trades: number; avgR: number; }
export function buildSessionHeatmap(trades: ApiTrade[]): SessionHeatCell[] {
  const cells = new Map<string, { trades:number; rSum:number; rCount:number }>();
  trades.forEach(t=> { if(!t.openDate) return; const dt=new Date(t.openDate); const weekday=dt.getDay(); const key=`${t.tradingSession||'unknown'}|${weekday}`; const risk=t.riskAmount||0; const r = risk? (t.pnl ?? 0)/risk : 0; const cur = cells.get(key)||{trades:0,rSum:0,rCount:0}; cur.trades++; cur.rSum+=r; cur.rCount++; cells.set(key,cur); });
  const out: SessionHeatCell[] = [];
  for (const [k,v] of cells) { const [session,weekday] = k.split('|'); out.push({ session, weekday:Number(weekday), trades:v.trades, avgR: v.rCount? v.rSum/v.rCount:0 }); }
  return out;
}
