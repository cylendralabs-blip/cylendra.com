/**
 * Equity Curve Chart Component
 * 
 * Displays equity curve over time
 * 
 * Phase 9: Backtesting Engine - Task 10
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityPoint } from '@/core/models/EquityPoint';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EquityCurveChartProps {
  equityCurve: EquityPoint[];
}

export const EquityCurveChart = ({ equityCurve }: EquityCurveChartProps) => {
  // Format data for chart
  const chartData = equityCurve.map(point => ({
    time: new Date(point.time).toLocaleDateString(),
    equity: point.equity
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="equity" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

