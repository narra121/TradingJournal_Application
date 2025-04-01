"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip, // Keep for now
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";

import { RootState } from "@/app/store";
import { selectTradeDetails } from "@/app/selectors";
import {
  ChartConfig,
  ChartContainer,
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

// Define chart config
const chartConfig = {
  count: {
    label: "Number of Trades",
    color: "hsl(var(--chart-1))", // Use CSS variable
  },
} satisfies ChartConfig;

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
          // Wrap with ChartContainer
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // Remove angle/anchor/height for horizontal labels
                // angle={-45}
                // textAnchor="end"
                // height={70}
                // stroke="#888888" // Remove
                // fontSize={12} // Remove
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false} // Count should be integer
                // stroke="#888888" // Remove
                // fontSize={12} // Remove
                // label prop might not be directly supported by shadcn styling, remove for now
                // label={{
                //   value: "Number of Trades",
                //   angle: -90,
                //   position: "insideLeft",
                // }}
              />
              {/* Replace Tooltip */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)" // Use CSS variable
                radius={4}
                // fill="currentColor" // Remove
                // radius={[4, 4, 0, 0]} // Simplify
                // className="fill-primary" // Remove
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No trade data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
