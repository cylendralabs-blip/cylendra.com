
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { DCAStrategy, DCASettings } from '@/types/strategies';
import { useToast } from '@/hooks/use-toast';

interface DCASettingsDialogProps {
  strategy: DCAStrategy;
  onUpdateStrategy: (updatedStrategy: DCAStrategy) => void;
}

const DCASettingsDialog = ({ strategy, onUpdateStrategy }: DCASettingsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DCASettings>(strategy.settings);

  const handleSave = () => {
    const updatedStrategy = {
      ...strategy,
      settings,
      updatedAt: new Date().toISOString()
    };

    onUpdateStrategy(updatedStrategy);
    setOpen(false);
    
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم تحديث إعدادات الاستراتيجية بنجاح',
    });
  };

  const updateSetting = (key: keyof DCASettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateArraySetting = (key: 'priceDropPercentages' | 'investmentPercentages', index: number, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات استراتيجية {strategy.name}
          </DialogTitle>
          <DialogDescription>
            تخصيص إعدادات الاستراتيجية حسب احتياجاتك
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">الأساسية</TabsTrigger>
            <TabsTrigger value="levels">المستويات</TabsTrigger>
            <TabsTrigger value="risk">المخاطر</TabsTrigger>
            <TabsTrigger value="advanced">المتقدمة</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  الإعدادات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxInvestment">الاستثمار الأقصى ($)</Label>
                  <Input
                    id="maxInvestment"
                    type="number"
                    value={settings.maxInvestment}
                    onChange={(e) => updateSetting('maxInvestment', Number(e.target.value))}
                    min={100}
                    step={100}
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfLevels">عدد المستويات</Label>
                  <Input
                    id="numberOfLevels"
                    type="number"
                    value={settings.numberOfLevels}
                    onChange={(e) => updateSetting('numberOfLevels', Number(e.target.value))}
                    min={3}
                    max={20}
                  />
                </div>
                <div>
                  <Label htmlFor="takeProfitPercentage">نسبة جني الأرباح (%)</Label>
                  <Input
                    id="takeProfitPercentage"
                    type="number"
                    value={settings.takeProfitPercentage}
                    onChange={(e) => updateSetting('takeProfitPercentage', Number(e.target.value))}
                    min={0.5}
                    max={50}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="stopLossPercentage">نسبة وقف الخسائر (%)</Label>
                  <Input
                    id="stopLossPercentage"
                    type="number"
                    value={settings.stopLossPercentage}
                    onChange={(e) => updateSetting('stopLossPercentage', Number(e.target.value))}
                    min={1}
                    max={50}
                    step={0.1}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  إعدادات المستويات
                </CardTitle>
                <CardDescription>
                  تخصيص نسب انخفاض السعر ونسب الاستثمار لكل مستوى
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">نسب انخفاض السعر (%)</h4>
                    <div className="space-y-2">
                      {settings.priceDropPercentages.map((percentage, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="w-16">المستوى {index + 1}:</Label>
                          <Input
                            type="number"
                            value={percentage}
                            onChange={(e) => updateArraySetting('priceDropPercentages', index, Number(e.target.value))}
                            min={0.1}
                            max={50}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">نسب الاستثمار (%)</h4>
                    <div className="space-y-2">
                      {settings.investmentPercentages.map((percentage, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="w-16">المستوى {index + 1}:</Label>
                          <Input
                            type="number"
                            value={percentage}
                            onChange={(e) => updateArraySetting('investmentPercentages', index, Number(e.target.value))}
                            min={1}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        المجموع: {settings.investmentPercentages.reduce((sum, p) => sum + p, 0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  إدارة المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxActiveDeals">الحد الأقصى للصفقات النشطة</Label>
                  <Input
                    id="maxActiveDeals"
                    type="number"
                    value={settings.maxActiveDeals}
                    onChange={(e) => updateSetting('maxActiveDeals', Number(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
                <div>
                  <Label htmlFor="cooldownPeriod">فترة التهدئة (ساعة)</Label>
                  <Input
                    id="cooldownPeriod"
                    type="number"
                    value={settings.cooldownPeriod}
                    onChange={(e) => updateSetting('cooldownPeriod', Number(e.target.value))}
                    min={1}
                    max={168}
                  />
                </div>
                <div>
                  <Label htmlFor="riskRewardRatio">نسبة المخاطرة للعائد</Label>
                  <Input
                    id="riskRewardRatio"
                    type="number"
                    value={settings.riskRewardRatio}
                    onChange={(e) => updateSetting('riskRewardRatio', Number(e.target.value))}
                    min={0.5}
                    max={10}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="minVolumeThreshold">الحد الأدنى للحجم</Label>
                  <Input
                    id="minVolumeThreshold"
                    type="number"
                    value={settings.minVolumeThreshold}
                    onChange={(e) => updateSetting('minVolumeThreshold', Number(e.target.value))}
                    min={10000}
                    step={10000}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  الإعدادات المتقدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enableSmartEntry}
                      onChange={(e) => updateSetting('enableSmartEntry', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">دخول ذكي</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enableDynamicTP}
                      onChange={(e) => updateSetting('enableDynamicTP', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">جني أرباح ديناميكي</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enableTrailingStop}
                      onChange={(e) => updateSetting('enableTrailingStop', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">وقف خسائر متحرك</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            حفظ الإعدادات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DCASettingsDialog;
