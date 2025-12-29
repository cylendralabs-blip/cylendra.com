
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutomatedTradingEngine } from '@/hooks/useAutomatedTradingEngine';
import { 
  Bot, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  DollarSign,
  Target,
  Shield,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

const AutomatedTradingPanel = () => {
  const {
    isEngineRunning,
    autoTradingSettings,
    activeTrades,
    processingSignals,
    engineStats,
    toggleTradingEngine,
    saveAutoTradingSettings,
    processNewSignals
  } = useAutomatedTradingEngine();

  const [editingSettings, setEditingSettings] = useState(false);

  const handleSettingChange = (key: keyof typeof autoTradingSettings, value: any) => {
    const newSettings = { [key]: value };
    saveAutoTradingSettings(newSettings);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* حالة المحرك الرئيسية */}
      <Card className={`border-2 ${isEngineRunning ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isEngineRunning ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
              }`}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">محرك التداول الآلي</CardTitle>
                <CardDescription>
                  {isEngineRunning ? 'نشط ويراقب الإشارات' : 'متوقف'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge 
                variant="outline" 
                className={isEngineRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
              >
                {isEngineRunning ? 'مفعل' : 'معطل'}
              </Badge>
              <Button
                onClick={() => toggleTradingEngine(!isEngineRunning)}
                variant={isEngineRunning ? "destructive" : "default"}
                size="lg"
                className="min-w-32"
              >
                {isEngineRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    إيقاف
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    تفعيل
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{engineStats.tradesExecuted}</div>
              <div className="text-sm text-muted-foreground">صفقات منفذة</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{engineStats.winRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">معدل النجاح</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{activeTrades.length}</div>
              <div className="text-sm text-muted-foreground">صفقات نشطة</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className={`text-2xl font-bold ${engineStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {engineStats.totalPnL.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الربح/الخسارة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مؤشر المعالجة */}
      {processingSignals && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <div className="text-sm font-medium">جاري معالجة الإشارات الجديدة...</div>
                <div className="text-xs text-muted-foreground">البحث عن فرص تداول مؤهلة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="active-trades" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-trades" className="flex items-center space-x-2 space-x-reverse">
            <Activity className="w-4 h-4" />
            <span>الصفقات النشطة</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2 space-x-reverse">
            <Settings className="w-4 h-4" />
            <span>الإعدادات</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-4 h-4" />
            <span>الإحصائيات</span>
          </TabsTrigger>
        </TabsList>

        {/* الصفقات النشطة */}
        <TabsContent value="active-trades" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">الصفقات النشطة ({activeTrades.length})</h3>
            <Button
              onClick={processNewSignals}
              disabled={processingSignals}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${processingSignals ? 'animate-spin' : ''}`} />
              معالجة الإشارات
            </Button>
          </div>

          {activeTrades.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد صفقات نشطة</h3>
              <p className="text-muted-foreground">
                {isEngineRunning ? 'المحرك يراقب الإشارات الجديدة...' : 'فعل المحرك لبدء التداول التلقائي'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeTrades.map((trade) => (
                <Card key={trade.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {trade.symbol.split('/')[0].slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            دخول: ${trade.entryPrice.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(trade.status)}>
                          {trade.status}
                        </Badge>
                        <div className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">السعر الحالي</div>
                        <div className="font-medium">${trade.currentPrice.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">مخاطرة</div>
                        <div className="font-medium">${trade.riskAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">مستوى DCA</div>
                        <div className="font-medium">{trade.dcaLevel}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* الإعدادات */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Shield className="w-5 h-5" />
                <span>إعدادات إدارة المخاطر</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="risk-per-trade">المخاطرة لكل صفقة (%)</Label>
                  <Input
                    id="risk-per-trade"
                    type="number"
                    step="0.1"
                    value={autoTradingSettings.riskPerTrade}
                    onChange={(e) => handleSettingChange('riskPerTrade', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-trades">الحد الأقصى للصفقات المتزامنة</Label>
                  <Input
                    id="max-trades"
                    type="number"
                    value={autoTradingSettings.maxConcurrentTrades}
                    onChange={(e) => handleSettingChange('maxConcurrentTrades', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-confidence">الحد الأدنى لثقة الإشارة (%)</Label>
                  <Input
                    id="min-confidence"
                    type="number"
                    value={autoTradingSettings.minConfidenceScore}
                    onChange={(e) => handleSettingChange('minConfidenceScore', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stop-loss">وقف الخسارة (%)</Label>
                  <Input
                    id="stop-loss"
                    type="number"
                    step="0.1"
                    value={autoTradingSettings.stopLossPercentage}
                    onChange={(e) => handleSettingChange('stopLossPercentage', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">التنفيذ التلقائي للإشارات</div>
                  <div className="text-sm text-muted-foreground">تنفيذ الصفقات تلقائياً عند استلام إشارات مؤهلة</div>
                </div>
                <Switch
                  checked={autoTradingSettings.autoExecuteSignals}
                  onCheckedChange={(checked) => handleSettingChange('autoExecuteSignals', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">تفعيل استراتيجية DCA</div>
                  <div className="text-sm text-muted-foreground">استخدام متوسط التكلفة بالدولار للدخول المتدرج</div>
                </div>
                <Switch
                  checked={autoTradingSettings.enableDCA}
                  onCheckedChange={(checked) => handleSettingChange('enableDCA', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الإحصائيات */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{engineStats.successfulTrades}</div>
              <div className="text-sm text-muted-foreground">صفقات ناجحة</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{engineStats.averageProfit.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">متوسط الربح</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activeTrades.filter(t => t.status === 'ACTIVE').length}</div>
              <div className="text-sm text-muted-foreground">صفقات نشطة حالياً</div>
            </Card>
            
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{engineStats.winRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">معدل النجاح</div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أداء المحرك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>معدل النجاح</span>
                    <span>{engineStats.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={engineStats.winRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>استخدام رأس المال</span>
                    <span>{((activeTrades.length / autoTradingSettings.maxConcurrentTrades) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(activeTrades.length / autoTradingSettings.maxConcurrentTrades) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomatedTradingPanel;
