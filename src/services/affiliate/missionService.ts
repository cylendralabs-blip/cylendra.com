/**
 * Mission Service
 * 
 * Handles mission progress tracking and completion
 * 
 * Phase 11A: Influence Economy
 */

import { Mission, MissionLog } from './types';

/**
 * Update mission progress
 */
export async function updateMissionProgress(
  affiliateId: string,
  missionId: string,
  progress: Record<string, number>
): Promise<void> {
  // This would update the mission log in database
  // Implementation would be in a hook or service that calls Supabase
}

/**
 * Check if mission is completed
 */
export function isMissionCompleted(
  mission: Mission,
  log?: MissionLog
): boolean {
  if (!log || log.status !== 'completed') return false;

  const requirements = mission.requirements;
  const progress = log.progress || {};

  // Check if all requirements are met
  for (const [key, required] of Object.entries(requirements)) {
    if ((progress[key] || 0) < required) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate mission progress percentage
 */
export function calculateMissionProgress(
  mission: Mission,
  log?: MissionLog
): number {
  if (!log) return 0;
  if (log.status === 'completed' || log.status === 'claimed') return 100;

  const requirements = mission.requirements;
  const progress = log.progress || {};

  const keys = Object.keys(requirements);
  if (keys.length === 0) return 0;

  const completed = keys.filter(
    key => (progress[key] || 0) >= (requirements[key] || 0)
  ).length;

  return Math.round((completed / keys.length) * 100);
}

/**
 * Get mission rewards summary
 */
export function getMissionRewardsSummary(mission: Mission): string {
  const rewards: string[] = [];

  if (mission.rewards.lp) rewards.push(`${mission.rewards.lp} LP`);
  if (mission.rewards.weight) rewards.push(`+${mission.rewards.weight} Weight`);
  if (mission.rewards.tokens) rewards.push(`${mission.rewards.tokens} Tokens`);
  if (mission.rewards.cpu) rewards.push(`${mission.rewards.cpu} CPU`);
  if (mission.rewards.usd) rewards.push(`$${mission.rewards.usd}`);

  return rewards.join(', ') || 'No rewards';
}

