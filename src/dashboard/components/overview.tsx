"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig, // Import ChartConfig type
} from "../../ui/chart"; // Adjust path as needed

interface ChartData {
  name: string;
  total: number;
}

// Define chart config
const chartConfig = {
  total: {
    label: "Total PnL",
    color: "hsl(var(--chart-1))", // Use CSS variable from shadcn theme
  },
} satisfies ChartConfig; // Use satisfies for type checking

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function Overview() {
  const trades = useSelector((state: RootState) =>
    state.TradeData.trades.map((trade) => trade.trade)
  );

  // Aggregate trade data by month
  const monthlyData: ChartData[] = monthNames.map((monthName, monthIndex) => {
    const monthlyTrades = trades.filter((trade) => {
      const tradeDate = new Date(trade.openDate);
      return tradeDate.getMonth() === monthIndex;
    });

    const totalPnl = monthlyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    if (totalPnl == 0) {
      return {
        name: monthName,
        total: 2,
      };
    }
    return {
      name: monthName,
      total: totalPnl,
    };
  });

  return (
    // Wrap with ChartContainer and pass config
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={monthlyData}>
        {" "}
        {/* Add accessibilityLayer */}
        <CartesianGrid vertical={false} /> {/* Add CartesianGrid */}
        <XAxis
          dataKey="name"
          tickLine={false} // Use props from shadcn examples
          tickMargin={10} // Use props from shadcn examples
          axisLine={false} // Use props from shadcn examples
          // stroke="#888888" // Remove direct stroke
          // fontSize={12} // Font size handled by ChartContainer styles
        />
        <YAxis
          // stroke="#888888" // Remove direct stroke
          tickLine={false} // Use props from shadcn examples
          axisLine={false} // Use props from shadcn examples
          tickMargin={10} // Use props from shadcn examples
          // fontSize={12} // Font size handled by ChartContainer styles
          tickFormatter={(value) => `$${value}`}
        />
        {/* Add Tooltip */}
        <ChartTooltip
          cursor={false} // Use props from shadcn examples
          content={<ChartTooltipContent indicator="line" />} // Use shadcn tooltip content
        />
        <Bar
          dataKey="total"
          fill="var(--color-total)" // Use CSS variable from config
          radius={4} // Simplified radius
          // fill="currentColor" // Remove direct fill
          // radius={[4, 4, 0, 0]} // Use simpler radius
          // className="fill-primary" // Remove direct class
        />
      </BarChart>
    </ChartContainer>
  );
}
