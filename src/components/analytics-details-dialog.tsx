import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";

interface AnalyticsDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsData[];
  currentItem: AnalyticsData;
  onNavigate: (direction: "prev" | "next") => void;
}

interface ImageData {
  url: string;
  description: string;
}

// Sample images for demonstration
const sampleImages: Record<string, ImageData[]> = {
  "1": [
    {
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      description:
        "Analytics dashboard showing key performance metrics and growth trends.",
    },
    {
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      description:
        "Team collaboration meeting discussing business strategy and metrics.",
    },
  ],
  "2": [
    {
      url: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800",
      description:
        "Sales performance visualization with detailed metrics breakdown.",
    },
  ],
  // Add more sample images for different IDs
};

export function AnalyticsDetailsDialog({
  isOpen,
  onClose,
  data,
  currentItem,
  onNavigate,
}: AnalyticsDetailsDialogProps) {
  const images = sampleImages[currentItem.id] || [];
  const currentIndex = data.findIndex((item) => item.id === currentItem.id);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Analytics Details</DialogTitle>
        </DialogHeader>
        <div className="flex h-full gap-4 overflow-hidden">
          {/* Left sidebar with items list */}
          <div className="w-64 border-r overflow-y-auto pr-4">
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    item.id === currentItem.id
                      ? "bg-gray-100 border-gray-300"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    onNavigate(index < currentIndex ? "prev" : "next")
                  }
                >
                  <p className="font-medium">{item.date}</p>
                  <p className="text-sm text-gray-500">
                    ${item.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* Details section */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-2xl font-bold">
                      ${currentItem.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Orders</p>
                    <p className="text-2xl font-bold">{currentItem.orders}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Customers</p>
                    <p className="text-2xl font-bold">
                      {currentItem.customers}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold">
                      {currentItem.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Additional Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Region:</span>{" "}
                      {currentItem.region}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Platform:</span>{" "}
                      {currentItem.platform}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">
                        Average Order Value:
                      </span>{" "}
                      ${currentItem.avgOrderValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Images section */}
              <div className="space-y-6">
                {images.map((image, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                      <img
                        src={image.url}
                        alt={`Analytics visual ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{image.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute left-4 right-4 bottom-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => onNavigate("prev")}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("next")}
            disabled={currentIndex === data.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
