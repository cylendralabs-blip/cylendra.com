/**
 * useFeatureFlag Hook
 * 
 * Phase Admin B: Check if a feature is enabled
 */

import { useQuery } from '@tanstack/react-query';
import { isFeatureEnabled } from '@/services/admin/FeatureFlagsService';

export function useFeatureFlag(featureKey: string) {
  return useQuery({
    queryKey: ['feature-flag', featureKey],
    queryFn: () => isFeatureEnabled(featureKey),
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

