"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ui/chart';
import { format, parseISO } from 'date-fns';

// Strategy TP Time chart (avg/min/max time to reach TP per strategy)
export function RollingExpectancyChart(){
  const trades = useSelector((s: RootState)=> (s as any).AwsTrades.items || []);
  const { rows, dateLabel } = useMemo(()=>{
  // Broaden TP detection: include case-insensitive TP / TAKE_PROFIT style statuses OR explicit takeProfit hit (exitPrice == takeProfit)
  const tpTrades = (trades as any[]).filter(t=>{
    const status = (t.status||'').toString().toUpperCase();
    const statusTp = ['TP','TAKE_PROFIT','TARGET','PROFIT'].includes(status);
    const byPrice = t.takeProfit != null && t.exitPrice != null && Number(t.exitPrice) === Number(t.takeProfit);
    return (statusTp || byPrice) && t.openDate && t.closeDate;
  });
    const byStrategy: Record<string, number[]> = {};
    tpTrades.forEach(t=>{
      const key = (t.setupType || 'unknown').toLowerCase();
      if(!byStrategy[key]) byStrategy[key] = [];
      try {
        const start = new Date(t.openDate).getTime();
        const end = new Date(t.closeDate).getTime();
        if(end>start){ byStrategy[key].push((end-start)/60000); }
      } catch { /* ignore */ }
    });
    const rows = Object.entries(byStrategy).map(([strategy, arr])=>{
      const sorted=[...arr].sort((a,b)=>a-b);
      const min=sorted[0];
      const max=sorted[sorted.length-1];
      const avg= sorted.reduce((s,v)=>s+v,0)/sorted.length;
      return { strategy, avg, min, max, count: sorted.length };
    }).sort((a,b)=> b.avg - a.avg);
    const allDates = tpTrades.map(t=> t.closeDate || t.openDate).filter(Boolean);
    let dateLabel='';
    if(allDates.length){
      try { const parsed=allDates.map(d=>parseISO(d)); const min=new Date(Math.min(...parsed.map(d=>d.getTime()))); const max=new Date(Math.max(...parsed.map(d=>d.getTime()))); const sameYear=min.getFullYear()===max.getFullYear(); dateLabel = sameYear? `${format(min,'MMM')} – ${format(max,'MMM yyyy')}`: `${format(min,'MMM yyyy')} – ${format(max,'MMM yyyy')}`;} catch{}
    }
    return { rows, dateLabel };
  }, [trades]);

  const chartConfig: ChartConfig = {
    avg: { label: 'Avg', color: 'hsl(var(--chart-2))' }
  };

  const formatMinutes = (m:number) => {
    if(m >= 60) return (m/60).toFixed(1)+ 'h';
    return m.toFixed(1)+'m';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Strategy TP Time</CardTitle>
  <CardDescription className="text-xs">Average minutes to reach TP (only TP trades)</CardDescription>
        {dateLabel && <CardDescription className="text-[10px] tracking-wide">{dateLabel}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">No TP trades</div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-72">
            <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="strategy" tick={{ fontSize: 11 }} interval={0} height={50} dy={8} axisLine={false} tickLine={false} />
              <YAxis width={55} tick={{ fontSize: 11 }} tickFormatter={(v)=> formatMinutes(v)} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="strategy" formatter={(val, _n, entry:any)=>{
                const r = entry?.payload; return [ `${formatMinutes(Number(val))} (${r?.count||0} trades)`, 'Avg']; }} />} />
              <Bar dataKey="avg" radius={[6,6,4,4]} fill="hsl(var(--chart-2))" />
            </ComposedChart>
          </ChartContainer>
        )}
  <p className="mt-2 text-xs text-muted-foreground">Bar shows average. 60m+ auto-shown in hours. Tooltip lists trade count.</p>
      </CardContent>
    </Card>
  );
}
