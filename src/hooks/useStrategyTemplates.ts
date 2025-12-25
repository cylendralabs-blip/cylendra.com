/**
 * Orbitra AI - Strategy Templates Hook
 *
 * React Query hook for fetching strategy templates
 */

import { useQuery } from '@tanstack/react-query';
import { StrategyTemplateService } from '@/services/strategy-system/StrategyTemplateService';
import { StrategyCategory } from '@/types/strategy-system';

/**
 * Get all strategy templates
 */
export function useStrategyTemplates() {
  return useQuery({
    queryKey: ['strategy-templates'],
    queryFn: () => StrategyTemplateService.getAllTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes (templates rarely change)
  });
}

/**
 * Get templates by category
 */
export function useStrategyTemplatesByCategory(category: StrategyCategory) {
  return useQuery({
    queryKey: ['strategy-templates', 'category', category],
    queryFn: () => StrategyTemplateService.getTemplatesByCategory(category),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get templates grouped by category
 */
export function useStrategyTemplatesGrouped() {
  return useQuery({
    queryKey: ['strategy-templates', 'grouped'],
    queryFn: () => StrategyTemplateService.getTemplatesGroupedByCategory(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single template by ID
 */
export function useStrategyTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['strategy-template', templateId],
    queryFn: () => templateId ? StrategyTemplateService.getTemplateById(templateId) : null,
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}
