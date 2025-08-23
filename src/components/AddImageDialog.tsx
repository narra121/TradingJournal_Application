
import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { v4 as uuidv4 } from "uuid";
import { ImageType } from "@/app/types";

interface ImageEntry extends ImageType {
  id: string;
}

export function AddImageDialog({
  isOpen,
  setIsOpen,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (images: ImageType[]) => void;
}) {
  const [entries, setEntries] = useState<ImageEntry[]>([
    { id: uuidv4(), url: "", description: "", timeframe: "" },
  ]);

  const handleAddNext = () => {
    setEntries([
      ...entries,
      { id: uuidv4(), url: "", description: "", timeframe: "" },
    ]);
  };

  const handleChange = (
    index: number,
    field: keyof ImageEntry,
    value: string
  ) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSave = () => {
    onSave(entries);
    setIsOpen(false);
    setEntries([{ id: uuidv4(), url: "", description: "", timeframe: "" }]);
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Images</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto pr-6">
          {entries.map((entry, index) => (
            <div key={entry.id} className="space-y-4 border-b pb-6 last:border-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <Select
                  value={entry.timeframe}
                  onValueChange={(value: string) =>
                    handleChange(index, "timeframe", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1m</SelectItem>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="30m">30m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="1d">1d</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <textarea
                    value={entry.url}
                    onChange={(e) =>
                      handleChange(index, "url", e.target.value)
                    }
                    className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Paste image URL or base64 data"
                  />
                </div>

                {entry.url && (
                  <div className="relative h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={entry.url}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                  className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Enter description"
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddNext}>Add Next Image</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
