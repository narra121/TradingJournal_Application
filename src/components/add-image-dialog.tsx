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

interface ImageEntry {
  title: string;
  description: string;
  imageUrl: string;
}

export function AddImageDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [entries, setEntries] = useState<ImageEntry[]>([
    { title: "", description: "", imageUrl: "" },
  ]);

  const handleAddNext = () => {
    setEntries([...entries, { title: "", description: "", imageUrl: "" }]);
  };

  const handleChange = (
    index: number,
    field: keyof ImageEntry,
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleSave = () => {
    // Handle saving the entries
    console.log("Saving entries:", entries);
    setIsOpen(false);
    setEntries([{ title: "", description: "", imageUrl: "" }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Images
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Images</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto pr-6">
          {entries.map((entry, index) => (
            <div key={index} className="space-y-4 border-b pb-6 last:border-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => handleChange(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <textarea
                    value={entry.imageUrl}
                    onChange={(e) =>
                      handleChange(index, "imageUrl", e.target.value)
                    }
                    className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Paste image URL or base64 data"
                  />
                </div>

                {entry.imageUrl && (
                  <div className="relative h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={entry.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/400x300?text=Invalid+Image";
                      }}
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
