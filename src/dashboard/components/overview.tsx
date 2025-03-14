"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

interface ChartData {
  name: string;
  total: number;
}

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
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <XAxis
          dataKey="name"
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
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
