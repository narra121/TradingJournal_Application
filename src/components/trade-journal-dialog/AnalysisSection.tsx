import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { TrendingUp } from "lucide-react";

export interface AnalysisState {
  riskRewardRatio: number | null;
  setupType: string;
  mistakes: string[];
}

interface AnalysisSectionProps {
  analysis: AnalysisState;
  onChange: (changes: Partial<AnalysisState>) => void;
  setupTypes: string[];
  tradeMistakes: string[];
}

export function AnalysisSection({ analysis, onChange, setupTypes, tradeMistakes }: AnalysisSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" /> Trade Analysis
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Risk/Reward Ratio</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g., 2.5"
            value={analysis.riskRewardRatio ?? ''}
            onChange={(e) => onChange({ riskRewardRatio: e.target.value === '' ? null : parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Setup Type</Label>
          <Select
            value={analysis.setupType}
            onValueChange={(value) => onChange({ setupType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select setup type" />
            </SelectTrigger>
            <SelectContent>
              {setupTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Trade Mistakes</Label>
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="no-mistakes"
            checked={analysis.mistakes.length === 0}
            onCheckedChange={(c) => {
              if (c) onChange({ mistakes: [] })
            }}
          />
          <Label htmlFor="no-mistakes" className="text-sm">No Mistakes</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tradeMistakes.map((mistake) => {
            const key = mistake.toLowerCase()
            const checked = analysis.mistakes.includes(key)
            return (
              <div key={mistake} className="flex items-center space-x-2">
                <Checkbox
                  id={key.replace(/\s/g, '-')}
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...analysis.mistakes, key]
                      : analysis.mistakes.filter(m => m !== key)
                    onChange({ mistakes: next })
                  }}
                />
                <Label htmlFor={key.replace(/\s/g, '-')} className="text-sm">{mistake}</Label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
