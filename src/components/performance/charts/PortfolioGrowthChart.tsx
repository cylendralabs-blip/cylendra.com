
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import CustomTooltip from './CustomTooltip';

interface PortfolioGrowthChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
}

const PortfolioGrowthChart = ({ data }: PortfolioGrowthChartProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>نمو المحفظة</CardTitle>
        <CardDescription>تطور قيمة المحفظة عبر الزمن</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <CustomTooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioGrowthChart;
