import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'
import { AppDispatch, RootState } from '@/app/store'
import { ApiTrade, ApiTradeCreate, ApiTradeUpdate, TradeSide } from '@/app/types'
import { createTrade, updateTrade, selectAwsTrades, listTrades } from '@/app/awsTradesSlice'
import { toast } from 'sonner'

interface AwsTradeDialogProps { open: boolean; onOpenChange: (open: boolean) => void; trade?: ApiTrade | null }

type FormState = Partial<ApiTradeCreate & { tradeId?: string }>

const initialForm: FormState = { symbol: '', side: 'BUY', quantity: undefined, openDate: new Date().toISOString().slice(0,10), entryPrice: undefined, stopLoss: undefined, takeProfit: undefined, setupType: '', preTradeNotes: '', postTradeNotes: '', commission: undefined, fees: undefined, riskAmount: undefined }

export function AwsTradeDialog({ open, onOpenChange, trade }: AwsTradeDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const trades = useSelector(selectAwsTrades)
  const saving = useSelector((s: RootState) => s.AwsTrades.status === 'loading')
  const [form, setForm] = useState<FormState>(initialForm)
  const [tags, setTags] = useState<string>('')
  const [psychology, setPsychology] = useState<{ greed?: boolean; fear?: boolean; fomo?: boolean; revenge?: boolean; overconfidence?: boolean; patience?: boolean }>({})
  const [errors, setErrors] = useState<Record<string,string>>({})
  const isEdit = !!trade
  const existing = useMemo(()=> trade ? trades.find(t=>t.tradeId===trade.tradeId) : undefined, [trade, trades])

  useEffect(() => {
    if (!open) return
    if (trade) {
      // If not cached, trigger fetch (simple list refresh) – could be replaced with dedicated get endpoint
      if (!existing) dispatch(listTrades(undefined))
      const src = existing || trade
      const { tradeId, symbol, side, quantity, openDate, entryPrice, stopLoss, takeProfit, setupType, preTradeNotes, postTradeNotes, commission, fees, riskAmount } = src
  setForm({ tradeId, symbol, side, quantity, openDate: openDate?.slice(0,10) || '', entryPrice: entryPrice ?? undefined, stopLoss: stopLoss ?? undefined, takeProfit: takeProfit ?? undefined, setupType: setupType ?? '', preTradeNotes: preTradeNotes ?? '', postTradeNotes: postTradeNotes ?? '', commission: commission ?? undefined, fees: fees ?? undefined, riskAmount: riskAmount ?? undefined })
      setTags((src.tags || []).join(','))
      setPsychology(src.psychology || {})
    } else {
      setForm(initialForm)
      setTags('')
      setPsychology({})
    }
  }, [open, trade, existing, dispatch])

  function update<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(f => ({ ...f, [k]: v })) }

  function validate(): boolean {
    const err: Record<string,string> = {}
    if (!form.symbol) err.symbol = 'Required'
  if (!form.quantity || Number(form.quantity) <= 0) err.quantity = 'Must be > 0'
  if (form.entryPrice != null && form.entryPrice < 0) err.entryPrice = 'Must be >= 0'
  if (form.stopLoss != null && form.stopLoss < 0) err.stopLoss = 'Must be >= 0'
  if (form.takeProfit != null && form.takeProfit < 0) err.takeProfit = 'Must be >= 0'
  if (form.commission != null && form.commission < 0) err.commission = '>= 0'
  if (form.fees != null && form.fees < 0) err.fees = '>= 0'
    if (!form.openDate) err.openDate = 'Required'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix validation errors'); return }
    if (isEdit && form.tradeId) {
      const changes: ApiTradeUpdate = {
        symbol: form.symbol,
        side: form.side as TradeSide,
  quantity: Number(form.quantity),
        openDate: form.openDate,
        entryPrice: form.entryPrice ? Number(form.entryPrice) : undefined,
        stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
        takeProfit: form.takeProfit ? Number(form.takeProfit) : undefined,
        setupType: form.setupType || undefined,
        preTradeNotes: form.preTradeNotes || undefined,
        postTradeNotes: form.postTradeNotes || undefined,
        commission: form.commission ?? undefined,
        fees: form.fees ?? undefined,
        riskAmount: form.riskAmount ?? undefined,
        tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
        psychology: psychology,
      }
  toast.promise(dispatch(updateTrade({ tradeId: form.tradeId, changes }) as any).unwrap(), { loading: 'Updating trade...', success: 'Trade updated', error: (e)=> e.message || 'Update failed' })
    } else {
      const body: ApiTradeCreate = {
        symbol: form.symbol || '',
        side: form.side as TradeSide,
  quantity: Number(form.quantity),
        openDate: form.openDate || new Date().toISOString().slice(0,10),
        entryPrice: form.entryPrice ? Number(form.entryPrice) : undefined,
        stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
        takeProfit: form.takeProfit ? Number(form.takeProfit) : undefined,
        setupType: form.setupType || undefined,
        preTradeNotes: form.preTradeNotes || undefined,
        postTradeNotes: form.postTradeNotes || undefined,
        commission: form.commission ?? undefined,
        fees: form.fees ?? undefined,
        riskAmount: form.riskAmount ?? undefined,
        tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
        psychology: psychology,
        images: [],
        mistakes: [],
        lessons: [],
        newsEvents: [],
        economicEvents: [],
      }
      toast.promise(dispatch(createTrade(body) as any).unwrap(), { loading: 'Creating trade...', success: 'Trade created', error: (e)=> e.message || 'Create failed' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Trade' : 'New Trade'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">Symbol</label>
              <Input value={form.symbol} onChange={e=>update('symbol', e.target.value.toUpperCase())} />
              {errors.symbol && <p className="text-xs text-red-500 mt-1">{errors.symbol}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Side</label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={form.side} onChange={e=>update('side', e.target.value as TradeSide)}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Quantity</label>
              <Input type="number" value={form.quantity ?? ''} onChange={e=>update('quantity', e.target.value === '' ? undefined : Number(e.target.value))} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Open Date</label>
              <Input type="date" value={form.openDate} onChange={e=>update('openDate', e.target.value)} />
              {errors.openDate && <p className="text-xs text-red-500 mt-1">{errors.openDate}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Entry Price</label>
              <Input type="number" step="0.01" value={form.entryPrice ?? ''} onChange={e=>update('entryPrice', e.target.value === '' ? undefined : Number(e.target.value))} />
              {errors.entryPrice && <p className="text-xs text-red-500 mt-1">{errors.entryPrice}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Stop Loss</label>
              <Input type="number" step="0.01" value={form.stopLoss ?? ''} onChange={e=>update('stopLoss', e.target.value === '' ? undefined : Number(e.target.value))} />
              {errors.stopLoss && <p className="text-xs text-red-500 mt-1">{errors.stopLoss}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Take Profit</label>
              <Input type="number" step="0.01" value={form.takeProfit ?? ''} onChange={e=>update('takeProfit', e.target.value === '' ? undefined : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium">Setup Type</label>
              <Input value={form.setupType ?? ''} onChange={e=>update('setupType', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Commission</label>
              <Input type="number" step="0.01" value={form.commission ?? ''} onChange={e=>update('commission', e.target.value === '' ? undefined : Number(e.target.value))} />
              {errors.commission && <p className="text-xs text-red-500 mt-1">{errors.commission}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Fees</label>
              <Input type="number" step="0.01" value={form.fees ?? ''} onChange={e=>update('fees', e.target.value === '' ? undefined : Number(e.target.value))} />
              {errors.fees && <p className="text-xs text-red-500 mt-1">{errors.fees}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Risk Amount</label>
              <Input type="number" step="0.01" value={form.riskAmount ?? ''} onChange={e=>update('riskAmount', e.target.value === '' ? undefined : Number(e.target.value))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Tags (comma separated)</label>
              <Input value={tags} onChange={e=>setTags(e.target.value)} />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-2">
              {['greed','fear','fomo','revenge','overconfidence','patience'].map(flag => (
                <label key={flag} className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={!!(psychology as any)[flag]} onChange={e=> setPsychology(p => ({ ...p, [flag]: e.target.checked || undefined }))} /> {flag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Pre Trade Notes</label>
            <Textarea rows={2} value={form.preTradeNotes ?? ''} onChange={e=>update('preTradeNotes', e.target.value)} />
          </div>
            <div>
              <label className="text-xs font-medium">Post Trade Notes</label>
              <Textarea rows={2} value={form.postTradeNotes ?? ''} onChange={e=>update('postTradeNotes', e.target.value)} />
            </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AwsTradeDialog