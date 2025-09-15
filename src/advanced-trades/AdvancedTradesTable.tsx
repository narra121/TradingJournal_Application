import React, { useMemo, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApiTrade } from '@/app/types'
import { RootState, AppDispatch } from '@/app/store'
import { deleteTrade, bulkDelete } from '@/app/awsTradesSlice'
import { setSelectedItem, setIsEditOpen, setIsDetailsOpen, setFilteredTradeIds } from '@/app/uiSlice'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card'
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/ui/table'
import { Checkbox } from '@/ui/checkbox'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/ui/dropdown-menu'
import { ChevronDown, ChevronsUpDown, ArrowUp, ArrowDown, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverTrigger, PopoverContent } from '@/ui/popover'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/ui/alert-dialog'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/ui/tooltip'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/ui/command'

interface Column<ApiTrade> { key: keyof ApiTrade | string; label: string; width?: string }

const baseColumns: Column<ApiTrade>[] = [
  { key: 'openDate', label: 'Open' },
  { key: 'closeDate', label: 'Close' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'side', label: 'Side' },
  { key: 'entryPrice', label: 'Entry' },
  { key: 'exitPrice', label: 'Exit' },
  { key: 'quantity', label: 'Qty' },
  { key: 'pnl', label: 'PnL' },
  { key: 'status', label: 'Status' },
]

