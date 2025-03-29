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
import { parseISO, differenceInMinutes } from "date-fns";

import { RootState } from "@/app/store";
import { selectTradeDetails } from "@/app/selectors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";

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
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                label={{
                  value: "Number of Trades",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [value, "Trades"]}
                labelFormatter={(label: string) => `Duration: ${label}`}
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
            No trade data available or durations could not be calculated.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
