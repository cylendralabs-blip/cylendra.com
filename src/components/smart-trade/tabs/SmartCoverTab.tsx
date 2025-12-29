
import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';

interface SmartCoverTabProps {
  selectedSymbol: string;
  onTradeExecuted: () => void;
}

const SmartCoverTab = ({ selectedSymbol, onTradeExecuted }: SmartCoverTabProps) => {
  const { toast } = useToast();
  const { getPrice } = useRealTimePrices();
  
  // Units section
  const [units, setUnits] = useState('0.05724270');
  const [useExistingAssets, setUseExistingAssets] = useState(false);
  const [unitsInput, setUnitsInput] = useState('0.0057');
  
  // Sell Price section
  const [sellPriceType, setSellPriceType] = useState<'limit' | 'market' | 'conditional'>('limit');
  const [sellPrice, setSellPrice] = useState('0.02414');
  const [trailingSell, setTrailingSell] = useState(false);
  const [trailingSellSteps, setTrailingSellSteps] = useState(1);
  
  // Take Profit section
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(true);
  const [takeProfitType, setTakeProfitType] = useState<'limit' | 'market'>('limit');
  const [takeProfitPrice, setTakeProfitPrice] = useState('0.02172');
  const [takeProfitPercentage, setTakeProfitPercentage] = useState(-10.00);
  const [trailingTakeProfit, setTrailingTakeProfit] = useState(false);
  const [trailingDeviation, setTrailingDeviation] = useState([5.00]);
  
  // Stop Loss section
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [stopLossType, setStopLossType] = useState<'conditional_limit' | 'conditional_market'>('conditional_limit');
  const [stopLossPrice, setStopLossPrice] = useState('0.02535');
  const [stopLossPercentage, setStopLossPercentage] = useState(5.00);
  const [stopLossTimeout, setStopLossTimeout] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(300);
  const [trailingStopLoss, setTrailingStopLoss] = useState(false);
  const [moveToBreakeven, setMoveToBreakeven] = useState(false);
  
  // Total section
  const [total, setTotal] = useState('0.00013759');
  const [sizePercentage, setSizePercentage] = useState(10);
  
  const currentPrice = getPrice(selectedSymbol)?.price || 0;
  const baseCurrency = selectedSymbol.split('/')[0];
  const quoteCurrency = selectedSymbol.split('/')[1];

  const sizeOptions = [5, 10, 25, 50, 100];

  const handleCreateTrade = () => {
    toast({
      title: "تم إنشاء Smart Cover",
      description: `تم إنشاء صفقة Smart Cover لـ ${selectedSymbol}`,
    });
    onTradeExecuted();
  };

  const handleSavePreset = () => {
    toast({
      title: "تم حفظ الإعداد المسبق",
      description: "تم حفظ إعدادات Smart Cover",
    });
  };

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <CardTitle className="text-lg">Smart Cover</CardTitle>
          <div className="flex items-center text-blue-600 text-sm cursor-pointer">
            <Info className="w-4 h-4 mr-1" />
            <span>How does Smart Cover work?</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Units Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Units</label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge variant="outline" className="text-blue-600">
                {units} {baseCurrency}
              </Badge>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch 
              checked={useExistingAssets}
              onCheckedChange={setUseExistingAssets}
            />
            <span className="text-sm">Use Existing Assets</span>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          
          <Input
            type="number"
            value={unitsInput}
            onChange={(e) => setUnitsInput(e.target.value)}
            placeholder="0.0000"
            className="text-right"
          />
        </div>

        <Separator />

        {/* Sell Price Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Sell Price</label>
          
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant={sellPriceType === 'limit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSellPriceType('limit')}
            >
              Limit
            </Button>
            <Button
              variant={sellPriceType === 'market' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSellPriceType('market')}
            >
              Market
            </Button>
            <Button
              variant={sellPriceType === 'conditional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSellPriceType('conditional')}
            >
              Cond.
            </Button>
          </div>
          
          <div className="text-xs text-gray-600">
            Will sell at actual rates after the trade is created
          </div>
          
          <div className="relative">
            <Input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {baseCurrency}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600">Bid: 0.02414{baseCurrency}</span>
            <span className="text-red-600">Ask: 0.02415{baseCurrency}</span>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch 
              checked={trailingSell}
              onCheckedChange={setTrailingSell}
            />
            <span className="text-sm">Trailing sell</span>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          
          {trailingSell && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrailingSellSteps(Math.max(1, trailingSellSteps - 1))}
              >
                −
              </Button>
              <span className="px-3">{trailingSellSteps}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrailingSellSteps(trailingSellSteps + 1)}
              >
                +
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Take Profit Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Take Profit</label>
            <Switch 
              checked={takeProfitEnabled}
              onCheckedChange={setTakeProfitEnabled}
            />
          </div>
          
          {takeProfitEnabled && (
            <>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={takeProfitType === 'limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTakeProfitType('limit')}
                >
                  Limit Order
                </Button>
                <Button
                  variant={takeProfitType === 'market' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTakeProfitType('market')}
                >
                  Market Order
                </Button>
              </div>
              
              <div className="text-xs text-gray-600">
                The order will be placed on the exchange order book beforehand
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Price</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {baseCurrency}
                  </span>
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-red-600">
                    {takeProfitPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-red-500">
                ⚠ Trade does not meet minimum requirements: 0.02631 BTC
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                Add TP target
              </Button>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch 
                  checked={trailingTakeProfit}
                  onCheckedChange={setTrailingTakeProfit}
                />
                <span className="text-sm">Trailing Take Profit</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              
              {trailingTakeProfit && (
                <div className="space-y-2">
                  <div className="text-sm">Follow max price with deviation (%)</div>
                  <Slider
                    value={trailingDeviation}
                    onValueChange={setTrailingDeviation}
                    max={20}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5%</span>
                    <span>{trailingDeviation[0]}%</span>
                  </div>
                </div>
              )}
              
              <div className="bg-orange-50 p-2 rounded text-xs">
                <div className="text-orange-600">Approximate Profit:</div>
                <div className="text-green-600">⚠ +1.52059792 +$1.52 +10.02%</div>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Stop Loss Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Stop Loss</label>
            <Switch 
              checked={stopLossEnabled}
              onCheckedChange={setStopLossEnabled}
            />
          </div>
          
          {stopLossEnabled && (
            <>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={stopLossType === 'conditional_limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStopLossType('conditional_limit')}
                >
                  Cond. Limit Order
                </Button>
                <Button
                  variant={stopLossType === 'conditional_market' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStopLossType('conditional_market')}
                >
                  Cond. Market Order
                </Button>
              </div>
              
              <div className="text-xs text-gray-600">
                The order will be executed at market price when the price meets Stop Loss conditions
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Price</label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value="last">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last">Last</SelectItem>
                      <SelectItem value="mark">Mark</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {baseCurrency}
                    </span>
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-green-600">
                      {stopLossPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-red-500">
                ⚠ Trade does not meet minimum requirements: 0.02631 BTC
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch 
                  checked={stopLossTimeout}
                  onCheckedChange={setStopLossTimeout}
                />
                <span className="text-sm">Stop Loss timeout</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              
              {stopLossTimeout && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Input
                    type="number"
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                    placeholder="300"
                    className="w-20"
                  />
                  <Button variant="outline" size="sm">−</Button>
                  <Button variant="outline" size="sm">+</Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch 
                  checked={trailingStopLoss}
                  onCheckedChange={setTrailingStopLoss}
                />
                <span className="text-sm">Trailing Stop Loss</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch 
                  checked={moveToBreakeven}
                  onCheckedChange={setMoveToBreakeven}
                />
                <span className="text-sm">Move to Breakeven</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="bg-orange-50 p-2 rounded text-xs">
                <div className="text-orange-600">Approximate Loss:</div>
                <div className="text-red-600">⚠ -0.7608503 -$0.76 -5.01%</div>
              </div>
              
              <div className="text-sm">
                Risk/Reward Ratio: <span className="font-semibold">1 : 2.00</span>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Total Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Total</label>
          
          <div className="relative">
            <Input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {baseCurrency}
            </span>
          </div>
          
          <div className="text-xs text-red-500">
            ⚠ Trade does not meet minimum requirements: 0.00015 {baseCurrency}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">Size from available amount</div>
            <div className="flex space-x-1 space-x-reverse">
              {sizeOptions.map((percentage) => (
                <Button
                  key={percentage}
                  variant={sizePercentage === percentage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSizePercentage(percentage)}
                  className="flex-1"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleCreateTrade}
            className="bg-gray-400 hover:bg-gray-500"
            disabled
          >
            Create Trade
          </Button>
          <Button
            variant="outline"
            onClick={handleSavePreset}
          >
            Save Preset
          </Button>
        </div>

        {/* Orders Status */}
        <div className="pt-4 border-t">
          <div className="text-center text-gray-500 py-4">
            You have no open orders
          </div>
          
          <div className="flex space-x-4 space-x-reverse text-sm">
            <Button variant="link" className="p-0 h-auto font-normal">
              Active
            </Button>
            <Button variant="link" className="p-0 h-auto font-normal text-gray-500">
              History
            </Button>
            <Button variant="link" className="p-0 h-auto font-normal text-gray-500">
              Presets
            </Button>
            <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5" />
            <Button variant="outline" size="sm" className="ml-auto">
              ↓
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
              <Button variant="outline" size="sm">
                ↑
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block mb-1">Created on</label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Dates range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">Source</label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">Signal Bot</label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All bots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All bots</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">Account</label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default SmartCoverTab;
