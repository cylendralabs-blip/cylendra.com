
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description: string;
}

const StatCard = ({ title, value, change, changeType, icon: Icon, description }: StatCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight truncate">
          {title}
        </CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      </CardHeader>
      <CardContent className="pt-0 p-2 sm:p-3 lg:p-4">
        <div className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">
          {value}
        </div>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs sm:text-sm ${getChangeColor()}`}>
            {change}
          </p>
        </div>
        <CardDescription className="text-xs mt-1 sm:mt-2 leading-tight">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default StatCard;
