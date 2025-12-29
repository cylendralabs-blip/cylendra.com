/**
 * Strategy Instance Card Component
 * 
 * Displays a user's strategy instance with actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StrategyInstance } from '@/types/strategy-system';
import { Edit, Trash2, Copy, History, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StrategyInstanceCardProps {
  instance: StrategyInstance;
  onEdit: (instance: StrategyInstance) => void;
  onDelete: (instance: StrategyInstance) => void;
  onClone: (instance: StrategyInstance) => void;
  onViewHistory: (instance: StrategyInstance) => void;
  onAssignToBot?: (instance: StrategyInstance) => void;
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  archived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function StrategyInstanceCard({
  instance,
  onEdit,
  onDelete,
  onClone,
  onViewHistory,
  onAssignToBot,
}: StrategyInstanceCardProps) {
  return (
    <Card className={instance.is_in_use ? 'border-accent' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{instance.name}</CardTitle>
              {instance.is_in_use && (
                <Badge variant="default" className="bg-accent">
                  قيد الاستخدام
                </Badge>
              )}
            </div>
            
            {instance.description && (
              <CardDescription className="text-sm mt-1">
                {instance.description}
              </CardDescription>
            )}
            
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>النسخة {instance.version}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(instance.created_at), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[instance.status]}>
            {instance.status === 'active' && 'نشط'}
            {instance.status === 'draft' && 'مسودة'}
            {instance.status === 'archived' && 'مؤرشف'}
          </Badge>
          
          {instance.template && (
            <Badge variant="outline">{instance.template.name}</Badge>
          )}
        </div>

        {/* Performance Data (if available) */}
        {instance.performance_data && instance.performance_data.total_trades && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-accent/5 rounded">
              <div className="font-semibold">{instance.performance_data.total_trades}</div>
              <div className="text-muted-foreground">صفقات</div>
            </div>
            <div className="text-center p-2 bg-accent/5 rounded">
              <div className="font-semibold">
                {instance.performance_data.win_rate?.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">نسبة النجاح</div>
            </div>
            <div className="text-center p-2 bg-accent/5 rounded">
              <div className={`font-semibold ${
                (instance.performance_data.net_profit || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {instance.performance_data.net_profit?.toFixed(2)}%
              </div>
              <div className="text-muted-foreground">صافي الربح</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(instance)}
            disabled={instance.status === 'archived'}
          >
            <Edit className="w-3 h-3 mr-1" />
            تعديل
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewHistory(instance)}
          >
            <History className="w-3 h-3 mr-1" />
            السجل
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onClone(instance)}
          >
            <Copy className="w-3 h-3 mr-1" />
            نسخ
          </Button>
          
          {onAssignToBot && !instance.is_in_use && (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => onAssignToBot(instance)}
            >
              <Play className="w-3 h-3 mr-1" />
              تعيين للبوت
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onDelete(instance)}
            disabled={instance.is_in_use}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

