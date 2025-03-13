import React, { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { TradeDetailsDialogAnalytics } from "./trading/TradeDetailsDialog";
import { CalendarView } from "./trading/CalendarView";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { Trade, TradeDetails } from "@/app/traceSlice";

interface AnalyticsData extends Trade {
  id: string;
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  conversionRate: number;
  region: string;
  platform: string;
}

interface AggregatedData {
  date: string;
  totalPnl: number;
  totalTrades: number;
  profitTrades: number;
  lossTrades: number;
  maxProfit: number;
  maxLoss: number;
  sellTrades: number;
  buyTrades: number;
  totalDuration: number; // in hours
  averagePnl?: number;
  averageDuration?: number;
}

const allColumns = [
  { key: "date", label: "Date" }, // When the trades happened

  { key: "totalTrades", label: "Total Trades" }, // Overview of trading activity
  { key: "totalPnl", label: "Total PnL" }, // Total profit/loss

  { key: "profitTrades", label: "Profit Trades" }, // Breakdown of profitable trades
  { key: "lossTrades", label: "Loss Trades" }, // Breakdown of losing trades
  { key: "maxProfit", label: "Max Profit" }, // Best trade outcome
  { key: "maxLoss", label: "Max Loss" }, // Worst trade outcome

  { key: "buyTrades", label: "Buy Trades" }, // Number of buy trades
  { key: "sellTrades", label: "Sell Trades" }, // Number of sell trades

  { key: "averagePnl", label: "Average PnL" }, // Avg profitability per trade
  { key: "averageDuration", label: "Average Duration" }, // Avg holding time per trade
  { key: "totalDuration", label: "Total Duration" }, // Total trading duration
] as const;

type ColumnKey = (typeof allColumns)[number]["key"];
type ViewMode = "table" | "calendar";
type TimeFrame = "daily" | "weekly" | "monthly";

export function AnalyticsTable() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily");
  const [selectedColumns, setSelectedColumns] = useState<Set<ColumnKey>>(
    new Set(allColumns.map((col) => col.key))
  );
  const [sortConfig, setSortConfig] = useState<{
    key: ColumnKey | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });
  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>(
    {}
  );
  const [selectedItem, setSelectedItem] = useState<{
    averagePnl: number;
    averageDuration: number;
    date: string;
    totalPnl: number;
    totalTrades: number;
    profitTrades: number;
    lossTrades: number;
    maxProfit: number;
    maxLoss: number;
    sellTrades: number;
    buyTrades: number;
    totalDuration: number;
  } | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const trades: TradeDetails[] = useSelector((state: RootState) =>
    state.TradeData.trades.map((trade) => trade.trade)
  );

  const aggregateData = (data: TradeDetails[]) => {
    // We'll build three aggregation objects for daily, weekly and monthly.
    const dailyAgg: Record<string, AggregatedData> = {};
    const weeklyAgg: Record<string, AggregatedData> = {};
    const monthlyAgg: Record<string, AggregatedData> = {};

    // Helper function to update a given aggregation bucket
    const updateAggregate = (
      agg: Record<string, AggregatedData>,
      key: string,
      trade: TradeDetails,
      duration: number
    ) => {
      if (!agg[key]) {
        agg[key] = {
          date: key,
          totalPnl: trade.pnl,
          totalTrades: 1,
          profitTrades: trade.pnl > 0 ? 1 : 0,
          lossTrades: trade.pnl < 0 ? 1 : 0,
          maxProfit: trade.pnl,
          maxLoss: trade.pnl,
          sellTrades: trade.side.toLowerCase() === "sell" ? 1 : 0,
          buyTrades: trade.side.toLowerCase() === "buy" ? 1 : 0,
          totalDuration: duration,
        };
      } else {
        const group = agg[key];
        group.totalTrades++;
        group.totalPnl += trade.pnl;
        if (trade.pnl > 0) group.profitTrades++;
        if (trade.pnl < 0) group.lossTrades++;
        group.maxProfit = Math.max(group.maxProfit, trade.pnl);
        group.maxLoss = Math.min(group.maxLoss, trade.pnl);
        if (trade.side.toLowerCase() === "sell") group.sellTrades++;
        if (trade.side.toLowerCase() === "buy") group.buyTrades++;
        group.totalDuration += duration;
      }
    };

    data.forEach((trade) => {
      const closeDate = new Date(trade.closeDate);
      const openDate = new Date(trade.openDate);
      // Calculate trade duration in hours
      const duration =
        (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60);

      // Daily key: use the close date formatted as "yyyy-MM-dd"
      const dailyKey = format(closeDate, "yyyy-MM-dd");

      // Weekly key: for weeks starting on Monday
      // In JavaScript, getDay() returns 0 for Sunday so we treat it as day 7.
      const dayOfWeek = closeDate.getDay() === 0 ? 7 : closeDate.getDay();
      const weekStart = new Date(closeDate);
      weekStart.setDate(closeDate.getDate() - (dayOfWeek - 1)); // shift to Monday
      const weeklyKey = format(weekStart, "yyyy-MM-dd");

      // Monthly key: format as "yyyy-MM"
      const monthlyKey = format(closeDate, "yyyy-MM");

      // Update each aggregation bucket
      updateAggregate(dailyAgg, dailyKey, trade, duration);
      updateAggregate(weeklyAgg, weeklyKey, trade, duration);
      updateAggregate(monthlyAgg, monthlyKey, trade, duration);
    });

    // Function to compute averages and convert aggregation objects into arrays
    const computeResults = (agg: Record<string, AggregatedData>) =>
      Object.values(agg).map((group) => ({
        ...group,
        averagePnl: group.totalTrades ? group.totalPnl / group.totalTrades : 0,
        averageDuration: group.totalTrades
          ? group.totalDuration / group.totalTrades
          : 0,
      }));

    return {
      daily: computeResults(dailyAgg),
      weekly: computeResults(weeklyAgg),
      monthly: computeResults(monthlyAgg),
    };
  };

  const processedData = useMemo(() => {
    let data = aggregateData(trades)[timeFrame];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        data = data.filter((item) =>
          item[key as ColumnKey]
            .toString()

            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      data.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [trades, timeFrame, sortConfig, filters]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: ColumnKey) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : current.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  };

  const formatValue = (key: ColumnKey, value: any) => {
    if (value == null || value === "") return "-"; // Handle empty values

    switch (key) {
      // Format money values

      case "averagePnl":
      case "totalPnl":
      case "maxProfit":
      case "maxLoss":
        return `$${Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      // Format numbers with proper separators

      case "totalTrades":
      case "profitTrades":
      case "lossTrades":
      case "sellTrades":
      case "buyTrades":
      case "totalDuration":
      case "averageDuration":
        return Number(value).toLocaleString();

      // Format dates for better readability

      case "date":
        return format(new Date(value), "MMM dd, yyyy HH:mm");

      default:
        return value;
    }
  };

  const getSortIcon = (key: ColumnKey) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4" />;
    if (sortConfig.direction === "asc")
      return <ChevronUp className="w-4 h-4" />;
    return <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-lg border p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="w-4 h-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Calendar
            </Button>
          </div>

          <Select
            value={timeFrame}
            onValueChange={(value: TimeFrame) => setTimeFrame(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual Trades</SelectItem>
              <SelectItem value="daily">Daily Summary</SelectItem>
              <SelectItem value="weekly">Weekly Summary</SelectItem>
              <SelectItem value="monthly">Monthly Summary</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {allColumns.map(
                    (column) =>
                      selectedColumns.has(column.key) && (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center space-x-1">
                            <button
                              className="flex items-center space-x-1 hover:text-gray-700"
                              onClick={() => handleSort(column.key)}
                            >
                              <span>{column.label}</span>
                              {getSortIcon(column.key)}
                            </button>
                          </div>
                          <input
                            type="text"
                            className="mt-2 w-full px-2 py-1 text-xs border rounded"
                            placeholder={`Filter ${column.label}`}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                [column.key]: e.target.value,
                              }))
                            }
                          />
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row) => (
                  <tr
                    key={uuidv4()}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => {
                      setSelectedItem(row);
                      setIsDetailsOpen(true);
                    }}
                  >
                    {allColumns.map(
                      (column) =>
                        selectedColumns.has(column.key) && (
                          <td
                            key={column.key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {formatValue(column.key, row[column.key])}
                          </td>
                        )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, processedData.length)} of{" "}
                  {processedData.length} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CalendarView
          data={processedData}
          onSelectDate={(date) => {
            // Handle date selection
            console.log("Selected date:", date);
          }}
        />
      )}

      {selectedItem && (
        <TradeDetailsDialogAnalytics
          isOpen={isDetailsOpen}
          timeframe={timeFrame}
          onClose={() => setIsDetailsOpen(false)}
          aggTrade={selectedItem}
          onNavigate={(direction) => {
            const currentIndex = processedData.findIndex(
              (item) => item.date === selectedItem.date
            );
            const newIndex =
              direction === "prev" ? currentIndex - 1 : currentIndex + 1;

            if (newIndex >= 0 && newIndex < processedData.length) {
              setSelectedItem(processedData[newIndex]);
            }
          }}
        />
      )}
    </div>
  );
}
