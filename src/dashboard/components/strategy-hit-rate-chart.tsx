"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/ui/chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

// First chart in the sequence: Strategy Target Hit Rate & Volume
export function StrategyHitRateChart() {
  const trades = useSelector((s: RootState) => (s as any).AwsTrades.items || []);

  const { data, chartConfig, dateLabel, trendLabel } = useMemo(() => {
    // Recompute simplified hit stats using status definitions:
    // Success: status === 'TP' or status === 'PARTIAL'
    // Failure: status === 'SL'
    const byStrategy: Record<string,{trades:number; successes:number; sumR:number; rCount:number}> = {};
    (trades as any[]).forEach(t => {
      const key = (t.setupType || 'unknown').toLowerCase();
      if(!byStrategy[key]) byStrategy[key] = { trades:0, successes:0, sumR:0, rCount:0 };
      const b = byStrategy[key];
      b.trades++;
      if(t.status === 'TP' || t.status === 'PARTIAL') b.successes++;
      const risk = t.riskAmount || 0;
      if(risk) { b.sumR += (t.pnl ?? 0)/risk; b.rCount++; }
    });
    const rows = Object.entries(byStrategy).map(([strategy,v]) => ({
      strategy,
      hitRate: v.trades ? (v.successes / v.trades) * 100 : 0,
      trades: v.trades,
      avgR: v.rCount ? v.sumR / v.rCount : 0,
    })).sort((a,b)=> b.trades - a.trades);
    const cfg: ChartConfig = {};
    rows.forEach((r, i) => {
      cfg[r.strategy] = { label: r.strategy, color: `hsl(var(--chart-${(i % 5) + 1}))` } as any;
    });
    // Date range label
    const allDates = (trades as any[]).map(t => t.closeDate || t.openDate).filter(Boolean);
    let dateLabel = '';
    if(allDates.length){
      try {
        const parsed = allDates.map(d=> parseISO(d));
        const min = new Date(Math.min(...parsed.map(d=>d.getTime())));
        const max = new Date(Math.max(...parsed.map(d=>d.getTime())));
        const sameYear = min.getFullYear() === max.getFullYear();
        dateLabel = sameYear ? `${format(min,'MMM')} – ${format(max,'MMM yyyy')}` : `${format(min,'MMM yyyy')} – ${format(max,'MMM yyyy')}`;
      } catch { /* ignore */ }
    }
    // Trend: compare avg hit rate last 5 strategies vs previous 5 (placeholder analytic)
    let trendLabel = '';
    if(rows.length > 3){
      const recent = rows.slice(0,3).reduce((s,r)=>s+r.hitRate,0)/Math.min(3,rows.length);
      const prior = rows.slice(3,6).reduce((s,r)=>s+r.hitRate,0)/Math.max(1,Math.min(3, rows.length-3));
      const delta = prior ? ((recent-prior)/prior)*100 : 0;
      trendLabel = `${delta>=0? 'Trending up':'Trending down'} by ${Math.abs(delta).toFixed(1)}% vs prior group`;
    }
    return { data: rows, chartConfig: cfg, dateLabel, trendLabel };
  }, [trades]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Strategy Hit Rate</CardTitle>
        {dateLabel && <CardDescription className="text-xs">{dateLabel}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {data.length === 0 ? (
          <div className="flex items-center justify-center aspect-video w-full text-muted-foreground text-xs">No trades available</div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="w-full h-72">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="strategy" tick={{ fontSize: 11 }} interval={0} height={40} dy={8} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" width={38} tick={{ fontSize: 11 }} tickFormatter={v=>`${v.toFixed(0)}%`} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" width={34} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent nameKey="strategy" hideLabel />} />
                <Bar yAxisId="right" dataKey="trades" radius={[6,6,4,4]} fill="hsl(var(--chart-3))" opacity={0.35} />
                <Line yAxisId="left" type="monotone" dataKey="hitRate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ChartContainer>
            <div className="text-xs mt-1 flex flex-col gap-1">
              {trendLabel && <p className="font-medium">{trendLabel}</p>}
              <p className="text-muted-foreground">Bars: count • Line: % of terminal trades TP/PARTIAL.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
