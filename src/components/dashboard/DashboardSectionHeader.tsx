import { ReactNode } from 'react';
import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardSectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export const DashboardSectionHeader = ({
  icon,
  title,
  subtitle,
  actions,
  className,
}: DashboardSectionHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};


