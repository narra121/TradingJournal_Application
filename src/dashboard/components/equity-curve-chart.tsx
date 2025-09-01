"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { buildEquityCurve } from 'lib/analytics/aggregations';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ui/chart';

export function EquityCurveChart(){
  const trades = useSelector((s: RootState)=> (s as any).AwsTrades.items || []);
  const data = useMemo(()=> buildEquityCurve(trades as any), [trades]);
  const chartConfig: ChartConfig = {
    equity: { label: 'Equity', color: 'hsl(var(--chart-1))' }
  };
  // Date range label & simple trend (last point vs first)
  let dateLabel = '';
  let trendLabel = '';
  if(data.length){
    try {
      const parsed = data.map(d=> parseISO(d.date));
      const min = parsed[0];
      const max = parsed[parsed.length-1];
      const sameYear = min.getFullYear() === max.getFullYear();
      dateLabel = sameYear ? `${format(min,'MMM')} – ${format(max,'MMM yyyy')}` : `${format(min,'MMM yyyy')} – ${format(max,'MMM yyyy')}`;
      const firstEq = data[0].equity; const lastEq = data[data.length-1].equity;
      const deltaPct = firstEq ? ((lastEq-firstEq)/Math.abs(firstEq))*100 : 0;
      trendLabel = `${deltaPct>=0? 'Up':'Down'} ${Math.abs(deltaPct).toFixed(1)}% over range`;
    } catch { /* ignore */ }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Equity Curve</CardTitle>
        <CardDescription className="text-xs">Cumulative net P&L over terminal trades.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <div className="aspect-video flex items-center justify-center text-xs text-muted-foreground">No data</div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-72">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="date" hide />
      <YAxis width={48} tick={{ fontSize: 11 }} tickFormatter={(v)=>`$${v}`} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v)=> [`$${v}`,'Equity']} hideLabel />} />
              <Area type="monotone" dataKey="equity" stroke="var(--color-equity)" fill="url(#equityGradient)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
    {dateLabel && <p className="mt-2 text-xs text-muted-foreground">{dateLabel}</p>}
    {trendLabel && <p className="text-xs font-medium">{trendLabel}</p>}
      </CardContent>
    </Card>
  );
}
