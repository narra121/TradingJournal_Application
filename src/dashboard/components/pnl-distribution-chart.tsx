"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";

import { RootState } from "@/app/store";
import { selectTradeDetails } from "@/app/selectors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";

// Define P&L brackets
const brackets = [
  { label: "< -100", min: -Infinity, max: -100 },
  { label: "-100 to -50", min: -100, max: -50 },
  { label: "-50 to -25", min: -50, max: -25 },
  { label: "-25 to 0", min: -25, max: 0 },
  { label: "0 to 25", min: 0, max: 25 },
  { label: "25 to 50", min: 25, max: 50 },
  { label: "50 to 100", min: 50, max: 100 },
  { label: "> 100", min: 100, max: Infinity },
];

export function PnlDistributionChart() {
  const trades = useSelector(selectTradeDetails);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    // Initialize counts for each bracket
    const bracketCounts: { [key: string]: number } = brackets.reduce(
      (acc, bracket) => {
        acc[bracket.label] = 0;
        return acc;
      },
      {} as { [key: string]: number }
    );

    // Count trades in each bracket
    trades.forEach((trade) => {
      const pnl = trade.pnl;
      for (const bracket of brackets) {
        // Handle exclusive upper bound for non-zero brackets, inclusive for zero
        const upperCheck =
          bracket.max === 0 ? pnl <= bracket.max : pnl < bracket.max;
        if (pnl >= bracket.min && upperCheck) {
          bracketCounts[bracket.label]++;
          break; // Move to next trade once bracket is found
        }
      }
      // Handle the edge case for exactly 0 PNL (falls into "0 to 25" bracket)
      if (pnl === 0) {
        bracketCounts["0 to 25"]++;
      }
      // Handle the edge case for exactly max value (falls into next bracket usually)
      else if (pnl === -100) bracketCounts["-100 to -50"]++;
      else if (pnl === -50) bracketCounts["-50 to -25"]++;
      else if (pnl === -25) bracketCounts["-25 to 0"]++;
      else if (pnl === 25) bracketCounts["25 to 50"]++;
      else if (pnl === 50) bracketCounts["50 to 100"]++;
      else if (pnl === 100) bracketCounts["> 100"]++;
    });

    // Format for recharts
    return brackets.map((bracket) => ({
      name: bracket.label,
      count: bracketCounts[bracket.label],
    }));
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Distribution</CardTitle>
        <CardDescription>Number of trades per P&L bracket.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-45} // Angle labels for better fit
                textAnchor="end"
                height={70} // Increase height to accommodate angled labels
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false} // Count should be integer
                label={{
                  value: "Number of Trades",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [value, "Trades"]}
                labelFormatter={(label: string) => `P&L: ${label}`}
              />
              <Bar
                dataKey="count"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
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
