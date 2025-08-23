import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { Trade } from "@/app/types";

interface PsychologySectionProps {
  psychology: Trade["psychology"];
  handlePsychologyChange: (
    field: keyof Trade["psychology"],
    value: any
  ) => void;
  emotionalStates: string[];
}

export function PsychologySection({
  psychology,
  handlePsychologyChange,
  emotionalStates,
}: PsychologySectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" /> Trade Psychology
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="greedy"
            checked={psychology.isGreedy}
            onCheckedChange={(checked) =>
              handlePsychologyChange("isGreedy", !!checked)
            }
          />
          <Label htmlFor="greedy">Greedy</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fomo"
            checked={psychology.isFomo}
            onCheckedChange={(checked) =>
              handlePsychologyChange("isFomo", !!checked)
            }
          />
          <Label htmlFor="fomo">FOMO</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="revenge"
            checked={psychology.isRevenge}
            onCheckedChange={(checked) =>
              handlePsychologyChange("isRevenge", !!checked)
            }
          />
          <Label htmlFor="revenge">Revenge</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Emotional State</Label>
        <Select
          value={psychology.emotionalState}
          onValueChange={(value) =>
            handlePsychologyChange("emotionalState", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select emotional state" />
          </SelectTrigger>
          <SelectContent>
            {emotionalStates.map((state) => (
              <SelectItem key={state} value={state.toLowerCase()}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Trade Notes</Label>
        <Textarea
          placeholder="Enter your trade notes here..."
          value={psychology.notes}
          onChange={(e) => handlePsychologyChange("notes", e.target.value)}
        />
      </div>
    </div>
  );
}
