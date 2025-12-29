
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X, Loader2 } from 'lucide-react';
import { Trade } from '@/types/trade';
import { useIsMobile } from '@/hooks/use-mobile';

interface CloseTradeButtonProps {
  trade: Trade;
  onCloseTrade: (trade: Trade) => void;
  isClosing: boolean;
}

const CloseTradeButton = ({ trade, onCloseTrade, isClosing }: CloseTradeButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleConfirmClose = () => {
    onCloseTrade(trade);
    setIsDialogOpen(false);
  };

  if (trade.status === 'CLOSED') {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "sm"}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isClosing}
        >
          {isClosing ? (
            <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} animate-spin`} />
          ) : (
            <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
          )}
          {!isMobile && <span className="mr-1">إغلاق</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد إغلاق الصفقة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من رغبتك في إغلاق صفقة <strong>{trade.symbol}</strong>؟
            <br />
            <br />
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span>المنصة:</span>
                <span className="font-medium">{trade.platform}</span>
                
                <span>الاتجاه:</span>
                <span className={`font-medium ${trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.side === 'buy' ? 'شراء' : 'بيع'}
                </span>
                
                <span>سعر الدخول:</span>
                <span className="font-medium">${trade.entry_price.toLocaleString()}</span>
                
                {trade.unrealized_pnl !== null && (
                  <>
                    <span>الربح/الخسارة:</span>
                    <span className={`font-medium ${trade.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${trade.unrealized_pnl.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <br />
            سيتم إغلاق الصفقة في النظام وإرسال أمر الإغلاق للمنصة.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClose}
            className="bg-red-600 hover:bg-red-700"
          >
            تأكيد الإغلاق
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CloseTradeButton;
