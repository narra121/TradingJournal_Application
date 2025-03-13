import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

interface ChartData {
  period: string;
  profit: number;
  trades: number;
  winRate: number;
}

interface TradingChartProps {
  weeklyData: ChartData[];
  monthlyData: ChartData[];
}

type MetricType = "profit" | "trades" | "winRate";
type TimeFrame = "weekly" | "monthly";

export function TradingChart({ weeklyData, monthlyData }: TradingChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("weekly");
  const [metric, setMetric] = useState<MetricType>("profit");

  const data = timeFrame === "weekly" ? weeklyData : monthlyData;

  const formatValue = (value: number) => {
    switch (metric) {
      case "profit":
        return `$${value.toFixed(2)}`;
      case "winRate":
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value;
    }
  };

  const getBarColor = (value: number) => {
    if (metric === "profit") {
      return value >= 0 ? "#22C55E" : "#EF4444";
    }
    return "#000000";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Trading Performance</h3>
        <div className="flex space-x-4">
          <Select
            value={timeFrame}
            onValueChange={(value: TimeFrame) => setTimeFrame(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={metric}
            onValueChange={(value: MetricType) => setMetric(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profit">Profit/Loss</SelectItem>
              <SelectItem value="trades">Trade Count</SelectItem>
              <SelectItem value="winRate">Win Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip
              formatter={(value: number) => formatValue(value)}
              labelStyle={{ color: "#111827" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "0.375rem",
              }}
            />
            <Bar
              dataKey={metric}
              fill={(data) => getBarColor(data[metric])}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
