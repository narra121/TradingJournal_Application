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
import { Trade } from "@/app/types";

interface AnalysisSectionProps {
  analysis: Trade["analysis"];
  handleAnalysisChange: (field: keyof Trade["analysis"], value: any) => void;
  setupTypes: string[];
  tradeMistakes: string[];
}

export function AnalysisSection({
  analysis,
  handleAnalysisChange,
  setupTypes,
  tradeMistakes,
}: AnalysisSectionProps) {
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
            value={analysis.riskRewardRatio || ""}
            onChange={(e) =>
              handleAnalysisChange(
                "riskRewardRatio",
                parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Setup Type</Label>
          <Select
            value={analysis.setupType}
            onValueChange={(value) => handleAnalysisChange("setupType", value)}
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
        <div className="grid grid-cols-3 gap-2">
          {tradeMistakes.map((mistake) => (
            <div key={mistake} className="flex items-center space-x-2">
              <Checkbox
                id={mistake.toLowerCase().replace(/\s/g, "-")}
                checked={analysis.mistakes.includes(mistake.toLowerCase())}
                onCheckedChange={(checked) => {
                  const updatedMistakes = checked
                    ? [...analysis.mistakes, mistake.toLowerCase()]
                    : analysis.mistakes.filter(
                        (m) => m !== mistake.toLowerCase()
                      );
                  handleAnalysisChange("mistakes", updatedMistakes);
                }}
              />
              <Label
                htmlFor={mistake.toLowerCase().replace(/\s/g, "-")}
                className="text-sm"
              >
                {mistake}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
