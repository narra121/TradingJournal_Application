import React, { useEffect } from "react";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, differenceInMinutes } from "date-fns";

import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import { useSelector } from "react-redux";
import { Trade, TradeDetails, ImageType } from "@/app/types";
import { RootState } from "@/app/store";

interface AggregatedTrade {
  date: Date;
}

interface TradeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  aggTrade: AggregatedTrade;
  onNavigate: (direction: "prev" | "next") => void;
}

export function TradeDetailsDialogAnalytics({
  isOpen,
  onClose,
  aggTrade,
  onNavigate,
}: TradeDetailsDialogProps) {
  const allTrades: Trade[] = useSelector((state: RootState) => {
    const weekStart = startOfWeek(aggTrade.date, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(aggTrade.date, { weekStartsOn: 1 }); // Sunday end

    return state.TradeData.trades
      .filter((trade) => {
        const tradeDate = parseISO(trade.trade.closeDate); // Convert string to Date object
        return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
      });
  });

  const [selectedTrade, setSelectedTrade] = React.useState<Trade | null>(null);

  useEffect(() => {
    if (allTrades.length > 0) {
      setSelectedTrade(allTrades[0]);
    } else {
      setSelectedTrade(null);
    }
  }, [allTrades]);

  const duration = selectedTrade ? differenceInMinutes(parseISO(selectedTrade.trade.closeDate), parseISO(selectedTrade.trade.openDate)) : 0;

  if (!selectedTrade) {
    return null; // Or a loading spinner, or a message
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Trade Details</DialogTitle>
        </DialogHeader>

        <div className="flex h-full gap-4 overflow-hidden">
          {/* Left sidebar with trade details */}

          <div className="w-64 border-r overflow-y-auto pr-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Trades in {format(aggTrade.date, "PPP")}
                </h3>
              </div>
              <div className="space-y-2">
                {allTrades.map((trade, index) => (
                  <div
                    onClick={() => setSelectedTrade(trade)}
                    key={trade.tradeId || index}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{trade.trade.symbol}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(trade.trade.closeDate), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-64 border-r overflow-y-auto pr-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">
                  {selectedTrade.trade.symbol}
                </h3>
                <p
                  className={`text-sm ${
                    selectedTrade.trade.side === "buy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedTrade.trade.side.toUpperCase()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Open Time:</span>
                  <br />
                  {format(parseISO(selectedTrade.trade.openDate), "PPpp")}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Close Time:</span>
                  <br />
                  {format(parseISO(selectedTrade.trade.closeDate), "PPpp")}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <br />
                  {duration.toFixed(1)} minutes
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Entry Price:</span>
                  <br />
                  {selectedTrade.trade.entry}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Exit Price:</span>
                  <br />
                  {selectedTrade.trade.exit}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Volume:</span>
                  <br />
                  {selectedTrade.trade.qty} lots
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Profit/Loss:</span>
                  <br />
                  <span
                    className={
                      selectedTrade.trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {selectedTrade.trade.pnl >= 0 ? "+" : ""}
                    {selectedTrade.trade.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content with chart images */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {selectedTrade.images.map((image: ImageType, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={image.url}
                      alt={`Trade analysis ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute left-4 right-4 bottom-4 flex justify-between">
          <Button variant="outline" onClick={() => onNavigate("prev")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Trade
          </Button>
          <Button variant="outline" onClick={() => onNavigate("next")}>
            Next Trade
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
