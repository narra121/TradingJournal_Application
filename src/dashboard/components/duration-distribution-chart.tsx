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
import { parseISO, differenceInMinutes } from "date-fns";

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

// Define duration brackets (in minutes)
const brackets = [
  { label: "0-15", min: 0, max: 15 },
  { label: "15-30", min: 15, max: 30 },
  { label: "30-60", min: 30, max: 60 },
  { label: "60-120", min: 60, max: 120 },
  { label: "120-240", min: 120, max: 240 },
  { label: "> 240", min: 240, max: Infinity },
];

export function DurationDistributionChart() {
  const trades = useSelector(selectTradeDetails);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    const bracketCounts: { [key: string]: number } = brackets.reduce(
      (acc, bracket) => {
        acc[bracket.label] = 0;
        return acc;
      },
      {} as { [key: string]: number }
    );

    trades.forEach((trade) => {
      try {
        const openTime = parseISO(trade.openDate);
        const closeTime = parseISO(trade.closeDate);
        // Ensure both dates are valid before calculating difference
        if (!isNaN(openTime.getTime()) && !isNaN(closeTime.getTime())) {
          const duration = differenceInMinutes(closeTime, openTime);

          for (const bracket of brackets) {
            // Handle exclusive upper bound, inclusive lower bound
            if (duration >= bracket.min && duration < bracket.max) {
              bracketCounts[bracket.label]++;
              break;
            }
          }
          // Handle edge case for exactly max value (falls into next bracket usually)
          if (duration === 15) bracketCounts["15-30"]++;
          else if (duration === 30) bracketCounts["30-60"]++;
          else if (duration === 60) bracketCounts["60-120"]++;
          else if (duration === 120) bracketCounts["120-240"]++;
          else if (duration === 240) bracketCounts["> 240"]++;
        }
      } catch (e) {
        console.error("Error calculating duration for trade:", trade, e);
      }
    });

    return brackets.map((bracket) => ({
      name: `${bracket.label} min`, // Add units to label
      count: bracketCounts[bracket.label],
    }));
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Duration Distribution</CardTitle>
        <CardDescription>
          Number of trades per duration bracket.
        </CardDescription>
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
                allowDecimals={false}
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
            No trade data available or durations could not be calculated.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
