import React from 'react';
import { TradingMetrics } from '@/types/trading';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock,
  Percent,
  DollarSign,
  Target,
  Scale
} from 'lucide-react';

interface TradingMetricsCardsProps {
  metrics: TradingMetrics;
}

export function TradingMetricsCards({ metrics }: TradingMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Profit/Loss',
      value: `$${metrics.totalProfit.toFixed(2)}`,
      icon: metrics.totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Win Rate',
      value: `${(metrics.winRate * 100).toFixed(1)}%`,
      icon: Percent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      icon: Scale,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Holding Time',
      value: `${metrics.averageHoldingTime}m`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className={`text-2xl font-bold mt-1 ${card.color}`}>
                {card.value}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}