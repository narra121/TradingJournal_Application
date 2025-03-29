"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { RootState } from "@/app/store";
import { Trade } from "@/app/traceSlice"; // Import the full Trade type
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";

// Define colors for the pie chart segments
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// Helper function to calculate win rate
const calculateWinRate = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((t) => t.trade.pnl > 0).length;
  return (winningTrades / trades.length) * 100;
};

export function WinRateBySetupChart() {
  // Select the full trades array
  const trades = useSelector((state: RootState) => state.TradeData.trades);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    // Group trades by setupType
    const groupedBySetup: { [key: string]: Trade[] } = trades.reduce(
      (acc, trade) => {
        const setup = trade.analysis?.setupType || "Unknown"; // Handle missing setupType
        if (!acc[setup]) {
          acc[setup] = [];
        }
        acc[setup].push(trade);
        return acc;
      },
      {} as { [key: string]: Trade[] }
    );

    // Calculate win rate for each group
    return Object.entries(groupedBySetup)
      .map(([setup, setupTrades]) => ({
        name: setup,
        value: parseFloat(calculateWinRate(setupTrades).toFixed(2)), // Win rate percentage
        tradeCount: setupTrades.length, // Store trade count for tooltip
      }))
      .filter((data) => data.tradeCount > 0); // Only include setups with trades
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate by Setup Type</CardTitle>
        <CardDescription>
          Percentage of winning trades for each setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} // Optional: label on slices
                outerRadius={100}
                fill="#8884d8"
                dataKey="value" // Value is the win rate percentage
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props) => [
                  `${value.toFixed(2)}% ( ${props.payload.tradeCount} trades )`, // Show win rate and trade count
                  name, // Show setup type name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No trade data with setup types available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
