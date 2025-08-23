import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Loader2, Check, X as XIcon } from "lucide-react";
import { ImageType, Trade, TradeDetails } from "@/app/types";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store";
import { setIsEditOpen } from "@/app/uiSlice";
import { PsychologySection } from "./trade-journal-dialog/PsychologySection";
import { MetricsSection } from "./trade-journal-dialog/MetricsSection";
import { AnalysisSection } from "./trade-journal-dialog/AnalysisSection";
import { ImageDocumentationSection } from "./trade-journal-dialog/ImageDocumentationSection";
import { TradeDetailsSection } from "./trade-journal-dialog/TradeDetailsSection";
import { v4 as uuidv4 } from "uuid";
import { updateTradeInFirestore } from "@/app/traceSlice";

interface TradeJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeDetails | null; // Add trade prop as it's passed from Trades.tsx
}

export function TradeJournalDialog({ isOpen, onClose, trade: selectedtradeDetails }: TradeJournalDialogProps) {
  const dispatch: AppDispatch = useDispatch();

  const [images, setImages] = useState<ImageType[]>([]);
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

  const [initialPsychology, setInitialPsychology] = useState(psychology);
  const [initialAnalysis, setInitialAnalysis] = useState(analysis);
  const [initialMetrics, setInitialMetrics] = useState(metrics);
  const [initialImagesState, setInitialImagesState] = useState<ImageType[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // selectedtradeDetails is now passed as a prop
  // const selectedtradeDetails: TradeDetails | null = useSelector(
  //   (state: RootState) => state.UI.selectedItem
  // );
  const tradeData: Trade | undefined = useSelector((state: RootState) => {
    if (!selectedtradeDetails) return undefined;
    return state.TradeData.trades.find(
      (t) => t.trade.tradeId === selectedtradeDetails.tradeId
    );
  });

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
      return (tradeData?.[field] ?? defaultStates[field]) as Trade[T];
    },
    [tradeData]
  );

  useEffect(() => {
    if (isOpen && tradeData) {
      const initialPsy = getInitialState("psychology");
      const initialAna = getInitialState("analysis");
      const initialMet = getInitialState("metrics");
      const initialImg = tradeData.images || [];

      setPsychology(initialPsy);
      setAnalysis(initialAna);
      setMetrics(initialMet);
      setImages(initialImg);

      setInitialPsychology(initialPsy);
      setInitialAnalysis(initialAna);
      setInitialMetrics(initialMet);
      setInitialImagesState(initialImg);

      setIsSaved(false);
    } else if (!isOpen) {
      setImages([]);
      setInitialImagesState([]);
    }
  }, [isOpen, tradeData, getInitialState]);

  const isDirty = useMemo(() => {
    if (!tradeData) return false;

    const psychologyChanged =
      JSON.stringify(psychology) !== JSON.stringify(initialPsychology);
    const analysisChanged =
      JSON.stringify(analysis) !== JSON.stringify(initialAnalysis);
    const metricsChanged =
      JSON.stringify(metrics) !== JSON.stringify(initialMetrics);
    const imagesChanged =
      JSON.stringify(images) !== JSON.stringify(initialImagesState);

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
  const sessions = ["Pre-market", "Regular", "After-hours"];
  const marketConditions = ["Trending", "Ranging", "Volatile", "Calm"];
  const tradeMistakes = [
    "Early Entry",
    "Late Entry",
    "Wrong Position Size",
    "Moved Stop Loss",
    "Early Exit",
  ];

  const handlePsychologyChange = (
    field: keyof Trade["psychology"],
    value: any
  ) => {
    setPsychology((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };
  const handleAnalysisChange = (
    field: keyof Trade["analysis"],
    value: any
  ) => {
    setAnalysis((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };
  const handleMetricsChange = (field: keyof Trade["metrics"], value: any) => {
    setMetrics((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = useCallback(async () => {
    if (!tradeData || !isDirty) return;

    setIsSaving(true);
    setIsSaved(false);

    try {
      const imagesToUpload = images.filter((image) => image.file);
      const imageUrls = await Promise.all(
        imagesToUpload.map(async (image) => {
          // Assuming firebase is already initialized and imported as 'app'
          // You might need to import getStorage, ref, uploadBytes, getDownloadURL from 'firebase/storage'
          // For now, let's mock the image upload and return a dummy URL
          // const storageRef = ref(storage, `trades/${tradeData.tradeId!}/${uuidv4()}`);
          // await uploadBytes(storageRef, image.file as File);
          // return getDownloadURL(storageRef);
          return Promise.resolve(`https://example.com/image/${uuidv4()}.png`);
        })
      );

      const updatedImages = images.map((image, index) => {
        if (image.file) {
          return {
            id: image.id,
            url: imageUrls[index],
            timeframe: image.timeframe,
            description: image.description,
          };
        }
        return image;
      });

      const updatedTrade: Trade = {
        ...tradeData,
        images: updatedImages,
        psychology,
        analysis,
        metrics,
      };
      await dispatch(updateTradeInFirestore(updatedTrade));

      setInitialPsychology(psychology);
      setInitialAnalysis(analysis);
      setInitialMetrics(metrics);
      setInitialImagesState(updatedImages);

      setIsSaved(true);
    } catch (error) {
      console.error("Error saving trade:", error);
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }, [
    dispatch,
    images,
    psychology,
    analysis,
    metrics,
    tradeData,
    isDirty,
  ]);

  const handleClose = () => {
    dispatch(setIsEditOpen(false));
  };

  if (!isOpen || !tradeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-4 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row justify-between items-center">
          <DialogTitle>Trade Journal</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <XIcon className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-6 p-6">
            <TradeDetailsSection tradeData={tradeData} />
            <div className="w-3/4 space-y-6">
              <PsychologySection
                psychology={psychology}
                handlePsychologyChange={handlePsychologyChange}
                emotionalStates={emotionalStates}
              />
              <MetricsSection
                metrics={metrics}
                handleMetricsChange={handleMetricsChange}
                marketConditions={marketConditions}
                sessions={sessions}
              />
              <AnalysisSection
                analysis={analysis}
                handleAnalysisChange={handleAnalysisChange}
                setupTypes={setupTypes}
                tradeMistakes={tradeMistakes}
              />
              <ImageDocumentationSection
                images={images}
                setImages={setImages}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end px-6 py-3 border-t bg-background">
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
