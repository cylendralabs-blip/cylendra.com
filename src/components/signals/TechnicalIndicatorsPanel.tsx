
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle, Zap } from 'lucide-react';
import { TechnicalIndicatorData, CandlestickPattern } from '@/utils/technicalIndicators';

interface TechnicalIndicatorsPanelProps {
  data: TechnicalIndicatorData;
  patterns: CandlestickPattern[];
  symbol: string;
}

const TechnicalIndicatorsPanel = ({ data, patterns, symbol }: TechnicalIndicatorsPanelProps) => {
  
  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'ذروة شراء', color: 'bg-red-500', textColor: 'text-red-700' };
    if (rsi < 30) return { status: 'ذروة بيع', color: 'bg-green-500', textColor: 'text-green-700' };
    return { status: 'متوازن', color: 'bg-blue-500', textColor: 'text-blue-700' };
  };

  const getMACDSignal = (macd: any) => {
    switch (macd.trend) {
      case 'BULLISH': return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' };
      case 'BEARISH': return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' };
      default: return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const getBollingerPosition = (position: string) => {
    switch (position) {
      case 'ABOVE_UPPER': return { text: 'فوق النطاق العلوي', color: 'text-red-600', bg: 'bg-red-50' };
      case 'BELOW_LOWER': return { text: 'تحت النطاق السفلي', color: 'text-green-600', bg: 'bg-green-50' };
      default: return { text: 'داخل النطاق', color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'BULLISH': return 'bg-green-100 text-green-800 border-green-200';
      case 'BEARISH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const rsiStatus = getRSIStatus(data.rsi);
  const macdSignal = getMACDSignal(data.macd);
  const bollingerPos = getBollingerPosition(data.bollingerBands.position);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-blue-600" />
          <span>المؤشرات التقنية المتقدمة</span>
          <Badge variant="outline">{symbol}</Badge>
        </CardTitle>
        <CardDescription>
          تحليل شامل للمؤشرات التقنية وأنماط الشموع اليابانية
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="indicators">المؤشرات الرئيسية</TabsTrigger>
            <TabsTrigger value="oscillators">المذبذبات</TabsTrigger>
            <TabsTrigger value="patterns">أنماط الشموع</TabsTrigger>
          </TabsList>

          <TabsContent value="indicators" className="space-y-6 mt-6">
            {/* RSI Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">RSI - مؤشر القوة النسبية</h4>
                  <Badge className={`${rsiStatus.textColor} bg-transparent border`}>
                    {rsiStatus.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>القيمة</span>
                    <span className="font-medium">{data.rsi.toFixed(2)}</span>
                  </div>
                  <Progress value={data.rsi} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>ذروة بيع (30)</span>
                    <span>ذروة شراء (70)</span>
                  </div>
                </div>
              </Card>

              {/* MACD Card */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">MACD</h4>
                  <div className={`flex items-center space-x-1 space-x-reverse p-2 rounded ${macdSignal.bg}`}>
                    <macdSignal.icon className={`w-4 h-4 ${macdSignal.color}`} />
                    <span className={`text-sm ${macdSignal.color}`}>{data.macd.trend}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>MACD Line:</span>
                    <span className="font-medium">{data.macd.line}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Signal Line:</span>
                    <span className="font-medium">{data.macd.signal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Histogram:</span>
                    <span className={`font-medium ${data.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.macd.histogram}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bollinger Bands */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Bollinger Bands - نطاقات بولينجر</h4>
                <div className={`px-3 py-1 rounded text-sm ${bollingerPos.bg} ${bollingerPos.color}`}>
                  {bollingerPos.text}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">النطاق العلوي</p>
                  <p className="font-medium text-red-600">{data.bollingerBands.upper}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">الوسط</p>
                  <p className="font-medium">{data.bollingerBands.middle}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">النطاق السفلي</p>
                  <p className="font-medium text-green-600">{data.bollingerBands.lower}</p>
                </div>
              </div>
              {data.bollingerBands.squeeze && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">ضغط نطاقات - توقع حركة قوية قريباً</span>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="oscillators" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stochastic */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Stochastic - المذبذب العشوائي</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>%K:</span>
                    <span className="font-medium">{data.stochastic.k}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>%D:</span>
                    <span className="font-medium">{data.stochastic.d}</span>
                  </div>
                  <Badge variant="outline" className={
                    data.stochastic.signal === 'OVERBOUGHT' ? 'text-red-600 border-red-200' :
                    data.stochastic.signal === 'OVERSOLD' ? 'text-green-600 border-green-200' :
                    'text-blue-600 border-blue-200'
                  }>
                    {data.stochastic.signal}
                  </Badge>
                </div>
              </Card>

              {/* Williams %R */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Williams %R</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>القيمة:</span>
                    <span className="font-medium">{data.williams.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.abs(data.williams)} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {data.williams < -80 ? 'ذروة بيع' : data.williams > -20 ? 'ذروة شراء' : 'متوازن'}
                  </div>
                </div>
              </Card>

              {/* CCI */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">CCI - مؤشر قناة السلع</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>القيمة:</span>
                    <span className="font-medium">{data.cci.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.cci > 100 ? 'ذروة شراء' : data.cci < -100 ? 'ذروة بيع' : 'طبيعي'}
                  </div>
                </div>
              </Card>

              {/* ADX */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">ADX - قوة الاتجاه</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>القيمة:</span>
                    <span className="font-medium">{data.adx.value}</span>
                  </div>
                  <Badge variant="outline" className={
                    data.adx.trend_strength === 'STRONG' ? 'text-green-600 border-green-200' :
                    data.adx.trend_strength === 'WEAK' ? 'text-red-600 border-red-200' :
                    'text-blue-600 border-blue-200'
                  }>
                    {data.adx.trend_strength}
                  </Badge>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4 mt-6">
            {patterns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map((pattern, index) => (
                  <Card key={index} className={`p-4 border-2 ${getPatternColor(pattern.type)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{pattern.name}</h4>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge variant="outline">{pattern.type}</Badge>
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">{pattern.reliability}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                    {pattern.confirmation && (
                      <div className="flex items-center space-x-1 space-x-reverse text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>مؤكد</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">لم يتم اكتشاف أنماط شموع يابانية في الوقت الحالي</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicatorsPanel;
