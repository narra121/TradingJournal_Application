import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { DateRangePicker } from "./components/date-range-picker";
import { TradingMetricsCards } from "./components/trading/TradingMetricsCards";
import { RecentTrades } from "./components/trading/RecentTrades";
import { TradingChart } from "./components/trading/TradingChart";
import { AnalyticsTable } from "./components/analytics-table";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { ChevronDown, Search } from "lucide-react";

import { AppDispatch, RootState } from "./app/store";
import { useDispatch, useSelector } from "react-redux";

import TradeJournal from "./components/trading/TradeJournal";
import { subscribeToTrades } from "./app/traceSlice";
import { Trades } from "./components/Trades";

// Sample data
const sampleMetrics = {
  totalTrades: 156,
  winRate: 0.65,
  totalProfit: 2547.82,
  averageProfit: 16.33,
  largestWin: 450.2,
  largestLoss: -215.75,
  profitFactor: 1.85,
  averageHoldingTime: 45,
};

const sampleChartData = {
  weekly: [
    { period: "Week 1", profit: 450.25, trades: 23, winRate: 0.7 },
    { period: "Week 2", profit: -125.5, trades: 18, winRate: 0.45 },
    // Add more weekly data
  ],
  monthly: [
    { period: "Jan", profit: 1250.75, trades: 85, winRate: 0.68 },
    { period: "Feb", profit: 875.25, trades: 71, winRate: 0.62 },
    // Add more monthly data
  ],
};

function App() {
  const [date, setDate] = useState<DateRange>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (date.from && date.to) {
      dispatch(
        subscribeToTrades({
          startDate: format(date.from, "yyyy-MM-dd"),
          endDate: format(date.to, "yyyy-MM-dd"),
        })
      );
    }
  }, [date]);
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>AK</AvatarFallback>
                </Avatar>
                <span className="font-medium">Alicia Koch</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-sm font-medium">
                  Overview
                </a>
                <a href="#" className="text-sm font-medium text-gray-500">
                  Customers
                </a>
                <a href="#" className="text-sm font-medium text-gray-500">
                  Products
                </a>
                <a href="#" className="text-sm font-medium text-gray-500">
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Trading Journal</h1>
          <TradeJournal />
          <DateRangePicker date={date} onChange={setDate} />
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <TradingMetricsCards metrics={sampleMetrics} />

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <div className="lg:col-span-4">
                  <TradingChart
                    weeklyData={sampleChartData.weekly}
                    monthlyData={sampleChartData.monthly}
                  />
                </div>

                <div className="lg:col-span-3">
                  <RecentTrades />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTable />
          </TabsContent>
          <TabsContent value="trades">
            <Trades />
          </TabsContent>
          <TabsContent value="calendar">
            {/* Calendar view will be implemented next */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
