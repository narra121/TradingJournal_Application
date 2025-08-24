import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog"; // Assuming DialogFooter might be needed later if not already used
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Loader2, Upload, Check } from "lucide-react"; // Import Check icon
import { cn } from "lib/utils";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/ui/select";
import { parse, isValid } from "date-fns";
import { useDispatch, useSelector } from 'react-redux'
import { extractTrades, createTradesBulk, listTrades } from '@/app/awsTradesSlice'
import { RootState, AppDispatch } from '@/app/store'
import { toast } from 'sonner'

// Removed legacy TradeDetails dependency; using lightweight ImportedTrade placeholder until bulk AWS import implemented.
interface ImportedTrade {
  tradeId?: string;
  symbol: string;
  side: string;
  openDate: string;
  closeDate: string;
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  status: string;
  // Extended fields
  stopLoss?: number | null;
  takeProfit?: number | null;
  commission?: number | null;
  fees?: number | null;
  riskAmount?: number | null;
  setupType?: string | null;
  timeframe?: string | null;
  marketCondition?: string | null;
  tradingSession?: string | null;
  tradeGrade?: string | null;
  confidence?: number | null;
  setupQuality?: number | null;
  execution?: number | null;
  emotionalState?: string | null;
  psychology?: {
    greed?: boolean;
    fear?: boolean;
    fomo?: boolean;
    revenge?: boolean;
    overconfidence?: boolean;
    patience?: boolean;
  };
  preTradeNotes?: string | null;
  postTradeNotes?: string | null;
  mistakes?: string[];
  lessons?: string[];
  newsEvents?: string[];
  economicEvents?: string[];
  tags?: string[];
  selected?: boolean;
  idempotencyKey?: string;
}
import { Textarea } from '@/ui/textarea';
import { Switch } from '@/ui/switch';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/ui/drawer';
import { Badge } from '@/ui/badge';
import { Separator } from '@/ui/separator';
const parseDateString = (dateString: string): Date => {
  let format: string = "yyyy-MM-dd HH:mm:ss";
  const date = parse(dateString, format, new Date());
  return isValid(date) ? date : new Date();
};
// Round to two decimals (standard rounding)
const round2 = (v: any): number => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

// Draft persistence key
const DRAFT_KEY = 'tj.importDraft'

// Deterministic hash (FNV-1a 32-bit) -> hex string for idempotency key
const fnv1a = (str: string) => {
  let h = 0x811c9dc5
  for (let i=0;i<str.length;i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
    h >>>= 0
  }
  return ('00000000'+h.toString(16)).slice(-8)
}

// Extended deterministic key now includes entry & exit for higher uniqueness.
// NOTE: Decimals are normalized to two places to avoid floating drift.
const buildIdempotencyKey = (t: Pick<ImportedTrade,'symbol'|'openDate'|'qty'|'pnl'|'closeDate'|'entry'|'exit'>) => {
  const parts = [
    (t.symbol||'').trim().toUpperCase(),
    (t.openDate||'').trim(),
    String(t.qty ?? ''),
    Number.isFinite(t.entry) ? round2(t.entry).toFixed(2) : '',
    Number.isFinite(t.exit) ? round2(t.exit).toFixed(2) : '',
    Number.isFinite(t.pnl) ? round2(t.pnl).toFixed(2) : '',
    (t.closeDate||'').trim()
  ]
  return 't_'+fnv1a(parts.join('::'))
}

