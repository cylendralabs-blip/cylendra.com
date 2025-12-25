
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';

interface PerformanceChartProps {
  data: any[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  if (data.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات أداء في الفترة المحددة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">مقارنة الأرباح بالدولار</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: any) => [`$${formatNumber(Number(value))}`, 'الربح']} />
            <Legend />
            <Line type="monotone" dataKey="dca" stroke="#10b981" strokeWidth={2} name="DCA" />
            <Line type="monotone" dataKey="grid" stroke="#8b5cf6" strokeWidth={2} name="Grid" />
            <Line type="monotone" dataKey="momentum" stroke="#f59e0b" strokeWidth={2} name="Momentum" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
