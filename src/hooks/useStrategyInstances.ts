/**
 * Orbitra AI - Strategy Instances Hook
 * 
 * React Query hooks for managing user strategy instances with versioning
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StrategyInstanceService } from '@/services/strategy-system/StrategyInstanceService';
import {
  CreateStrategyInstanceDto,
  UpdateStrategyInstanceDto,
  StrategyInstanceStatus
} from '@/types/strategy-system';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * Get user's strategy instances
 */
export function useStrategyInstances(options?: {
  status?: StrategyInstanceStatus;
  templateId?: string;
  includeTemplate?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategy-instances', user?.id, options],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('🔍 Fetching strategy instances for user:', user.id);
      return StrategyInstanceService.getUserInstances(user.id, options);
    },
    enabled: !!user?.id,
  });
}

/**
 * Get a single strategy instance
 */
export function useStrategyInstance(instanceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategy-instance', instanceId],
    queryFn: () => {
      if (!user?.id || !instanceId) return null;
      return StrategyInstanceService.getInstanceById(instanceId, user.id);
    },
    enabled: !!user?.id && !!instanceId,
  });
}

/**
 * Get strategy instance with version history
 */
export function useStrategyInstanceWithHistory(instanceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategy-instance-history', instanceId],
    queryFn: () => {
      if (!user?.id || !instanceId) return null;
      return StrategyInstanceService.getInstanceWithHistory(instanceId, user.id);
    },
    enabled: !!user?.id && !!instanceId,
  });
}

/**
 * Create strategy instance mutation
 */
export function useCreateStrategyInstance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateStrategyInstanceDto) => {
      if (!user?.id) throw new Error('User not authenticated');
      return StrategyInstanceService.createInstance(user.id, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-instances'] });
      toast({
        title: 'تم إنشاء الاستراتيجية',
        description: 'تم إنشاء الاستراتيجية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في إنشاء الاستراتيجية',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update strategy instance mutation
 * Automatically creates new version if strategy is in use
 */
export function useUpdateStrategyInstance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instanceId, dto }: { instanceId: string; dto: UpdateStrategyInstanceDto }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return StrategyInstanceService.updateInstance(instanceId, user.id, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strategy-instances'] });
      queryClient.invalidateQueries({ queryKey: ['strategy-instance', data.id] });
      
      if (data.version > 1) {
        toast({
          title: 'تم إنشاء نسخة جديدة',
          description: `تم إنشاء النسخة ${data.version} من الاستراتيجية`,
        });
      } else {
        toast({
          title: 'تم تحديث الاستراتيجية',
          description: 'تم حفظ التغييرات بنجاح',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في تحديث الاستراتيجية',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete strategy instance mutation
 */
export function useDeleteStrategyInstance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instanceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return StrategyInstanceService.deleteInstance(instanceId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-instances'] });
      toast({
        title: 'تم حذف الاستراتيجية',
        description: 'تم حذف الاستراتيجية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في حذف الاستراتيجية',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Clone strategy instance mutation
 */
export function useCloneStrategyInstance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instanceId, newName }: { instanceId: string; newName: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return StrategyInstanceService.cloneInstance(instanceId, user.id, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-instances'] });
      toast({
        title: 'تم نسخ الاستراتيجية',
        description: 'تم إنشاء نسخة من الاستراتيجية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في نسخ الاستراتيجية',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

