import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import { Trash2, Edit2, Plus } from "lucide-react";
import { AppDispatch, RootState } from "@/app/store";
import { useDispatch, useSelector } from "react-redux";
import { ApiTrade } from '@/app/types';
import { deleteTrade, selectAwsTrades } from '@/app/awsTradesSlice';
import { setIsDetailsOpen, setSelectedItem, setIsEditOpen } from "@/app/uiSlice";
import AwsTradeDialog from './AwsTradeDialog';
import { TradeJournalDialog } from './TradeJournalDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/ui/table';
import { Button } from '@/ui/button';

// Simple column list (fixed)
const columns = ["openDate","symbol","side","quantity","pnl"] as const;
type ColumnKey = typeof columns[number];

export function Trades() {
  const dispatch = useDispatch<AppDispatch>();
  const awsTrades = useSelector(selectAwsTrades);
  const selectedTradeId = useSelector((state: RootState) => state.UI.selectedItem);
  const isJournalOpen = useSelector((state: RootState) => state.UI.isEditOpen);
  const [isAwsDialogOpen, setIsAwsDialogOpen] = useState(false);
  const trades: ApiTrade[] = awsTrades;

  const formatValue = useCallback((key: ColumnKey, value: any) => {
    if (value == null || value === "") return "-";
    switch (key) {
      case "openDate":
        return format(new Date(value), "MMM dd, yyyy HH:mm");
      case "pnl":
        return `$${Number(value).toFixed(2)}`;
      case "quantity":
        return Number(value).toString();
      default:
        return value;
    }
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent, item: ApiTrade) => {
    e.stopPropagation();
    dispatch(setSelectedItem(item.tradeId));
    setIsAwsDialogOpen(true);
  }, [dispatch]);

  const handleJournal = useCallback((e: React.MouseEvent, item: ApiTrade) => {
    e.stopPropagation();
    dispatch(setSelectedItem(item.tradeId));
    dispatch(setIsEditOpen(true));
  }, [dispatch]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, tradeId: string) => {
      e.stopPropagation();
  dispatch(deleteTrade(tradeId) as any);
    },
    [dispatch]
  );

  const handleRowDoubleClick = useCallback((item: ApiTrade) => {
    dispatch(setIsDetailsOpen(true));
    dispatch(setSelectedItem(item.tradeId));
  }, [dispatch]);

  return (
  <>
  <div className="space-y-4 relative">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold">Trades</CardTitle>
        <Button size="sm" onClick={()=>setIsAwsDialogOpen(true)} className="gap-1"><Plus className="w-4 h-4"/> New</Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Open Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>PnL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map(trade => (
              <TableRow key={trade.tradeId} onDoubleClick={()=>handleRowDoubleClick(trade)} className="cursor-pointer">
                <TableCell>{formatValue('openDate', trade.openDate)}</TableCell>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell className="capitalize">{trade.side}</TableCell>
                <TableCell>{formatValue('quantity', trade.quantity)}</TableCell>
                <TableCell>{formatValue('pnl', trade.pnl)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button variant="ghost" size="icon" onClick={(e)=>handleEdit(e, trade)} title="Edit"><Edit2 className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={(e)=>handleJournal(e, trade)} title="Journal">J</Button>
                    <Button variant="ghost" size="icon" onClick={(e)=>handleDelete(e, trade.tradeId)} title="Delete"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {trades.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No trades yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
  <AwsTradeDialog open={isAwsDialogOpen} onOpenChange={o=>{ if(!o){ setIsAwsDialogOpen(false) } else setIsAwsDialogOpen(true) }} trade={selectedTradeId ? awsTrades.find(t=>t.tradeId===selectedTradeId) as any : null} />
  <TradeJournalDialog isOpen={isJournalOpen} onClose={()=>dispatch(setIsEditOpen(false))} trade={selectedTradeId ? awsTrades.find(t=>t.tradeId===selectedTradeId) as any : null} />
  {/* Removed floating button in favor of header New button */}
  </>
  );
}
