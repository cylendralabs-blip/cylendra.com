
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calculator } from 'lucide-react';

interface PortfolioAsset {
  name: string;
  allocation: number;
  risk: string;
}

interface PortfolioRiskSummaryProps {
  assets: PortfolioAsset[];
}

const PortfolioRiskSummary = ({ assets }: PortfolioRiskSummaryProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع المحفظة</CardTitle>
          <CardDescription>توزيع رأس المال حسب الأصول</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="font-medium">{asset.name}</span>
                  <span className="px-2 py-1 rounded text-xs border">{asset.risk}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Progress value={asset.allocation} className="w-20 h-2" />
                  <span className="text-sm">{asset.allocation}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص المخاطر</CardTitle>
          <CardDescription>تقييم شامل لمستوى المخاطر</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">B+</div>
              <p className="text-sm text-gray-600">تقييم المخاطر الإجمالي</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>المخاطر الحالية:</span>
                <span className="font-medium text-green-600">منخفضة</span>
              </div>
              <div className="flex justify-between">
                <span>التنويع:</span>
                <span className="font-medium text-green-600">جيد</span>
              </div>
              <div className="flex justify-between">
                <span>السيولة:</span>
                <span className="font-medium text-blue-600">عالية</span>
              </div>
              <div className="flex justify-between">
                <span>التقلبات:</span>
                <span className="font-medium text-yellow-600">متوسطة</span>
              </div>
            </div>
            
            <Button className="w-full" variant="outline">
              <Calculator className="w-4 h-4 mr-2" />
              حساب المخاطر المثلى
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioRiskSummary;
