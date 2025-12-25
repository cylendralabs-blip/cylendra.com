
interface StrategyStatus {
  name: string;
  status: string;
  color: string;
}

interface StrategyStatusListProps {
  strategies: StrategyStatus[];
}

const StrategyStatusList = ({ strategies }: StrategyStatusListProps) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">حالة الاستراتيجيات</h4>
      {strategies.map((strategy, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{strategy.name}</span>
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className={`w-2 h-2 rounded-full ${strategy.color}`}></div>
            <span className="text-xs text-gray-500">{strategy.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StrategyStatusList;
