
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatNumber } from '@/utils/tradingFormat';

interface VaRData {
  timeframe: string;
  var95: number;
  var99: number;
  expectedShortfall: number;
}

interface VaRAnalysisChartProps {
  data: VaRData[];
}

const VaRAnalysisChart = ({ data }: VaRAnalysisChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تحليل القيمة المعرضة للمخاطر (VaR)</CardTitle>
        <CardDescription>تقدير الخسائر المحتملة في ظروف السوق المختلفة</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeframe" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value: any) => [`${formatNumber(value)}%`, '']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="var95" 
              stroke="#10b981" 
              strokeWidth={2}
              name="VaR 95%"
            />
            <Line 
              type="monotone" 
              dataKey="var99" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="VaR 99%"
            />
            <Line 
              type="monotone" 
              dataKey="expectedShortfall" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Expected Shortfall"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VaRAnalysisChart;
