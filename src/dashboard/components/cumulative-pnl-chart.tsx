"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip, // Keep Tooltip for now, replace with ChartTooltip later
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";

import { RootState } from "@/app/store";
import { selectTradeDetails } from "@/app/selectors"; // Use memoized selector
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
} from "@/ui/card"; // Assuming UI components are in @/ui

// Define chart config
const chartConfig = {
  cumulativePnl: {
    label: "Cumulative P&L",
    color: "hsl(var(--chart-1))", // Use CSS variable
  },
} satisfies ChartConfig;

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
          // Wrap with ChartContainer
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <LineChart
              accessibilityLayer // Add accessibilityLayer
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }} // Adjust margins if needed
            >
              <CartesianGrid vertical={false} />{" "}
              {/* Keep grid, adjust style if needed */}
              <XAxis
                dataKey="name" // Or "date" if preferred
                tickLine={false} // Use shadcn style
                axisLine={false} // Use shadcn style
                tickMargin={8} // Use shadcn style
                // stroke="#888888" // Remove direct stroke
                // fontSize={12} // Remove direct font size
              />
              <YAxis
                tickLine={false} // Use shadcn style
                axisLine={false} // Use shadcn style
                tickMargin={8} // Use shadcn style
                // stroke="#888888" // Remove direct stroke
                // fontSize={12} // Remove direct font size
                tickFormatter={(value) => `$${value}`}
                // domain={["auto", "auto"]} // Keep domain or adjust as needed
              />
              {/* Replace recharts Tooltip with ChartTooltip */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="cumulativePnl"
                type="monotone"
                // stroke="var(--color-cumulativePnl)" // Revert to currentColor + className
                stroke="currentColor" // Use theme color via className
                strokeWidth={2}
                dot={false}
                className="text-primary" // Apply primary color class
              />
            </LineChart>
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
