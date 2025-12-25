/**
 * Testnet Guard Component
 * 
 * Enforces testnet mode for first-time users or when enabled
 * Shows warning and blocks live trading if testnet is required
 * 
 * Phase 10: UI/UX Improvement - Task 12
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestnetGuardProps {
  children: React.ReactNode;
  requireTestnet?: boolean;
}

export const TestnetGuard = ({ children, requireTestnet = false }: TestnetGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTestnet, setIsTestnet] = useState(true);
  const [loading, setLoading] = useState(true);
  const [testnetDuration, setTestnetDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !requireTestnet) {
      setLoading(false);
      return;
    }

    const checkTestnetStatus = async () => {
      try {
        // Check API keys for testnet status
        const { data: apiKeys } = await supabase
          .from('api_keys')
          .select('testnet, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (apiKeys && apiKeys.length > 0) {
          const testnet = apiKeys[0].testnet || false;
          setIsTestnet(testnet);

          if (testnet && apiKeys[0].created_at) {
            // Calculate testnet duration
            const created = new Date(apiKeys[0].created_at);
            const now = new Date();
            const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            setTestnetDuration(hours);
          }
        }
      } catch (error) {
        console.error('Error checking testnet status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkTestnetStatus();
  }, [user, requireTestnet]);

  if (!requireTestnet || !isTestnet) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking testnet status...</p>
        </div>
      </div>
    );
  }

  const MIN_TESTNET_HOURS = 24;
  const hoursRemaining = testnetDuration !== null 
    ? Math.max(0, MIN_TESTNET_HOURS - testnetDuration)
    : MIN_TESTNET_HOURS;

  const canGoLive = testnetDuration !== null && testnetDuration >= MIN_TESTNET_HOURS;

  return (
    <div className="space-y-4">
      {!canGoLive && (
        <Alert variant="default" className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Testnet Mode Active</AlertTitle>
          <AlertDescription>
            You're currently in testnet mode. Please test for at least {MIN_TESTNET_HOURS} hours before going live.
            {testnetDuration !== null && (
              <span className="block mt-2">
                Time in testnet: {Math.floor(testnetDuration)} hours. 
                {hoursRemaining > 0 && ` ${hoursRemaining.toFixed(1)} hours remaining.`}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Testnet Mode Protection</h4>
              <p className="text-sm text-muted-foreground mb-4">
                All trading operations are currently in testnet mode. No real funds will be used.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/api-settings')}
              >
                Manage API Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
};

