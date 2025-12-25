
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CorrelationData {
  asset: string;
  [key: string]: string | number;
}

interface CorrelationMatrixProps {
  data: CorrelationData[];
}

const CorrelationMatrix = ({ data }: CorrelationMatrixProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>مصفوفة الارتباط</CardTitle>
        <CardDescription>تحليل الارتباط بين الأصول المختلفة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">الأصل</th>
                {data[0] && Object.keys(data[0]).slice(1).map(asset => (
                  <th key={asset} className="text-center p-2">{asset}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="font-medium p-2">{row.asset}</td>
                  {Object.entries(row).slice(1).map(([asset, correlation]) => {
                    const correlationValue = typeof correlation === 'number' ? correlation : 0;
                    return (
                      <td key={asset} className="text-center p-2">
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            correlationValue === 1 ? 'bg-blue-100 text-blue-800' :
                            correlationValue > 0.8 ? 'bg-red-100 text-red-800' :
                            correlationValue > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          )}
                        >
                          {correlationValue.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
