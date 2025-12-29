
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import CustomTooltip from './CustomTooltip';

interface ProfitLossChartProps {
  data: Array<{
    date: string;
    profit: number;
    loss: number;
    net: number;
  }>;
}

const ProfitLossChart = ({ data }: ProfitLossChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الأرباح والخسائر اليومية</CardTitle>
        <CardDescription>تفصيل الأرباح والخسائر</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <CustomTooltip />
            <Bar dataKey="profit" fill="#10b981" name="الأرباح" />
            <Bar dataKey="loss" fill="#ef4444" name="الخسائر" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProfitLossChart;
