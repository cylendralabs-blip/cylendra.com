
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    ACTIVE: { color: 'bg-green-500', text: 'نشط' },
    CLOSED: { color: 'bg-gray-500', text: 'مغلق' },
    PENDING: { color: 'bg-yellow-500', text: 'معلق' },
    CANCELLED: { color: 'bg-red-500', text: 'ملغي' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  
  return (
    <Badge className={`${config.color} text-white`}>
      {config.text}
    </Badge>
  );
};

export default StatusBadge;
