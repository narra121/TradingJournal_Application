import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Trade } from '@/app/types';
import { format } from 'date-fns';
import { cn } from 'lib/utils';
import { ScrollArea } from '@/ui/scroll-area';
import { TradeDetails } from './TradeDetails';

interface DailyTradesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  trades: Trade[];
}

export function DailyTradesDialog({ isOpen, onClose, selectedDate, trades }: DailyTradesDialogProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (isOpen && trades.length > 0) {
      setSelectedTrade(trades[0]); // Select the first trade when the dialog opens
    } else if (!isOpen) {
      setSelectedTrade(null); // Clear selected trade when dialog closes
    }
  }, [isOpen, trades]);

  if (!selectedDate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            Trades on {format(selectedDate, "PPP")} ({trades.length})
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(100%-64px)]"> {/* Adjusted height for content area */}
          {/* Left Column: List of Trades (20%) */}
          <div className="w-1/5 border-r p-4 flex flex-col">
            <ScrollArea className="flex-grow pr-4">
              {trades.length === 0 ? (
                <p className="text-gray-500">No trades for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {trades.map((trade) => (
                    <li
                      key={trade.trade.tradeId}
                      className={cn(
                        "p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors",
                        selectedTrade?.trade.tradeId === trade.trade.tradeId
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "bg-white"
                      )}
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <div className="text-sm font-medium">
                        {trade.trade.symbol}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          trade.trade.pnl >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        PNL: {trade.trade.pnl.toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          {/* Right Column: Trade Details (80%) */}
          <div className="w-4/5 p-4 flex flex-col">
            <ScrollArea className="flex-grow pr-4">
              {selectedTrade ? (
                <TradeDetails trade={selectedTrade.trade} />
              ) : (
                <p className="text-gray-500">Select a trade to view details.</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
