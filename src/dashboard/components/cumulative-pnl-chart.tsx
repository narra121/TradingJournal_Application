"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";

import { RootState } from "@/app/store";
import { selectTradeDetails } from "@/app/selectors"; // Use memoized selector
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card"; // Assuming UI components are in @/ui

export function CumulativePnlChart() {
  const trades = useSelector(selectTradeDetails);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    // Sort trades by open date
    const sortedTrades = [...trades].sort(
      (a, b) => parseISO(a.openDate).getTime() - parseISO(b.openDate).getTime()
    );

    let cumulativePnl = 0;
    return sortedTrades.map((trade, index) => {
      cumulativePnl += trade.pnl;
      return {
        name: `Trade ${index + 1}`, // Simple label, could use date
        // date: format(parseISO(trade.openDate), "dd MMM"), // Alternative X-axis label
        cumulativePnl: parseFloat(cumulativePnl.toFixed(2)), // Ensure it's a number
      };
    });
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative P&L</CardTitle>
        <CardDescription>Profit/Loss progression over trades.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name" // Or "date" if preferred
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                domain={["auto", "auto"]} // Adjust domain if needed
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toFixed(2)}`,
                  "Cumulative P&L",
                ]}
                labelFormatter={(label: string) => label} // Show "Trade X" or date in tooltip
              />
              <Line
                type="monotone"
                dataKey="cumulativePnl"
                stroke="currentColor" // Use Shadcn's current color
                strokeWidth={2}
                dot={false}
                className="text-primary" // Use primary color from theme
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No trade data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
