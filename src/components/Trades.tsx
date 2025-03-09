import React, { useState, useMemo, useCallback } from "react";
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
import { Trash2, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarView } from "./trading/CalendarView";
import { RootState } from "@/app/store";
import { useDispatch, useSelector } from "react-redux";
import { TradeJournalDialog } from "./TradeJournalDialog";
import { deleteTradeFromFirestore, TradeDetails } from "@/app/traceSlice";
import { TradeDetailsDialog } from "./TradeDetailsDialog";

const allColumns = [
  { key: "openDate", label: "Open Date" },
  { key: "closeDate", label: "Close Date" },
  { key: "symbol", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "entry", label: "Entry Price" },
  { key: "exit", label: "Exit Price" },
  { key: "qty", label: "Quantity" },
  { key: "pnl", label: "Profit/Loss" },
  { key: "status", label: "Status" },
] as const;

type ColumnKey = (typeof allColumns)[number]["key"];
type ViewMode = "table" | "calendar";
type TimeFrame = "daily" | "weekly" | "monthly";

export function Trades() {
  const dispatch = useDispatch();
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
  const [selectedItem, setSelectedItem] = useState<TradeDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const trades: TradeDetails[] = useSelector((state: RootState) =>
    state.TradeData.trades.map((trade) => trade.trade)
  );

  // Memoized function for formatting values
  const formatValue = useCallback((key: ColumnKey, value: any) => {
    if (value == null || value === "") return "-";

    switch (key) {
      case "openDate":
      case "closeDate":
        return format(new Date(value), "MMM dd, yyyy HH:mm");
      case "entry":
      case "exit":
      case "pnl":
        return `$${Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      case "qty":
        return Number(value).toLocaleString();
      default:
        return value;
    }
  }, []);

  const processedData = useMemo(() => {
    let data = [...trades]; // Create a copy to avoid mutating the original state

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const columnKey = key as ColumnKey;
        data = data.filter((item) =>
          String(item[columnKey]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      const key = sortConfig.key;
      const direction = sortConfig.direction;
      data.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) {
          return direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [trades, filters, sortConfig]);

  // Pagination
  const totalPages = useMemo(
    () => Math.ceil(processedData.length / pageSize),
    [processedData.length, pageSize]
  );

  const paginatedData = useMemo(() => {
    return processedData.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [processedData, currentPage, pageSize]);

  const handleSort = useCallback((key: ColumnKey) => {
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
  }, []);

  const getSortIcon = useCallback(
    (key: ColumnKey) => {
      if (sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4" />;
      if (sortConfig.direction === "asc")
        return <ChevronUp className="w-4 h-4" />;
      return <ChevronDown className="w-4 h-4" />;
    },
    [sortConfig]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const handleEdit = useCallback((e: React.MouseEvent, item: TradeDetails) => {
    e.stopPropagation();
    setIsEditOpen(true);
    setSelectedItem(item);
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent, tradeId: string) => {
      e.stopPropagation();
      dispatch(deleteTradeFromFirestore(tradeId) as any);
    },
    [dispatch]
  );

  const handleRowDoubleClick = useCallback((item: TradeDetails) => {
    setIsDetailsOpen(true);
    setSelectedItem(item);
  }, []);

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
                            value={filters[column.key] || ""}
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
                    onDoubleClick={() => handleRowDoubleClick(row)}
                    key={row.tradeId}
                    className="hover:bg-gray-50 cursor-pointer group relative"
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
                    <div className="absolute right-0 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded-l-md shadow-md">
                        <button
                          className="text-gray-500 hover:text-gray-700"
                          onClick={(e) => handleEdit(e, row)}
                          title="Edit Trade"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete Trade"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={(e) => handleDelete(e, row.tradeId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute inset-y-0 right-full w-4 bg-gradient-to-r from-transparent to-gray-50 pointer-events-none"></div>
                    </div>
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
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(pageNumber)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLastPage}
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

      <TradeJournalDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        trade={selectedItem!}
      />

      <TradeDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        trade={selectedItem!}
      />
    </div>
  );
}
