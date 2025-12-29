
interface BotStatusIndicatorProps {
  isRunning: boolean;
}

const BotStatusIndicator = ({ isRunning }: BotStatusIndicatorProps) => {
  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isRunning ? 'bg-trading-success animate-pulse' : 'bg-gray-400'}`}></div>
      <span className={`text-xs sm:text-sm font-medium ${isRunning ? 'text-trading-success' : 'text-gray-500'}`}>
        {isRunning ? 'نشط' : 'متوقف'}
      </span>
    </div>
  );
};

export default BotStatusIndicator;
