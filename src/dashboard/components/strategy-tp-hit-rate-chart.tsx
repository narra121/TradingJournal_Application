"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

export function StrategyTpHitRateChart(){
  const trades = useSelector((s: RootState)=> (s as any).AwsTrades.items || []);
  const { data, cfg, dateLabel } = useMemo(()=>{
    const byStrategy: Record<string,{ wins:number; losses:number }> = {};
    (trades as any[]).forEach(t=>{
      const key = (t.setupType || 'unknown').toLowerCase();
      if(!byStrategy[key]) byStrategy[key] = { wins:0, losses:0 };
      const status = (t.status||'').toUpperCase();
      const rawPnl = Number(t.pnl ?? 0);
      // Broader heuristic: classify using common status variants then fallback to PnL sign
  const successStatuses = ['TP','PARTIAL','WIN','WON','TARGET','PROFIT'];
  const failStatuses = ['SL','STOP','STOP_LOSS','LOSS','LOST','FAILED'];
      const isSuccess = successStatuses.includes(status) || (!failStatuses.includes(status) && rawPnl > 0);
  const isFailure = failStatuses.includes(status) || (!successStatuses.includes(status) && rawPnl < 0);
  // Breakeven statuses intentionally excluded from win/loss tallies
  if(isSuccess) byStrategy[key].wins++; else if(isFailure) byStrategy[key].losses++;
    });
    const rows = Object.entries(byStrategy).map(([strategy,v])=>{
      const total = v.wins + v.losses;
      const successRate = total? (v.wins/total)*100:0;
      const failRate = total? (v.losses/total)*100:0;
      return { strategy, successRate, failRate: -failRate, wins:v.wins, losses:v.losses, total };
    }).sort((a,b)=> b.total - a.total);
    const cfg: ChartConfig = {};
    rows.forEach((r,i)=> cfg[r.strategy] = { label: r.strategy, color: `hsl(var(--chart-${(i%5)+1}))` } as any);
    const allDates = (trades as any[]).map(t=> t.closeDate || t.openDate).filter(Boolean);
    let dateLabel='';
    if(allDates.length){
      try { const parsed=allDates.map(d=>parseISO(d)); const min=new Date(Math.min(...parsed.map(d=>d.getTime()))); const max=new Date(Math.max(...parsed.map(d=>d.getTime()))); const sameYear=min.getFullYear()===max.getFullYear(); dateLabel = sameYear? `${format(min,'MMM')} – ${format(max,'MMM yyyy')}`: `${format(min,'MMM yyyy')} – ${format(max,'MMM yyyy')}`;} catch{}
    }
    return { data: rows, cfg, dateLabel };
  }, [trades]);
  const chartConfig: ChartConfig = { successRate: { label:'TP+Partial %', color:'black' }, failRate: { label:'SL %', color:'#6B7280' }, ...cfg };

  // Convert failRate (currently negative) to positive magnitude for display
  const transformed = data.map(d=> ({ ...d, failRatePos: Math.abs(d.failRate) }));
  const maxRate = Math.max(5, ...transformed.map(d=> Math.max(d.successRate, d.failRatePos)));

  // Dynamic width: keep bars wide as for 3 strategies; scroll horizontally if more.
  const baseCategories = 3;
  const baseWidthPerCategory = 240; // px width allocated per category when scrolling
  const scrollWidth = transformed.length > baseCategories
    ? transformed.length * baseWidthPerCategory
    : '100%';

  // Full-width bar shapes (Recharts already allocates equal width per series in a category)
  const FullBar = (props:any) => {
    let { x, y, width, height, fill } = props;
    if(height <= 0) {
      // Always show stub for zero value (either no trades or zero side within trades)
      const stubH = 4;
      const top = y - stubH;
      const r = 2;
      const pathStub = `M ${x} ${y} L ${x} ${top + r} Q ${x} ${top} ${x + r} ${top} H ${x + width - r} Q ${x + width} ${top} ${x + width} ${top + r} L ${x + width} ${y} Z`;
      return <path d={pathStub} fill={fill} opacity={0.35} />;
    }
    const r = Math.min(6, height);
    const path = `M ${x} ${y+height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y+height} Z`;
    return <path d={path} fill={fill} />;
  };
  const SuccessShape = (props:any)=> <FullBar {...props} fill="black" />;
  const FailShape = (props:any)=> <FullBar {...props} fill="#6B7280" />;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
  <CardTitle className="text-sm font-semibold">Strategy TP / Partial Hit %</CardTitle>
        {dateLabel && <CardDescription className="text-xs">{dateLabel}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {data.length === 0 ? <div className="aspect-video flex items-center justify-center text-xs text-muted-foreground">No data</div> : (
          <>
            <div className="overflow-x-auto">
              <div style={{ width: scrollWidth }}>
                <ChartContainer config={chartConfig} className="w-full h-72 aspect-auto">
                  <BarChart data={transformed} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barCategoryGap={"18%"} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="strategy" tick={{ fontSize: 11 }} interval={0} height={40} dy={8} axisLine={false} tickLine={false} />
                <YAxis domain={[0, maxRate]} width={44} tick={{ fontSize:11 }} tickFormatter={v=>`${Number(v).toFixed(0)}%`} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="strategy" formatter={(val, name, item:any)=>{
                      const p = item?.payload || {};
                      if(p.total === 0) return null; // hide tooltip entries for stub bars
                      if(name==='successRate') return [`${Number(val).toFixed(1)}%`, `TP+Partial % (${p.wins||0}/${p.total||0})`];
                      if(name==='failRatePos') return [`${Number(val).toFixed(1)}%`, `SL % (${p.losses||0}/${p.total||0})`];
                      return [val,name];
                    }} />} />
                <Bar dataKey="successRate" shape={<SuccessShape />} />
                <Bar dataKey="failRatePos" shape={<FailShape />} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
            <div className="text-xs mt-1 flex flex-col gap-1">
              <p className="text-muted-foreground">Black = TP/PARTIAL %, Ash = SL %.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
