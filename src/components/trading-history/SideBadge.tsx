
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SideBadgeProps {
  side: string;
}

const SideBadge = ({ side }: SideBadgeProps) => {
  return side === 'BUY' ? (
    <Badge className="bg-green-100 text-green-800">
      <TrendingUp className="w-3 h-3 mr-1" />
      شراء
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800">
      <TrendingDown className="w-3 h-3 mr-1" />
      بيع
    </Badge>
  );
};

export default SideBadge;
