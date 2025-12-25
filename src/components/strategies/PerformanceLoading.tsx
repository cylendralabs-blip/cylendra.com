
const PerformanceLoading = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceLoading;