const attachIdempotency = (t: ImportedTrade): ImportedTrade => ({ ...t, idempotencyKey: buildIdempotencyKey(t) })
export function TradeImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [trades, setTrades] = useState<ImportedTrade[]>([]);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof ImportedTrade;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For image processing
  const [isSaving, setIsSaving] = useState(false); // For saving trades
  const [isSaved, setIsSaved] = useState(false); // Track successful save
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detailTrade, setDetailTrade] = useState<ImportedTrade | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>()
  const extractState = useSelector((s:RootState)=> s.AwsTrades.extract)
  const extractionCancelRef = useRef<{ cancelled: boolean }>({ cancelled: false })
  const [isCancelling, setIsCancelling] = useState(false)
  // Dialog removed per request; using toasts only for extraction progress/result

  // Clear previous state every time the dialog is (re)opened
  const wasOpenRef = useRef(false)
  useEffect(()=>{
    if(isOpen) {
      // If reopening (or first open) wipe previous import session
      setTrades([])
      setUploadedImage(null)
      setIsDirty(false)
      setIsSaved(false)
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  const extractWithRetry = async (base64: string, attempts = 3, delayMs = 1200) => {
    extractionCancelRef.current.cancelled = false
    for (let i=1; i<=attempts; i++) {
      if (extractionCancelRef.current.cancelled) throw new Error('Extraction cancelled')
      const start = Date.now()
      const action = await dispatch(extractTrades(base64))
      if (extractTrades.fulfilled.match(action)) {
        toast.success(`Extracted trades (attempt ${i}) in ${Date.now()-start}ms`, { id: 'extract-trades-progress' })
        return action.payload
      } else {
        if (extractionCancelRef.current.cancelled) throw new Error('Extraction cancelled')
        const remaining = attempts - i
        toast.error(`Extraction failed (attempt ${i})${remaining?`, retrying in ${delayMs}ms...`:''}`, { id: 'extract-trades-progress' })
        if (!remaining) throw new Error(String(action.payload || 'Extraction failed'))
        await new Promise(r=>setTimeout(r, delayMs))
        delayMs *= 2 // exponential backoff
      }
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setIsCancelling(false)
    setIsDirty(false); // Reset dirty state on new upload
    setIsSaved(false); // Reset saved state on new upload
  toast.loading('Extracting trades from image...', { id: 'extract-trades-progress' })
  // If a previous extraction is in-flight, cooperatively cancel it
  extractionCancelRef.current.cancelled = true;
  // Small delay to allow any in-flight promise loops to notice cancellation flag
  await new Promise(r=>setTimeout(r,10));
  extractionCancelRef.current.cancelled = false;
    try {
      // Simulate API call to process image
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string
        setUploadedImage(base64);
        try {
          const res = await extractWithRetry(base64)
          if(res) {
            const items = res.data?.items || []
            const currentYear = new Date().getFullYear()
            const normalizeYear = (raw:string): string => {
              if(!raw) return ''
              const s = raw.trim()
              if(/^\d{4}-/.test(s)) {
                return s.replace(/^\d{4}/, String(currentYear))
              }
              if(/^\d{1,2}[-/]\d{1,2}/.test(s)) {
                const std = s.replace(/\//g,'-')
                return `${currentYear}-${std}`
              }
              // Attempt parse
              const d = new Date(s)
              if(!isNaN(d.getTime())) {
                d.setFullYear(currentYear)
                const pad = (n:number)=> String(n).padStart(2,'0')
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
              }
              return s
            }
            const importedTrades: ImportedTrade[] = items.map((t:any) => attachIdempotency({
              tradeId: uuidv4(),
              symbol: t.symbol || '',
              side: t.side || 'BUY',
              openDate: normalizeYear(t.openDate || ''),
              closeDate: normalizeYear(t.closeDate || ''),
              entry: round2(t.entryPrice ?? t.entry ?? 0),
              exit: round2(t.exitPrice ?? t.exit ?? 0),
              qty: t.quantity || t.qty || 0,
              pnl: round2(t.pnl ?? 0),
              status: t.status || ( (t.pnl??0) > 0 ? 'TP':'SL'),
              stopLoss: null,
              takeProfit: null,
              commission: null,
              fees: null,
              riskAmount: null,
              setupType: null,
              timeframe: null,
              marketCondition: null,
              tradingSession: null,
              tradeGrade: null,
              confidence: null,
              setupQuality: null,
              execution: null,
              emotionalState: null,
              psychology: { greed:false,fear:false,fomo:false,revenge:false,overconfidence:false,patience:false },
              preTradeNotes: null,
              postTradeNotes: null,
              mistakes: [],
              lessons: [],
              newsEvents: [],
              economicEvents: [],
              tags: [],
              selected: false,
              idempotencyKey: undefined
            }))
            setTrades(importedTrades)
            if(importedTrades.length>0) setIsDirty(true)
            if(importedTrades.length===0) toast.info('No trades detected in image')
    toast.success(`${importedTrades.length} trade(s) extracted`, { id: 'extract-trades-progress' })
          } else {
            toast.error('Extraction produced no result')
          }
        } catch (e:any) { 
          if(e.message==='Extraction cancelled'){ 
    toast.info('Extraction cancelled', { id: 'extract-trades-progress' }) 
          } else { 
            console.error(e); 
    toast.error(e.message || 'Extraction failed', { id: 'extract-trades-progress' }); 
          } 
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setIsDirty(false); // Ensure dirty is false if import fails
  toast.error('Error processing image', { id: 'extract-trades-progress' })
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          break;
        }
      }
    },
    [handleImageUpload]
  );

  // Also support global paste (user might not have the drop zone focused)
  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if(!isOpen || isLoading) return;
      const items = e.clipboardData?.items;
      if(!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, isLoading, handleImageUpload]);

  const handleCellEdit = (
    id: string,
    field: keyof ImportedTrade,
    value: string | number
  ) => {
    // Apply rounding for numeric decimal fields
    const numericFields: Array<keyof ImportedTrade> = ['entry','exit','pnl']
    const nextVal = numericFields.includes(field) ? round2(value) : value
    setTrades(trades.map(trade => {
      if (trade.tradeId !== id) return trade
      const updated: ImportedTrade = { ...trade, [field]: nextVal } as any
      // Recompute idempotency key if any of the contributing fields changed
      if (['symbol','openDate','qty','pnl','closeDate','entry','exit'].includes(field)) {
        return attachIdempotency(updated)
      }
      return updated
    }))
    setEditingCell(null)
    setIsDirty(true)
    setIsSaved(false) // Reset saved state on edit
  }

  const validateTrades = (list: ImportedTrade[]) => {
    const errors: string[] = []
    const valid: ImportedTrade[] = []
    list.forEach((t, idx) => {
      const prefix = `Row ${idx+1}`
      const rowErrors: string[] = []
      if(!t.symbol) rowErrors.push('missing symbol')
      if(!['BUY','SELL'].includes(t.side)) rowErrors.push('invalid side')
      if(!t.openDate) rowErrors.push('missing openDate')
      if(!t.closeDate) rowErrors.push('missing closeDate')
      if(t.openDate && t.closeDate && new Date(t.openDate) > new Date(t.closeDate)) rowErrors.push('openDate after closeDate')
      if(!t.entry || isNaN(t.entry)) rowErrors.push('invalid entry')
      if(!t.exit || isNaN(t.exit)) rowErrors.push('invalid exit')
      if(!t.qty || isNaN(t.qty) || t.qty<=0) rowErrors.push('invalid qty')
      if(rowErrors.length) errors.push(`${prefix}: ${rowErrors.join(', ')}`)
      else valid.push(t)
    })
    return { valid, errors }
  }

  // throttleAll removed (bulk save now single request)

  const handleSave = async () => {
    if(trades.length===0) return
    const subset = trades.some(t=>t.selected) ? trades.filter(t=>t.selected) : trades
    const { valid, errors } = validateTrades(subset)
    if(errors.length) {
      toast.error(`Validation errors:\n${errors.slice(0,5).join('\n')}${errors.length>5?`\n...(${errors.length-5} more)`:''}`)
      if(valid.length===0) return
      toast.info(`Proceeding with ${valid.length} valid trades`)    
    }
    setIsSaving(true)
    toast.loading(`Saving ${valid.length} trade(s)...`, { id:'save-trades' })
    // Build bulk payload
  const bulkItems = valid.map(t => ({
      // Core required
      symbol: t.symbol,
      side: t.side as any,
      quantity: t.qty,
      openDate: t.openDate,
      idempotencyKey: t.idempotencyKey || uuidv4(),
      // Optional / nullable fields (send explicitly per request)
      closeDate: t.closeDate || null,
      entryPrice: t.entry ?? null,
      exitPrice: t.exit ?? null,
  // Explicit PnL fields (backend previously derived; now passing actual extracted value)
  pnl: Number.isFinite(t.pnl) ? round2(t.pnl) : null,
  netPnl: Number.isFinite(t.pnl) ? round2(t.pnl) : null,
      stopLoss: t.stopLoss ?? null,
      takeProfit: t.takeProfit ?? null,
      commission: t.commission ?? null,
      fees: t.fees ?? null,
      riskAmount: t.riskAmount ?? null,
      setupType: t.setupType ?? null,
      timeframe: t.timeframe ?? null,
      marketCondition: t.marketCondition ?? null,
      tradingSession: t.tradingSession ?? null,
      tradeGrade: t.tradeGrade ?? null,
      confidence: t.confidence ?? null,
      setupQuality: t.setupQuality ?? null,
      execution: t.execution ?? null,
      emotionalState: t.emotionalState ?? null,
      psychology: { ...(t.psychology||{}) },
      preTradeNotes: t.preTradeNotes ?? null,
      postTradeNotes: t.postTradeNotes ?? null,
      mistakes: t.mistakes ?? [],
      lessons: t.lessons ?? [],
      newsEvents: t.newsEvents ?? [],
      economicEvents: t.economicEvents ?? [],
      tags: t.tags ?? [],
      status: 'CLOSED',
      images: [],
    }))
    let created = 0, skipped: any[] = [], apiErrors: any[] = [], errorMsg: string | undefined
    try {
      const envelope: any = await dispatch(createTradesBulk(bulkItems as any)).unwrap()
      created = envelope?.data?.created || 0
      skipped = envelope?.data?.skipped || []
      apiErrors = envelope?.data?.errors || []
    } catch(e:any) { errorMsg = e.message || String(e) }
    setIsSaving(false)

    // Compose toast message
    const closeable = { id:'save-trades', dismissible: true as any }
    if(errorMsg) {
      toast.error(`Bulk save failed (${errorMsg.substring(0,160)})`, closeable)
      return
    }
    const skippedCount = skipped.length
  const errorCount = apiErrors.length
    if(created>0 && skippedCount===0 && errorCount===0) {
      toast.success(`Created ${created} trade(s)`, closeable)
  setIsSaved(true)
      setIsDirty(false)
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
  // Invalidate / refresh trade list after successful import
  dispatch(listTrades(undefined))
      return
    }
    if(created===0 && skippedCount>0 && errorCount===0) {
      toast.info(`Skipped ${skippedCount} (duplicates)`, closeable)
      // treat as saved state since duplicates already exist
  setIsSaved(true)
      setIsDirty(false)
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
  dispatch(listTrades(undefined))
      return
    }
    if(created>0 && (skippedCount>0 || errorCount>0)) {
      toast.warning?.(`Created ${created}, skipped ${skippedCount}${errorCount?`, errors ${errorCount}`:''}`, closeable) || toast(`Created ${created}, skipped ${skippedCount}${errorCount?`, errors ${errorCount}`:''}`, closeable)
  setIsSaved(true)
      setIsDirty(false)
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
  dispatch(listTrades(undefined))
      return
    }
    // Fallback
    toast.error('Bulk save produced no result', closeable)
  }

  const handleRowSelect = (id: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) =>
        trade.tradeId === id ? { ...trade, selected: !trade.selected } : trade
      )
    );
  };

  const handleMergeTrades = () => {
    const selectedTrades = trades.filter((trade) => trade.selected);

    if (selectedTrades.length < 2) {
      alert("Select at least two trades to merge.");
      return;
    }

  const sides = [...new Set(selectedTrades.map((trade) => trade.side))];
    if (sides.length > 1) {
      alert("You can only merge trades with the same side.");
      return;
    }
    const symbols = [...new Set(selectedTrades.map((trade) => trade.symbol))];
    if (symbols.length > 1) {
      alert("You can only merge trades with the same symbol.");
      return;
    }
    const symbol = symbols[0];

    const mergedTradeBase: ImportedTrade = {
      tradeId: uuidv4(),
      symbol: symbol,
      openDate: selectedTrades.reduce((minDate, trade) => {
        const currentDate = parseDateString(trade.openDate);
        const min = parseDateString(minDate);
        console.log(currentDate, min);
        return currentDate < min ? trade.openDate : minDate;
      }, selectedTrades[0].openDate),
      closeDate: selectedTrades.reduce((maxDate, trade) => {
        const currentDate = parseDateString(trade.closeDate);
        const max = parseDateString(maxDate);
        return currentDate > max ? trade.closeDate : maxDate;
      }, selectedTrades[0].closeDate),
      pnl: selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0),
      status:
        selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0) >= 0
          ? "TP"
          : "SL",
      side: selectedTrades[0].side, // Assuming all trades are of the same side

      // Calculate Entry and Exit
  entry:
        selectedTrades[0].side === "BUY"
          ? selectedTrades.reduce((minEntry, trade) => {
              return trade.entry < minEntry ? trade.entry : minEntry;
            }, selectedTrades[0].entry)
          : selectedTrades.reduce((maxEntry, trade) => {
              return trade.entry > maxEntry ? trade.entry : maxEntry;
            }, selectedTrades[0].entry),

      exit:
        selectedTrades[0].side === "BUY"
          ? selectedTrades.reduce((maxExit, trade) => {
              return trade.exit > maxExit ? trade.exit : maxExit;
            }, selectedTrades[0].exit)
          : selectedTrades.reduce((minExit, trade) => {
              return trade.exit < minExit ? trade.exit : minExit;
            }, selectedTrades[0].exit),

  qty: selectedTrades.reduce((sum, trade) => sum + (trade.qty||0), 0),
      selected: false,
    };

    const mergedTrade = attachIdempotency(mergedTradeBase)

    setTrades((prevTrades) => [
      ...prevTrades.filter((trade) => !trade.selected),
      mergedTrade,
    ]);
  };

  const handleDeleteTrades = () => {
    setTrades(prev => {
      const next = prev.filter(t=>!t.selected)
      if(next.length !== prev.length) {
        setIsDirty(true)
        setIsSaved(false)
      }
      return next
    })
  };

  const handleClick = () => {
    setEditingCell(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Trades
        </Button>
      </DialogTrigger>
      <DialogContent
        onClick={handleClick}
        className="max-w-[90vw] max-h-[90vh] w-full h-full flex flex-col p-5 mb-10"
      >
  {/* Draft auto-restore removed per request: starting fresh each open */}
        <DialogHeader className=" pb-2">
          <DialogTitle className="flex justify-between items-center">
            <span>Import Trades</span>
            {/* Removed the button from here */}
            {/* <div className="flex gap-2"> */}
            {/* {isDirty && (
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              )} */}
            {/* <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button> */}
            {/* </div> */}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1  space-y-4 overflow-hidden">
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            // Single click just focuses so user can Ctrl+V. Double click opens file dialog.
            onClick={() => {
              if(isLoading) return;
              // focus container for accessibility / paste readiness
              (dropZoneRef.current as HTMLDivElement | null)?.focus?.();
            }}
            onDoubleClick={() => {
              if(isLoading) return;
              fileInputRef.current?.click();
            }}
            tabIndex={0}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors overflow-auto",
              "hover:border-zinc-400 cursor-pointer",
              uploadedImage ? "border-green-500" : "border-zinc-200",
              "max-h-[20vh]"
            )}
          >
            {/* Hidden file input for click-to-upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if(file && file.type.startsWith('image/')) handleImageUpload(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Processing image...</span>
                <Button variant="ghost" size="sm" disabled={isCancelling} onClick={()=>{ extractionCancelRef.current.cancelled = true; setIsCancelling(true) }}>Cancel</Button>
              </div>
            ) : uploadedImage ? (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded trade"
                  className="w-full h-auto"
                />
                {(extractState.lastParseSteps || extractState.lastElapsedMs) && (
                  <div className='text-left'>
                    <div className='flex items-center gap-2 mb-1'>
                      {extractState.lastElapsedMs && <span className='inline-block text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700'>Elapsed {extractState.lastElapsedMs}ms</span>}
                      {extractState.lastParseSteps && <p className='text-xs font-medium'>Parse Steps:</p>}
                    </div>
                    {extractState.lastParseSteps && (
                      <ul className='text-xs list-disc pl-4 space-y-0.5'>
                        {extractState.lastParseSteps.map((s,i)=>(<li key={i}>{s}</li>))}
                      </ul>
                    )}
                  </div>
                )}
                <p className="text-sm text-zinc-500">
                  Double-click to choose a file, or single click then paste (Ctrl+V) / drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-zinc-400" />
                <p>Drag & drop, double-click to browse, or click then paste a trade screenshot</p>
                <p className="text-sm text-zinc-500">
                  Supported formats: PNG, JPG, JPEG
                </p>
              </div>
            )}
          </div>

          {trades.length > 0 && (
            <div
              className="border rounded-lg flex flex-col"
              // style={{ height: "calc(60vh - 2rem)" }}
            >
              <div className="flex justify-end p-2 gap-2">
                <Button variant="outline" onClick={handleMergeTrades}>
                  {"(" +
                    trades.filter((trade) => trade.selected).length +
                    ") Merge"}
                </Button>
                <Button variant="default" onClick={handleDeleteTrades}>
                  {"(" +
                    trades.filter((trade) => trade.selected).length +
                    ") Delete"}
                </Button>
              </div>
              <div className="bg-white border-b">
                <Table>
                  <TableHeader>
                    <TableRow className="text-center">
                      <TableHead className="w-[20px] text-center"></TableHead>
                      <TableHead className="w-[160px] text-center">Open Date</TableHead>
                      <TableHead className="w-[160px] text-center">Close Date</TableHead>
                      <TableHead className="w-[100px] text-center">Symbol</TableHead>
                      <TableHead className="w-[80px] text-center">Side</TableHead>
                      <TableHead className="w-[100px] text-center">Entry</TableHead>
                      <TableHead className="w-[100px] text-center">Exit</TableHead>
                      <TableHead className="w-[100px] text-center">Quantity</TableHead>
                      <TableHead className="w-[100px] text-center">P&L</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                      <TableHead className="w-[90px] text-center">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div
                className="overflow-auto h-[30vh]"
                onClick={(e) => {
                  // Only close editing if clicking on the container itself, not its children
                  if (editingCell && e.target === e.currentTarget) {
                    setEditingCell(null);
                  }
                }}
              >
                <Table>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.tradeId} className="text-center">
                        <TableCell className="w-[20px] text-center">
                            <Checkbox
                              checked={trade.selected || false}
                              onCheckedChange={()=> { if(trade.tradeId) { handleRowSelect(trade.tradeId) } }}
                            />
                        </TableCell>
                        <TableCell className="w-[160px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "openDate" ? (
                            <Input
                              autoFocus
                              defaultValue={trade.openDate}
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'openDate', e.target.value)}
                              onKeyDown={(e)=>{
                                if(e.key==='Enter') (e.target as HTMLInputElement).blur();
                                if(e.key==='Escape') setEditingCell(null);
                              }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'openDate'}); }}
                            >{trade.openDate}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[160px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "closeDate" ? (
                            <Input
                              autoFocus
                              defaultValue={trade.closeDate}
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'closeDate', e.target.value)}
                              onKeyDown={(e)=>{
                                if(e.key==='Enter') (e.target as HTMLInputElement).blur();
                                if(e.key==='Escape') setEditingCell(null);
                              }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'closeDate'}); }}
                            >{trade.closeDate}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "symbol" ? (
                            <Input
                              defaultValue={trade.symbol}
                              autoFocus
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'symbol', e.target.value)}
                              onKeyDown={(e)=>{ if(e.key==='Enter') (e.target as HTMLInputElement).blur(); if(e.key==='Escape') setEditingCell(null); }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'symbol'}); }}
                            >{trade.symbol}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[80px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === 'side' ? (
                            <Select
                              defaultValue={trade.side}
                              onValueChange={(val)=>{ handleCellEdit(trade.tradeId||'', 'side', val); }}
                            >
                              <SelectTrigger className="h-7 text-xs text-center"> <SelectValue /> </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BUY">BUY</SelectItem>
                                <SelectItem value="SELL">SELL</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium cursor-pointer",
                                trade.side === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              )}
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'side'}); }}
                            >{trade.side}</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "entry" ? (
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={trade.entry}
                              autoFocus
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'entry', parseFloat(e.target.value))}
                              onKeyDown={(e)=>{ if(e.key==='Enter') (e.target as HTMLInputElement).blur(); if(e.key==='Escape') setEditingCell(null); }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'entry'}); }}
                            >{round2(trade.entry).toFixed(2)}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "exit" ? (
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={trade.exit}
                              autoFocus
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'exit', parseFloat(e.target.value))}
                              onKeyDown={(e)=>{ if(e.key==='Enter') (e.target as HTMLInputElement).blur(); if(e.key==='Escape') setEditingCell(null); }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'exit'}); }}
                            >{round2(trade.exit).toFixed(2)}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === "qty" ? (
                            <Input
                              type="number"
                              defaultValue={trade.qty}
                              autoFocus
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'qty', parseInt(e.target.value))}
                              onKeyDown={(e)=>{ if(e.key==='Enter') (e.target as HTMLInputElement).blur(); if(e.key==='Escape') setEditingCell(null); }}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-zinc-100 p-1 rounded font-mono"
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'qty'}); }}
                            >{trade.qty}</div>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === 'pnl' ? (
                            <Input
                              type="number"
                              defaultValue={trade.pnl}
                              autoFocus
                              className="text-center"
                              onBlur={(e)=>handleCellEdit(trade.tradeId||'', 'pnl', parseFloat(e.target.value))}
                              onKeyDown={(e)=>{ if(e.key==='Enter') (e.target as HTMLInputElement).blur(); if(e.key==='Escape') setEditingCell(null); }}
                            />
                          ) : (
                            <span
                              className={cn("font-mono cursor-pointer", trade.pnl>=0? 'text-green-600':'text-red-600')}
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'pnl'}); }}
                            >${round2(trade.pnl).toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {editingCell?.id === trade.tradeId && editingCell?.field === 'status' ? (
                            <Select
                              defaultValue={trade.status}
                              onValueChange={(val)=>{ handleCellEdit(trade.tradeId||'', 'status', val); }}
                            >
                              <SelectTrigger className="h-7 text-xs text-center"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TP">TP</SelectItem>
                                <SelectItem value="SL">SL</SelectItem>
                                <SelectItem value="BE">BE</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium cursor-pointer",
                                trade.status==='TP' ? 'bg-green-100 text-green-800' : trade.status==='SL' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-700'
                              )}
                              title="Double-click to edit"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e)=>{ e.stopPropagation(); setEditingCell({ id: trade.tradeId||'', field:'status'}); }}
                            >{trade.status}</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[90px] text-center">
                          <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setDetailTrade(trade); setIsDetailOpen(true); }}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        {/* Footer with the updated button */}
        <div className="flex justify-end mt-4">
          {isSaved ? (
            <Button
              onClick={() => setIsOpen(false)}
              className="align-self-end gap-2"
            >
              <Check className="h-4 w-4" /> Close
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              // Enable if not saving AND (either dirty OR there are trades but not yet saved)
              // Simplified: Enable if not saving AND there are trades AND (it's dirty OR it hasn't been saved yet)
              // Let's refine the logic: Enable if not saving AND there are trades to save (isDirty is true)
              disabled={isSaving || !isDirty} // Button is disabled if saving is in progress OR if there are no changes (isDirty is false)
              className="align-self-end gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </DialogContent>
      {/* Detail Drawer */}
      <Drawer open={isDetailOpen} onOpenChange={(o)=>{ if(!o) { setIsDetailOpen(false); setDetailTrade(null);} }}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">Trade Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto space-y-6">
            {detailTrade && (
              <>
                <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['symbol','side','openDate','closeDate','entry','exit','qty','pnl','status'].map(f => (
                    <div key={f} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">{f}</label>
                      <Input
                        type={['entry','exit','qty','pnl'].includes(f)?'number':'text'}
                        value={(detailTrade as any)[f] ?? ''}
                        onChange={e=>{
                          const val = ['entry','exit','qty','pnl'].includes(f)? parseFloat(e.target.value): e.target.value;
                          setDetailTrade(dt=> dt? { ...dt, [f]: val }: dt);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  {['stopLoss','takeProfit','commission','fees','riskAmount','confidence','setupQuality','execution'].map(f => (
                    <div key={f} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">{f}</label>
                      <Input
                        type="number"
                        value={(detailTrade as any)[f] ?? ''}
                        onChange={e=>{
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          setDetailTrade(dt=> dt? { ...dt, [f]: val }: dt);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  {['setupType','timeframe','marketCondition','tradingSession','tradeGrade','emotionalState'].map(f => (
                    <div key={f} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">{f}</label>
                      <Input
                        value={(detailTrade as any)[f] ?? ''}
                        onChange={e=> setDetailTrade(dt=> dt? { ...dt, [f]: e.target.value || null }: dt)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </section>
                <Separator />
                <section className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Psychology Flags</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['greed','fear','fomo','revenge','overconfidence','patience'].map(flag => (
                      <label key={flag} className="flex items-center gap-2 text-xs">
                        <Switch
                          checked={!!detailTrade.psychology?.[flag as keyof typeof detailTrade.psychology]}
                          onCheckedChange={(checked)=> setDetailTrade(dt=> dt? { ...dt, psychology: { ...(dt.psychology||{}), [flag]: checked } }: dt)}
                        />
                        <span className="capitalize">{flag}</span>
                      </label>
                    ))}
                  </div>
                </section>
                <Separator />
                <section className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Pre Trade Notes</label>
                    <Textarea value={detailTrade.preTradeNotes || ''} onChange={e=> setDetailTrade(dt=> dt? { ...dt, preTradeNotes: e.target.value || null }: dt)} className="min-h-[80px] text-sm"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Post Trade Notes</label>
                    <Textarea value={detailTrade.postTradeNotes || ''} onChange={e=> setDetailTrade(dt=> dt? { ...dt, postTradeNotes: e.target.value || null }: dt)} className="min-h-[80px] text-sm"/>
                  </div>
                </section>
                <Separator />
                <section className="grid md:grid-cols-2 gap-6">
                  {['mistakes','lessons','newsEvents','economicEvents','tags'].map(listName => (
                    <ArrayEditor
                      key={listName}
                      label={listName}
                      values={(detailTrade as any)[listName] || []}
                      onChange={(vals)=> setDetailTrade(dt=> dt? { ...dt, [listName]: vals }: dt)}
                    />
                  ))}
                </section>
              </>
            )}
          </div>
          <DrawerFooter className="pt-2">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>{ setIsDetailOpen(false); setDetailTrade(null); }}>Cancel</Button>
              <Button
                onClick={()=>{
                  if(!detailTrade) return;
                  setTrades(ts => ts.map(t=> t.tradeId===detailTrade.tradeId ? attachIdempotency({ ...t, ...detailTrade }) : t));
                  setIsDirty(true);
                  setIsSaved(false);
                  setIsDetailOpen(false);
                }}
              >Apply</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Dialog>
  );
}

// Lightweight array editor component for chip-style list inputs
function ArrayEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (vals:string[])=>void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if(!trimmed) return;
    if(values.includes(trimmed)) { setInput(''); return; }
    onChange([...values, trimmed]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
        <span>{label}</span>
        {values.length>0 && <span className="text-[10px] font-normal">{values.length}</span>}
      </label>
      <div className="flex flex-wrap gap-1">
        {values.map(v => (
          <Badge key={v} variant="secondary" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
            {v}
            <button type="button" className="ml-1 text-[10px] hover:text-destructive" onClick={()=> onChange(values.filter(x=>x!==v))}>×</button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={`Add ${label}`}
          value={input}
          onChange={e=> setInput(e.target.value)}
          onKeyDown={e=> { if(e.key==='Enter'){ e.preventDefault(); add(); }}}
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

// Draft persistence component removed (requirement: start clean on reopen)
