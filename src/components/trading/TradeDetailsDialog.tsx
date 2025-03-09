import React from "react";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { Trade, TradeDetails } from "@/app/traceSlice";
import { RootState } from "@/app/store";

interface TradeDetailsDialogProps {
  isOpen: boolean;
  timeframe: string;
  onClose: () => void;
  aggTrade: any;
  onNavigate: (direction: "prev" | "next") => void;
}

// Sample images for demonstration
const sampleImages = {
  BTCUSD: [
    {
      url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
      description: "Bitcoin price action showing strong support at key levels.",
    },
    {
      url: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=800",
      description:
        "Technical analysis of BTC/USD with trend lines and indicators.",
    },
  ],
  ETHUSD: [
    {
      url: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800",
      description:
        "Ethereum chart analysis with volume profile and key price levels.",
    },
  ],
  XAUUSD: [
    {
      url: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800",
      description:
        "Gold price action with support and resistance zones marked.",
    },
  ],
  EURUSD: [
    {
      url: "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800",
      description: "EUR/USD forex pair analysis showing market structure.",
    },
  ],
};

export function TradeDetailsDialogAnalytics({
  isOpen,
  onClose,
  aggTrade,
  onNavigate,
}: TradeDetailsDialogProps) {
  // Duration in minutes
  const trades: TradeDetails[] = useSelector((state: RootState) => {
    const weekStart = startOfWeek(aggTrade.date, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(aggTrade.date, { weekStartsOn: 1 }); // Sunday end

    return state.TradeData.trades
      .filter((trade) => {
        const tradeDate = parseISO(trade.trade.closeDate); // Convert string to Date object
        return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
      })
      .map((trade) => trade.trade);
  });

  const [selectedTrade, setSelectedTrade] = React.useState<TradeDetails>(
    trades[0]
  );

  const images: any = [];
  const duration = 100;
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
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
                  Trades in {aggTrade.date}
                </h3>
              </div>
              <div className="space-y-2">
                {trades.map((trade, index) => (
                  <div
                    onClick={() => setSelectedTrade(trade)}
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{trade.symbol}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(trade.closeDate), "HH:mm")}
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
                  {selectedTrade.symbol}
                </h3>
                <p
                  className={`text-sm ${
                    selectedTrade.side === "buy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedTrade.side.toUpperCase()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Open Time:</span>
                  <br />
                  {format(selectedTrade.openDate, "PPpp")}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Close Time:</span>
                  <br />
                  {format(selectedTrade.closeDate, "PPpp")}
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
                  {selectedTrade.openDate}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Exit Price:</span>
                  <br />
                  {selectedTrade.closeDate}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Volume:</span>
                  <br />
                  {selectedTrade.qty} lots
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Profit/Loss:</span>
                  <br />
                  <span
                    className={
                      selectedTrade.pnl >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {selectedTrade.pnl >= 0 ? "+" : ""}
                    {selectedTrade.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content with chart images */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {images.map((image: any, index: any) => (
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
