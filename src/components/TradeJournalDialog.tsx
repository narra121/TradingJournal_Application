import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Checkbox } from "@/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { Upload, X, AlertTriangle, TrendingUp, BarChart } from "lucide-react";
import {
  ImageType,
  Trade,
  TradeDetails,
  updateTradeInFirestore,
} from "@/app/traceSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/app/firebase";
import { setIsEditOpen } from "@/app/uiSlice";

// --- IndexedDB Helper Functions ---
const DB_NAME = "imageDB";
const DB_VERSION = 1;
const OBJECT_STORE_NAME = "images";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME);
      }
    };
  });
};

const storeImageInDB = async (url: string, file: File): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = transaction.objectStore(OBJECT_STORE_NAME);
  store.put(file, url); // Use URL as the key

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error); // Handle aborts
  });
};

const getImageFromDB = async (url: string): Promise<File | null> => {
  const db = await openDB();
  const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
  const store = transaction.objectStore(OBJECT_STORE_NAME);
  const request = store.get(url);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export function TradeJournalDialog() {
  const dispatch: AppDispatch = useDispatch();
  const [images, setImages] = useState<
    { file: File; timeframe: string; description: string }[]
  >([]);

  const selectedtrade: TradeDetails = useSelector(
    (state: RootState) => state.UI.selectedItem!
  );
  const tradeData: Trade = useSelector(
    (state: RootState) =>
      state.TradeData.trades.find(
        (t) => t.trade.tradeId === selectedtrade.tradeId
      )!
  );

  const initialPsychology: Trade["psychology"] = tradeData?.psychology || {
    isGreedy: false,
    isFomo: false,
    isRevenge: false,
    emotionalState: "",
    notes: "",
  };
  const initialAnalysis: Trade["analysis"] = tradeData?.analysis || {
    riskRewardRatio: 0,
    setupType: "",
    mistakes: [],
  };
  const initialMetrics: Trade["metrics"] = tradeData?.metrics || {
    riskPerTrade: 0,
    stopLossDeviation: 0,
    targetDeviation: 0,
    marketConditions: "",
    tradingSession: "",
  };

  const [psychology, setPsychology] =
    useState<Trade["psychology"]>(initialPsychology);
  const [analysis, setAnalysis] = useState<Trade["analysis"]>(initialAnalysis);
  const [metrics, setMetrics] = useState<Trade["metrics"]>(initialMetrics);

  const fetchAndSetImages = useCallback(async (imageUrls: ImageType[]) => {
    const imagePromises = imageUrls.map(async (image) => {
      // 1. Try to get the image from IndexedDB
      let file = await getImageFromDB(image.url);

      if (file) {
        return {
          file,
          timeframe: image.timeframe,
          description: image.description,
        };
      } else {
        // 2. If not in IndexedDB, fetch from the network
        try {
          const response = await fetch(image.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          const blob = await response.blob();
          const fileName = image.url.split("/").pop() || `image_${Date.now()}`; //get a reasonable filename
          file = new File([blob], fileName, { type: blob.type });

          // 3. Store the fetched image in IndexedDB
          await storeImageInDB(image.url, file);
          return {
            file,
            timeframe: image.timeframe,
            description: image.description,
          };
        } catch (error) {
          console.error("Error fetching image:", error);
          return null; // Return null for failed fetches
        }
      }
    });

    const fetchedImages = (await Promise.all(imagePromises)).filter(
      (
        image
      ): image is { file: File; timeframe: string; description: string } =>
        image !== null
    );
    setImages(fetchedImages);
  }, []);

  const isOpen = useSelector((state: RootState) => state.UI.isEditOpen);
  const handleClose = () => {
    dispatch(setIsEditOpen(false));
  };
  useEffect(() => {
    if (isOpen && tradeData) {
      setPsychology(tradeData.psychology || initialPsychology);
      setAnalysis(tradeData.analysis || initialAnalysis);
      setMetrics(tradeData.metrics || initialMetrics);

      if (tradeData.images && tradeData.images.length > 0) {
        fetchAndSetImages(tradeData.images);
      } else {
        setImages([]);
      }
    }
  }, [
    isOpen,
    tradeData,
    initialPsychology,
    initialAnalysis,
    initialMetrics,
    fetchAndSetImages,
  ]);

  const emotionalStates = [
    "Calm",
    "Anxious",
    "Excited",
    "Fearful",
    "Confident",
  ];
  const setupTypes = [
    "Breakout",
    "Pullback",
    "Trend Following",
    "Counter-trend",
    "Range",
  ];
  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const sessions = ["Pre-market", "Regular", "After-hours"];
  const marketConditions = ["Trending", "Ranging", "Volatile", "Calm"];
  const tradeMistakes = [
    "Early Entry",
    "Late Entry",
    "Wrong Position Size",
    "Moved Stop Loss",
    "Early Exit",
  ];

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const newImages = Array.from(files).map((file) => ({
          file,
          timeframe: "15m", // Default timeframe
          description: "",
        }));
        setImages((prevImages) => [...prevImages, ...newImages]);
      }
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }, []);

  const uploadImages = useCallback(
    async (
      imageObjects: {
        file: File;
        timeframe: string;
        description: string;
      }[]
    ): Promise<ImageType[]> => {
      const uploadedImages: ImageType[] = [];

      await Promise.all(
        imageObjects.map(async (imageObject) => {
          const storageRef = ref(storage, `images/${imageObject.file.name}`);
          const snapshot = await uploadBytes(storageRef, imageObject.file);
          const downloadURL = await getDownloadURL(snapshot.ref);

          // Store image in IndexedDB after uploading
          await storeImageInDB(downloadURL, imageObject.file);

          uploadedImages.push({
            timeframe: imageObject.timeframe,
            description: imageObject.description,
            url: downloadURL,
          });
        })
      );

      return uploadedImages;
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!tradeData) return;

    try {
      const processedImages = await uploadImages(images);
      const updatedTrade: Trade = {
        ...tradeData,
        images: processedImages,
        psychology,
        analysis,
        metrics,
      };
      await dispatch(updateTradeInFirestore(updatedTrade));
      // onClose();
    } catch (error) {
      console.error("Error saving trade:", error);
    }
  }, [
    dispatch,
    uploadImages,
    images,
    psychology,
    analysis,
    metrics,
    tradeData,
    // onClose,
  ]);

  const handlePsychologyChange = useCallback(
    (field: keyof Trade["psychology"], value: any) => {
      setPsychology((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAnalysisChange = useCallback(
    (field: keyof Trade["analysis"], value: any) => {
      setAnalysis((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleMetricsChange = useCallback(
    (field: keyof Trade["metrics"], value: any) => {
      setMetrics((prev) => ({ ...prev, [field]: value }));
    },
    []
  );
  const handleImageTimeframeChange = useCallback(
    (index: number, value: string) => {
      setImages((prevImages) =>
        prevImages.map((image, i) =>
          i === index ? { ...image, timeframe: value } : image
        )
      );
    },
    []
  );

  const handleImageDescriptionChange = useCallback(
    (index: number, value: string) => {
      setImages((prevImages) =>
        prevImages.map((image, i) =>
          i === index ? { ...image, description: value } : image
        )
      );
    },
    []
  );
  if (!isOpen || !tradeData) return null;
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex gap-4">
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-4 right-4">
            <X className="w-4 h-4" />
          </Button>
        </DialogClose>
        <div className="w-1/6 border-r pr-4 pl-4">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Symbol</Label>
              <p className="text-lg font-bold">{tradeData.trade.symbol}</p>
            </div>
            <div>
              <Label>Side</Label>
              <p
                className={`text-lg font-bold ${
                  tradeData.trade.side === "buy"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {tradeData.trade.side.toUpperCase()}
              </p>
            </div>
            <div>
              <Label>Entry Price</Label>
              <p className="text-lg">${tradeData.trade.entry}</p>
            </div>
            <div>
              <Label>Exit Price</Label>
              <p className="text-lg">${tradeData.trade.exit}</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <p className="text-lg">{tradeData.trade.qty}</p>
            </div>
            <div>
              <Label>Profit/Loss</Label>
              <p
                className={`text-lg font-bold ${
                  tradeData.trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                ${tradeData.trade.pnl}
              </p>
            </div>
          </div>
        </div>

        <div className="w-5/6 overflow-y-auto pl-2">
          <div className="grid grid-cols-[52%_42%] gap-6">
            <div className="flex flex-col space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Trade Psychology
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="greedy"
                      checked={psychology.isGreedy}
                      onCheckedChange={(checked) =>
                        handlePsychologyChange("isGreedy", checked)
                      }
                    />
                    <Label htmlFor="greedy">Greedy Trade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fomo"
                      checked={psychology.isFomo}
                      onCheckedChange={(checked) =>
                        handlePsychologyChange("isFomo", checked)
                      }
                    />
                    <Label htmlFor="fomo">FOMO Trade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revenge"
                      checked={psychology.isRevenge}
                      onCheckedChange={(checked) =>
                        handlePsychologyChange("isRevenge", checked)
                      }
                    />
                    <Label htmlFor="revenge">Revenge Trade</Label>
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
                    onChange={(e) =>
                      handlePsychologyChange("notes", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart className="w-5 h-5" /> Additional Metrics
                </h3>
                <div className="space-y-2">
                  <Label>Risk per Trade (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter risk percentage"
                    value={metrics.riskPerTrade || ""}
                    onChange={(e) =>
                      handleMetricsChange(
                        "riskPerTrade",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop Loss Deviation</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter stop loss deviation"
                    value={metrics.stopLossDeviation || ""}
                    onChange={(e) =>
                      handleMetricsChange(
                        "stopLossDeviation",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Deviation</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter target deviation"
                    value={metrics.targetDeviation || ""}
                    onChange={(e) =>
                      handleMetricsChange(
                        "targetDeviation",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Market Conditions</Label>
                  <Select
                    value={metrics.marketConditions}
                    onValueChange={(value) =>
                      handleMetricsChange("marketConditions", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select market condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketConditions.map((condition) => (
                        <SelectItem
                          key={condition}
                          value={condition.toLowerCase()}
                        >
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trading Session</Label>
                  <Select
                    value={metrics.tradingSession}
                    onValueChange={(value) =>
                      handleMetricsChange("tradingSession", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trading session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session} value={session.toLowerCase()}>
                          {session}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Trade Analysis
              </h3>
              <div className="space-y-2">
                <Label>Risk/Reward Ratio</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter R:R ratio"
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
                  onValueChange={(value) =>
                    handleAnalysisChange("setupType", value)
                  }
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
              <div className="space-y-2">
                <Label>Trade Mistakes</Label>
                <div className="space-y-2">
                  {tradeMistakes.map((mistake) => (
                    <div key={mistake} className="flex items-center space-x-2">
                      <Checkbox
                        id={mistake.toLowerCase().replace(/\s/g, "-")}
                        checked={analysis.mistakes.includes(
                          mistake.toLowerCase()
                        )}
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
                      >
                        {mistake}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" /> Image Documentation
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Click to upload images</p>
                  </div>
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  title="Upload images"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(image.file)}
                        alt={`Trade image ${index + 1}`}
                        className="w-full h-40 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Select
                      value={image.timeframe}
                      onValueChange={(value) =>
                        handleImageTimeframeChange(index, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map((tf) => (
                          <SelectItem key={tf} value={tf}>
                            {tf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Image description"
                      value={image.description}
                      onChange={(e) =>
                        handleImageDescriptionChange(index, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
