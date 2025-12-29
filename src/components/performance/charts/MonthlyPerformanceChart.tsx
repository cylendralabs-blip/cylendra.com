
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import CustomTooltip from './CustomTooltip';

interface MonthlyPerformanceChartProps {
  data: Array<{
    month: string;
    profit: number;
    trades: number;
  }>;
}

const MonthlyPerformanceChart = ({ data }: MonthlyPerformanceChartProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>الأداء الشهري</CardTitle>
        <CardDescription>الأرباح وعدد الصفقات شهرياً</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="profit" orientation="left" tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <YAxis yAxisId="trades" orientation="right" />
            <CustomTooltip />
            <Legend />
            <Line 
              yAxisId="profit"
              type="monotone" 
              dataKey="profit" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="الأرباح"
            />
            <Line 
              yAxisId="trades"
              type="monotone" 
              dataKey="trades" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="عدد الصفقات"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyPerformanceChart;
