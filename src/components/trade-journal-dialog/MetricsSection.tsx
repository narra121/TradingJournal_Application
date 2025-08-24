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

export interface MetricsState {
  riskAmount: number | null;
  marketCondition: string;
  tradingSession: string;
}

interface MetricsSectionProps {
  metrics: MetricsState;
  onChange: (changes: Partial<MetricsState>) => void;
  marketConditions: string[];
  sessions: string[];
}

export function MetricsSection({ metrics, onChange, marketConditions, sessions }: MetricsSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart className="w-5 h-5 text-blue-500" /> Additional Metrics
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Risk Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g., 100"
              value={metrics.riskAmount ?? ''}
              onChange={(e) => onChange({ riskAmount: e.target.value === '' ? null : parseFloat(e.target.value) })}
            />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Market Condition</Label>
          <Select
            value={metrics.marketCondition}
            onValueChange={(value) => onChange({ marketCondition: value })}
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
            onValueChange={(value) => onChange({ tradingSession: value })}
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
