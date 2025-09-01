"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { parseISO } from 'date-fns';

// Displays success rate (TP or PARTIAL) of trades by the hour they were opened.
// Assumptions:
// - Success = status === 'TP' or 'PARTIAL'. Failure = status === 'SL'. Other statuses ignored.
// - Hour derived from openDate (falls back to closeDate if openDate missing).
// - Only hours with at least one considered trade are shown (sparse bars).
export function HourlySuccessRateChart(){
  const trades = useSelector((s: RootState)=> (s as any).AwsTrades.items || []);

  const { data } = useMemo(()=>{
    const bucket: Record<number,{wins:number; losses:number; total:number}> = {};
    (trades as any[]).forEach(t=>{
      const status = (t.status||'').toUpperCase();
      const rawPnl = Number(t.pnl ?? 0);
  const successStatuses = ['TP','PARTIAL','WIN','WON','TARGET','PROFIT'];
  const failStatuses = ['SL','STOP','STOP_LOSS','LOSS','LOST','FAILED'];
  const breakevenStatuses = ['BE','B/E','BREAK_EVEN','BREAKEVEN','BREAK-EVEN'];
      const isSuccess = successStatuses.includes(status) || (!failStatuses.includes(status) && rawPnl > 0);
  const isFailure = failStatuses.includes(status) || (!successStatuses.includes(status) && rawPnl < 0);
  const isBreakeven = breakevenStatuses.includes(status) || (!isSuccess && !isFailure && rawPnl === 0);
  if(!(isSuccess || isFailure) || isBreakeven) return; // exclude breakeven
      const dateStr = t.openDate || t.closeDate;
      if(!dateStr) return;
      let hour: number | undefined;
      try { hour = parseISO(dateStr).getHours(); } catch { return; }
      if(hour===undefined) return;
      if(!bucket[hour]) bucket[hour] = { wins:0, losses:0, total:0 };
      bucket[hour].total++;
      if(isSuccess) bucket[hour].wins++; else if(isFailure) bucket[hour].losses++;
    });
    const rows = Array.from({length:24}, (_,h)=>{
      const v = bucket[h] || { wins:0, losses:0, total:0 };
      const successRate = v.total? (v.wins/v.total)*100:0;
      const failRate = v.total? (v.losses/v.total)*100:0;
      return { hour: h, successRate, failRate: -failRate, trades: v.total, wins: v.wins, losses: v.losses };
    });
    return { data: rows };
  }, [trades]);

  const chartConfig: ChartConfig = { successRate: { label: 'TP+Partial %', color: 'black' }, failRatePos: { label: 'SL %', color: '#6B7280' } };

  // Transform fail rate to positive for display
  const transformed = data.map(d=> ({ ...d, failRatePos: Math.abs(d.failRate) }));
  const maxRate = Math.max(5, ...transformed.map(d=> Math.max(d.successRate, d.failRatePos)));

  const FullBar = (props:any) => {
    let { x, y, width, height, fill } = props;
    // Placeholder stub for zero-height (no data) bars
    if(height <= 0) {
      const stubH = 4;
      const top = y - stubH;
      const r = 2;
      const pathStub = `M ${x} ${y} L ${x} ${top + r} Q ${x} ${top} ${x + r} ${top} H ${x + width - r} Q ${x + width} ${top} ${x + width} ${top + r} L ${x + width} ${y} Z`;
      return <path d={pathStub} fill={fill} opacity={0.35} />;
    }
    // Adaptive corner radius: reduce rounding for very narrow bars so they don't look like pills.
    // Strategy: start from base (<=6, <=height) then clamp by a fraction of width.
    // For very narrow bars (<=10px) allow at most width/2 (semi-circle top). For moderate (<=20px) <= width/3. Wider bars <= width/4 for subtle rounding.
    const baseR = Math.min(6, height);
    let r: number;
    if (width <= 10) r = Math.min(baseR, width / 2);
    else if (width <= 20) r = Math.min(baseR, width / 3);
    else r = Math.min(baseR, width / 4);
    // Keep a minimum radius of 1px for slight softness without over-rounding.
    r = Math.max(1, r);
    const path = `M ${x} ${y+height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y+height} Z`;
    return <path d={path} fill={fill} />;
  };
  const SuccessShape = (props:any)=> <FullBar {...props} fill="black" />;
  const FailShape = (props:any)=> <FullBar {...props} fill="#6B7280" />;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Hourly Success Rate</CardTitle>
        <CardDescription className="text-xs">TP / PARTIAL rate by open hour</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {data.length === 0 ? (
          <div className="aspect-video flex items-center justify-center text-xs text-muted-foreground">No qualifying trades</div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-72">
              <BarChart data={transformed} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barCategoryGap={"18%"} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={0} height={40} dy={8} axisLine={false} tickLine={false} />
              <YAxis domain={[0, maxRate]} width={48} tick={{ fontSize: 11 }} tickFormatter={v=>`${Number(v).toFixed(0)}%`} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(val,name,item:any)=>{
                const p = item?.payload || {};
                const wins = p.wins||0; const losses = p.losses||0; const total = wins + losses;
                if(total === 0) return null; // hide stub tooltip
                if(name==='successRate') return [`${Number(val).toFixed(1)}%`, `TP+Partial % (${wins}/${total})`];
                if(name==='failRatePos') return [`${Number(val).toFixed(1)}%`, `SL % (${losses}/${total})`];
                return [val,name];
              }} />} />
              <Bar dataKey="successRate" shape={<SuccessShape />} />
              <Bar dataKey="failRatePos" shape={<FailShape />} />
            </BarChart>
          </ChartContainer>
        )}
  <p className="text-xs text-muted-foreground">Black = TP/PARTIAL %, Ash = SL %.</p>
      </CardContent>
    </Card>
  );
}
