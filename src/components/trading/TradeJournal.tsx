import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog"; // Assuming DialogFooter might be needed later if not already used
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Loader2, Upload, X, Check } from "lucide-react"; // Import Check icon
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { DateTimePicker24h } from "@/ui/DateTimePicker";
import { Checkbox } from "@/ui/checkbox";
import { parse, isValid } from "date-fns";
import { useDispatch } from "react-redux";
import { addTradeToFirestore, TradeDetails } from "@/app/traceSlice";

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
const parseDateString = (dateString: string): Date => {
  let format: string = "yyyy-MM-dd HH:mm:ss";
  const date = parse(dateString, format, new Date());
  return isValid(date) ? date : new Date();
};
export function TradeImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof Trade;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For image processing
  const [isSaving, setIsSaving] = useState(false); // For saving trades
  const [isSaved, setIsSaved] = useState(false); // Track successful save
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setIsDirty(false); // Reset dirty state on new upload
    setIsSaved(false); // Reset saved state on new upload
    try {
      // Simulate API call to process image
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);

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
      let importedTrades: Trade[] = JSON.parse(responseText);
      importedTrades = importedTrades.map((trade) => ({
        ...trade,
        tradeId: uuidv4(),
        selected: false, //Initialize selected to false
      }));
      setTrades(importedTrades);
      if (importedTrades.length > 0) {
        setIsDirty(true); // Set dirty to true after successful import with trades
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setIsDirty(false); // Ensure dirty is false if import fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          break;
        }
      }
    },
    [handleImageUpload]
  );

  const handleCellEdit = (
    id: string,
    field: keyof Trade,
    value: string | number
  ) => {
    setTrades(
      trades.map((trade) =>
        trade.tradeId === id ? { ...trade, [field]: value } : trade
      )
    );
    setEditingCell(null);
    setIsDirty(true);
    setIsSaved(false); // Reset saved state on edit
  };

  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false); // Reset saved state before attempting save
    try {
      const tradesToSave = trades.map((trade) => {
        const { selected, ...rest } = trade; // Exclude 'selected' property
        return rest;
      });
      // Assuming addTradeToFirestore returns a promise or can be awaited
      await dispatch(
        addTradeToFirestore(tradesToSave as TradeDetails[]) as any
      );
      setIsSaved(true); // Set saved state on success
      setIsDirty(false); // Mark as not dirty *after* successful save
    } catch (error) {
      console.error("Error saving trades:", error);
      // Optionally: show an error message to the user
      setIsSaved(false); // Ensure saved state is false on error
      // Keep isDirty true on save error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowSelect = (id: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) =>
        trade.tradeId === id ? { ...trade, selected: !trade.selected } : trade
      )
    );
  };

  const handleMergeTrades = () => {
    const selectedTrades = trades.filter((trade) => trade.selected);

    if (selectedTrades.length < 2) {
      alert("Select at least two trades to merge.");
      return;
    }

    const sides = [...new Set(selectedTrades.map((trade) => trade.side))];
    if (sides.length > 1) {
      alert("You can only merge trades with the same side.");
      return;
    }
    const symbols = [...new Set(selectedTrades.map((trade) => trade.symbol))];
    if (symbols.length > 1) {
      alert("You can only merge trades with the same symbol.");
      return;
    }
    const symbol = symbols[0];

    const mergedTrade: Trade = {
      tradeId: uuidv4(),
      symbol: symbol,
      openDate: selectedTrades.reduce((minDate, trade) => {
        const currentDate = parseDateString(trade.openDate);
        const min = parseDateString(minDate);
        console.log(currentDate, min);
        return currentDate < min ? trade.openDate : minDate;
      }, selectedTrades[0].openDate),
      closeDate: selectedTrades.reduce((maxDate, trade) => {
        const currentDate = parseDateString(trade.closeDate);
        const max = parseDateString(maxDate);
        return currentDate > max ? trade.closeDate : maxDate;
      }, selectedTrades[0].closeDate),
      pnl: selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0),
      status:
        selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0) >= 0
          ? "TP"
          : "SL",
      side: selectedTrades[0].side, // Assuming all trades are of the same side

      // Calculate Entry and Exit
      entry:
        selectedTrades[0].side === "BUY"
          ? selectedTrades.reduce((minEntry, trade) => {
              return trade.entry < minEntry ? trade.entry : minEntry;
            }, selectedTrades[0].entry)
          : selectedTrades.reduce((maxEntry, trade) => {
              return trade.entry > maxEntry ? trade.entry : maxEntry;
            }, selectedTrades[0].entry),

      exit:
        selectedTrades[0].side === "BUY"
          ? selectedTrades.reduce((maxExit, trade) => {
              return trade.exit > maxExit ? trade.exit : maxExit;
            }, selectedTrades[0].exit)
          : selectedTrades.reduce((minExit, trade) => {
              return trade.exit < minExit ? trade.exit : minExit;
            }, selectedTrades[0].exit),

      qty: selectedTrades.reduce((sum, trade) => sum + trade.qty, 0),
      selected: false,
    };

    setTrades((prevTrades) => [
      ...prevTrades.filter((trade) => !trade.selected),
      mergedTrade,
    ]);
  };

  const handleDeleteTrades = () => {
    setTrades((prevTrades) => prevTrades.filter((trade) => !trade.selected));
  };

  const handleClick = () => {
    setEditingCell(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Trades
        </Button>
      </DialogTrigger>
      <DialogContent
        onClick={handleClick}
        className="max-w-[90vw] max-h-[90vh] w-full h-full flex flex-col p-5 mb-10"
      >
        <DialogHeader className=" pb-2">
          <DialogTitle className="flex justify-between items-center">
            <span>Import Trades</span>
            {/* Removed the button from here */}
            {/* <div className="flex gap-2"> */}
            {/* {isDirty && (
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              )} */}
            {/* <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button> */}
            {/* </div> */}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1  space-y-4 overflow-hidden">
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors overflow-auto",
              "hover:border-zinc-400 cursor-pointer",
              uploadedImage ? "border-green-500" : "border-zinc-200",
              "max-h-[20vh]"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing image...
              </div>
            ) : uploadedImage ? (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded trade"
                  className="w-full h-auto"
                />
                <p className="text-sm text-zinc-500">
                  Click or paste another image to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-zinc-400" />
                <p>Drag & drop or paste a trade screenshot here</p>
                <p className="text-sm text-zinc-500">
                  Supported formats: PNG, JPG, JPEG
                </p>
              </div>
            )}
          </div>

          {trades.length > 0 && (
            <div
              className="border rounded-lg flex flex-col"
              // style={{ height: "calc(60vh - 2rem)" }}
            >
              <div className="flex justify-end p-2 gap-2">
                <Button variant="outline" onClick={handleMergeTrades}>
                  {"(" +
                    trades.filter((trade) => trade.selected).length +
                    ") Merge"}
                </Button>
                <Button variant="default" onClick={handleDeleteTrades}>
                  {"(" +
                    trades.filter((trade) => trade.selected).length +
                    ") Delete"}
                </Button>
              </div>
              <div className="bg-white border-b">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20px]"></TableHead>
                      <TableHead className="w-[160px]">Open Date</TableHead>
                      <TableHead className="w-[160px]">Close Date</TableHead>
                      <TableHead className="w-[100px]">Symbol</TableHead>
                      <TableHead className="w-[80px]">Side</TableHead>
                      <TableHead className="w-[100px]">Entry</TableHead>
                      <TableHead className="w-[100px]">Exit</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[100px]">P&L</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div
                className="overflow-auto h-[30vh]"
                onClick={(e) => {
                  if (editingCell) {
                    setEditingCell(null);
                  }
                }}
              >
                <Table>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell className="w-[20px]">
                          <Checkbox
                            checked={trade.selected || false}
                            onCheckedChange={() =>
                              handleRowSelect(trade.tradeId)
                            }
                          />
                        </TableCell>
                        <TableCell className="w-[160px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "openDate" ? (
                            <DateTimePicker24h />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "openDate",
                                });
                              }}
                            >
                              {trade.openDate}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[160px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "closeDate" ? (
                            <DateTimePicker24h />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "closeDate",
                                });
                              }}
                            >
                              {trade.closeDate}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "symbol" ? (
                            <Input
                              defaultValue={trade.symbol}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(
                                  trade.tradeId,
                                  "symbol",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "symbol",
                                });
                              }}
                            >
                              {trade.symbol}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[80px]">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              trade.side === "BUY"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {trade.side}
                          </span>
                        </TableCell>
                        <TableCell className="w-[100px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "entry" ? (
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={trade.entry}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(
                                  trade.tradeId,
                                  "entry",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "entry",
                                });
                              }}
                            >
                              {trade.entry}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "exit" ? (
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={trade.exit}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(
                                  trade.tradeId,
                                  "exit",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "exit",
                                });
                              }}
                            >
                              {trade.exit}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          {editingCell?.id === trade.tradeId &&
                          editingCell?.field === "qty" ? (
                            <Input
                              type="number"
                              defaultValue={trade.qty}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(
                                  trade.tradeId,
                                  "qty",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediate blur
                                setEditingCell({
                                  id: trade.tradeId,
                                  field: "qty",
                                });
                              }}
                            >
                              {trade.qty}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <span
                            className={cn(
                              "font-mono"
                              // trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            ${trade.pnl}
                          </span>
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-100">
                            {trade.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        {/* Footer with the updated button */}
        <div className="flex justify-end mt-4">
          {isSaved ? (
            <Button
              onClick={() => setIsOpen(false)}
              className="align-self-end gap-2"
            >
              <Check className="h-4 w-4" /> Close
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              // Enable if not saving AND (either dirty OR there are trades but not yet saved)
              // Simplified: Enable if not saving AND there are trades AND (it's dirty OR it hasn't been saved yet)
              // Let's refine the logic: Enable if not saving AND there are trades to save (isDirty is true)
              disabled={isSaving || !isDirty} // Button is disabled if saving is in progress OR if there are no changes (isDirty is false)
              className="align-self-end gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
