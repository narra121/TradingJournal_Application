"use client";
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '@/app/store';
import { buildSessionHeatmap } from 'lib/analytics/aggregations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';

const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function SessionHeatmapChart(){
  const trades = useSelector((s: RootState)=> (s as any).AwsTrades.items || []);
  const data = useMemo(()=> buildSessionHeatmap(trades as any), [trades]);

  // Build matrix keyed by session then weekday
  const sessions = Array.from(new Set(data.map(d=>d.session)));
  const grid = sessions.map(session=> ({ session, values: weekdays.map((_,i)=> data.find(d=> d.session===session && d.weekday===i) || { trades:0, avgR:0 }) }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Session Heatmap</CardTitle>
            <CardDescription className="text-xs">Color intensity = |avg R|, hue = performance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">No data</div> : (
          <div className="overflow-x-auto h-72">
            <table className="border-collapse text-xs select-none">
              <thead>
                <tr>
                  <th className="p-1 text-left sticky left-0 bg-background">Session</th>
                  {weekdays.map(w=> <th key={w} className="p-1 font-normal text-muted-foreground">{w}</th>)}
                </tr>
              </thead>
              <tbody>
                {grid.map(row=> (
                  <tr key={row.session}>
                    <td className="p-1 pr-2 font-medium sticky left-0 bg-background">{row.session}</td>
                    {row.values.map((cell,i)=>{
                      const intensity = Math.min(1, Math.abs(cell.avgR)/3); // scale
                      const positive = cell.avgR >= 0;
                      const alpha = (0.18 + intensity*0.55).toFixed(3);
                      const bg = intensity===0 ? 'transparent' : `hsl(var(${positive? '--chart-3':'--destructive'}) / ${alpha})`;
                      return (
                        <td key={i} className="p-1 group">
                          <div className="relative w-10 h-10 rounded-sm flex items-center justify-center ring-1 ring-border/20 transition-colors" style={{ background: bg }}>
                            <span className="text-[10px] font-medium mix-blend-plus-lighter">{cell.trades || ''}</span>
                            {cell.trades > 0 && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] backdrop-blur-sm bg-background/55 rounded-sm transition-opacity">
                                <span className="font-semibold">{cell.avgR.toFixed(2)}R</span>
                                <span className="text-[8px] text-muted-foreground">{cell.trades} tr</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.length>0 && <p className="mt-2 text-xs text-muted-foreground">Hover to see R & trade count per session/day.</p>}
      </CardContent>
    </Card>
  );
}
