import { RootState } from "@/app/store";
import { Trade, TradeDetails } from "@/app/traceSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Import DialogTrigger
  DialogClose, // Import DialogClose
} from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import {
  Clock,
  TrendingUp,
  BarChart,
  AlertTriangle,
  DollarSign,
  LineChart,
  Edit, // Import Edit icon
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react"; // Import useState
import { Input } from "@/ui/input"; // Import Input
import { Label } from "@/ui/label"; // Import Label
import { Textarea } from "@/ui/textarea"; // Import Textarea
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { setIsDetailsOpen, setIsEditOpen } from "@/app/uiSlice";

export function TradeDetailsDialog() {
  const selectedtrade: TradeDetails = useSelector(
    (state: RootState) => state.UI.selectedItem!
  );
  const tradeData: Trade = useSelector(
    (state: RootState) =>
      state.TradeData.trades.find(
        (t) => t.trade.tradeId === selectedtrade.tradeId
      )!
  );

  // State for managing edit mode and image data
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedImage, setEditedImage] = useState<
    { url: string; description: string; timeframe: string }[]
  >([]);

  // Function to handle image edit
  const handleEditImage = (index: number) => {
    setEditIndex(index);
    setEditedImage(
      tradeData.images.map((image) => ({
        url: image.url,
        description: image.description,
        timeframe: image.timeframe,
      }))
    );
  };

  const handleUpdateImage = (index: number) => {
    const updatedImages = [...tradeData.images];
    updatedImages[index] = {
      url: editedImage[index].url,
      description: editedImage[index].description,
      timeframe: editedImage[index].timeframe,
    };

    //   console.log("new", updatedImages)

    // Dispatch an action to update the tradeData.images in your Redux store
    // dispatch(updateTradeImages({ tradeId: tradeData.trade.tradeId, images: updatedImages }));

    console.log("Updated Image:", editedImage);

    setEditIndex(null); // Exit edit mode
  };

  const handleImageChange = (
    index: number,
    field: "url" | "description" | "timeframe",
    value: string
  ) => {
    setEditedImage((prevImages) => {
      const updatedImages = [...prevImages];
      updatedImages[index] = {
        ...updatedImages[index],
        [field]: value,
      };
      return updatedImages;
    });
  };
  const isOpen = useSelector((state: RootState) => state.UI.isDetailsOpen);
  const dispatch = useDispatch();
  const handleClose = () => {
    dispatch(setIsDetailsOpen(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 gap-0">
        <div className="grid grid-cols-[1fr,2fr] h-full">
          {/* Left side - Trade Information */}
          <div className="border-r border-border p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <LineChart className="w-6 h-6 text-primary" />
                {tradeData.trade.symbol} Trade Details
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-[calc(90vh-8rem)] pr-4 mt-6">
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
                          tradeData.trade.side === "buy"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {tradeData.trade.side.toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="text-xl font-bold">{tradeData.trade.qty}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Entry Price
                      </p>
                      <p className="text-xl font-bold">
                        ${tradeData.trade.entry}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Exit Price
                      </p>
                      <p className="text-xl font-bold">
                        ${tradeData.trade.entry}
                      </p>
                    </div>
                    <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Profit/Loss
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          tradeData.trade.pnl >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        ${tradeData.trade.pnl.toFixed(2)}
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
                      {tradeData.psychology.isGreedy && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium">
                          Greedy Trade
                        </span>
                      )}
                      {tradeData.psychology.isFomo && (
                        <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium">
                          FOMO Trade
                        </span>
                      )}
                      {tradeData.psychology.isRevenge && (
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
                        {tradeData.psychology.emotionalState}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm mt-1">
                        {tradeData.psychology.notes}
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
                          {tradeData.analysis.riskRewardRatio}:1
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          Setup Type
                        </p>
                        <p className="text-lg font-semibold">
                          {tradeData.analysis.setupType}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mistakes
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {tradeData.analysis.mistakes.map((mistake, index) => (
                          <span
                            key={index}
                            className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium"
                          >
                            {mistake}
                          </span>
                        ))}
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
                        {tradeData.metrics.riskPerTrade}%
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Stop Loss Deviation
                      </p>
                      <p className="text-lg font-semibold">
                        {tradeData.metrics.stopLossDeviation}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Target Deviation
                      </p>
                      <p className="text-lg font-semibold">
                        {tradeData.metrics.targetDeviation}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Market Conditions
                      </p>
                      <p className="text-lg font-semibold">
                        {tradeData.metrics.marketConditions}
                      </p>
                    </div>
                    <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Trading Session
                      </p>
                      <p className="text-lg font-semibold">
                        {tradeData.metrics.tradingSession}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Images */}
          <ScrollArea className="h-[90vh] bg-muted/30">
            <div className="space-y-6 p-6">
              {tradeData.images.map((image, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden">
                  {editIndex === index ? (
                    <>
                      <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Select
                            value={editedImage[index].timeframe}
                            onValueChange={(value) =>
                              handleImageChange(index, "timeframe", value)
                            }
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
                          <Button
                            variant="secondary"
                            className="mr-2"
                            onClick={() => handleUpdateImage(index)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditIndex(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      <div className="relative aspect-video">
                        <Input
                          type="text"
                          value={editedImage[index].url}
                          onChange={(e) =>
                            handleImageChange(index, "url", e.target.value)
                          }
                          className="w-full h-full object-cover"
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
                          value={editedImage[index].description}
                          onChange={(e) =>
                            handleImageChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="text-sm text-muted-foreground"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {image.timeframe} Timeframe
                          </span>
                        </div>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditImage(index)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
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
      </DialogContent>
    </Dialog>
  );
}
