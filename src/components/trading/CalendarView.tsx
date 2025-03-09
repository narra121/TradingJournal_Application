import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Trade } from '@/types/trading';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  data: Trade[];
  onSelectDate: (date: Date) => void;
}

export function CalendarView({ data, onSelectDate }: CalendarViewProps) {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  const days = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const getDayData = (date: Date) => {
    return data.filter(trade => {
      const tradeDate = new Date(trade.close_time);
      return format(tradeDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getPerformanceColor = (trades: Trade[]) => {
    if (trades.length === 0) return 'bg-gray-50';
    
    const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
    if (totalProfit > 0) return 'bg-green-100';
    if (totalProfit < 0) return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="grid grid-cols-7 gap-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
          
          {days.map((date, dayIdx) => {
            const dayData = getDayData(date);
            const totalProfit = dayData.reduce((sum, trade) => sum + trade.profit, 0);
            const tradeCount = dayData.length;
            
            return (
              <div
                key={date.toString()}
                className={cn(
                  'min-h-[120px] relative bg-white p-3 border hover:bg-gray-50 cursor-pointer transition-colors',
                  dayIdx === 0 && `col-start-${date.getDay() + 1}`,
                  !isSameMonth(date, today) && 'bg-gray-50 text-gray-400',
                  isToday(date) && 'border-blue-500'
                )}
                onClick={() => onSelectDate(date)}
              >
                <time
                  dateTime={format(date, 'yyyy-MM-dd')}
                  className={cn(
                    'text-sm',
                    isToday(date) && 'font-semibold text-blue-600'
                  )}
                >
                  {format(date, 'd')}
                </time>
                
                {tradeCount > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className={cn(
                      'text-xs font-medium px-2 py-1 rounded',
                      totalProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tradeCount} trade{tradeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}