
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DCAOrder } from '@/types/trade';
import { formatNumber, formatDate } from '@/utils/tradingFormat';
import StatusBadge from './StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';

interface DCAOrdersTableProps {
  dcaOrders: DCAOrder[] | undefined;
}

const DCAOrdersTable = ({ dcaOrders }: DCAOrdersTableProps) => {
  const isMobile = useIsMobile();

  if (!dcaOrders || dcaOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm sm:text-base">لا توجد أوامر DCA</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 px-3">
        {dcaOrders.map((order) => (
          <Card key={order.id} className="trade-card">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="font-medium text-sm">{order.trades?.symbol}</span>
                    <Badge variant={order.trades?.trade_type === 'spot' ? 'secondary' : 'default'} className="text-xs">
                      {order.trades?.trade_type === 'spot' ? 'سبوت' : 'فيوتشر'}
                    </Badge>
                  </div>
                  <StatusBadge status={order.status || 'PENDING'} />
                </div>

                {/* DCA Level */}
                <div className="border-b pb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">مستوى DCA</span>
                  <p className="font-medium text-lg">{order.dca_level}</p>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">السعر المستهدف</span>
                    <p className="font-medium">${formatNumber(order.target_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">السعر المنفذ</span>
                    <p className="font-medium">${formatNumber(order.executed_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">الكمية</span>
                    <p className="font-medium">{formatNumber(order.quantity)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">الكمية المنفذة</span>
                    <p className="font-medium">{formatNumber(order.executed_quantity)}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="border-t pt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">المبلغ</span>
                  <p className="font-medium">${formatNumber(order.amount)}</p>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
                  <div className="flex justify-between">
                    <span>أُنشئ: {formatDate(order.created_at)}</span>
                    {order.executed_at && <span>نُفذ: {formatDate(order.executed_at)}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs lg:text-sm">الرمز</TableHead>
            <TableHead className="text-xs lg:text-sm">النوع</TableHead>
            <TableHead className="text-xs lg:text-sm">مستوى DCA</TableHead>
            <TableHead className="text-xs lg:text-sm">السعر المستهدف</TableHead>
            <TableHead className="text-xs lg:text-sm">الكمية</TableHead>
            <TableHead className="text-xs lg:text-sm">المبلغ</TableHead>
            <TableHead className="text-xs lg:text-sm">السعر المنفذ</TableHead>
            <TableHead className="text-xs lg:text-sm">الكمية المنفذة</TableHead>
            <TableHead className="text-xs lg:text-sm">الحالة</TableHead>
            <TableHead className="text-xs lg:text-sm">تاريخ الإنشاء</TableHead>
            <TableHead className="text-xs lg:text-sm">تاريخ التنفيذ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dcaOrders.map((order) => (
            <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <TableCell className="text-xs lg:text-sm">{order.trades?.symbol}</TableCell>
              <TableCell>
                <Badge variant={order.trades?.trade_type === 'spot' ? 'secondary' : 'default'} className="text-xs">
                  {order.trades?.trade_type === 'spot' ? 'سبوت' : 'فيوتشر'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs lg:text-sm">{order.dca_level}</TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(order.target_price)}</TableCell>
              <TableCell className="text-xs lg:text-sm">{formatNumber(order.quantity)}</TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(order.amount)}</TableCell>
              <TableCell className="text-xs lg:text-sm">${formatNumber(order.executed_price)}</TableCell>
              <TableCell className="text-xs lg:text-sm">{formatNumber(order.executed_quantity)}</TableCell>
              <TableCell><StatusBadge status={order.status || 'PENDING'} /></TableCell>
              <TableCell className="text-xs lg:text-sm">{formatDate(order.created_at)}</TableCell>
              <TableCell className="text-xs lg:text-sm">{formatDate(order.executed_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DCAOrdersTable;
