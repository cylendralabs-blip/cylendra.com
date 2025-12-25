
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, DollarSign } from 'lucide-react';

interface DCABacktestDialogProps {
  strategyId: string;
}

const DCABacktestDialog = ({ strategyId }: DCABacktestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [backtestParams, setBacktestParams] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 10000,
  });

  const handleBacktest = async () => {
    setLoading(true);
    
    // محاكاة نتائج الباك تست
    setTimeout(() => {
      setResults({
        totalReturn: 15.5,
        winRate: 68,
        maxDrawdown: -8.2,
        totalTrades: 45,
        profitFactor: 1.8,
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="w-4 h-4 mr-1" />
          باك تست
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>باك تست الاستراتيجية</DialogTitle>
          <DialogDescription>
            اختبر أداء الاستراتيجية على البيانات التاريخية
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                value={backtestParams.startDate}
                onChange={(e) => setBacktestParams(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">تاريخ النهاية</Label>
              <Input
                id="endDate"
                type="date"
                value={backtestParams.endDate}
                onChange={(e) => setBacktestParams(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="capital">رأس المال الأولي</Label>
              <Input
                id="capital"
                type="number"
                value={backtestParams.initialCapital}
                onChange={(e) => setBacktestParams(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
              />
            </div>
            
            <Button 
              onClick={handleBacktest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'جاري التحليل...' : 'بدء الباك تست'}
            </Button>
          </div>
          
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">نتائج الباك تست</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>العائد الإجمالي:</span>
                  <span className="font-bold text-green-600">+{results.totalReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span>معدل الفوز:</span>
                  <span className="font-bold">{results.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>أقصى انخفاض:</span>
                  <span className="font-bold text-red-600">{results.maxDrawdown}%</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي الصفقات:</span>
                  <span className="font-bold">{results.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>عامل الربح:</span>
                  <span className="font-bold">{results.profitFactor}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DCABacktestDialog;
