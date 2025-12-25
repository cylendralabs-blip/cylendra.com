
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatNumber } from '@/utils/tradingFormat';

interface TradeDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  winRate: number;
}

const TradeDistributionChart = ({ data, winRate }: TradeDistributionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>توزيع الصفقات</CardTitle>
        <CardDescription>نسبة الصفقات الرابحة والخاسرة</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'عدد الصفقات']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            معدل النجاح: {formatNumber(winRate)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeDistributionChart;
