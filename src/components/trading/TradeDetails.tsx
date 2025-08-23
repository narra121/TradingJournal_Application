import { RootState } from "@/app/store";
import type { Trade, TradeDetails } from "@/app/types";
import { ScrollArea } from "@/ui/scroll-area";
import {
  Clock,
  Loader2, // Import Loader icon
  TrendingUp,
  BarChart,
  AlertTriangle,
  DollarSign,
  LineChart,
  Edit,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback, useEffect } from "react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea"; // Import Textarea
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

interface TradeDetailsProps {
  trade: TradeDetails | null;
}

export function TradeDetails({ trade: selectedtrade }: TradeDetailsProps) {
  const tradeData: Trade | undefined = useSelector((state: RootState) => {
    if (!selectedtrade) return undefined;
    return state.TradeData.trades.find(
      (t) => t.trade.tradeId === selectedtrade.tradeId!
    );
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedImage, setEditedImage] = useState<
    { id: string; url: string; description: string; timeframe: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const handleEditImage = (index: number) => {
    setEditIndex(index);
    setIsSavedSuccessfully(false);
    setIsLoading(false);
    setEditedImage(
      tradeData?.images?.map((image) => ({
        id: image.id,
        url: image.url,
        description: image.description,
        timeframe: image.timeframe,
      })) || []
    );
  };

  const handleUpdateImage = async (index: number) => {
    if (!tradeData?.images || !editedImage[index] || isLoading) return;

    setIsLoading(true);
    setIsSavedSuccessfully(false);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Simulating image update:", editedImage[index]);
    const updatedImages = [...tradeData.images];
    updatedImages[index] = {
      id: editedImage[index].id,
      url: editedImage[index].url,
      description: editedImage[index].description,
      timeframe: editedImage[index].timeframe,
    };

    setIsLoading(false);
    setIsSavedSuccessfully(true);
  };

  const handleImageChange = (
    index: number,
    field: "url" | "description" | "timeframe",
    value: string
  ) => {
    if (isSavedSuccessfully) {
      setIsSavedSuccessfully(false);
    }
    setEditedImage((prevImages) => {
      const updatedImages = [...prevImages];
      updatedImages[index] = {
        ...updatedImages[index],
        [field]: value,
      };
      return updatedImages;
    });
  };

  return (
    <div className="flex h-full">
      {/* Left side - Trade Information */}
      <div className="w-1/3 border-r border-border p-6 flex flex-col">
        <div className="text-2xl font-bold flex items-center gap-2 mb-6">
          <LineChart className="w-6 h-6 text-primary" />
          {tradeData?.trade?.symbol} Trade Details
        </div>

        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-8">
            {/* Trade Overview */}
            <div className="bg-card rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Trade Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Side</p>
                  <p
                    className={`text-xl font-bold ${
                      tradeData?.trade?.side === "buy"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {tradeData?.trade?.side?.toUpperCase()}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="text-xl font-bold">
                    {tradeData?.trade?.qty}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Entry Price
                  </p>
                  <p className="text-xl font-bold">
                    ${tradeData?.trade?.entry}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Exit Price
                  </p>
                  <p className="text-xl font-bold">
                    ${tradeData?.trade?.entry}
                  </p>
                </div>
                <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Profit/Loss
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      tradeData?.trade?.pnl ?? 0 >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    ${tradeData?.trade?.pnl?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Psychology */}
            <div className="bg-card rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Psychology
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {tradeData?.psychology?.isGreedy && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      Greedy Trade
                    </span>
                  )}
                  {tradeData?.psychology?.isFomo && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      FOMO Trade
                    </span>
                  )}
                  {tradeData?.psychology?.isRevenge && (
                    <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      Revenge Trade
                    </span>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Emotional State
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.psychology?.emotionalState}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">
                    {tradeData?.psychology?.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-card rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Analysis
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Risk/Reward Ratio
                    </p>
                    <p className="text-lg font-semibold">
                      {tradeData?.analysis?.riskRewardRatio}:1
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Setup Type
                    </p>
                    <p className="text-lg font-semibold">
                      {tradeData?.analysis?.setupType}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mistakes
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {tradeData?.analysis?.mistakes?.map(
                      (mistake, index) => (
                        <span
                          key={index}
                          className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          {mistake}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-card rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Risk per Trade
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.metrics?.riskPerTrade}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Stop Loss Deviation
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.metrics?.stopLossDeviation}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Target Deviation
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.metrics?.targetDeviation}
                  </p>
                </div>
                <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Market Conditions
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.metrics?.marketConditions}
                  </p>
                </div>
                <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Trading Session
                  </p>
                  <p className="text-lg font-semibold">
                    {tradeData?.metrics?.tradingSession}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right side - Images */}
      <ScrollArea className="flex-grow bg-muted/30">
        <div className="space-y-6 p-6">
          {tradeData?.images?.map((image, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden">
              {editIndex === index ? (
                // Edit Mode JSX
                <>
                  <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={editedImage[index]?.timeframe || ""}
                        onValueChange={(value) =>
                          handleImageChange(index, "timeframe", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Timeframe" />
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
                    <div>
                      {isSavedSuccessfully ? (
                        <Button variant="default" onClick={() => setEditIndex(null)}>
                          Close
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            className="mr-2"
                            onClick={() => handleUpdateImage(index)}
                            disabled={isLoading}
                          >
                            {isLoading && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isLoading ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditIndex(null)}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative aspect-video">
                    <Input
                      type="text"
                      value={editedImage[index]?.url || ""}
                      onChange={(e) =>
                        handleImageChange(index, "url", e.target.value)
                      }
                      className="w-full h-full object-cover"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="p-4 bg-background">
                    <Label
                      htmlFor={`description-${index}`}
                      className="sr-only"
                    >
                      Description
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={editedImage[index]?.description || ""}
                      onChange={(e) =>
                        handleImageChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="text-sm text-muted-foreground"
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                // View Mode JSX
                <>
                  <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {image.timeframe} Timeframe
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditImage(index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="relative aspect-video">
                    <img
                      src={image.url}
                      alt={`Trade chart ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 bg-background">
                    <p className="text-sm text-muted-foreground">
                      {image.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
