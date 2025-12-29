
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStrategyTemplates } from '@/hooks/useStrategyTemplates';

const CreateStrategyDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    dcaLevels: 5,
    riskReward: 2,
    capitalPerTrade: 100,
  });

  const { createStrategy } = useStrategyTemplates();

  const strategyTypes = [
    { value: 'dca_basic', label: 'DCA الأساسية', description: 'استراتيجية متوسط التكلفة بالدولار الكلاسيكية' },
    { value: 'dca_leverage_new', label: 'DCA + رافعة (مركز جديد)', description: 'فتح مركز إضافي برافعة مالية عند الصعود' },
    { value: 'dca_leverage_modify', label: 'DCA + رافعة (تعديل المركز)', description: 'تعديل الرافعة المالية على نفس المركز' },
    { value: 'grid_classic', label: 'Grid Trading الكلاسيكي', description: 'استراتيجية الشبكة التقليدية' },
    { value: 'momentum_basic', label: 'Momentum الأساسي', description: 'تداول القوة الدافعة الأساسي' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedStrategy = strategyTypes.find(s => s.value === formData.type);
    
    try {
      await createStrategy.mutateAsync();
      
      // Placeholder data for demonstration - logged for debugging
      console.log('Strategy would be created with:', {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        is_active: false,
        settings: {
          dcaLevels: formData.dcaLevels,
          riskReward: formData.riskReward,
          capitalPerTrade: formData.capitalPerTrade,
          priceDropLevels: [2, 4, 6, 8],
          capitalDistribution: [25, 30, 35, 10],
        },
        performance_data: {
          performance: "0%",
          risk: formData.type === 'dca_basic' ? 'منخفض' : formData.type.includes('leverage') ? 'متوسط' : 'عالي',
          activeTrades: 0
        }
      });
      
      setIsOpen(false);
      setFormData({
        name: '',
        type: '',
        description: '',
        dcaLevels: 5,
        riskReward: 2,
        capitalPerTrade: 100,
      });
    } catch (error) {
      console.error('Error creating strategy:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          إنشاء استراتيجية جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء استراتيجية جديدة</DialogTitle>
          <DialogDescription>
            قم بإنشاء استراتيجية تداول مخصصة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">اسم الاستراتيجية</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="مثل: استراتيجيتي المخصصة"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">نوع الاستراتيجية</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الاستراتيجية" />
              </SelectTrigger>
              <SelectContent>
                {strategyTypes.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-gray-500">{strategy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="وصف مختصر للاستراتيجية..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dcaLevels">مستويات DCA</Label>
              <Input
                id="dcaLevels"
                type="number"
                value={formData.dcaLevels}
                onChange={(e) => setFormData({...formData, dcaLevels: parseInt(e.target.value)})}
                min={1}
                max={10}
              />
            </div>
            <div>
              <Label htmlFor="riskReward">نسبة R:R</Label>
              <Input
                id="riskReward"
                type="number"
                value={formData.riskReward}
                onChange={(e) => setFormData({...formData, riskReward: parseFloat(e.target.value)})}
                min={1}
                max={5}
                step={0.1}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="capitalPerTrade">رأس المال لكل صفقة ($)</Label>
            <Input
              id="capitalPerTrade"
              type="number"
              value={formData.capitalPerTrade}
              onChange={(e) => setFormData({...formData, capitalPerTrade: parseInt(e.target.value)})}
              min={10}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createStrategy.isPending}>
            {createStrategy.isPending ? 'جاري الإنشاء...' : 'إنشاء الاستراتيجية'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStrategyDialog;
