"use client";

import * as React from "react";
import { format, startOfWeek, startOfMonth, endOfMonth, subDays, subMonths, startOfYear, subYears, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "lib/utils";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/ui/dropdown-menu'
import { DateTimePicker24h } from '@/ui/DateTimePicker'

interface PickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onRangeChange?: (range: { from?: Date; to?: Date }) => void
}
export function CalendarDateRangePicker({
  className,
  onRangeChange,
}: PickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [preset, setPreset] = React.useState<string>('today')
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(undefined)
  const [customTo, setCustomTo] = React.useState<Date | undefined>(undefined)

  const applyRange = (from: Date, to: Date) => {
    const next = { from, to }
    setDate(next)
    onRangeChange?.(next)
  }

  React.useEffect(()=>{
    const now = new Date()
    switch(preset){
      case 'today': {
        applyRange(now, now); break;
      }
      case 'yesterday': {
        const y = subDays(now,1); applyRange(y,y); break;
      }
      case 'last7': {
        applyRange(subDays(now,6), now); break;
      }
      case 'currentWeek': { // Sunday -> today
        const from = startOfWeek(now,{weekStartsOn:0});
        applyRange(from, now); break;
      }
      case 'lastWeek': { // Previous week Sunday -> Saturday
        const thisWeekStart = startOfWeek(now,{weekStartsOn:0});
        const lastWeekStart = subDays(thisWeekStart,7);
        const lastWeekEnd = addDays(lastWeekStart,6);
        applyRange(lastWeekStart,lastWeekEnd); break;
      }
      case 'last30': {
        applyRange(subDays(now,29), now); break;
      }
      case 'currentMonth': { // 1st of month -> today
        applyRange(startOfMonth(now), now); break;
      }
      case 'lastMonth': {
        const lastMonthDate = subMonths(now,1)
        applyRange(startOfMonth(lastMonthDate), endOfMonth(lastMonthDate)); break;
      }
      case 'last365': {
        applyRange(subDays(now,364), now); break;
      }
      case 'currentYear': { // Jan 1 -> today
        applyRange(startOfYear(now), now); break;
      }
      case 'lastYear': {
        const lastYear = subYears(now,1)
        const start = startOfYear(lastYear)
        const end = new Date(start.getFullYear(),11,31,23,59,59,999)
        applyRange(start, end); break;
      }
      case 'custom': {
        if (customFrom && customTo) applyRange(customFrom, customTo)
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[preset, customFrom, customTo])

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[170px] justify-between">
            <span className="truncate text-left">{
              {
                today:'Today',
                yesterday:'Yesterday',
                last7:'Last 7 Days',
                currentWeek:'Current Week',
                lastWeek:'Last Week',
                last30:'Last 30 Days',
                currentMonth:'Current Month',
                lastMonth:'Last Month',
                last365:'Last 365 Days',
                currentYear:'Current Year',
                lastYear:'Last Year',
                custom:'Custom Range'
              }[preset] || 'Range'
            }</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuRadioGroup value={preset} onValueChange={setPreset}>
            <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="yesterday">Yesterday</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="last7">Last 7 Days</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="currentWeek">Current Week</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lastWeek">Last Week</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="last30">Last 30 Days</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="currentMonth">Current Month</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lastMonth">Last Month</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="last365">Last 365 Days</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="currentYear">Current Year</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lastYear">Last Year</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="custom">Custom</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              preset !== 'custom' && 'cursor-default opacity-80'
            )}
            disabled={preset !== 'custom'}
            aria-disabled={preset !== 'custom'}
            title={preset !== 'custom' ? 'Change preset to Custom to edit dates' : undefined}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          {preset === 'custom' ? (
            <div className="p-3 space-y-3 w-[320px]">
              <div>
                <p className="text-xs font-medium mb-1">From</p>
                <DateTimePicker24h value={customFrom} onChange={(d)=> setCustomFrom(d)} placeholder="Start" />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">To</p>
                <DateTimePicker24h value={customTo} onChange={(d)=> setCustomTo(d)} placeholder="End" />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button size="sm" variant="secondary" onClick={()=> { setCustomFrom(undefined); setCustomTo(undefined); }}>Clear</Button>
                <Button size="sm" disabled={!customFrom || !customTo} onClick={()=> { if (customFrom && customTo){ const next = {from:customFrom,to:customTo}; setDate(next); onRangeChange?.(next); }}}>Apply</Button>
              </div>
            </div>
          ) : (
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          )}
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}
