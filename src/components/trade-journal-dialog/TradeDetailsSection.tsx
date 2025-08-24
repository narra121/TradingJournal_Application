import { Label } from "@/ui/label";
import { ApiTrade } from "@/app/types";

interface TradeDetailsSectionProps {
  trade: ApiTrade;
}

export function TradeDetailsSection({ trade }: TradeDetailsSectionProps) {
  return (
    <div className="w-1/4 space-y-4 self-start sticky top-6">
      <div>
        <Label className="text-xs text-muted-foreground">Symbol</Label>
        <p className="text-lg font-bold">{trade.symbol}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Side</Label>
        <p
          className={`text-lg font-bold ${
            trade.side === "BUY" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trade.side}
        </p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Entry Price</Label>
        <p className="text-base">${trade.entryPrice ?? '-'}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Exit Price</Label>
        <p className="text-base">${trade.exitPrice ?? '-'}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Quantity</Label>
        <p className="text-base">{trade.quantity}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Profit/Loss</Label>
        <p
          className={`text-lg font-bold ${
            (trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          ${(trade.pnl ?? 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
