import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { BarChart } from "lucide-react";
import { Trade } from "@/app/types";

interface MetricsSectionProps {
  metrics: Trade["metrics"];
  handleMetricsChange: (field: keyof Trade["metrics"], value: any) => void;
  marketConditions: string[];
  sessions: string[];
}

export function MetricsSection({
  metrics,
  handleMetricsChange,
  marketConditions,
  sessions,
}: MetricsSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart className="w-5 h-5 text-blue-500" /> Additional Metrics
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Risk per Trade (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g., 1"
            value={metrics.riskPerTrade || ""}
            onChange={(e) =>
              handleMetricsChange(
                "riskPerTrade",
                parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Stop Loss Deviation</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g., 0.5"
            value={metrics.stopLossDeviation || ""}
            onChange={(e) =>
              handleMetricsChange(
                "stopLossDeviation",
                parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Target Deviation</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g., -0.2"
            value={metrics.targetDeviation || ""}
            onChange={(e) =>
              handleMetricsChange(
                "targetDeviation",
                parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Market Conditions</Label>
          <Select
            value={metrics.marketConditions}
            onValueChange={(value) =>
              handleMetricsChange("marketConditions", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select market condition" />
            </SelectTrigger>
            <SelectContent>
              {marketConditions.map((condition) => (
                <SelectItem key={condition} value={condition.toLowerCase()}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Trading Session</Label>
          <Select
            value={metrics.tradingSession}
            onValueChange={(value) =>
              handleMetricsChange("tradingSession", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trading session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session} value={session.toLowerCase()}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
