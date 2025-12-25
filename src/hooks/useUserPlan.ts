/**
 * Hook for accessing user plan information
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserPlan, getAllPlans, assignPlanToUser, canUseFeature } from '@/core/plans/planManager';
import type { PlanCode } from '@/core/plans/planTypes';
import { useAuth } from '@/hooks/useAuth';

/**
 * Get user's current plan
 */
export function useUserPlan() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userPlan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return getUserPlan(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get all available plans
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getAllPlans,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Assign plan to user (admin/service only)
 */
export function useAssignPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, planCode, paymentMethod, expiresAt }: {
      userId: string;
      planCode: PlanCode;
      paymentMethod?: string;
      expiresAt?: string | null;
    }) => {
      return assignPlanToUser(userId, planCode, paymentMethod, expiresAt);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userPlan', variables.userId] });
    },
  });
}

/**
 * Check if user can use a feature
 */
export function useCanUseFeature(featurePath: string) {
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  
  return useQuery({
    queryKey: ['canUseFeature', user?.id, featurePath],
    queryFn: async () => {
      if (!user?.id) return false;
      // canUseFeature is already imported statically above
      return canUseFeature(user.id, featurePath);
    },
    enabled: !!user?.id && !!userPlan,
    staleTime: 5 * 60 * 1000,
  });
}

