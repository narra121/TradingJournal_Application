import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval, // Import isWithinInterval
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "lib/utils";
import { ApiTrade } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Badge } from "@/ui/badge";

// Types for trade data

interface DayTrade {
  profit: number;
  trades: number;
}

interface CalenderProps {
  onSelectDate?: (date: Date) => void;
}

interface TradeData {
  [date: string]: DayTrade;
}

// Process trades into daily data (using ApiTrade model)
const processTrades = (trades: ApiTrade[]): TradeData => {
  const tradeData: TradeData = {};

  trades.forEach((trade) => {
    const closeOrOpen = trade.closeDate || trade.openDate; // fallback to openDate if not closed
    try {
      const date = format(parseISO(closeOrOpen), "yyyy-MM-dd");
      if (!tradeData[date]) {
        tradeData[date] = { profit: 0, trades: 0 };
      }
      const pnl = trade.netPnl ?? trade.pnl ?? 0;
      tradeData[date].profit += pnl;
      tradeData[date].trades += 1;
    } catch (e) {
      // swallow malformed date
    }
  });

  return tradeData;
};

// Calculate weekly totals (using the monthly filtered tradeData)
const getWeekNumber = (date: Date) => {
  const firstDayOfMonth = startOfMonth(date);
  return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
};

function Calender({ onSelectDate }: CalenderProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const allTrades = useSelector((state: RootState) => state.AwsTrades.items as ApiTrade[]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // yyyy-MM-dd
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Filter trades for the current month
  const monthlyTrades = useMemo(() => {
    return allTrades.filter((trade) => {
      const closeOrOpen = trade.closeDate || trade.openDate;
      try {
        const d = parseISO(closeOrOpen);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [allTrades, monthStart, monthEnd]);

  // Process trades for daily view (only for the current month's trades)
  const tradeData = useMemo(() => processTrades(monthlyTrades), [monthlyTrades]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const weeklyTotals = useMemo(() => {
    const weeklyTotals: { [week: number]: { profit: number; trades: number } } =
      {};

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const weekNum = getWeekNumber(day);

      if (!weeklyTotals[weekNum]) {
        weeklyTotals[weekNum] = { profit: 0, trades: 0 };
      }

      if (tradeData[dateStr]) {
        weeklyTotals[weekNum].profit += tradeData[dateStr].profit;
        weeklyTotals[weekNum].trades += tradeData[dateStr].trades;
      }
    });

    return weeklyTotals;
  }, [days, tradeData]);

  const monthlyStats = useMemo(() => {
    return monthlyTrades.reduce(
      (acc, trade) => {
        const pnl = (trade.netPnl ?? trade.pnl ?? 0) as number;
        acc.totalPnl += pnl;
        acc.totalTrades += 1;
        if (pnl > 0) acc.positiveTrades += 1;
        else if (pnl < 0) acc.negativeTrades += 1;
        else acc.breakEvenTrades += 1;
        return acc;
      },
      {
        totalPnl: 0,
        totalTrades: 0,
        positiveTrades: 0,
        negativeTrades: 0,
        breakEvenTrades: 0,
      }
    );
  }, [monthlyTrades]);

  const tradesByDate = useMemo(() => {
    const map: Record<string, ApiTrade[]> = {};
    monthlyTrades.forEach(tr => {
      const key = format(parseISO(tr.closeDate || tr.openDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(tr);
    });
    // sort each day's trades by updatedAt desc then openDate
    Object.values(map).forEach(list => list.sort((a,b)=> (b.updatedAt? new Date(b.updatedAt).getTime():0) - (a.updatedAt? new Date(a.updatedAt).getTime():0)));
    return map;
  }, [monthlyTrades]);

  const openDayDialog = useCallback((day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    setSelectedDate(key);
    const trades = tradesByDate[key] || [];
    setSelectedTradeId(trades.length ? trades[0].tradeId : null);
    setDialogOpen(true);
    onSelectDate && onSelectDate(day);
  }, [tradesByDate, onSelectDate]);

  const selectedTrades = selectedDate ? tradesByDate[selectedDate] || [] : [];
  const selectedTrade = selectedTradeId ? selectedTrades.find(t=>t.tradeId===selectedTradeId) : null;

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-[1200px] mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">
            {format(currentDate, "MMMM, yyyy")}
          </CardTitle>
          {/* Container for Stats and Buttons */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Monthly Stats */}
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <span>
                Total P&L:{" "}
                <span
                  className={cn(
                    "font-semibold inline-block min-w-[10ch] text-right", // Added min-width and text-right
                    monthlyStats.totalPnl > 0 && "text-green-600",
                    monthlyStats.totalPnl < 0 && "text-red-600",
                    monthlyStats.totalPnl === 0 &&
                      monthlyStats.totalTrades > 0 &&
                      "text-yellow-600"
                  )}
                >
                  $
                  {monthlyStats.totalPnl.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
              <span>|</span>
              <span>
                Total Trades:{" "}
                <span className="font-semibold inline-block min-w-[4ch] text-right">
                  {" "}
                  {/* Added min-width */}
                  {monthlyStats.totalTrades}
                </span>
              </span>
              <span className="text-green-600">
                W:{" "}
                <span className="font-semibold inline-block min-w-[3ch] text-right">
                  {" "}
                  {/* Added min-width */}
                  {monthlyStats.positiveTrades}
                </span>
              </span>
              <span className="text-red-600">
                L:{" "}
                <span className="font-semibold inline-block min-w-[3ch] text-right">
                  {" "}
                  {/* Added min-width */}
                  {monthlyStats.negativeTrades}
                </span>
              </span>
              <span className="text-yellow-600">
                B/E:{" "}
                <span className="font-semibold inline-block min-w-[3ch] text-right">
                  {" "}
                  {/* Added min-width */}
                  {monthlyStats.breakEvenTrades}
                </span>
              </span>
            </div>
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  setCurrentDate(
                    (date) => new Date(date.getFullYear(), date.getMonth() - 1)
                  )
                }
                className="p-2 hover:bg-accent rounded-md"
                aria-label="Previous month" // Added aria-label
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentDate(
                    (date) => new Date(date.getFullYear(), date.getMonth() + 1)
                  )
                }
                className="p-2 hover:bg-accent rounded-md"
                aria-label="Next month" // Added aria-label
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>{" "}
            {/* Added closing div for Navigation Buttons container */}
          </div>{" "}
          {/* Added closing div for the outer flex container */}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-1 text-sm">
            {/* Header row */}
            <div className="p-2 text-center font-medium">Sun</div>
            <div className="p-2 text-center font-medium">Mon</div>
            <div className="p-2 text-center font-medium">Tue</div>
            <div className="p-2 text-center font-medium">Wed</div>
            <div className="p-2 text-center font-medium">Thu</div>
            <div className="p-2 text-center font-medium">Fri</div>
            <div className="p-2 text-center font-medium">Sat</div>
            <div className="p-2 text-center font-medium">Total</div>

            {/* Calendar grid */}
            {days.length > 0 && Array.from(
              { length: Math.ceil((days[0].getDay() + days.length) / 7) },
              (_, weekIndex) => {
                const weekNumber = weekIndex + 1;
                const weekTotal = weeklyTotals[weekNumber] || {
                  profit: 0,
                  trades: 0,
                };

                return (
                  <React.Fragment key={`week-${weekNumber}`}>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayNumber = weekIndex * 7 + dayIndex - days[0].getDay();
                      const currentDay = days[dayNumber];

                      if (
                        !currentDay ||
                        !isSameMonth(currentDay, currentDate)
                      ) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            className="min-h-[100px] p-2 border rounded-lg bg-muted/10"
                          />
                        );
                      }

                      const dateStr = format(currentDay, "yyyy-MM-dd");
                      const dayData = tradeData[dateStr] || { profit: 0, trades: 0 };
                      const isCurrentDay = isToday(currentDay);

                      return (
                        <div
                          key={dateStr}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openDayDialog(currentDay); } }}
                          className={cn(
                            "min-h-[100px] p-2 border rounded-lg relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50",
                            isCurrentDay && "bg-accent",
                            dayData.profit > 0 && "bg-green-500/10",
                            dayData.profit < 0 && "bg-red-500/10",
                            dayData.trades===0 && "hover:bg-muted/40",
                            dayData.trades>0 && "hover:bg-primary/5"
                          )}
                          onClick={() => openDayDialog(currentDay)}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium">
                              {format(currentDay, "d")}
                            </span>
                            {dayData.trades > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {dayData.trades} trades
                              </span>
                            )}
                          </div>
                          {dayData.profit !== 0 && (
                            <div
                              className={cn(
                                "mt-1 font-medium",
                                dayData.profit > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              $
                              {Math.abs(dayData.profit).toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 }
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Weekly total column */}
                    <div className="min-h-[100px] p-2 border rounded-lg bg-secondary/50">
                      <div className="font-medium">Week {weekNumber}</div>
                      <div
                        className={cn(
                          "mt-1 font-medium",
                          weekTotal.profit > 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        $
                        {weekTotal.profit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {weekTotal.trades} trades
                      </div>
                    </div>
                  </React.Fragment>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {selectedDate ? format(parseISO(selectedDate), 'MMMM d, yyyy') : 'Day Trades'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[500px]">
            {/* Trades list */}
            <div className="border-r bg-muted/30 flex flex-col w-[15vw] min-w-[180px] max-w-[300px]">
              <div className="p-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Trades</div>
              <ScrollArea className="flex-1">
                <div className="px-2 pb-2 space-y-1">
                  {selectedTrades.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2">No trades for this day.</div>
                  )}
                  {selectedTrades.map(t => {
                    const pnl = t.netPnl ?? t.pnl ?? 0;
                    return (
                      <button
                        key={t.tradeId}
                        onClick={()=> setSelectedTradeId(t.tradeId)}
                        className={cn(
                          "w-full text-left rounded-md border p-2 bg-background hover:bg-accent/50 transition-colors",
                          selectedTradeId===t.tradeId && "border-primary ring-1 ring-primary"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{t.symbol}</span>
                          <span className={cn("text-xs font-semibold", pnl>0?"text-green-600": pnl<0?"text-red-600":"text-muted-foreground")}>{pnl?.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t.side}</span>
                          {t.status && <Badge variant="secondary" className="px-1 py-0 text-[10px]">{t.status}</Badge>}
                          {t.tradeGrade && <Badge variant="outline" className="px-1 py-0 text-[10px]">{t.tradeGrade}</Badge>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
            {/* Details */}
            <div className="flex-1 flex flex-col">
              <div className="p-2 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b">Details</div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {!selectedTrade && <div className="text-sm text-muted-foreground">Select a trade to view details.</div>}
                  {selectedTrade && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <span className="text-muted-foreground">Symbol</span><span className="font-medium">{selectedTrade.symbol}</span>
                        <span className="text-muted-foreground">Side</span><span>{selectedTrade.side}</span>
                        <span className="text-muted-foreground">Quantity</span><span>{selectedTrade.quantity}</span>
                        <span className="text-muted-foreground">Entry</span><span>{selectedTrade.entryPrice ?? '-'}</span>
                        <span className="text-muted-foreground">Exit</span><span>{selectedTrade.exitPrice ?? '-'}</span>
                        <span className="text-muted-foreground">PnL</span><span className={cn(selectedTrade.netPnl??selectedTrade.pnl??0>0?'text-green-600':(selectedTrade.netPnl??selectedTrade.pnl??0)<0?'text-red-600':'')}>{(selectedTrade.netPnl ?? selectedTrade.pnl ?? 0).toFixed(2)}</span>
                        <span className="text-muted-foreground">Status</span><span>{selectedTrade.status}</span>
                        <span className="text-muted-foreground">Grade</span><span>{selectedTrade.tradeGrade ?? '-'}</span>
                        <span className="text-muted-foreground">Opened</span><span>{selectedTrade.openDate}</span>
                        <span className="text-muted-foreground">Closed</span><span>{selectedTrade.closeDate || '-'}</span>
                        <span className="text-muted-foreground">Timeframe</span><span>{selectedTrade.timeframe || '-'}</span>
                        <span className="text-muted-foreground">Session</span><span>{selectedTrade.tradingSession || '-'}</span>
                      </div>
                      {(selectedTrade.preTradeNotes || selectedTrade.postTradeNotes) && (
                        <div className="space-y-3 text-sm">
                          {selectedTrade.preTradeNotes && <div><div className="font-medium mb-1">Pre-trade Notes</div><p className="whitespace-pre-wrap text-muted-foreground">{selectedTrade.preTradeNotes}</p></div>}
                          {selectedTrade.postTradeNotes && <div><div className="font-medium mb-1">Post-trade Notes</div><p className="whitespace-pre-wrap text-muted-foreground">{selectedTrade.postTradeNotes}</p></div>}
                        </div>
                      )}
                      {selectedTrade.tags && selectedTrade.tags.length>0 && (
                        <div className="text-xs flex flex-wrap gap-1">
                          {selectedTrade.tags.map(tag => <Badge key={tag} variant="outline" className="px-1 py-0">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Calender;
