import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { ApiTrade, ApiTradeImage } from '@/app/types';
import { format, parseISO } from 'date-fns';
import { cn } from 'lib/utils';
import { ScrollArea } from '@/ui/scroll-area';
import { Badge } from '@/ui/badge';
import { X, ZoomIn, ImageIcon } from 'lucide-react';
import { Button } from '@/ui/button';
// Legacy TradeDetails component removed in ApiTrade refactor

interface DailyTradesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  trades: ApiTrade[];
  showTradesList?: boolean; // Optional prop to control whether to show trades list
}

export function DailyTradesDialog({ isOpen, onClose, selectedDate, trades, showTradesList = true }: DailyTradesDialogProps) {
  const [selectedTrade, setSelectedTrade] = useState<ApiTrade | null>(null);
  const [activeImage, setActiveImage] = useState<ApiTradeImage | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{x:number;y:number}|null>(null);

  useEffect(() => {
    if (isOpen && trades.length > 0) {
      setSelectedTrade(trades[0]);
    } else if (!isOpen) {
      setSelectedTrade(null);
      setActiveImage(null);
      setImageScale(1);
      setImageOffset({x:0,y:0});
    }
  }, [isOpen, trades]);

  const closeImageViewer = useCallback(() => {
    setActiveImage(null);
    setImageScale(1);
    setImageOffset({x:0,y:0});
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if(!activeImage) return;
    e.preventDefault();
    const delta = -e.deltaY; // Natural direction
    setImageScale(prev => {
      const next = prev + (delta > 0 ? 0.1 : -0.1);
      return Math.min(Math.max(next, 0.3), 5);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if(!activeImage) return;
    setIsPanning(true);
    setPanStart({x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y});
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if(isPanning && panStart) {
      setImageOffset({x: e.clientX - panStart.x, y: e.clientY - panStart.y});
    }
  };
  const handleMouseUp = () => { setIsPanning(false); };
  const handleDoubleClick = () => {
    if(!activeImage) return;
    setImageScale(s => (s !== 1 ? 1 : 2));
    if(imageScale === 1) setImageOffset({x:0,y:0});
  };

  if (!selectedDate) return null;

  const field = (label: string, value: any) => {
    if(value === undefined || value === null || value === '' || (Array.isArray(value) && value.length===0)) return null;
    if(Array.isArray(value)) {
      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="flex flex-wrap gap-1">
            {value.map((v,i)=>(<Badge key={i} variant="secondary" className="text-[10px] py-0.5 px-2">{String(v)}</Badge>))}
          </div>
        </div>
      );
    }
    if(typeof value === 'object') {
      // flatten boolean flags
      const entries = Object.entries(value).filter(([,val])=>!!val);
      if(entries.length===0) return null;
      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="flex flex-wrap gap-1">
            {entries.map(([k]) => <Badge key={k} variant="outline" className="text-[10px] py-0.5 px-2">{k}</Badge>)}
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-sm leading-tight">{String(value)}</div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-2xl w-[95vw] h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base font-medium tracking-tight">
            Trades on {format(selectedDate, 'PPP')} <span className="text-muted-foreground font-normal">({trades.length})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(100%)] max-h-[calc(92vh)]">{/* main content */}
          {/* Trades list - conditionally rendered */}
          {showTradesList && (
            <div className="w-1/4 border-r flex flex-col">
              <div className="p-2 border-b flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Trades</div>
                <div className="text-[10px] text-muted-foreground">Select to view</div>
              </div>
              <ScrollArea className="flex-1">
                <ul className="pb-20 p-2 space-y-2">
                  {trades.map(t => {
                    const isActive = selectedTrade?.tradeId === t.tradeId;
                    return (
                      <li
                        key={t.tradeId}
                        className={cn(
                          'p-3 text-xs rounded-md border bg-card shadow-sm cursor-pointer group transition-colors',
                          isActive ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/50 hover:bg-accent/40'
                        )}
                        onClick={()=> setSelectedTrade(t)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="font-medium leading-none flex items-center gap-2">
                              <span className="text-sm">{t.symbol}</span>
                              {t.tags && t.tags.slice(0,2).map(tag => <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">{tag}</Badge>)}
                            </div>
                            <div className={cn('text-[11px] font-medium', (t.pnl||0) >=0 ? 'text-green-600':'text-red-600')}>{(t.pnl||0).toFixed(2)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={t.side==='BUY'?'secondary':'destructive'} className="text-[9px] px-1 py-0">{t.side}</Badge>
                            {t.status && <span className="text-[9px] text-muted-foreground">{t.status}</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  <li className="h-16" aria-hidden />
                </ul>
              </ScrollArea>
            </div>
          )}
          {/* Detail panel - adjusts width based on whether trades list is shown */}
          <div className={cn("flex-1 flex", !showTradesList && "w-full")}>
            {selectedTrade ? (
              <>
                <div className={cn("border-r flex flex-col min-w-[260px] overflow-hidden", showTradesList ? "w-2/5" : "w-2/5")}>
                  <ScrollArea className="flex-1 h-0">
                    <div className="p-5 pb-20 space-y-4 text-xs">
                      {/* Trade Details Section */}
                      <div className="bg-card border rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                          {selectedTrade.symbol}
                          <Badge variant={selectedTrade.side==='BUY'?'secondary':'destructive'} className="uppercase" >{selectedTrade.side}</Badge>
                          {selectedTrade.status && <Badge variant="outline" className="uppercase">{selectedTrade.status}</Badge>}
                        </h3>
                        <div className={cn('text-xs font-medium', (selectedTrade.pnl||0) >=0 ? 'text-green-600':'text-red-600')}>
                          PnL: {(selectedTrade.pnl||0).toFixed(2)} {selectedTrade.netPnl && <span className="text-[10px] text-muted-foreground">(Net {(selectedTrade.netPnl||0).toFixed(2)})</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {field('Quantity', selectedTrade.quantity)}
                          {field('Entry Price', selectedTrade.entryPrice)}
                          {field('Exit Price', selectedTrade.exitPrice)}
                          {field('Stop Loss', selectedTrade.stopLoss)}
                          {field('Take Profit', selectedTrade.takeProfit)}
                          {field('Risk %', selectedTrade.riskAmount ? `${selectedTrade.riskAmount}%` : null)}
                          {field('Risk/Reward', selectedTrade.riskRewardRatio)}
                          {field('Session', selectedTrade.tradingSession)}
                          {field('Market', selectedTrade.marketCondition)}
                          {field('Setup', selectedTrade.setupType)}
                          {field('Timeframe', selectedTrade.timeframe)}
                          {field('Grade', selectedTrade.tradeGrade)}
                          {field('Commission', selectedTrade.commission)}
                          {field('Fees', selectedTrade.fees)}
                          {field('Open Date', selectedTrade.openDate)}
                          {field('Close Date', selectedTrade.closeDate)}
                        </div>
                      </div>
                      
                      {/* Performance Section */}
                      <div className="bg-card border rounded-lg p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Performance</div>
                        <div className="space-y-2">
                          {/* Confidence */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Confidence</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    (selectedTrade.confidence || 0) >= 70 ? 'bg-green-500' : 
                                    (selectedTrade.confidence || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, selectedTrade.confidence || 0))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium min-w-[20px]">{selectedTrade.confidence ?? 'N/A'}</span>
                            </div>
                          </div>
                          {/* Setup Quality */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Setup Quality</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    (selectedTrade.setupQuality || 0) >= 70 ? 'bg-green-500' : 
                                    (selectedTrade.setupQuality || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, selectedTrade.setupQuality || 0))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium min-w-[20px]">{selectedTrade.setupQuality ?? 'N/A'}</span>
                            </div>
                          </div>
                          {/* Execution */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Execution</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    (selectedTrade.execution || 0) >= 70 ? 'bg-green-500' : 
                                    (selectedTrade.execution || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, selectedTrade.execution || 0))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium min-w-[20px]">{selectedTrade.execution ?? 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        {/* Debug info */}
                        <div className="text-[9px] text-muted-foreground/50 mt-1">
                          Debug: conf={JSON.stringify(selectedTrade.confidence)}, setup={JSON.stringify(selectedTrade.setupQuality)}, exec={JSON.stringify(selectedTrade.execution)}
                        </div>
                      </div>
                      
                      {/* Psychology Section */}
                      <div className="bg-card border rounded-lg p-4 space-y-2">
                        {field('Psychology', selectedTrade.psychology)}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emotional State</div>
                          {selectedTrade.emotionalState ? (
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-[10px] py-0.5 px-2">{selectedTrade.emotionalState}</Badge>
                            </div>
                          ) : <div className="text-[11px] text-muted-foreground">None</div>}
                        </div>
                      </div>
                      
                      {/* Mistakes Section */}
                      <div className="bg-card border rounded-lg p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mistakes</div>
                        {selectedTrade.mistakes && selectedTrade.mistakes.length>0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedTrade.mistakes.map(m=> <Badge key={m} variant="outline" className="text-[10px] py-0.5 px-2">{m}</Badge>)}
                          </div>
                        ) : <div className="text-[11px] text-muted-foreground">None</div>}
                      </div>
                      
                      {/* Trading Notes Section */}
                      <div className="bg-card border rounded-lg p-4 space-y-3">
                        <div className="space-y-2">
                          {field('Pre Trade Notes', selectedTrade.preTradeNotes || '-')}
                          {field('Post Trade Notes', selectedTrade.postTradeNotes || '-')}
                        </div>
                        {field('Lessons', selectedTrade.lessons)}
                        {field('Tags', selectedTrade.tags)}
                        {field('News Events', selectedTrade.newsEvents)}
                        {field('Economic Events', selectedTrade.economicEvents)}
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground flex gap-4 pt-4 pb-2">
                        {selectedTrade.createdAt && <span>Created {format(parseISO(selectedTrade.createdAt), 'PP p')}</span>}
                        {selectedTrade.updatedAt && <span>Updated {format(parseISO(selectedTrade.updatedAt), 'PP p')}</span>}
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="h-10 border-t bg-background/60 backdrop-blur-sm shrink-0" aria-hidden />
                 
                </div>
                <div className={cn("flex flex-col min-w-[320px] overflow-hidden", showTradesList ? "flex-1" : "w-3/5")}>
                  <ScrollArea className="flex-1 h-0">
                    <div className="p-5 pb-20 space-y-4">
                      {(!selectedTrade.images || selectedTrade.images.length===0) && (
                        <div className="text-xs text-muted-foreground">No images</div>
                      )}
                      {selectedTrade.images && selectedTrade.images.map(img => (
                        <div key={img.id||img.url} className="border rounded-md p-3 bg-muted/30">
                          {img.timeframe && <div className="text-xs font-bold text-foreground bg-background/80 px-2 py-1 rounded w-fit uppercase tracking-wide">{img.timeframe}</div>}
                          <div className="w-full aspect-video bg-background rounded flex items-center justify-center overflow-hidden mb-2 cursor-pointer" onClick={()=> setActiveImage(img)}>
                            {img.url ? <img src={img.url} alt={img.description||''} className="object-contain w-full h-full" /> : <ImageIcon className="h-6 w-6 text-muted-foreground"/>}
                          </div>
                          {img.description && <div className="text-[11px] leading-snug whitespace-pre-wrap">{img.description}</div>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="h-10 border-t bg-background/60 backdrop-blur-sm shrink-0" aria-hidden />
                </div>
              </>
            ) : (
              <div className={cn("flex items-center justify-center text-sm text-muted-foreground", showTradesList ? "flex-1" : "w-full")}>
                {showTradesList ? "Select a trade to view details." : "No trade selected."}
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Image Viewer */}
        {activeImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flex items-center justify-between p-3 text-white text-sm bg-black/40">
              <div className="flex items-center gap-3">
                <span className="font-medium">{selectedTrade?.symbol}</span>
                {activeImage.timeframe && <Badge variant="outline" className="text-[10px] border-white/40 text-white">{activeImage.timeframe}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={()=> setImageScale(s=> Math.min(s+0.2,5))}><ZoomIn className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={()=> setImageScale(s=> Math.max(s-0.2,0.3))}><span className="text-lg leading-none">-</span></Button>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={()=> {setImageScale(1); setImageOffset({x:0,y:0});}}>1:1</Button>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={closeImageViewer}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
              {activeImage.url && (
                <img
                  src={activeImage.url}
                  alt={activeImage.description||''}
                  className="select-none pointer-events-none"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`,
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
            <div className="p-4 bg-black/60 text-white text-xs flex flex-col gap-2 max-h-[30vh] overflow-auto">
              {activeImage.description && <div className="leading-snug">{activeImage.description}</div>}
              <div className="flex flex-wrap gap-2 items-center">
                {activeImage.timeframe && <Badge variant="outline" className="border-white/30 text-white text-[10px]">{activeImage.timeframe}</Badge>}
                {selectedTrade?.symbol && <Badge variant="outline" className="border-white/30 text-white text-[10px]">{selectedTrade.symbol}</Badge>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
