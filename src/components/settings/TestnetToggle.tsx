/**
 * Testnet Toggle Component
 * 
 * Enhanced toggle with confirmation dialog and visual indicators
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, TestTube, Zap } from 'lucide-react';

interface TestnetToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  showBadge?: boolean;
  label?: string;
  confirmLiveMode?: boolean; // Show confirmation when switching to live mode
}

export const TestnetToggle = ({
  checked,
  onCheckedChange,
  disabled = false,
  showBadge = true,
  label = 'الشبكة التجريبية (Testnet)',
  confirmLiveMode = true,
}: TestnetToggleProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  const handleToggle = (newValue: boolean) => {
    // If switching from testnet to live, show confirmation
    if (!checked && newValue && confirmLiveMode) {
      setPendingValue(newValue);
      setShowConfirmDialog(true);
    } else {
      onCheckedChange(newValue);
    }
  };

  const confirmSwitch = () => {
    if (pendingValue !== null) {
      onCheckedChange(pendingValue);
    }
    setShowConfirmDialog(false);
    setPendingValue(null);
  };

  const cancelSwitch = () => {
    setShowConfirmDialog(false);
    setPendingValue(null);
  };

  return (
    <>
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={checked}
            onCheckedChange={handleToggle}
            disabled={disabled}
            id="testnet-toggle"
          />
          <Label 
            htmlFor="testnet-toggle" 
            className="text-sm font-medium cursor-pointer"
          >
            {label}
          </Label>
        </div>
        
        {showBadge && (
          <Badge
            variant={checked ? 'outline' : 'default'}
            className={
              checked
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                : 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
            }
          >
            <div className="flex items-center gap-1">
              {checked ? (
                <>
                  <TestTube className="w-3 h-3" />
                  <span>Testnet</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Live</span>
                </>
              )}
            </div>
          </Badge>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              تحذير: التبديل إلى الشبكة الحقيقية
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-red-600 dark:text-red-400">
                أنت على وشك التبديل من Testnet إلى Live Mode (الشبكة الحقيقية).
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  ⚠️ تحذيرات مهمة:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>الصفقات ستكون على حساب حقيقي بأموال حقيقية</li>
                  <li>تأكد من أن إعدادات البوت صحيحة قبل التفعيل</li>
                  <li>ابدأ برأس مال صغير للاختبار</li>
                  <li>راقب الصفقات باستمرار</li>
                  <li>تأكد من تفعيل Stop Loss و Take Profit</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                هل أنت متأكد من رغبتك في المتابعة؟
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSwitch}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitch}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              نعم، التبديل إلى Live Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Testnet Indicator Badge
 * Simple badge to show testnet status
 */
export const TestnetBadge = ({ testnet }: { testnet: boolean }) => {
  if (!testnet) return null;

  return (
    <Badge
      variant="outline"
      className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
    >
      <div className="flex items-center gap-1">
        <TestTube className="w-3 h-3" />
        <span>Testnet</span>
      </div>
    </Badge>
  );
};

/**
 * Live Mode Badge
 */
export const LiveBadge = ({ live }: { live: boolean }) => {
  if (!live) return null;

  return (
    <Badge
      variant="outline"
      className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
    >
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3" />
        <span>Live</span>
      </div>
    </Badge>
  );
};


