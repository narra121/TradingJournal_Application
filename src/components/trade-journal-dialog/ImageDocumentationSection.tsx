import { Upload } from "lucide-react";

import { ImageType } from "@/app/types";
import { AddImageDialog } from "../AddImageDialog";

interface ImageDocumentationSectionProps {
  images: ImageType[];
  setImages: (images: ImageType[]) => void;
}

export function ImageDocumentationSection({
  images,
  setImages,
}: ImageDocumentationSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Upload className="w-5 h-5 text-purple-500" /> Image Documentation
      </h3>
      <AddImageDialog
        isOpen={false} // This dialog is opened by a button, not directly here
        setIsOpen={() => {}}
        onSave={(newImages) =>
          setImages(newImages.map((img) => ({ ...img, file: new File([], "") })))
        } // Placeholder for now
      />
    </div>
  );
}
