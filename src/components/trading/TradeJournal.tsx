import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Check,
  Trash2,
  Edit2,
  Merge,
  AlertCircle,
  Loader,
  Clipboard,
  Import,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { AppDispatch } from "@/app/store";
import { useDispatch } from "react-redux";
import { randomUUID } from "crypto";
import {
  addTradeToFirestore,
  TradeDetails,
  tradesSlice,
} from "@/app/traceSlice";
import { v4 as uuidv4 } from "uuid";

interface ImportedTrade {
  tradeId: string;
  OpenDate: string;
  CloseDate: string;
  Symbol: string;
  Side: string;
  Entry: number;
  Exit: number;
  Qty: number;
  "P&L": string;
  Status: string;
}

interface Trade {
  tradeId: string;
  openDate: string;
  closeDate: string;
  symbol: string;
  side: string;
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  status: string;
  selected?: boolean;
}

const TradeJournal: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trades, setTrades] = useState<TradeDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof Trade;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [screenshotText, setScreenshotText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch: AppDispatch = useDispatch();

  const convertImportedTradeToTrade = (importedTrade: ImportedTrade): Trade => {
    return {
      tradeId: uuidv4(),

      openDate: new Date(importedTrade.OpenDate).toISOString().split("T")[0],
      closeDate: new Date(importedTrade.CloseDate).toISOString().split("T")[0],
      symbol: importedTrade.Symbol,
      side: importedTrade.Side.toLowerCase(),
      entry: importedTrade.Entry,
      exit: importedTrade.Exit,
      qty: importedTrade.Qty,

      pnl: parseFloat(importedTrade["P&L"].replace(/[^0-9.-]+/g, "")),
      status: importedTrade.Status.toLowerCase() === "win" ? "tp" : "sl",
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "https://importtrades.azurewebsites.net/api/importtrades",
        {
          method: "POST",
          headers: {
            "Access-Control-Allow-Credentials": "true", // Allow cookies
            "Access-Control-Allow-Origin": "*", // Allow all origins (or specify a specific one)
            "Access-Control-Allow-Methods": "POST, OPTIONS", // Allowed HTTP methods
            "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allowed headers
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseText = await response.text();
      const importedTrades: ImportedTrade[] = JSON.parse(responseText);

      // Convert and validate the imported trades
      const newTrades = importedTrades.map(convertImportedTradeToTrade);

      setTrades((prev) => [...prev, ...newTrades]);
      // Close dialog after successful import
    } catch (error) {
      console.error("Error processing trade image:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process the trade image"
      );
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleScreenshotTextSubmit = async () => {
    if (!screenshotText.trim()) {
      setError("Please paste some text from your screenshot first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://importtrades.azurewebsites.net/api/importtrades",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: screenshotText }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const importedTrades: ImportedTrade[] = await response.json();

      // Convert and validate the imported trades
      const newTrades = importedTrades.map(convertImportedTradeToTrade);

      setTrades((prev) => [...prev, ...newTrades]);
      setScreenshotText(""); // Clear the text area after processing
      setIsDialogOpen(false); // Close dialog after successful import
    } catch (error) {
      console.error("Error processing trade text:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process the trade text"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellClick = (id: string, field: keyof Trade) => {
    const trade = trades.find((t) => t.tradeId === id);
    if (!trade) return;

    setEditingCell({ id, field });
    setEditValue(String(trade[field]));
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const saveEdit = () => {
    if (!editingCell) return;

    setTrades(
      trades.map((trade) => {
        if (trade.tradeId === editingCell.id) {
          let value: any = editValue;

          // Convert value to appropriate type based on field
          if (["entry", "exit", "qty", "pnl"].includes(editingCell.field)) {
            value = parseFloat(value);
            if (isNaN(value)) value = 0;
          }

          return { ...trade, [editingCell.field]: value };
        }
        return trade;
      })
    );
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const toggleTradeSelection = (id: string) => {
    setSelectedTrades((prev) => {
      if (prev.includes(id)) {
        return prev.filter((tradeId) => tradeId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const deleteTrades = () => {
    if (selectedTrades.length === 0) {
      setError("Please select at least one trade to delete");
      return;
    }

    // Filter out the selected trades
    const updatedTrades = trades.filter(
      (trade) => !selectedTrades.includes(trade.tradeId)
    );
    setTrades(updatedTrades);
    setSelectedTrades([]); // Clear selection after deletion
    setError(null);
  };

  const mergeTrades = () => {
    if (selectedTrades.length < 2) {
      setError("Please select at least 2 trades to merge");
      return;
    }

    // Get selected trades and remaining trades
    const selectedTradeObjects = trades.filter((trade) =>
      selectedTrades.includes(trade.tradeId)
    );
    const otherTrades = trades.filter(
      (trade) => !selectedTrades.includes(trade.tradeId)
    );

    // Sort selected trades by open date
    selectedTradeObjects.sort(
      (a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
    );

    // Check if all selected trades have the same symbol
    const allSameSymbol = selectedTradeObjects.every(
      (trade) => trade.symbol === selectedTradeObjects[0].symbol
    );
    if (!allSameSymbol) {
      setError("Cannot merge trades with different symbols");
      return;
    }

    // Calculate weighted average entry and exit prices
    const totalQty = selectedTradeObjects.reduce(
      (sum, trade) => sum + trade.qty,
      0
    );
    const weightedEntry =
      selectedTradeObjects.reduce(
        (sum, trade) => sum + trade.entry * trade.qty,
        0
      ) / totalQty;
    const weightedExit =
      selectedTradeObjects.reduce(
        (sum, trade) => sum + trade.exit * trade.qty,
        0
      ) / totalQty;

    // Create a merged trade
    const mergedTrade: Trade = {
      tradeId: `merged-${Date.now()}`,
      openDate: selectedTradeObjects[0].openDate, // Earliest open date
      closeDate:
        selectedTradeObjects[selectedTradeObjects.length - 1].closeDate, // Latest close date
      symbol: selectedTradeObjects[0].symbol,
      side: selectedTradeObjects[0].side, // Use the side of the first trade
      entry: parseFloat(weightedEntry.toFixed(2)),
      exit: parseFloat(weightedExit.toFixed(2)),
      qty: parseFloat(totalQty.toFixed(2)),

      pnl: parseFloat(
        selectedTradeObjects
          .reduce((sum, trade) => sum + trade.pnl, 0)
          .toFixed(2)
      ),
      status: selectedTradeObjects.some((trade) => trade.status === "tp")
        ? "tp"
        : "sl",
    };

    // Update trades with the merged one
    setTrades([...otherTrades, mergedTrade]);
    setSelectedTrades([]); // Clear selection after merging
    setError(null);
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Import className="w-5 h-5 mr-2" />
        Import Trades
      </button>
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-[5%] left-[5%] w-[90%] h-[90%] bg-white rounded-lg shadow-xl p-6 overflow-y-auto">
            <div className=" flex justify-between items-center">
              <div className="flex space-x-4">
                {selectedTrades.length > 0 && (
                  <>
                    <button
                      onClick={mergeTrades}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      disabled={selectedTrades.length < 2}
                    >
                      <Merge className="w-5 h-5 mr-2" />
                      Merge Selected ({selectedTrades.length})
                    </button>
                    <button
                      onClick={deleteTrades}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete Selected ({selectedTrades.length})
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start mb-6">
              <Dialog.Title className="text-xl font-semibold">
                Import Trades
              </Dialog.Title>
              <Dialog.Close className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </Dialog.Close>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Trade Screenshot
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Supported formats: PNG, JPG, JPEG
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => dispatch(addTradeToFirestore(trades))}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Import className="w-5 h-5 mr-2" />
                    Import Trades
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto h-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrades(trades.map((t) => t.tradeId));
                            } else {
                              setSelectedTrades([]);
                            }
                          }}
                          checked={
                            selectedTrades.length === trades.length &&
                            trades.length > 0
                          }
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Open Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Close Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Side
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          <div className="flex flex-col items-center justify-center py-8">
                            <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-lg font-medium">
                              No trades found
                            </p>
                            <p className="text-gray-500 mt-1">
                              Click "Import Trades" to get started
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade) => (
                        <tr
                          key={trade.tradeId}
                          className={
                            selectedTrades.includes(trade.tradeId)
                              ? "bg-blue-50"
                              : ""
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={selectedTrades.includes(trade.tradeId)}
                              onChange={() =>
                                toggleTradeSelection(trade.tradeId)
                              }
                            />
                          </td>
                          {Object.keys(trade)
                            .filter(
                              (key) => key !== "tradeId" && key !== "selected"
                            )
                            .map((key) => {
                              const field = key as keyof Trade;
                              const isEditing =
                                editingCell?.id === trade.tradeId &&
                                editingCell?.field === field;

                              // Format values for display
                              let displayValue = String(trade[field]);
                              if (field === "pnl") {
                                const value = trade[field] as number;
                                displayValue =
                                  value >= 0
                                    ? `$${value.toFixed(2)}`
                                    : `-$${Math.abs(value).toFixed(2)}`;
                              } else if (["entry", "exit"].includes(field)) {
                                displayValue = (trade[field] as number).toFixed(
                                  2
                                );
                              }

                              // Apply styling based on field type
                              let cellClass =
                                "px-6 py-4 whitespace-nowrap text-sm";
                              if (field === "pnl") {
                                const value = trade[field] as number;
                                cellClass +=
                                  value >= 0
                                    ? " text-green-600"
                                    : " text-red-600";
                              } else if (field === "side") {
                                cellClass +=
                                  trade[field] === "buy"
                                    ? " text-green-600"
                                    : " text-red-600";
                              } else if (field === "status") {
                                cellClass +=
                                  trade[field] === "tp"
                                    ? " text-green-600"
                                    : " text-red-600";
                              }

                              return (
                                <td
                                  key={`${trade.tradeId}-${field}`}
                                  className={cellClass}
                                  onDoubleClick={() =>
                                    handleCellClick(trade.tradeId, field)
                                  }
                                >
                                  {isEditing ? (
                                    <div className="flex items-center">
                                      <input
                                        type={
                                          [
                                            "entry",
                                            "exit",
                                            "qty",

                                            "pnl",
                                          ].includes(field)
                                            ? "number"
                                            : "text"
                                        }
                                        value={editValue}
                                        onBlur={saveEdit}
                                        onChange={handleCellEdit}
                                        onKeyDown={handleKeyDown}
                                        className=" w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-gray-300 "
                                        autoFocus
                                        step={
                                          [
                                            "entry",
                                            "exit",
                                            "qty",

                                            "pnl",
                                          ].includes(field)
                                            ? "0.01"
                                            : undefined
                                        }
                                      />
                                      {/* <div className="ml-2 flex space-x-1">
                                        <button
                                          onClick={saveEdit}
                                          className="text-green-600 hover:text-green-800"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={cancelEdit}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div> */}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between group">
                                      <span>{displayValue}</span>
                                      <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {trades.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {trades.length}{" "}
                    {trades.length === 1 ? "trade" : "trades"}
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      First
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      &lt;
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      &gt;
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default TradeJournal;
