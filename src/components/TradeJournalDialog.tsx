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
import { ImageType, ApiTrade, TradeSide, TradeStatus, TradeGrade } from "@/app/types";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store";
import { setIsEditOpen } from "@/app/uiSlice";
import { PsychologySection, PsychologyState } from "./trade-journal-dialog/PsychologySection";
import { MetricsSection, MetricsState } from "./trade-journal-dialog/MetricsSection";
import { AnalysisSection, AnalysisState } from "./trade-journal-dialog/AnalysisSection";
import { ImageDocumentationSection } from "./trade-journal-dialog/ImageDocumentationSection";
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/ui/select'
import { Slider } from '@/ui/slider'
import { Badge } from '@/ui/badge'
import { v4 as uuidv4 } from "uuid";
import { updateTrade } from '@/app/awsTradesSlice'
import { toast } from 'sonner'

interface TradeJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trade: ApiTrade | null;
}

export function TradeJournalDialog({ isOpen, onClose, trade }: TradeJournalDialogProps) {
  const dispatch: AppDispatch = useDispatch();
  const [images, setImages] = useState<ImageType[]>([]);
  const [psychology, setPsychology] = useState<PsychologyState>({ greed: false, fomo: false, revenge: false, fear:false, overconfidence:false, patience:false, emotionalState: '', preNotes: '', notes: '' });
  const [analysis, setAnalysis] = useState<AnalysisState>({ riskRewardRatio: null, setupType: '', mistakes: [] });
  const [metrics, setMetrics] = useState<MetricsState>({ riskAmount: null, marketCondition: '', tradingSession: '' });

  // Additional core trade editable state (fields not covered by existing sub-sections)
  const [core, setCore] = useState({
    symbol: '',
    side: 'BUY' as TradeSide,
    status: 'OPEN' as TradeStatus,
    quantity: 0,
    openDate: '',
    closeDate: '',
    entryPrice: '' as string | number | '',
    exitPrice: '' as string | number | '',
    stopLoss: '' as string | number | '',
    takeProfit: '' as string | number | '',
    commission: '' as string | number | '',
    fees: '' as string | number | '',
    timeframe: '' as string | null,
    tradeGrade: null as TradeGrade | null,
    confidence: null as number | null,
    setupQuality: null as number | null,
    execution: null as number | null,
    preTradeNotes: '' as string,
    // list fields managed separately as arrays
  })
  const [initialCore, setInitialCore] = useState(core)

  // Array list states (chips UI)
  const [lessons, setLessons] = useState<string[]>([])
  const [newsEvents, setNewsEvents] = useState<string[]>([])
  const [economicEvents, setEconomicEvents] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  const [initialLessons, setInitialLessons] = useState<string[]>([])
  const [initialNewsEvents, setInitialNewsEvents] = useState<string[]>([])
  const [initialEconomicEvents, setInitialEconomicEvents] = useState<string[]>([])
  const [initialTags, setInitialTags] = useState<string[]>([])

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
  // Use provided ApiTrade directly
  const tradeData = trade || null

  useEffect(() => {
    if (isOpen && tradeData) {
      // Build fresh snapshot only once per open or trade change
  const newImages: ImageType[] = (tradeData.images || []).map(i => ({ id: i.id, url: i.url, timeframe: i.timeframe || '', description: i.description || '' }))
      const newPsychology: PsychologyState = {
        greed: !!tradeData.psychology?.greed,
        fomo: !!tradeData.psychology?.fomo,
        revenge: !!tradeData.psychology?.revenge,
        fear: !!tradeData.psychology?.fear,
        overconfidence: !!tradeData.psychology?.overconfidence,
        patience: !!tradeData.psychology?.patience,
        emotionalState: tradeData.emotionalState || '',
        preNotes: tradeData.preTradeNotes || '',
        notes: tradeData.postTradeNotes || ''
      }
      const newAnalysis: AnalysisState = {
        riskRewardRatio: tradeData.riskRewardRatio ?? null,
        setupType: tradeData.setupType || '',
        mistakes: tradeData.mistakes || []
      }
      const newMetrics: MetricsState = {
        riskAmount: tradeData.riskAmount ?? null,
        marketCondition: tradeData.marketCondition || '',
        tradingSession: tradeData.tradingSession || ''
      }
      // Normalize date strings to YYYY-MM-DD if they include time
      const fmtDate = (d?: string | null) => {
        if(!d) return '';
        if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const only = d.split('T')[0];
        return only || '';
      }
      const newCore = {
        symbol: tradeData.symbol,
        side: tradeData.side,
        status: tradeData.status,
        quantity: tradeData.quantity,
        openDate: fmtDate(tradeData.openDate),
        closeDate: fmtDate(tradeData.closeDate || undefined),
        entryPrice: tradeData.entryPrice ?? '',
        exitPrice: tradeData.exitPrice ?? '',
        stopLoss: tradeData.stopLoss ?? '',
        takeProfit: tradeData.takeProfit ?? '',
        commission: tradeData.commission ?? '',
        fees: tradeData.fees ?? '',
        timeframe: tradeData.timeframe || '',
        tradeGrade: tradeData.tradeGrade ?? null,
        confidence: tradeData.confidence ?? null,
        setupQuality: tradeData.setupQuality ?? null,
        execution: tradeData.execution ?? null,
  preTradeNotes: tradeData.preTradeNotes || '',
      }
  // array lists
  setLessons(tradeData.lessons || [])
  setNewsEvents(tradeData.newsEvents || [])
  setEconomicEvents(tradeData.economicEvents || [])
  setTags(tradeData.tags || [])
  setInitialLessons(tradeData.lessons || [])
  setInitialNewsEvents(tradeData.newsEvents || [])
  setInitialEconomicEvents(tradeData.economicEvents || [])
  setInitialTags(tradeData.tags || [])
      // Apply state
      setImages(newImages);
      setPsychology(newPsychology);
      setAnalysis(newAnalysis);
      setMetrics(newMetrics);
      setCore(newCore);
      // Store baselines
      setInitialImagesState(newImages);
      setInitialPsychology(newPsychology);
      setInitialAnalysis(newAnalysis);
      setInitialMetrics(newMetrics);
      setInitialCore(newCore);
      setIsSaved(false);
    } else if (!isOpen) {
      setImages([]);
      setInitialImagesState([]);
    }
  }, [isOpen, tradeData]);

  const isDirty = useMemo(() => {
    if (!tradeData) return false
    const currentComposite = JSON.stringify({ psychology, analysis, metrics, images, core, lessons, newsEvents, economicEvents, tags })
    const initialComposite = JSON.stringify({ psychology: initialPsychology, analysis: initialAnalysis, metrics: initialMetrics, images: initialImagesState, core: initialCore, lessons: initialLessons, newsEvents: initialNewsEvents, economicEvents: initialEconomicEvents, tags: initialTags })
    return currentComposite !== initialComposite
  }, [psychology, analysis, metrics, images, core, lessons, newsEvents, economicEvents, tags, initialPsychology, initialAnalysis, initialMetrics, initialImagesState, initialCore, initialLessons, initialNewsEvents, initialEconomicEvents, initialTags, tradeData])

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

  const handlePsychologyChange = (changes: Partial<PsychologyState>) => { setPsychology(p => ({ ...p, ...changes })); setIsSaved(false) }
  const handleAnalysisChange = (changes: Partial<AnalysisState>) => { setAnalysis(a => ({ ...a, ...changes })); setIsSaved(false) }
  const handleMetricsChange = (changes: Partial<MetricsState>) => { setMetrics(m => ({ ...m, ...changes })); setIsSaved(false) }

  const handleSave = useCallback(async () => {
    if (!tradeData || !isDirty) return;

  setIsSaving(true);
  setIsSaved(false);
  toast.loading('Updating trade...', { id: 'journal-update' })

    try {
      const imagesToUpload = images.filter((image) => image.file);
      const imageUrls = await Promise.all(
        imagesToUpload.map(async () => {
          return Promise.resolve(`https://example.com/image/${uuidv4()}.png`)
        })
      )

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

      // Map legacy nested edits back to ApiTradeUpdate shape
      const toNum = (v: any) => (v === '' || v === null ? null : Number(v))
      // lists already arrays
      const changes: any = {
        symbol: core.symbol,
        side: core.side,
        status: core.status,
        quantity: core.quantity,
        openDate: core.openDate,
        closeDate: core.closeDate || null,
        entryPrice: toNum(core.entryPrice),
        exitPrice: toNum(core.exitPrice),
        stopLoss: toNum(core.stopLoss),
        takeProfit: toNum(core.takeProfit),
        commission: toNum(core.commission),
        fees: toNum(core.fees),
        timeframe: core.timeframe || null,
        tradeGrade: core.tradeGrade || null,
        confidence: core.confidence ?? null,
        setupQuality: core.setupQuality ?? null,
        execution: core.execution ?? null,
  preTradeNotes: psychology.preNotes || null,
        lessons,
        newsEvents,
        economicEvents,
        tags,
  images: updatedImages.slice(0,10).map(img => ({ id: img.id, url: img.url, timeframe: img.timeframe || null, description: img.description || null })),
  psychology: { greed: psychology.greed, fomo: psychology.fomo, revenge: psychology.revenge, fear: psychology.fear, overconfidence: psychology.overconfidence, patience: psychology.patience, lossRecovery: psychology.lossRecovery },
        emotionalState: psychology.emotionalState || null,
        postTradeNotes: psychology.notes || null,
        riskRewardRatio: analysis.riskRewardRatio ?? null,
        setupType: analysis.setupType || null,
        mistakes: analysis.mistakes || [],
        riskAmount: metrics.riskAmount ?? null,
        marketCondition: metrics.marketCondition || null,
        tradingSession: metrics.tradingSession || null,
      }
  await dispatch(updateTrade({ tradeId: tradeData.tradeId, changes })).unwrap()

  setInitialPsychology(psychology);
      setInitialAnalysis(analysis);
      setInitialMetrics(metrics);
      setInitialImagesState(updatedImages);
  setInitialCore(core)
      setInitialLessons(lessons);
      setInitialNewsEvents(newsEvents);
      setInitialEconomicEvents(economicEvents);
      setInitialTags(tags);

  setIsSaved(true);
  toast.success('Trade updated', { id: 'journal-update' })
    } catch (error) {
      console.error("Error saving trade:", error);
      setIsSaved(false);
  toast.error((error as any)?.message || 'Update failed', { id: 'journal-update' })
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, images, psychology, analysis, metrics, core, tradeData, isDirty]);

  const handleClose = () => {
    dispatch(setIsEditOpen(false))
    onClose()
  }

  if (!isOpen || !tradeData) return null;

  // Inline chip input component for list fields
  function ChipsInput({ label, items, setItems, placeholder, setIsSaved }: { label: string; items: string[]; setItems: (v: string[])=>void; placeholder?: string; setIsSaved: (v: boolean)=>void }) {
    const [value, setValue] = useState('')
    const addItem = () => {
      const trimmed = value.trim()
      if (trimmed && !items.includes(trimmed)) {
        setItems([...items, trimmed])
        setIsSaved(false)
      }
      setValue('')
    }
    const remove = (i: number) => { const next = items.filter((_,idx)=>idx!==i); setItems(next); setIsSaved(false) }
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-2">
          <Input value={value} placeholder={placeholder} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addItem(); } }} />
          <Button type="button" variant="secondary" onClick={addItem} disabled={!value.trim()}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((it,i)=> (
            <Badge key={it+ i} variant="secondary" className="flex items-center gap-1">
              <span>{it}</span>
              <button type="button" className="text-[10px] leading-none" onClick={()=>remove(i)}>✕</button>
            </Badge>
          ))}
          {items.length===0 && <span className="text-[10px] text-muted-foreground">No items</span>}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-5 py-2 border-b sticky top-0 bg-background z-10 flex flex-row justify-between items-center h-10 min-h-0">
          <DialogTitle className="text-sm font-semibold leading-none">Trade Journal</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <XIcon className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-6 p-6">
            <div className="w-1/4 space-y-6">
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Core (Read Only)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1"><Label>Symbol</Label><div className="rounded bg-muted px-2 py-1 font-mono text-xs">{core.symbol}</div></div>
                  <div className="space-y-1"><Label>Side</Label><div className="rounded bg-muted px-2 py-1 text-xs">{core.side}</div></div>
                  <div className="space-y-1"><Label>Status</Label><div className="rounded bg-muted px-2 py-1 text-xs">{core.status}</div></div>
                  <div className="space-y-1"><Label>Quantity</Label><div className="rounded bg-muted px-2 py-1 text-xs">{core.quantity}</div></div>
                  <div className="space-y-1"><Label>Open Date</Label><div className="rounded bg-muted px-2 py-1 text-xs">{core.openDate || '-'}</div></div>
                  <div className="space-y-1"><Label>Close Date</Label><div className="rounded bg-muted px-2 py-1 text-xs">{core.closeDate || '-'}</div></div>
                </div>
              </div>
              <div className="space-y-2 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Prices (Read Only)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {['entryPrice','exitPrice','stopLoss','takeProfit','commission','fees'].map(field => (
                    <div key={field} className="space-y-1">
                      <Label className="capitalize">{field.replace(/([A-Z])/g,' $1')}</Label>
                      <div className="rounded bg-muted px-2 py-1">{(core as any)[field] !== '' && (core as any)[field] !== null ? (core as any)[field] : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Performance Scores</h4>
                {(['confidence','setupQuality','execution'] as const).map(f => (
                  <div key={f} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Label className="capitalize">{f}</Label>
                      <span>{(core as any)[f] ?? 0}</span>
                    </div>
                    <Slider value={[(core as any)[f] ?? 0]} max={100} step={1} onValueChange={v=>{ setCore(c=>({ ...c, [f]: v[0] })); setIsSaved(false) }} />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Grade</Label>
                  <Select value={core.tradeGrade ?? ''} onValueChange={v=>{ setCore(c=>({ ...c, tradeGrade: v as TradeGrade })); setIsSaved(false) }}>
                    <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>{['A','B','C','D','F'].map(g=> <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Derived (Read Only)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><Label className="text-[11px]">PnL</Label><div className="mt-1 rounded bg-muted px-2 py-1">{tradeData.pnl ?? '-'}</div></div>
                  <div><Label className="text-[11px]">Net PnL</Label><div className="mt-1 rounded bg-muted px-2 py-1">{tradeData.netPnl ?? '-'}</div></div>
                  <div><Label className="text-[11px]">RR Ratio</Label><div className="mt-1 rounded bg-muted px-2 py-1">{tradeData.riskRewardRatio ?? '-'}</div></div>
                  <div><Label className="text-[11px]">Remaining Qty</Label><div className="mt-1 rounded bg-muted px-2 py-1">{tradeData.remainingQuantity ?? '-'}</div></div>
                </div>
              </div>
            </div>
            <div className="w-3/4 space-y-6">
              <PsychologySection psychology={psychology} onChange={handlePsychologyChange} emotionalStates={emotionalStates} />
              <MetricsSection metrics={metrics} onChange={handleMetricsChange} marketConditions={marketConditions} sessions={sessions} />
              <AnalysisSection analysis={analysis} onChange={handleAnalysisChange} setupTypes={setupTypes} tradeMistakes={tradeMistakes} />
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Meta</h4>
                <ChipsInput label="Lessons" items={lessons} setItems={setLessons} placeholder="Add lesson and press Enter" setIsSaved={setIsSaved} />
                <ChipsInput label="News Events" items={newsEvents} setItems={setNewsEvents} placeholder="Add news event" setIsSaved={setIsSaved} />
                <ChipsInput label="Economic Events" items={economicEvents} setItems={setEconomicEvents} placeholder="Add economic event" setIsSaved={setIsSaved} />
                <ChipsInput label="Tags" items={tags} setItems={setTags} placeholder="Add tag" setIsSaved={setIsSaved} />
              </div>
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
