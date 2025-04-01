import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter, // Import DialogFooter
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
import {
  Upload,
  X,
  AlertTriangle,
  TrendingUp,
  BarChart,
  Loader2,
  Check,
} from "lucide-react";
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
  store.put(file, url);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
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
// --- End IndexedDB ---

export function TradeJournalDialog() {
  const dispatch: AppDispatch = useDispatch();

  // --- State for form data ---
  const [images, setImages] = useState<
    { file: File; timeframe: string; description: string }[]
  >([]);
  const [psychology, setPsychology] = useState<Trade["psychology"]>({
    isGreedy: false,
    isFomo: false,
    isRevenge: false,
    emotionalState: "",
    notes: "",
  });
  const [analysis, setAnalysis] = useState<Trade["analysis"]>({
    riskRewardRatio: 0,
    setupType: "",
    mistakes: [],
  });
  const [metrics, setMetrics] = useState<Trade["metrics"]>({
    riskPerTrade: 0,
    stopLossDeviation: 0,
    targetDeviation: 0,
    marketConditions: "",
    tradingSession: "",
  });

  // --- State for initial data (for dirty checking) ---
  const [initialPsychology, setInitialPsychology] = useState(psychology);
  const [initialAnalysis, setInitialAnalysis] = useState(analysis);
  const [initialMetrics, setInitialMetrics] = useState(metrics);
  const [initialImagesState, setInitialImagesState] = useState<ImageType[]>([]);

  // --- State for UI control ---
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isOpen = useSelector((state: RootState) => state.UI.isEditOpen);

  // --- Selectors ---
  const selectedtradeDetails: TradeDetails | null = useSelector(
    (state: RootState) => state.UI.selectedItem
  );
  const tradeData: Trade | undefined = useSelector((state: RootState) => {
    if (!selectedtradeDetails) return undefined;
    return state.TradeData.trades.find(
      (t) => t.trade.tradeId === selectedtradeDetails.tradeId
    );
  });

  // --- Helper to get initial state safely ---
  const getInitialState = useCallback(
    <
      T extends keyof Pick<
        Trade,
        "psychology" | "analysis" | "metrics" | "images"
      >
    >(
      field: T
    ): Trade[T] => {
      const defaultStates: Pick<
        Trade,
        "psychology" | "analysis" | "metrics" | "images"
      > = {
        psychology: {
          isGreedy: false,
          isFomo: false,
          isRevenge: false,
          emotionalState: "",
          notes: "",
        },
        analysis: { riskRewardRatio: 0, setupType: "", mistakes: [] },
        metrics: {
          riskPerTrade: 0,
          stopLossDeviation: 0,
          targetDeviation: 0,
          marketConditions: "",
          tradingSession: "",
        },
        images: [],
      };
      // Use nullish coalescing: if tradeData or tradeData[field] is null/undefined, use the default
      // Need type assertion because TS struggles with the generic + conditional access + default map
      return (tradeData?.[field] ?? defaultStates[field]) as Trade[T];
    },
    [tradeData]
  );

  // --- Image Fetching Logic ---
  const fetchAndSetImages = useCallback(async (imageUrls: ImageType[]) => {
    const imagePromises = imageUrls.map(async (image) => {
      let file = await getImageFromDB(image.url);
      if (!file) {
        try {
          const response = await fetch(image.url);
          if (!response.ok)
            throw new Error(`Failed to fetch image: ${response.status}`);
          const blob = await response.blob();
          const fileName = image.url.split("/").pop() || `image_${Date.now()}`;
          file = new File([blob], fileName, { type: blob.type });
          await storeImageInDB(image.url, file);
        } catch (error) {
          console.error("Error fetching image:", error);
          return null;
        }
      }
      return {
        file,
        timeframe: image.timeframe,
        description: image.description,
      };
    });

    const fetchedImages = (await Promise.all(imagePromises)).filter(
      (img): img is { file: File; timeframe: string; description: string } =>
        img !== null
    );
    setImages(fetchedImages);
    setInitialImagesState(imageUrls); // Store initial metadata for dirty check
  }, []);

  // --- Effect to Reset State on Open/Trade Change ---
  useEffect(() => {
    if (isOpen && tradeData) {
      const initialPsy = getInitialState("psychology");
      const initialAna = getInitialState("analysis");
      const initialMet = getInitialState("metrics");
      const initialImg = tradeData.images || [];

      setPsychology(initialPsy);
      setAnalysis(initialAna);
      setMetrics(initialMet);

      setInitialPsychology(initialPsy);
      setInitialAnalysis(initialAna);
      setInitialMetrics(initialMet);
      setInitialImagesState(initialImg);

      if (initialImg.length > 0) {
        fetchAndSetImages(initialImg);
      } else {
        setImages([]); // Clear images if none initially
      }
      setIsSaved(false); // Reset saved state
    } else if (!isOpen) {
      // Optional: Clear state when dialog closes
      setImages([]);
      setInitialImagesState([]);
    }
  }, [isOpen, tradeData, getInitialState, fetchAndSetImages]);

  // --- Calculate isDirty ---
  const isDirty = useMemo(() => {
    if (!tradeData) return false;

    const psychologyChanged =
      JSON.stringify(psychology) !== JSON.stringify(initialPsychology);
    const analysisChanged =
      JSON.stringify(analysis) !== JSON.stringify(initialAnalysis);
    const metricsChanged =
      JSON.stringify(metrics) !== JSON.stringify(initialMetrics);

    let imagesChanged = images.length !== initialImagesState.length;
    if (!imagesChanged && images.length > 0) {
      // Compare metadata (more robust check needed for actual file content changes)
      const currentImageMetadata = images.map((img) => ({
        timeframe: img.timeframe,
        description: img.description,
        name: img.file.name,
      })); // Include name
      const initialImageMetadata = initialImagesState.map((img) => ({
        timeframe: img.timeframe,
        description: img.description,
        name: img.url.split("/").pop() || "",
      })); // Extract name from URL
      // Sort arrays before comparing to handle order changes if necessary (though order might matter)
      imagesChanged =
        JSON.stringify(currentImageMetadata) !==
        JSON.stringify(initialImageMetadata);
    }

    return (
      psychologyChanged || analysisChanged || metricsChanged || imagesChanged
    );
  }, [
    psychology,
    analysis,
    metrics,
    images,
    initialPsychology,
    initialAnalysis,
    initialMetrics,
    initialImagesState,
    tradeData,
  ]);

  // --- Constants ---
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

  // --- Change Handlers ---
  const makeChangeHandler = <T extends keyof Trade>(
    setState: React.Dispatch<React.SetStateAction<Trade[T]>>,
    field: keyof Trade[T]
  ) =>
    useCallback(
      (value: any) => {
        setState((prev: any) => ({ ...prev, [field]: value }));
        setIsSaved(false);
      },
      [setState]
    );

  const handlePsychologyChange = (
    field: keyof Trade["psychology"],
    value: any
  ) => {
    setPsychology((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };
  const handleAnalysisChange = (field: keyof Trade["analysis"], value: any) => {
    setAnalysis((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };
  const handleMetricsChange = (field: keyof Trade["metrics"], value: any) => {
    setMetrics((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const newImages = Array.from(files).map((file) => ({
          file,
          timeframe: "15m",
          description: "",
        }));
        setImages((prevImages) => [...prevImages, ...newImages]);
        setIsSaved(false);
      }
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setIsSaved(false);
  }, []);

  const handleImageTimeframeChange = useCallback(
    (index: number, value: string) => {
      setImages((prevImages) =>
        prevImages.map((image, i) =>
          i === index ? { ...image, timeframe: value } : image
        )
      );
      setIsSaved(false);
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
      setIsSaved(false);
    },
    []
  );

  // --- Image Upload Helper ---
  const uploadImages = useCallback(
    async (
      imageObjects: { file: File; timeframe: string; description: string }[]
    ): Promise<ImageType[]> => {
      const uploadedImages: ImageType[] = [];
      await Promise.all(
        imageObjects.map(async (imageObject) => {
          // Avoid re-uploading if URL already exists and matches initial state (more complex check)
          // For now, re-upload all current images
          const storageRef = ref(
            storage,
            `images/${Date.now()}_${imageObject.file.name}`
          ); // Add timestamp to avoid overwrites
          const snapshot = await uploadBytes(storageRef, imageObject.file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await storeImageInDB(downloadURL, imageObject.file); // Cache after upload
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

  // --- Save Handler ---
  const handleSave = useCallback(async () => {
    if (!tradeData || !isDirty) return;

    setIsSaving(true);
    setIsSaved(false);

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

      // Update initial state to reflect the saved state
      setInitialPsychology(psychology);
      setInitialAnalysis(analysis);
      setInitialMetrics(metrics);
      setInitialImagesState(processedImages);

      setIsSaved(true); // Mark as saved
    } catch (error) {
      console.error("Error saving trade:", error);
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }, [
    dispatch,
    uploadImages,
    images,
    psychology,
    analysis,
    metrics,
    tradeData,
    isDirty,
  ]);

  // --- Close Handler ---
  const handleClose = () => {
    dispatch(setIsEditOpen(false));
  };

  // --- Render ---
  if (!isOpen || !tradeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* Added flex flex-col back to DialogContent */}
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0">
        {" "}
        {/* Remove gap and padding */}
        <DialogHeader className="px-6 pt-4 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row justify-between items-center">
          {" "}
          {/* Make header sticky and flex */}
          <DialogTitle>Trade Journal</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        {/* Main Content Area (Scrollable) */}
        {/* Added flex-1 back to this div */}
        <div className="flex-1 overflow-y-auto">
          {" "}
          {/* Main scroll container */}
          <div className="flex gap-6 p-6">
            {" "}
            {/* Add padding and gap here */}
            {/* Left Side (Trade Details - Sticky) */}
            <div className="w-1/4 space-y-4 self-start sticky top-6">
              {" "}
              {/* Adjust sticky top */}
              <div>
                <Label className="text-xs text-muted-foreground">Symbol</Label>
                <p className="text-lg font-bold">{tradeData.trade.symbol}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Side</Label>
                <p
                  className={`text-lg font-bold ${
                    tradeData.trade.side === "buy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tradeData.trade.side.toUpperCase()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Entry Price
                </Label>
                <p className="text-base">${tradeData.trade.entry}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Exit Price
                </Label>
                <p className="text-base">${tradeData.trade.exit}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Quantity
                </Label>
                <p className="text-base">{tradeData.trade.qty}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Profit/Loss
                </Label>
                <p
                  className={`text-lg font-bold ${
                    tradeData.trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${tradeData.trade.pnl.toFixed(2)}
                </p>
              </div>
            </div>
            {/* Right Side (Form Inputs) */}
            <div className="w-3/4 space-y-6">
              {/* Psychology Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Trade
                  Psychology
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
                    onChange={(e) =>
                      handlePsychologyChange("notes", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Metrics Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-500" /> Additional
                  Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Risk per Trade (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 1"
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
                      placeholder="e.g., 0.5"
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
                      placeholder="e.g., -0.2"
                      value={metrics.targetDeviation || ""}
                      onChange={(e) =>
                        handleMetricsChange(
                          "targetDeviation",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem
                            key={session}
                            value={session.toLowerCase()}
                          >
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Analysis Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" /> Trade
                  Analysis
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
                </div>
                <div className="space-y-2">
                  <Label>Trade Mistakes</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {tradeMistakes.map((mistake) => (
                      <div
                        key={mistake}
                        className="flex items-center space-x-2"
                      >
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
                          className="text-sm"
                        >
                          {mistake}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Documentation Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-500" /> Image
                  Documentation
                </h3>
                <div>
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click or Drag & Drop to upload images
                      </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2 bg-background"
                    >
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(image.file)}
                          alt={`Trade ${index + 1}`}
                          className="w-full h-48 object-contain rounded bg-muted"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
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
                        placeholder="Image description..."
                        value={image.description}
                        onChange={(e) =>
                          handleImageDescriptionChange(index, e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer (Fixed) */}
        <DialogFooter className="flex justify-end px-6 py-3 border-t bg-background">
          {/* Use DialogFooter, removed sticky/bottom/z-index */}
          {isSaved ? (
            <Button onClick={handleClose} className="gap-2" variant="secondary">
              <Check className="h-4 w-4" /> Close
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
