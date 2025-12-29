/**
 * Missions Panel Component
 * 
 * Displays available missions and progress
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle2, Clock, Trophy, BarChart3, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionLog } from '@/services/affiliate/types';
import { useToast } from '@/hooks/use-toast';

interface MissionsPanelProps {
  affiliateId: string;
}

export const MissionsPanel = ({ affiliateId }: MissionsPanelProps) => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionLogs, setMissionLogs] = useState<MissionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = useCallback(async () => {
    try {
      // Load active missions
      // Use type assertion to avoid deep type inference issues
      // The missions table exists but isn't in generated types yet
      const missionsResult = await (supabase
        .from('missions' as any)
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false }) as any) as { data: Mission[] | null; error: any };

      if (missionsResult.error) throw missionsResult.error;

      // Load mission logs
      // Use type assertion to avoid deep type inference issues
      // The mission_logs table exists but isn't in generated types yet
      const logsResult = await (supabase
        .from('mission_logs' as any)
        .select('*')
        .eq('affiliate_id', affiliateId) as any) as { data: MissionLog[] | null; error: any };

      if (logsResult.error) throw logsResult.error;

      const missionsData = missionsResult.data;
      const logsData = logsResult.data;

      setMissions(missionsData || []);
      setMissionLogs(logsData || []);
    } catch (error: any) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleClaim = async (missionId: string) => {
    try {
      // Update mission log status
      // Use type assertion to avoid deep type inference issues
      const updateResult = await (supabase
        .from('mission_logs' as any)
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        } as any)
        .eq('affiliate_id', affiliateId)
        .eq('mission_id', missionId)
        .eq('status', 'completed') as any) as { error: any };

      if (updateResult.error) throw updateResult.error;

      toast({
        title: 'Success',
        description: 'Mission rewards claimed!',
      });

      loadMissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim',
        variant: 'destructive',
      });
    }
  };

  const getMissionLog = (missionId: string): MissionLog | undefined => {
    return missionLogs.find(log => log.mission_id === missionId);
  };

  const calculateProgress = (mission: Mission, log?: MissionLog): number => {
    if (!log || log.status === 'completed' || log.status === 'claimed') return 100;

    const requirements = mission.requirements;
    const progress = log.progress || {};

    // Simple progress calculation (can be enhanced)
    const keys = Object.keys(requirements);
    const completed = keys.filter(key => progress[key] >= requirements[key]).length;

    return (completed / keys.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Missions
        </CardTitle>
        <CardDescription>
          Complete missions to earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {missions.map((mission) => {
          const log = getMissionLog(mission.id);
          const progress = calculateProgress(mission, log);
          const isCompleted = log?.status === 'completed' || log?.status === 'claimed';
          const canClaim = log?.status === 'completed';

          return (
            <Card key={mission.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{mission.title}</CardTitle>
                    <CardDescription className="mt-1">{mission.description}</CardDescription>
                  </div>
                  <Badge variant={isCompleted ? 'default' : 'outline'}>
                    {mission.mission_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-4 text-sm">
                  {mission.rewards.lp && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      <span>{mission.rewards.lp} LP</span>
                    </div>
                  )}
                  {mission.rewards.weight && (
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>+{mission.rewards.weight} Weight</span>
                    </div>
                  )}
                  {mission.rewards.tokens && (
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      <span>{mission.rewards.tokens} Tokens</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canClaim && (
                  <Button
                    onClick={() => handleClaim(mission.id)}
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Claim Rewards
                  </Button>
                )}

                {!log && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      // Start mission
                      try {
                        // Use type assertion to avoid deep type inference issues
                        const insertResult = await (supabase
                          .from('mission_logs' as any)
                          .insert({
                            affiliate_id: affiliateId,
                            mission_id: mission.id,
                            status: 'in_progress',
                          } as any) as any) as { error: any };
                        if (insertResult.error) throw insertResult.error;
                        loadMissions();
                      } catch (error) {
                        console.error('Error starting mission:', error);
                      }
                    }}
                  >
                    Start Mission
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

