
import TwoFactorAuth from '@/components/security/TwoFactorAuth';
import SecurityLogs from '@/components/security/SecurityLogs';

const SecurityTab = () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <TwoFactorAuth />
      <SecurityLogs />
    </div>
  );
};

export default SecurityTab;
