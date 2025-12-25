
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DCAPerformanceChartProps {
  data?: any[];
}

const DCAPerformanceChart = ({ data = [] }: DCAPerformanceChartProps) => {
  // بيانات وهمية للعرض
  const mockData = [
    { name: 'يناير', profit: 150, loss: -50 },
    { name: 'فبراير', profit: 300, loss: -100 },
    { name: 'مارس', profit: 200, loss: -80 },
    { name: 'أبريل', profit: 450, loss: -120 },
    { name: 'مايو', profit: 350, loss: -90 },
    { name: 'يونيو', profit: 500, loss: -150 },
  ];

  const chartData = data.length > 0 ? data : mockData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>أداء استراتيجيات DCA</CardTitle>
        <CardDescription>تطور الأرباح والخسائر عبر الوقت</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={2}
              name="الأرباح"
            />
            <Line 
              type="monotone" 
              dataKey="loss" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="الخسائر"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DCAPerformanceChart;
