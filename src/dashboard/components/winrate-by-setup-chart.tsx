"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip, // Keep for now
  Legend, // Keep for now
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { RootState } from "@/app/store";
import { Trade } from "@/app/traceSlice"; // Import the full Trade type
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart"; // Import shadcn chart components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";

// Colors are now handled by chartConfig

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

  // Dynamically generate chartConfig based on data
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (chartData.length > 0) {
      chartData.forEach((item, index) => {
        // Use a base color and generate variations or use a predefined palette
        const colorIndex = index % 6; // Example: cycle through 6 base colors
        config[item.name] = {
          label: item.name,
          // Use shadcn theme colors if available, otherwise fallback
          color: `hsl(var(--chart-${colorIndex + 1}))`,
        };
      });
    }
    return config;
  }, [chartData]);

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
          // Wrap with ChartContainer
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[350px]"
          >
            <PieChart>
              {/* Replace Tooltip */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />} // Pie charts often hide the label in tooltip
              />
              <Pie
                data={chartData}
                dataKey="value" // Win rate percentage
                nameKey="name" // Setup type
                innerRadius={60} // Make it a donut chart like shadcn examples
                strokeWidth={5} // Add stroke like shadcn examples
              >
                {/* Use chartConfig for fills */}
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={`var(--color-${entry.name})`} // Use CSS variable from config
                    className="stroke-background" // Use shadcn class for stroke
                  />
                ))}
              </Pie>
              {/* Replace Legend */}
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No trade data with setup types available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
