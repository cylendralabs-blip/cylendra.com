
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface RadarData {
  metric: string;
  value: number;
  fullMark: number;
}

interface RiskRadarChartProps {
  data: RadarData[];
}

const RiskRadarChart = ({ data }: RiskRadarChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>رادار المخاطر</CardTitle>
        <CardDescription>تحليل شامل لجوانب المخاطر المختلفة</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="مستوى المخاطر"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RiskRadarChart;
