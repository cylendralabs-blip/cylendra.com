// This component is temporarily disabled because the tradingview_signals table doesn't exist yet
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TestSignalButton = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Feature Unavailable",
      description: "The tradingview_signals table needs to be created first.",
      variant: "destructive"
    });
  };

  return (
    <Button 
      onClick={handleClick}
      disabled
      variant="outline"
      className="text-muted-foreground"
    >
      <AlertTriangle className="w-4 h-4 mr-2" />
      TradingView Signals Unavailable
    </Button>
  );
};

export default TestSignalButton;
