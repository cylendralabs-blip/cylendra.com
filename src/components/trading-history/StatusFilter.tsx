
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const StatusFilter = ({ selectedStatus, onStatusChange }: StatusFilterProps) => {
  const isMobile = useIsMobile();
  
  const statusOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'active', label: 'نشط' },
    { value: 'closed', label: 'مغلق' },
    { value: 'pending', label: 'معلق' }
  ];

  return (
    <div className="flex gap-1 sm:gap-2 flex-wrap">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={selectedStatus === option.value ? 'default' : 'outline'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => onStatusChange(option.value)}
          className={`text-xs ${isMobile ? 'px-2 py-1 h-7' : 'px-3 py-1 h-8'} transition-all duration-200 hover:scale-105`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default StatusFilter;
