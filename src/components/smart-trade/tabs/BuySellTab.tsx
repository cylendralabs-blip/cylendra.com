
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BuySellTabProps {
  selectedSymbol: string;
  onTradeExecuted: () => void;
}

const BuySellTab = ({ selectedSymbol, onTradeExecuted }: BuySellTabProps) => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Executing trade:', { selectedSymbol, side, amount, price, orderType });
    onTradeExecuted();
  };

  const handleAdvancedSettings = () => {
    console.log('Navigating to bot settings...');
    try {
      navigate('/dashboard/bot-settings');
      console.log('Navigation to bot-settings successful');
    } catch (error) {
      console.error('Navigation to bot-settings failed:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={side} onValueChange={(value) => setSide(value as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="buy" className="text-green-600">شراء</TabsTrigger>
            <TabsTrigger value="sell" className="text-red-600">بيع</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={orderType === 'market' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('market')}
                  className="flex-1"
                >
                  السوق
                </Button>
                <Button
                  type="button"
                  variant={orderType === 'limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('limit')}
                  className="flex-1"
                >
                  محدد
                </Button>
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div className="space-y-2">
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="أدخل السعر"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">الكمية</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="أدخل الكمية"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  شراء {selectedSymbol}
                </Button>
                
                {/* إعدادات متقدمة Button */}
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAdvancedSettings}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  إعدادات متقدمة
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={orderType === 'market' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('market')}
                  className="flex-1"
                >
                  السوق
                </Button>
                <Button
                  type="button"
                  variant={orderType === 'limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('limit')}
                  className="flex-1"
                >
                  محدد
                </Button>
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div className="space-y-2">
                  <Label htmlFor="sell-price">السعر</Label>
                  <Input
                    id="sell-price"
                    type="number"
                    placeholder="أدخل السعر"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="sell-amount">الكمية</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  placeholder="أدخل الكمية"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  بيع {selectedSymbol}
                </Button>
                
                {/* إعدادات متقدمة Button */}
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAdvancedSettings}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  إعدادات متقدمة
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BuySellTab;