export const AdvancedTradesTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const trades: ApiTrade[] = useSelector((s: RootState)=> s.AwsTrades.items)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [visible, setVisible] = useState<Set<string>>(new Set(baseColumns.map(c=>String(c.key))))
  const [sort, setSort] = useState<{key: string; dir: 'asc' | 'desc'} | null>({ key:'openDate', dir:'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filters, setFilters] = useState({
    symbol: '',
    side: '',
    status: '',
    minPnl: '',
    maxPnl: ''
  })


  const filtered = useMemo(()=>{
    return trades
      .filter(t => {
        if(filters.symbol && !t.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
        if(filters.side && t.side !== filters.side) return false
        if(filters.status && t.status !== filters.status) return false
        if(filters.minPnl){ if((t.pnl ?? 0) < parseFloat(filters.minPnl)) return false }
        if(filters.maxPnl){ if((t.pnl ?? 0) > parseFloat(filters.maxPnl)) return false }
        return true
      })
  },[trades, filters])

  const sorted = useMemo(()=>{
    if(!sort) return filtered
    return [...filtered].sort((a,b)=>{
      const av = (a as any)[sort.key]
      const bv = (b as any)[sort.key]
      if(av==null && bv==null) return 0
      if(av==null) return 1
      if(bv==null) return -1
      if(av < bv) return sort.dir==='asc' ? -1 : 1
      if(av > bv) return sort.dir==='asc' ? 1 : -1
      return 0
    })
  },[filtered, sort])

  // Update filtered trade IDs in UI state whenever sorted trades change
  useEffect(() => {
    const tradeIds = sorted.map(t => t.tradeId);
    console.log('AdvancedTradesTable: Setting filtered trade IDs:', tradeIds);
    dispatch(setFilteredTradeIds(tradeIds));
  }, [sorted, dispatch])

  const paged = useMemo(()=>{
    const start = (page-1)*pageSize
    return sorted.slice(start, start+pageSize)
  },[sorted, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const goPage = (p:number)=> setPage(Math.min(Math.max(1,p), totalPages))

  const toggleColumn = (k:string)=> setVisible(v=>{ const n = new Set(v); n.has(k)? n.delete(k): n.add(k); return n })
  const cycleSort = (k:string)=> setSort(s=> !s || s.key!==k ? { key:k, dir:'asc'} : s.dir==='asc'? { key:k, dir:'desc'} : null)

  // Unique symbols for dropdown
  const symbols = useMemo(()=> Array.from(new Set(trades.map(t=> t.symbol))).sort(), [trades])
  // Unique statuses for dropdown
  const statuses = useMemo(()=> Array.from(new Set(trades.map(t=> t.status).filter(Boolean))).sort(), [trades])
  const [symbolOpen, setSymbolOpen] = useState(false)
  const currentSymbol = filters.symbol

  const toggleOne = (id:string) => setSelected(s=> { const n = new Set(s); n.has(id)? n.delete(id): n.add(id); return n })
  const toggleAllPage = () => {
    const ids = paged.map(t=>t.tradeId)
    const allSelected = ids.every(id=> selected.has(id))
    setSelected(s=> {
      const n = new Set(s)
      ids.forEach(id=> { if(allSelected) n.delete(id); else n.add(id) })
      return n
    })
  }
  const runBulkDelete = () => {
    if(selected.size===0) return
    const ids = Array.from(selected)
    const chunks: string[][] = []
    for(let i=0;i<ids.length;i+=50) chunks.push(ids.slice(i,i+50))
    setDeletingIds(s=> { const n=new Set(s); ids.forEach(id=> n.add(id)); return n })
    toast.promise(
      (async ()=> {
        for(const chunk of chunks) {
          const res:any = await dispatch(bulkDelete(chunk) as any).unwrap()
          const failed = new Set((res.errors||[]).map((e:any)=> e.tradeId))
          setSelected(sel => {
            const n = new Set(sel)
            chunk.forEach(id=> { if(!failed.has(id)) n.delete(id) })
            return n
          })
        }
      })()
        .finally(()=> setDeletingIds(new Set())),
      { loading: `Deleting ${ids.length} trade(s)...`, success: 'Deleted trades', error: (e)=> e?.message || 'Bulk delete failed' }
    )
  }

  return (
    <Card className="space-y-4">
      <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="text-base font-semibold">Advanced Trades</CardTitle>
        <div className='flex items-center gap-2 flex-wrap'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='gap-1'>Columns <ChevronDown className='w-4 h-4'/></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='max-h-64 overflow-auto'>
              {baseColumns.map(c=> (
                <DropdownMenuCheckboxItem key={c.key as string} checked={visible.has(String(c.key))} onCheckedChange={()=>toggleColumn(String(c.key))}>
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className='text-xs text-muted-foreground'>Matches: {sorted.length}</div>
          <Button variant='destructive' size='sm' disabled={selected.size===0} onClick={runBulkDelete} className='gap-1'>
            <Trash2 className='w-4 h-4'/>{selected.size>0 ? `Delete (${selected.size})` : 'Delete'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
  <div className='grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'>
          {/* Symbol Combobox */}
          <div className='flex flex-col gap-1'>
            <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
              <PopoverTrigger asChild>
                <Button variant='outline' role='combobox' size='sm' className='justify-between w-full h-9'>
                  {currentSymbol ? currentSymbol : 'Symbol'}
                  <ChevronDown className='ml-2 h-4 w-4 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='p-0 w-56'>
                <Command filter={(value, search)=> value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                  <CommandInput placeholder='Search symbol...' className='h-9' />
                  <CommandList>
                    <CommandEmpty>No symbol found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value='ALL' onSelect={()=>{ setFilters(f=>({...f, symbol:''})); setPage(1); setSymbolOpen(false) }}>
                        <Check className={`mr-2 h-4 w-4 ${currentSymbol===''? 'opacity-100':'opacity-0'}`} />
                        All Symbols
                      </CommandItem>
                      {symbols.map(sym=> (
                        <CommandItem key={sym} value={sym} onSelect={()=>{ setFilters(f=>({...f, symbol:sym})); setPage(1); setSymbolOpen(false) }}>
                          <Check className={`mr-2 h-4 w-4 ${currentSymbol===sym? 'opacity-100':'opacity-0'}`} />
                          {sym}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* Free text fallback if symbol not in list */}
            <Input placeholder='Or type custom' value={currentSymbol} onChange={e=>{ setFilters(f=>({...f, symbol:e.target.value.toUpperCase()})); setPage(1) }} />
            {currentSymbol && (
              <Button variant='ghost' type='button' size='sm' className='self-start h-6 px-2 text-[10px]' onClick={()=>{ setFilters(f=>({...f, symbol:''})); setPage(1) }}>
                <X className='w-3 h-3 mr-1' />Clear
              </Button>
            )}
          </div>
      {/* Radix Select disallows empty-string item values; use 'ALL' sentinel and map to '' in state */}
      <Select value={filters.side || 'ALL'} onValueChange={v=>{ const side = v==='ALL' ? '' : v; setPage(1); setFilters(f=>({...f, side})) }}>
            <SelectTrigger><SelectValue placeholder='Side' /></SelectTrigger>
            <SelectContent>
        <SelectItem value='ALL'>All Sides</SelectItem>
              <SelectItem value='BUY'>BUY</SelectItem>
              <SelectItem value='SELL'>SELL</SelectItem>
            </SelectContent>
          </Select>
  <Select value={filters.status || 'ALL'} onValueChange={v=>{ const status = v==='ALL' ? '' : v as any; setPage(1); setFilters(f=>({...f, status})) }}>
            <SelectTrigger><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent>
    <SelectItem value='ALL'>All Statuses</SelectItem>
      {statuses.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder='Min PnL' value={filters.minPnl} onChange={e=>{ setPage(1); setFilters(f=>({...f, minPnl:e.target.value})) }} />
          <Input placeholder='Max PnL' value={filters.maxPnl} onChange={e=>{ setPage(1); setFilters(f=>({...f, maxPnl:e.target.value})) }} />
          <Button variant='secondary' size='sm' onClick={()=>{ setFilters({ symbol:'', side:'', status:'', minPnl:'', maxPnl:'' }); setPage(1) }}>Reset</Button>
        </div>
  <div className='rounded-md border'>
  <TooltipProvider delayDuration={600}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-8'>
                  <Checkbox
                    checked={paged.length>0 && paged.every(t=> selected.has(t.tradeId))}
                    onCheckedChange={toggleAllPage}
                    aria-label='Select page'
                  />
                </TableHead>
                {baseColumns.filter(c=>visible.has(String(c.key))).map(c=> {
                  const active = sort?.key===c.key
                  return (
                    <TableHead key={c.key as string} onClick={()=>cycleSort(String(c.key))} className='cursor-pointer select-none'>
                      <div className='flex items-center gap-1'>
                        <span>{c.label}</span>
                        {active && (sort!.dir==='asc' ? <ArrowUp className='w-3 h-3'/> : <ArrowDown className='w-3 h-3'/>)}
                        {!active && <ChevronsUpDown className='w-3 h-3 text-muted-foreground' />}
                      </div>
                    </TableHead>
                  )
                })}
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(t=> (
                <Tooltip key={t.tradeId}>
                  <TooltipTrigger asChild>
                    <TableRow
                      className='hover:bg-muted/50'
                      tabIndex={0}
                    >
                  <TableCell className='w-8'>
                    <Checkbox checked={selected.has(t.tradeId)} onCheckedChange={()=> toggleOne(t.tradeId)} aria-label='Select row'/>
                  </TableCell>
                  {baseColumns.filter(c=>visible.has(String(c.key))).map(c=> {
                    const v = (t as any)[c.key as any]
                    let display: any = v
                    if(c.key==='openDate' || c.key==='closeDate') display = v ? format(new Date(v), 'yyyy-MM-dd HH:mm') : '-'
                    if(['entryPrice','exitPrice','pnl'].includes(String(c.key))) display = v==null? '-' : `$${Number(v).toFixed(2)}`
                    if(c.key==='quantity') display = v==null? '-' : v
                    if(c.key==='status') display = v || '-'
                    return <TableCell key={String(c.key)} className='whitespace-nowrap'>{display}</TableCell>
                  })}
                  <TableCell className='text-right whitespace-nowrap align-middle'>
                    <div className='inline-flex gap-1 items-center h-full'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            aria-label='View Details'
                            className='h-6 px-2 text-[11px] font-medium rounded-md border border-border leading-none flex items-center justify-center'
                            onClick={()=>{ dispatch(setSelectedItem(t.tradeId)); dispatch(setIsDetailsOpen(true)) }}
                          >View</Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            aria-label='Edit Journal'
                            className='h-6 px-2 rounded-md flex items-center justify-center border'
                            onClick={()=>{ dispatch(setSelectedItem(t.tradeId)); dispatch(setIsEditOpen(true)) }}
                          >
                            <Pencil className='w-3.5 h-3.5 text-slate-500'/>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      {/* Removed separate view icon per request for simpler two-icon actions */}
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                aria-label='Delete'
                                className='h-6 px-2 rounded-md flex items-center justify-center border'
                                disabled={deletingIds.has(t.tradeId)}
                              >
                                {deletingIds.has(t.tradeId) ? <Loader2 className='w-3.5 h-3.5 animate-spin text-slate-500'/> : <Trash2 className='w-3.5 h-3.5 text-slate-500'/>}
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent className='sm:max-w-[360px]'>
                          <AlertDialogHeader>
                            <AlertDialogTitle className='text-sm'>Delete Trade?</AlertDialogTitle>
                            <AlertDialogDescription className='text-xs'>This action cannot be undone. The trade will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className='text-xs h-8 px-3'>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-red-600 hover:bg-red-700 text-xs h-8 px-3'
                              onClick={(e)=>{
                                e.preventDefault()
                                if(deletingIds.has(t.tradeId)) return
                                setDeletingIds(s=> new Set(s).add(t.tradeId))
                                toast.promise(
                                  dispatch(deleteTrade(t.tradeId) as any).unwrap()
                                    .then(()=> { setSelected(s=> { if(!s.has(t.tradeId)) return s; const n=new Set(s); n.delete(t.tradeId); return n }) })
                                    .finally(()=> setDeletingIds(s=> { const n=new Set(s); n.delete(t.tradeId); return n })),
                                  { loading: 'Deleting...', success: 'Deleted', error: (err)=> err?.message || 'Delete failed' }
                                )
                              }}
                            >Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                    </TableRow>
                    </TooltipTrigger>
                    {/* Removed double-click row to view tooltip */}
                  </Tooltip>
              ))}
              {sorted.length===0 && (
                <TableRow>
                  <TableCell colSpan={visible.size+2} className='h-24 text-center text-muted-foreground'>No trades</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TooltipProvider>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
          <div>Page {page} / {totalPages}</div>
          <div className='flex items-center gap-1'>
            <Button variant='outline' size='sm' disabled={page===1} onClick={()=>goPage(1)}>First</Button>
            <Button variant='outline' size='sm' disabled={page===1} onClick={()=>goPage(page-1)}>Prev</Button>
            <Button variant='outline' size='sm' disabled={page===totalPages} onClick={()=>goPage(page+1)}>Next</Button>
            <Button variant='outline' size='sm' disabled={page===totalPages} onClick={()=>goPage(totalPages)}>Last</Button>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>Rows</span>
            <Select value={String(pageSize)} onValueChange={v=>{ setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className='w-20'><SelectValue /></SelectTrigger>
              <SelectContent>{[10,25,50,100].map(n=> <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdvancedTradesTable
