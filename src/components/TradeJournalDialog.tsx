import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Loader2, X as XIcon } from "lucide-react";
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
  onSave?: (updated: ApiTrade) => void;
  /** if true, always perform local save (import mode) */
  importMode?: boolean;
}

export function TradeJournalDialog({ isOpen, onClose, trade, onSave, importMode }: TradeJournalDialogProps) {
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
  const [touched, setTouched] = useState(false);
  const isLocalEditable = importMode || !!onSave; // when true allow editing of core & price fields
  // isSaved removed (rely on isDirty + isSaving)

  // selectedtradeDetails is now passed as a prop
  // const selectedtradeDetails: TradeDetails | null = useSelector(
  //   (state: RootState) => state.UI.selectedItem
  // );
  // Use provided ApiTrade directly
  const tradeData = trade || null
  // preserve original date-time strings for import mode so we don't lose time component
  const rawOpenDateRef = useRef<string | null>(null);
  const rawCloseDateRef = useRef<string | null>(null);
  // Track last initialized tradeId to avoid wiping user-edited meta arrays when the same trade object updates in store
  const lastInitTradeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && tradeData) {
      // Guard: only initialize when opening or switching to a different tradeId
      if (lastInitTradeIdRef.current === tradeData.tradeId) {
        return;
      }
      // Always clear previous images to avoid leakage across different trades
      setImages([]);
      setInitialImagesState([]);
      // Build fresh snapshot only once per open or trade change
      if (importMode) {
        rawOpenDateRef.current = tradeData.openDate || null;
        rawCloseDateRef.current = tradeData.closeDate || null;
      } else {
        rawOpenDateRef.current = null;
        rawCloseDateRef.current = null;
      }
      let newImages: ImageType[] = (tradeData.images || []).map(i => ({ id: i.id, url: i.url, timeframe: i.timeframe || '', description: i.description || '' }))
      if (!importMode && tradeData.tradeId) {
        if (newImages.length > 0) {
          // Backend has images now; purge any stale cache
          try { localStorage.removeItem(`journalImages:${tradeData.tradeId}`) } catch {}
        } else {
          // Fallback to cache only if backend returned none
          try {
            const cached = localStorage.getItem(`journalImages:${tradeData.tradeId}`)
            if (cached) {
              const parsed = JSON.parse(cached)
              if (Array.isArray(parsed)) {
                newImages = parsed.map((img: any) => ({ id: img.id, url: img.url, timeframe: img.timeframe || '', description: img.description || '' }))
              }
            }
          } catch {}
        }
      }
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
        // Normalize to lowercase because selection list uses lowercase values
        setupType: (tradeData.setupType || '').toLowerCase(),
        // Mistakes stored lowercase in checkbox logic; convert to lowercase array
        mistakes: (tradeData.mistakes || []).map(m => (m || '').toLowerCase()).filter(Boolean)
      }
      const newMetrics: MetricsState = {
        riskAmount: tradeData.riskAmount ?? null,
        marketCondition: (tradeData.marketCondition || '').toLowerCase(),
        tradingSession: (tradeData.tradingSession || '').toLowerCase()
      }
      // Normalize date strings to YYYY-MM-DD if they include time
    // Preserve full ISO datetime (backend stores with time). Truncation removed.
      const newCore = {
        symbol: tradeData.symbol,
        side: tradeData.side,
        status: tradeData.status,
        quantity: tradeData.quantity,
          openDate: tradeData.openDate || '',
          closeDate: tradeData.closeDate || '',
        entryPrice: tradeData.entryPrice ?? '',
        exitPrice: tradeData.exitPrice ?? '',
        stopLoss: tradeData.stopLoss ?? '',
        takeProfit: tradeData.takeProfit ?? '',
        commission: tradeData.commission ?? '',
        fees: tradeData.fees ?? '',
  timeframe: (tradeData.timeframe || ''),
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
  setTouched(false);
  lastInitTradeIdRef.current = tradeData.tradeId;
  // snapshot refreshed
    } else if (!isOpen) {
      setImages([]);
      setInitialImagesState([]);
      setTouched(false);
  lastInitTradeIdRef.current = null;
    }
  }, [isOpen, tradeData]);

  const isDirty = useMemo(() => {
    if (!tradeData) return false;
    if (touched) return true;
    const currentComposite = JSON.stringify({ psychology, analysis, metrics, images, core, lessons, newsEvents, economicEvents, tags });
    const initialComposite = JSON.stringify({ psychology: initialPsychology, analysis: initialAnalysis, metrics: initialMetrics, images: initialImagesState, core: initialCore, lessons: initialLessons, newsEvents: initialNewsEvents, economicEvents: initialEconomicEvents, tags: initialTags });
    return currentComposite !== initialComposite;
  }, [touched, psychology, analysis, metrics, images, core, lessons, newsEvents, economicEvents, tags, initialPsychology, initialAnalysis, initialMetrics, initialImagesState, initialCore, initialLessons, initialNewsEvents, initialEconomicEvents, initialTags, tradeData]);

  const emotionalStates = [
    "Confident",
    "Calm",
    "Fearful",
    "Excited",
    "Frustrated",
    "Hopeful",
    "Stressed",
    "Indecisive",
    "Disciplined",
    "Impatient",
    "Greedy",
    "Revengeful",
    "Satisfied",
    "Overwhelmed",
    "Focused",
    "Distracted",
    "Neutral",
  ];
  const setupTypes = [
    "Blads Candle Close",
    "Blad's Candle Break",
  ];
  const sessions = ["Asian", "London", "New York", "Sydney"];
  const marketConditions = ["Trending", "Ranging", "Volatile", "Calm"];
  const tradeMistakes = [
    "Early Entry",
    "Late Entry",
    "Wrong Position Size",
    "Moved Stop Loss",
    "Early Exit",
  ];

  const markDirty = () => { if(!touched) setTouched(true) }
  const handlePsychologyChange = (changes: Partial<PsychologyState>) => { setPsychology(p => ({ ...p, ...changes })); markDirty() }
  const handleAnalysisChange = (changes: Partial<AnalysisState>) => { setAnalysis(a => ({ ...a, ...changes })); markDirty() }
  const handleMetricsChange = (changes: Partial<MetricsState>) => { setMetrics(m => ({ ...m, ...changes })); markDirty() }

  const handleSave = useCallback(async () => {
    if (!tradeData || !isDirty) return;

  setIsSaving(true);
  // mark saving start
  const localSave = importMode || !!onSave;
  toast.loading(localSave ? 'Saving changes locally...' : 'Updating trade...', { id: 'journal-update' });
  // helper to convert input strings to numbers or null
  // Normalize numeric fields and round to 2 decimals
  const toNum = (v: any) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  };

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

      // Prepare full updated ApiTrade object
      const preservedOpen = importMode && rawOpenDateRef.current ? rawOpenDateRef.current : core.openDate;
      const preservedClose = importMode && rawCloseDateRef.current ? rawCloseDateRef.current : (core.closeDate || null);
      // Derive pnl / netPnl if possible (only for full trade update path)
      const entryNum = toNum(core.entryPrice);
      const exitNum = toNum(core.exitPrice);
      const qtyNum = toNum(core.quantity) ?? 0;
      // Preserve explicit 0 vs null for commission / fees; don't coerce null -> 0 here
      const commissionNum = toNum(core.commission); // may be null or number
      const feesNum = toNum(core.fees); // may be null or number
      const initialCommissionNum = toNum(initialCore.commission);
      const initialFeesNum = toNum(initialCore.fees);
      // PnL derivation rules:
      // - In import/local mode we keep an existing pnl the user already adjusted unless core price fields changed.
      // - In persisted mode always recompute if we have entry/exit/qty and status CLOSED.
      // - Use absolute quantity to avoid negative qty influencing sign (side already encodes direction).
      const qtyAbs = Math.abs(qtyNum || 0);
      const shouldRecalcPnL = (
        core.status === 'CLOSED' &&
        entryNum !== null && exitNum !== null && qtyAbs > 0 && (
          !importMode || // normal edit always recompute
          importMode && (
            entryNum !== toNum(initialCore.entryPrice) ||
            exitNum !== toNum(initialCore.exitPrice) ||
            qtyNum !== toNum(initialCore.quantity)
          )
        )
      );
      let pnlDerived: number | null = tradeData.pnl ?? null;
      if (shouldRecalcPnL) {
        const rawMove = core.side === 'BUY' ? (exitNum! - entryNum!) : (entryNum! - exitNum!);
        const raw = rawMove * qtyAbs;
        pnlDerived = Math.round(raw * 100) / 100;
      }
      const commissionChanged = commissionNum !== initialCommissionNum;
      const feesChanged = feesNum !== initialFeesNum;
      let netPnlDerived: number | null = tradeData.netPnl ?? null;
      if (pnlDerived !== null && (shouldRecalcPnL || commissionChanged || feesChanged)) {
        netPnlDerived = Math.round((pnlDerived - (commissionNum ?? 0) - (feesNum ?? 0)) * 100) / 100;
      }
      // Round risk amount consistently
      const riskAmountNum = toNum(metrics.riskAmount);

      const updatedTrade: ApiTrade = {
        ...tradeData,
        symbol: core.symbol,
        side: core.side,
        status: core.status,
        quantity: qtyNum,
        openDate: preservedOpen,
        closeDate: preservedClose,
        entryPrice: entryNum,
        exitPrice: exitNum,
        stopLoss: toNum(core.stopLoss),
        takeProfit: toNum(core.takeProfit),
  commission: commissionNum,
  fees: feesNum,
        timeframe: core.timeframe || null,
        tradeGrade: core.tradeGrade ?? null,
        confidence: core.confidence ?? null,
        setupQuality: core.setupQuality ?? null,
        execution: core.execution ?? null,
        preTradeNotes: psychology.preNotes || null,
        mistakes: analysis.mistakes || [],
        newsEvents,
        economicEvents,
        lessons,
        tags,
        psychology: { ...psychology },
        images: updatedImages.slice(0,10).map(img => ({ id: img.id, url: img.url, timeframe: img.timeframe || null, description: img.description || null })),
        emotionalState: psychology.emotionalState || null,
        postTradeNotes: psychology.notes || null,
        riskRewardRatio: analysis.riskRewardRatio ?? null,
        setupType: analysis.setupType || null,
  riskAmount: riskAmountNum,
        marketCondition: metrics.marketCondition ?? null,
        tradingSession: metrics.tradingSession ?? null,
  pnl: pnlDerived ?? tradeData.pnl ?? undefined,
        netPnl: netPnlDerived ?? undefined,
  remainingQuantity: tradeData.remainingQuantity ?? (core.status === 'CLOSED' ? 0 : null),
  realizedPartialPnl: tradeData.realizedPartialPnl ?? null,
      };
  if (localSave && onSave) {
        // Local save without API call; keep dialog open so user can continue editing
        onSave(updatedTrade);
        // Update baseline snapshots so button disables until more edits
        setInitialCore(core);
        setInitialPsychology(psychology);
        setInitialAnalysis(analysis);
        setInitialMetrics(metrics);
        setInitialImagesState(updatedImages);
        setInitialLessons(lessons);
        setInitialNewsEvents(newsEvents);
        setInitialEconomicEvents(economicEvents);
        setInitialTags(tags);
        setTouched(false);
        // Persist images locally so they can be restored when viewing in the normal trades table after import save
        try { localStorage.setItem(`journalImages:${updatedTrade.tradeId}`, JSON.stringify(updatedImages)); } catch {}
        toast.success('Changes saved locally', { id: 'journal-update' });
        setIsSaving(false);
        return;
      }
  // lists already arrays
  const changes: any = {
    symbol: core.symbol,
    side: core.side,
    status: core.status,
    quantity: qtyNum,
    openDate: preservedOpen,
    closeDate: preservedClose,
    entryPrice: entryNum,
    exitPrice: exitNum,
    stopLoss: toNum(core.stopLoss),
    takeProfit: toNum(core.takeProfit),
    commission: commissionNum,
    fees: feesNum,
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
    psychology: { greed: psychology.greed, fomo: psychology.fomo, revenge: psychology.revenge, fear: psychology.fear, overconfidence: psychology.overconfidence, patience: psychology.patience },
    emotionalState: psychology.emotionalState || null,
    postTradeNotes: psychology.notes || null,
    riskRewardRatio: analysis.riskRewardRatio ?? null,
    setupType: analysis.setupType || null,
    mistakes: analysis.mistakes || [],
    riskAmount: riskAmountNum,
    marketCondition: metrics.marketCondition || null,
    tradingSession: metrics.tradingSession || null,
  pnl: pnlDerived ?? tradeData.pnl ?? undefined,
    netPnl: netPnlDerived ?? undefined,
    remainingQuantity: tradeData.remainingQuantity ?? (core.status === 'CLOSED' ? 0 : null),
    realizedPartialPnl: tradeData.realizedPartialPnl ?? null,
  }
  await dispatch(updateTrade({ tradeId: tradeData.tradeId, changes })).unwrap()
  // After successful API update, clear any cached local images (now source of truth is backend)
  try { localStorage.removeItem(`journalImages:${tradeData.tradeId}`) } catch {}

  setInitialPsychology(psychology);
      setInitialAnalysis(analysis);
      setInitialMetrics(metrics);
      setInitialImagesState(updatedImages);
  setInitialCore(core)
      setInitialLessons(lessons);
      setInitialNewsEvents(newsEvents);
      setInitialEconomicEvents(economicEvents);
      setInitialTags(tags);

  // saved
  toast.success('Trade updated', { id: 'journal-update' })
    } catch (error) {
      console.error("Error saving trade:", error);
  // failed
  toast.error((error as any)?.message || 'Update failed', { id: 'journal-update' })
    } finally {
  setIsSaving(false);
  setTouched(false);
    }
  }, [
    dispatch,
    images,
    psychology,
    analysis,
    metrics,
    core,
    lessons,
    newsEvents,
    economicEvents,
    tags,
    tradeData,
    isDirty,
  onSave,
    onClose,
  importMode,
  ]);

  const handleClose = () => {
    // In import/local mode ensure we don't lose unsaved edits when user clicks Close
    if ((importMode || onSave) && onSave && isDirty && !isSaving) {
      // trigger local save then close
      handleSave().finally(() => {
        dispatch(setIsEditOpen(false));
        onClose();
      })
      return;
    }
    dispatch(setIsEditOpen(false))
    onClose()
  }

  if (!isOpen || !tradeData) return null;

  // Inline chip input component for list fields
  function ChipsInput({ label, items, setItems, placeholder }: { label: string; items: string[]; setItems: (v: string[])=>void; placeholder?: string }) {
    const [value, setValue] = useState('')
    const addItem = () => {
      const trimmed = value.trim()
      if (trimmed && !items.includes(trimmed)) {
        setItems([...items, trimmed])
        markDirty()
      }
      setValue('')
    }
    const remove = (i: number) => { const next = items.filter((_,idx)=>idx!==i); setItems(next); markDirty() }
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
                <h4 className="font-medium text-sm">Core {isLocalEditable ? '(Editable)' : '(Read Only)'}</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1"><Label>Symbol</Label>{isLocalEditable ? <Input value={core.symbol} onChange={e=>{ setCore(c=>({...c,symbol:e.target.value})); markDirty(); }} /> : <div className="rounded bg-muted px-2 py-1 font-mono text-xs">{core.symbol}</div>}</div>
                  <div className="space-y-1"><Label>Side</Label>{isLocalEditable ? (
                    <Select value={core.side} onValueChange={v=>{ setCore(c=>({...c,side:v as TradeSide})); markDirty(); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['BUY','SELL'].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <div className="rounded bg-muted px-2 py-1 text-xs">{core.side}</div>}</div>
                  <div className="space-y-1"><Label>Status</Label>{isLocalEditable ? (
                    <Select value={core.status} onValueChange={v=>{ setCore(c=>({...c,status:v as TradeStatus})); markDirty(); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['OPEN','CLOSED','PARTIAL','CANCELLED'].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <div className="rounded bg-muted px-2 py-1 text-xs">{core.status}</div>}</div>
                  <div className="space-y-1"><Label>Quantity</Label>{isLocalEditable ? (
                    <Input
                      type="number"
                      value={core.quantity}
                      onChange={e=>{
                        const val = e.target.value;
                        setCore(c=>({ ...c, quantity: val === '' ? 0 : Number(val) }));
                        markDirty();
                      }}
                    />
                  ) : <div className="rounded bg-muted px-2 py-1 text-xs">{core.quantity}</div>}</div>
                  <div className="space-y-1"><Label>Open Date</Label>{isLocalEditable ? <Input value={core.openDate} onChange={e=>{ setCore(c=>({...c,openDate:e.target.value})); markDirty(); }} placeholder="YYYY-MM-DDTHH:mm:ss" /> : <div className="rounded bg-muted px-2 py-1 text-xs">{core.openDate || '-'}</div>}</div>
                  <div className="space-y-1"><Label>Close Date</Label>{isLocalEditable ? <Input value={core.closeDate} onChange={e=>{ setCore(c=>({...c,closeDate:e.target.value})); markDirty(); }} placeholder="YYYY-MM-DDTHH:mm:ss" /> : <div className="rounded bg-muted px-2 py-1 text-xs">{core.closeDate || '-'}</div>}</div>
                </div>
              </div>
              <div className="space-y-2 p-4 border rounded-md">
                <h4 className="font-medium text-sm">Prices {isLocalEditable ? '(Editable)' : '(Read Only)'}</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {['entryPrice','exitPrice','stopLoss','takeProfit','commission','fees'].map(field => {
                    const label = field.replace(/([A-Z])/g,' $1');
                    const value = (core as any)[field];
                    return (
                      <div key={field} className="space-y-1">
                        <Label className="capitalize">{label}</Label>
                        {isLocalEditable ? (
                          <Input
                            type="number"
                            value={value === '' || value === null ? '' : value}
                            onChange={e=>{ const v = e.target.value; setCore(c=>({...c,[field]: v})); markDirty(); }}
                          />
                        ) : <div className="rounded bg-muted px-2 py-1">{value !== '' && value !== null ? value : '-'}</div>}
                      </div>
                    )
                  })}
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
                    <Slider value={[(core as any)[f] ?? 0]} max={100} step={1} onValueChange={v=>{ setCore(c=>({ ...c, [f]: v[0] })); markDirty() }} />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Grade</Label>
                  <Select value={core.tradeGrade ?? ''} onValueChange={v=>{ setCore(c=>({ ...c, tradeGrade: v as TradeGrade })); markDirty() }}>
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
                <ChipsInput label="Lessons" items={lessons} setItems={setLessons} placeholder="Add lesson and press Enter" />
                <ChipsInput label="News Events" items={newsEvents} setItems={setNewsEvents} placeholder="Add news event" />
                <ChipsInput label="Economic Events" items={economicEvents} setItems={setEconomicEvents} placeholder="Add economic event" />
                <ChipsInput label="Tags" items={tags} setItems={setTags} placeholder="Add tag" />
              </div>
              <ImageDocumentationSection
                images={images}
                setImages={setImages}
                onDirty={markDirty}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end px-6 py-3 border-t bg-background">
          <Button onClick={handleClose} variant="outline" disabled={isSaving} className="mr-2">Close</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="gap-2"
            variant={isDirty ? 'default' : 'secondary'}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isSaving ? 'Saving...' : (importMode || onSave) ? 'Update Trade' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
