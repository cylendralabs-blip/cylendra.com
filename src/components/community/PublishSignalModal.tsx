/**
 * Publish Signal Modal Component
 * 
 * Phase X.12 - Community Signals System
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePublishSignal } from '@/hooks/useCommunitySignals';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublishSignalModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PublishSignalModal({ open, onOpenChange }: PublishSignalModalProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const { toast } = useToast();
  const publishMutation = usePublishSignal();

  const [formData, setFormData] = useState({
    symbol: '',
    timeframe: '1h',
    side: 'BUY' as 'BUY' | 'SELL',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    confidence: '',
    analysis_text: '',
    source: 'manual' as 'manual' | 'twitter' | 'telegram' | 'ai-assisted',
    ai_assisted: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await publishMutation.mutateAsync({
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        side: formData.side,
        entry_price: formData.entry_price ? Number(formData.entry_price) : undefined,
        stop_loss: formData.stop_loss ? Number(formData.stop_loss) : undefined,
        take_profit: formData.take_profit ? Number(formData.take_profit) : undefined,
        confidence: formData.confidence ? Number(formData.confidence) : undefined,
        analysis_text: formData.analysis_text || undefined,
        source: formData.source,
        ai_assisted: formData.ai_assisted,
      });

      toast({
        title: '✅ تم النشر بنجاح',
        description: 'تم نشر إشارتك في المجتمع',
      });

      // Reset form
      setFormData({
        symbol: '',
        timeframe: '1h',
        side: 'BUY',
        entry_price: '',
        stop_loss: '',
        take_profit: '',
        confidence: '',
        analysis_text: '',
        source: 'manual',
        ai_assisted: false,
      });

      setIsOpen(false);
      onOpenChange?.(false);
    } catch (error) {
      toast({
        title: '❌ خطأ',
        description: error instanceof Error ? error.message : 'فشل في نشر الإشارة',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          نشر إشارة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>نشر إشارة جديدة</DialogTitle>
          <DialogDescription>
            شارك إشارتك مع المجتمع واحصل على تقييمات وLP Points
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الرمز *</Label>
              <Input
                required
                placeholder="BTC/USDT"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <Label>الإطار الزمني *</Label>
              <Select
                value={formData.timeframe}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الاتجاه *</Label>
              <Select
                value={formData.side}
                onValueChange={(value) => setFormData(prev => ({ ...prev, side: value as 'BUY' | 'SELL' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">شراء</SelectItem>
                  <SelectItem value="SELL">بيع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الثقة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="70"
                value={formData.confidence}
                onChange={(e) => setFormData(prev => ({ ...prev, confidence: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>سعر الدخول</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="40000"
                value={formData.entry_price}
                onChange={(e) => setFormData(prev => ({ ...prev, entry_price: e.target.value }))}
              />
            </div>
            <div>
              <Label>وقف الخسارة</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="39500"
                value={formData.stop_loss}
                onChange={(e) => setFormData(prev => ({ ...prev, stop_loss: e.target.value }))}
              />
            </div>
            <div>
              <Label>هدف الربح</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="41000"
                value={formData.take_profit}
                onChange={(e) => setFormData(prev => ({ ...prev, take_profit: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>التحليل</Label>
            <Textarea
              placeholder="اكتب تحليلك للإشارة..."
              rows={4}
              value={formData.analysis_text}
              onChange={(e) => setFormData(prev => ({ ...prev, analysis_text: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.ai_assisted}
                onChange={(e) => setFormData(prev => ({ ...prev, ai_assisted: e.target.checked }))}
              />
              AI Assisted (تم التحقق بواسطة AI)
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                onOpenChange?.(false);
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={publishMutation.isPending}>
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                'نشر الإشارة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

