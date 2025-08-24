import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CalendarDateRangePicker } from "./components/date-range-picker";
import { Overview } from "./components/overview";
import { RecentTrades } from "./components/recent-sales";
import { Search } from "./components/search";
import TeamSwitcher from "./components/team-switcher";
import { UserNav } from "./components/user-nav";
import { CumulativePnlChart } from "./components/cumulative-pnl-chart";
import { PnlDistributionChart } from "./components/pnl-distribution-chart";
import { WinRateBySetupChart } from "./components/winrate-by-setup-chart";
import { DurationDistributionChart } from "./components/duration-distribution-chart";
import CalendarView from "@/components/trading/CalendarView";
import AdvancedTradesTable from "@/advanced-trades/AdvancedTradesTable";
import { ApiTrade } from "@/app/types";
import { listTrades } from "@/app/awsTradesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { AppDispatch } from "@/app/store";
import { TradeJournalDialog } from "@/components/TradeJournalDialog";
import { setIsEditOpen, setIsDetailsOpen } from "@/app/uiSlice";
import { TradeImportDialog } from "@/components/trading/TradeJournal";
import { DailyTradesDialog } from "@/components/trading/DailyTradesDialog";
import { format, parseISO } from "date-fns";
import { Button } from "@/ui/button";
import { RotateCw } from "lucide-react";
import { toast } from 'sonner'

export default function DashboardPage() {
  const [isDailyTradesDialogOpen, setIsDailyTradesDialogOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [tradesForSelectedDate, setTradesForSelectedDate] = useState<ApiTrade[]>([]);
  const trades: ApiTrade[] = useSelector((s:any)=>s.AwsTrades.items);
  const dispatch = useDispatch<AppDispatch>();
  const isJournalOpen = useSelector((s:any)=> s.UI.isEditOpen);
  const isDetailsOpen = useSelector((s:any)=> s.UI.isDetailsOpen);
  const selectedTradeId = useSelector((s:any)=> s.UI.selectedItem);
  const selectedTrade = trades.find(t=> t.tradeId === selectedTradeId) || null;

  // Date range state (synced from picker via callback)
  const [range, setRange] = useState<{from?: Date; to?: Date}>({});
  const initialFetchRef = useRef(false);

  const refresh = async () => {
    toast.loading('Refreshing trades...', { id: 'refresh-trades' });
    try {
      await dispatch(listTrades(undefined) as any).unwrap(); // Ignore date filters for now
      toast.success('Trades refreshed', { id: 'refresh-trades' });
    } catch (e:any) {
      toast.error(e.message || 'Refresh failed', { id: 'refresh-trades' });
    }
  };

  // Initial fetch
  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when range changes
  useEffect(()=>{ if(initialFetchRef.current) refresh(); }, [range.from?.getTime(), range.to?.getTime()]);

  const handleSelectDate = (date: Date) => {
    setSelectedCalendarDate(date);
    const filtered = trades.filter(t => {
      try {
        const d = parseISO(t.closeDate || t.openDate);
        return format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      } catch { return false; }
    }) as any;
    setTradesForSelectedDate(filtered);
    setIsDailyTradesDialogOpen(true);
  };

  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl ? Number(trade.pnl) : 0), 0);
  const winningTrades = trades.filter((trade) => (trade.pnl ? Number(trade.pnl) : 0) > 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  const totalDuration = trades.reduce((sum, trade) => {
    if(!trade.closeDate) return sum;
    const openTime = new Date(trade.openDate).getTime();
    const closeTime = new Date(trade.closeDate).getTime();
    return sum + (closeTime - openTime);
  }, 0);
  const averageDurationMs = trades.length > 0 ? totalDuration / trades.length : 0;
  const averageDurationMinutes = averageDurationMs / (1000 * 60);

  return (
    <div className="hidden flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <TeamSwitcher />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker className="flex" onRangeChange={setRange} />
            <Button variant="outline" size="sm" onClick={refresh} title="Refresh now">
              <RotateCw className="h-4 w-4" />
            </Button>
            <TradeImportDialog />
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="calender">Calender</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalPnl.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trades.length}</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{winRate.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageDurationMinutes.toFixed(2)} min</div>
                  <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
                <CardContent className="pl-2"><Overview /></CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent><RecentTrades /></CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <CumulativePnlChart />
              <PnlDistributionChart />
              <WinRateBySetupChart />
              <DurationDistributionChart />
            </div>
          </TabsContent>
          <TabsContent value="trades">
            <AdvancedTradesTable />
            <TradeJournalDialog isOpen={isJournalOpen && !!selectedTrade} onClose={()=>dispatch(setIsEditOpen(false))} trade={selectedTrade} />
            <DailyTradesDialog 
              isOpen={isDetailsOpen && !!selectedTrade} 
              onClose={()=>dispatch(setIsDetailsOpen(false))} 
              selectedDate={selectedTrade ? new Date(selectedTrade.openDate) : null} 
              trades={selectedTrade ? [selectedTrade] : []} 
              showTradesList={false} 
            />
          </TabsContent>
          <TabsContent value="calender">
            <CalendarView data={trades} onSelectDate={handleSelectDate} />
            <DailyTradesDialog isOpen={isDailyTradesDialogOpen} onClose={() => setIsDailyTradesDialogOpen(false)} selectedDate={selectedCalendarDate} trades={tradesForSelectedDate as any} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
