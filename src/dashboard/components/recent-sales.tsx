import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { cn } from "lib/utils";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { selectRecentTrades } from "@/app/selectors";
import { ApiTrade } from "@/app/types";

interface TradeItemProps { trade: ApiTrade }

const TradeItem: React.FC<TradeItemProps> = ({ trade }) => {
  const isProfitable = (trade.pnl ?? 0) > 0;
  const isLoss = (trade.pnl ?? 0) < 0;

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
              trade.side === "BUY" ? "default" : "secondary"
            }
            className="ml-2 capitalize"
          >
            {trade.side}
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
          {typeof trade.pnl === 'number' ? `$${Math.abs(trade.pnl).toFixed(2)}` : "N/A"}
        </div>
      </div>
    </div>
  );
};

export function RecentTrades() {
  const trades = useSelector<any, ApiTrade[]>(selectRecentTrades as any);
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
