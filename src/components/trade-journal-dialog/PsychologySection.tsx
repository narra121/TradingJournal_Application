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

export interface PsychologyState {
  greed: boolean;
  fomo: boolean;
  revenge: boolean;
  fear: boolean;
  overconfidence: boolean;
  patience: boolean;
  emotionalState: string;
  notes: string;
}

interface PsychologySectionProps {
  psychology: PsychologyState;
  onChange: (changes: Partial<PsychologyState>) => void;
  emotionalStates: string[];
}

export function PsychologySection({ psychology, onChange, emotionalStates }: PsychologySectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" /> Trade Psychology
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="greed"
            checked={psychology.greed}
            onCheckedChange={(checked) => onChange({ greed: !!checked })}
          />
          <Label htmlFor="greed">Greedy</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fomo"
            checked={psychology.fomo}
            onCheckedChange={(checked) => onChange({ fomo: !!checked })}
          />
          <Label htmlFor="fomo">FOMO</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="revenge"
            checked={psychology.revenge}
            onCheckedChange={(checked) => onChange({ revenge: !!checked })}
          />
          <Label htmlFor="revenge">Revenge</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fear"
            checked={psychology.fear}
            onCheckedChange={(checked) => onChange({ fear: !!checked })}
          />
          <Label htmlFor="fear">Fear</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="overconfidence"
            checked={psychology.overconfidence}
            onCheckedChange={(checked) => onChange({ overconfidence: !!checked })}
          />
          <Label htmlFor="overconfidence">Overconfidence</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="patience"
            checked={psychology.patience}
            onCheckedChange={(checked) => onChange({ patience: !!checked })}
          />
          <Label htmlFor="patience">Patience</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Emotional State</Label>
        <Select
          value={psychology.emotionalState}
          onValueChange={(value) => onChange({ emotionalState: value })}
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
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
