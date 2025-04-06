import { useState } from "react";
import { useSelector } from "react-redux"; // Import useSelector
import { RootState } from "../store"; // Import RootState
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
import { cn } from "@/lib/utils";
import { Trade } from "../traceSlice";

// Types for trade data

interface DayTrade {
  profit: number;
  trades: number;
}

interface TradeData {
  [date: string]: DayTrade;
}

// Process trades into daily data
const processTrades = (trades: Trade[]): TradeData => {
  const tradeData: TradeData = {};

  trades.forEach((trade) => {
    const date = format(parseISO(trade.trade.closeDate), "yyyy-MM-dd");

    if (!tradeData[date]) {
      tradeData[date] = { profit: 0, trades: 0 };
    }

    tradeData[date].profit += trade.trade.pnl;
    tradeData[date].trades += 1;
  });

  return tradeData;
};

function Calender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const allTrades = useSelector((state: RootState) => state.TradeData.trades); // Fetch all trades

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Filter trades for the current month
  const monthlyTrades = allTrades.filter((trade) => {
    try {
      const closeDate = parseISO(trade.trade.closeDate);
      return isWithinInterval(closeDate, { start: monthStart, end: monthEnd });
    } catch (e) {
      console.error("Error parsing date for trade:", trade, e);
      return false;
    }
  });

  // Process trades for daily view (only for the current month's trades)
  const tradeData = processTrades(monthlyTrades);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate weekly totals (using the monthly filtered tradeData)
  const getWeekNumber = (date: Date) => {
    const firstDayOfMonth = startOfMonth(date);
    return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
  };

  const calculateWeeklyTotals = () => {
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
  };

  const weeklyTotals = calculateWeeklyTotals(); // This uses tradeData which is already filtered

  // Calculate detailed monthly stats from monthlyTrades
  const monthlyStats = monthlyTrades.reduce(
    (acc, trade) => {
      const pnl = trade.trade.pnl;
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
            {Array.from(
              { length: Math.ceil((days[0].getDay() + days.length) / 7) },
              (_, weekIndex) => {
                const weekNumber = weekIndex + 1;
                const weekTotal = weeklyTotals[weekNumber] || {
                  profit: 0,
                  trades: 0,
                };

                return (
                  <>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayNumber =
                        weekIndex * 7 + dayIndex - days[0].getDay();
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
                      const dayData = tradeData[dateStr] || {
                        profit: 0,
                        trades: 0,
                      };
                      const isCurrentDay = isToday(currentDay);

                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            "min-h-[100px] p-2 border rounded-lg relative",
                            isCurrentDay && "bg-accent",
                            dayData.profit > 0 && "bg-green-500/10",
                            dayData.profit < 0 && "bg-red-500/10"
                          )}
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
                  </>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Calender;
