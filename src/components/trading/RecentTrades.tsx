import React, { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Trade, TradeDetails } from "@/app/traceSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

export function RecentTrades() {
  const trades: TradeDetails[] = useSelector((state: RootState) =>
    state.TradeData.trades.map((trade) => trade.trade)
  );

  useEffect(() => {
    console.log(trades);
  }, [trades]);
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
      <div className="space-y-6">
        {trades.map((trade) => (
          <div key={trade.symbol} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                className={
                  trade.pnl >= 0
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }
                >
                  {trade.symbol.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">{trade.symbol}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      trade.side === "buy"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {trade.side.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(trade.closeDate, { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {trade.pnl >= 0 ? "+" : ""}
                {trade.pnl.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {trade.qty} lot{trade.qty !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}
