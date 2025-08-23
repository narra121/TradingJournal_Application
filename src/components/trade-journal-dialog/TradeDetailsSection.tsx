import { Label } from "@/ui/label";
import { Trade } from "@/app/types";

interface TradeDetailsSectionProps {
  tradeData: Trade;
}

export function TradeDetailsSection({ tradeData }: TradeDetailsSectionProps) {
  return (
    <div className="w-1/4 space-y-4 self-start sticky top-6">
      {" "}
      {/* Adjust sticky top */}
      <div>
        <Label className="text-xs text-muted-foreground">Symbol</Label>
        <p className="text-lg font-bold">{tradeData.trade.symbol}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Side</Label>
        <p
          className={`text-lg font-bold ${
            tradeData.trade.side === "buy" ? "text-green-600" : "text-red-600"
          }`}
        >
          {tradeData.trade.side.toUpperCase()}
        </p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Entry Price</Label>
        <p className="text-base">${tradeData.trade.entry}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Exit Price</Label>
        <p className="text-base">${tradeData.trade.exit}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Quantity</Label>
        <p className="text-base">{tradeData.trade.qty}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Profit/Loss</Label>
        <p
          className={`text-lg font-bold ${
            tradeData.trade.pnl >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          ${tradeData.trade.pnl.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
