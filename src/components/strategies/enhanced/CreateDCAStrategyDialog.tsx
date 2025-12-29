
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Zap, Plus } from 'lucide-react';

interface CreateDCAStrategyDialogProps {
  onCreateStrategy: (type: 'dca_basic' | 'dca_advanced' | 'dca_smart') => void;
}

const CreateDCAStrategyDialog = ({ onCreateStrategy }: CreateDCAStrategyDialogProps) => {
  const [open, setOpen] = useState(false);

  const strategyTypes = [
    {
      type: 'dca_basic' as const,
      title: 'DCA الأساسية',
      description: 'استراتيجية بسيطة وآمنة للمبتدئين',
      icon: Target,
      color: 'blue',
    },
    {
      type: 'dca_advanced' as const,
      title: 'DCA المتقدمة',
      description: 'مميزات إضافية وتحكم أكبر',
      icon: TrendingUp,
      color: 'green',
    },
    {
      type: 'dca_smart' as const,
      title: 'DCA الذكية',
      description: 'ذكاء اصطناعي وتحليل متقدم',
      icon: Zap,
      color: 'purple',
    },
  ];

  const handleCreateStrategy = (type: 'dca_basic' | 'dca_advanced' | 'dca_smart') => {
    onCreateStrategy(type);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          إنشاء استراتيجية جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>إنشاء استراتيجية DCA جديدة</DialogTitle>
          <DialogDescription>
            اختر نوع استراتيجية DCA التي تريد إنشاءها
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {strategyTypes.map((strategy) => {
            const Icon = strategy.icon;
            return (
              <Card 
                key={strategy.type} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCreateStrategy(strategy.type)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 text-${strategy.color}-600`} />
                    {strategy.title}
                  </CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    إنشاء {strategy.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDCAStrategyDialog;
