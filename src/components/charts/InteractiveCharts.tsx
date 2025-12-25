
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ComposedChart,
  Scatter,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Maximize2,
  Download,
  Settings
} from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { useHistoricalTrades } from '@/hooks/useHistoricalTrades';
import { cn } from '@/lib/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (value: any) => string;
  valueFormatter?: (value: any) => string;
}

const CustomTooltip = ({ active, payload, label, labelFormatter, valueFormatter }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 space-x-reverse">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.name}: 
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {valueFormatter ? valueFormatter(entry.value) : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const InteractiveCharts = () => {
  const [selectedChart, setSelectedChart] = useState('performance');
  const [timeRange, setTimeRange] = useState('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { data: trades, isLoading } = useHistoricalTrades(timeRange);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      // Generate sample data for demo
      return {
        performanceData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
          profit: Math.random() * 1000 + 500,
          loss: Math.random() * 400 + 100,
          netProfit: Math.random() * 600 + 200,
          trades: Math.floor(Math.random() * 20) + 5,
          winRate: Math.random() * 30 + 60
        })),
        strategyData: [
          { name: 'DCA الأساسية', value: 35, profit: 2450, color: '#10b981' },
          { name: 'Grid Trading', value: 28, profit: 1890, color: '#8b5cf6' },
          { name: 'Momentum', value: 22, profit: 1340, color: '#f59e0b' },
          { name: 'DCA + رافعة', value: 15, profit: 980, color: '#3b82f6' }
        ],
        riskAnalysis: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          risk: Math.random() * 5 + 1,
          exposure: Math.random() * 100 + 50,
          volatility: Math.random() * 20 + 10
        })),
        correlationData: Array.from({ length: 15 }, (_, i) => ({
          pair: `Pair ${i + 1}`,
          correlation: Math.random() * 2 - 1,
          volume: Math.random() * 10000 + 1000,
          fill: Math.random() > 0.5 ? '#10b981' : '#ef4444'
        }))
      };
    }

    // Process real trade data
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
    
    const performanceData = closedTrades.reduce((acc, trade) => {
      const date = new Date(trade.closed_at || trade.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        if (trade.realized_pnl > 0) {
          existing.profit += trade.realized_pnl;
        } else {
          existing.loss += Math.abs(trade.realized_pnl);
        }
        existing.netProfit = existing.profit - existing.loss;
        existing.trades += 1;
      } else {
        acc.push({
          date,
          profit: trade.realized_pnl > 0 ? trade.realized_pnl : 0,
          loss: trade.realized_pnl < 0 ? Math.abs(trade.realized_pnl) : 0,
          netProfit: trade.realized_pnl,
          trades: 1,
          winRate: 0 // Will be calculated later
        });
      }
      return acc;
    }, []);

    return { performanceData, strategyData: [], riskAnalysis: [], correlationData: [] };
  }, [trades]);

  const chartTypes = [
    { id: 'performance', name: 'الأداء', icon: TrendingUp },
    { id: 'strategy', name: 'الاستراتيجيات', icon: PieChartIcon },
    { id: 'risk', name: 'المخاطر', icon: Activity },
    { id: 'correlation', name: 'الارتباط', icon: BarChart3 }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData.performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                yAxisId="profit"
                orientation="left"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${formatNumber(value)}`}
              />
              <YAxis 
                yAxisId="trades"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <CustomTooltip 
                valueFormatter={(value) => `$${formatNumber(value)}`}
                labelFormatter={(label) => `التاريخ: ${label}`}
              />
              <Legend />
              <Area
                yAxisId="profit"
                type="monotone"
                dataKey="netProfit"
                fill="url(#profitGradient)"
                stroke="#10b981"
                strokeWidth={2}
                name="صافي الربح"
              />
              <Bar
                yAxisId="trades"
                dataKey="trades"
                fill="#3b82f6"
                name="عدد الصفقات"
                opacity={0.7}
              />
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'strategy':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.strategyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {chartData.strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <CustomTooltip valueFormatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">تفاصيل الاستراتيجيات</h4>
              {chartData.strategyData.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: strategy.color }}
                    />
                    <span className="font-medium">{strategy.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      ${formatNumber(strategy.profit)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {strategy.value}% من المحفظة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'risk':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.riskAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `${value}%`}
              />
              <CustomTooltip 
                valueFormatter={(value) => `${formatNumber(value)}%`}
                labelFormatter={(label) => `الوقت: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="risk"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="مستوى المخاطر"
              />
              <Line
                type="monotone"
                dataKey="volatility"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="التقلبات"
              />
              <ReferenceLine y={5} stroke="#dc2626" strokeDasharray="8 8" label="حد المخاطر الأقصى" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'correlation':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.correlationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                type="number"
                domain={[-1, 1]}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                type="category"
                dataKey="pair"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                width={80}
              />
              <CustomTooltip 
                valueFormatter={(value) => formatNumber(value)}
                labelFormatter={(label) => `الزوج: ${label}`}
              />
              <Bar 
                dataKey="correlation" 
                fill="#3b82f6"
                name="معامل الارتباط"
              />
              <ReferenceLine x={0} stroke="#6b7280" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-300', isFullscreen && 'fixed inset-4 z-50')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-6 h-6" />
              <span>الرسوم البيانية التفاعلية</span>
            </CardTitle>
            <CardDescription>
              تحليلات بصرية متقدمة للأداء والمخاطر
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center space-x-2 space-x-reverse mt-4">
          {chartTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={selectedChart === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart(type.id)}
                className="flex items-center space-x-1 space-x-reverse"
              >
                <Icon className="w-4 h-4" />
                <span>{type.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveCharts;
