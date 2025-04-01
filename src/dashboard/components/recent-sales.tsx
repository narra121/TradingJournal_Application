import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { TradeDetails } from "@/app/traceSlice";

interface TradeItemProps {
  trade: TradeDetails;
}

const TradeItem: React.FC<TradeItemProps> = ({ trade }) => {
  const isProfitable = trade.pnl && trade.pnl > 0;
  const isLoss = trade.pnl && trade.pnl < 0;

  return (
    <div className="flex items-center p-4 rounded-lg transition-colors hover:bg-muted/50">
      <Avatar className="h-10 w-10 border-2 border-border">
        <AvatarImage
          src={`https://pi.dicebear.com/7.x/initials/svg?seed=${trade.symbol}`}
        />
        <AvatarFallback className="">
          {trade.symbol?.substring(0, 2).toUpperCase() || "TR"}
        </AvatarFallback>
      </Avatar>
      <div className="ml-4 space-y-1 flex-1">
        <div className="flex items-center">
          <p className="text-sm font-medium leading-none">
            {trade.symbol || "Unknown Symbol"}
          </p>
          <Badge
            variant={
              trade.side.toLowerCase() === "buy" ? "default" : "secondary"
            }
            className="ml-2 capitalize"
          >
            {trade.side.toLowerCase()}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {trade.openDate || "Unknown Time"}
        </p>
      </div>
      <div
        className={cn(
          "font-medium tabular-nums text-right"
          // isProfitable && "text-green-500",
          // isLoss && "text-red-500"
        )}
      >
        <div className="flex items-center gap-1 justify-end">
          {isProfitable && <ArrowUpIcon className="w-4 h-4" />}
          {isLoss && <ArrowDownIcon className="w-4 h-4" />}
          {trade.pnl ? `$${Math.abs(trade.pnl).toFixed(2)}` : "N/A"}
        </div>
      </div>
    </div>
  );
};

export function RecentTrades() {
  const trades: TradeDetails[] = useSelector((state: RootState) => {
    // Sort trades by openDate descending before returning
    return state.TradeData.trades
      .map((trade) => trade.trade)
      .sort((a, b) => {
        // Assuming openDate is a string like 'YYYY-MM-DD HH:MM:SS' or ISO format
        // Parse dates for accurate comparison
        const dateA = new Date(a.openDate).getTime();
        const dateB = new Date(b.openDate).getTime();
        return dateB - dateA; // Sort descending (newest first)
      });
  });
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-1">
        {/* Map over the already sorted trades */}
        {trades.map((trade) => (
          <TradeItem key={trade.tradeId} trade={trade} />
        ))}
        {trades.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUpIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">No recent trades available.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
