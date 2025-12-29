/**
 * Orbitra AI - Strategy Instance Service
 * 
 * Handles user-level strategy instances with versioning support
 * 
 * CRITICAL VERSIONING RULE:
 * - Editing a strategy in use creates a NEW VERSION
 * - Never overwrite existing versions
 * - Bots remain on their assigned version until explicitly updated
 */

import { supabase } from '@/integrations/supabase/client';
import {
  StrategyInstance,
  StrategyInstanceWithHistory,
  CreateStrategyInstanceDto,
  UpdateStrategyInstanceDto,
  StrategyInstanceStatus
} from '@/types/strategy-system';
import { StrategyTemplateService } from './StrategyTemplateService';

export class StrategyInstanceService {
  /**
   * Create a new strategy instance
   */
  static async createInstance(
    userId: string,
    dto: CreateStrategyInstanceDto
  ): Promise<StrategyInstance> {
    // Validate template exists
    const template = await StrategyTemplateService.getTemplateById(dto.template_id);
    if (!template) {
      throw new Error('Strategy template not found');
    }

    // Validate configuration
    const validation = StrategyTemplateService.validateConfig(template, dto.config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('strategy_instances')
      .insert({
        user_id: userId,
        template_id: dto.template_id,
        name: dto.name,
        description: dto.description,
        config: dto.config,
        status: dto.status || 'active',
        version: 1,
        parent_id: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategy instance:', error);
      throw new Error('Failed to create strategy instance');
    }

    return data;
  }

  /**
   * Update strategy instance
   * 
   * IMPORTANT: If strategy is in use, creates a NEW VERSION instead of updating
   */
  static async updateInstance(
    instanceId: string,
    userId: string,
    dto: UpdateStrategyInstanceDto
  ): Promise<StrategyInstance> {
    // Get current instance
    const current = await this.getInstanceById(instanceId, userId);
    if (!current) {
      throw new Error('Strategy instance not found');
    }

    // Check if strategy is in use
    if (current.is_in_use) {
      // Create new version instead of updating
      return this.createNewVersion(current, userId, dto);
    }

    // If not in use, safe to update directly
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    
    if (dto.config !== undefined) {
      // Validate new config
      const template = await StrategyTemplateService.getTemplateById(current.template_id);
      if (template) {
        const validation = StrategyTemplateService.validateConfig(template, dto.config);
        if (!validation.isValid) {
          throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }
      }
      updateData.config = dto.config;
    }

    const { data, error } = await supabase
      .from('strategy_instances')
      .update(updateData)
      .eq('id', instanceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating strategy instance:', error);
      throw new Error('Failed to update strategy instance');
    }

    return data;
  }

  /**
   * Create a new version of a strategy
   * This is called when editing a strategy that is in use
   */
  static async createNewVersion(
    current: StrategyInstance,
    userId: string,
    dto: UpdateStrategyInstanceDto
  ): Promise<StrategyInstance> {
    const newConfig = dto.config !== undefined ? dto.config : current.config;

    // Validate new config
    const template = await StrategyTemplateService.getTemplateById(current.template_id);
    if (template) {
      const validation = StrategyTemplateService.validateConfig(template, newConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
    }

    const { data, error } = await supabase
      .from('strategy_instances')
      .insert({
        user_id: userId,
        template_id: current.template_id,
        name: dto.name !== undefined ? dto.name : current.name,
        description: dto.description !== undefined ? dto.description : current.description,
        config: newConfig,
        status: dto.status !== undefined ? dto.status : current.status,
        version: current.version + 1,
        parent_id: current.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating new version:', error);
      throw new Error('Failed to create new version');
    }

    return data;
  }

  /**
   * Get user's strategy instances
   */
  static async getUserInstances(
    userId: string,
    options?: {
      status?: StrategyInstanceStatus;
      templateId?: string;
      includeTemplate?: boolean;
    }
  ): Promise<StrategyInstance[]> {
    console.log('🔍 getUserInstances called with:', { userId, options });

    let query = supabase
      .from('strategy_instances')
      .select(options?.includeTemplate ? '*, template:strategy_templates(*)' : '*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.templateId) {
      query = query.eq('template_id', options.templateId);
    }

    const { data, error } = await query;

    console.log('🔍 getUserInstances result:', { data, error });

    if (error) {
      console.error('Error fetching user instances:', error);
      throw new Error('Failed to fetch strategy instances');
    }

    return data || [];
  }

  /**
   * Get a single instance by ID
   */
  static async getInstanceById(
    instanceId: string,
    userId: string
  ): Promise<StrategyInstance | null> {
    const { data, error } = await supabase
      .from('strategy_instances')
      .select('*, template:strategy_templates(*)')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching instance:', error);
      return null;
    }

    return data;
  }

  /**
   * Get instance with version history
   */
  static async getInstanceWithHistory(
    instanceId: string,
    userId: string
  ): Promise<StrategyInstanceWithHistory | null> {
    const instance = await this.getInstanceById(instanceId, userId);
    if (!instance) return null;

    // Get all versions (including this one and its children)
    const versions = await this.getVersionHistory(instanceId, userId);

    const latestVersion = Math.max(...versions.map(v => v.version));

    return {
      ...instance,
      versions,
      latest_version: latestVersion,
      is_latest: instance.version === latestVersion
    };
  }

  /**
   * Get version history for a strategy
   */
  static async getVersionHistory(
    instanceId: string,
    userId: string
  ): Promise<StrategyInstance[]> {
    // Get the root instance
    const instance = await this.getInstanceById(instanceId, userId);
    if (!instance) return [];

    // Find the root (version 1)
    let rootId = instance.id;
    if (instance.parent_id) {
      const { data } = await supabase
        .from('strategy_instances')
        .select('id')
        .eq('user_id', userId)
        .eq('version', 1)
        .or(`id.eq.${instance.id},id.eq.${instance.parent_id}`)
        .single();

      if (data) rootId = data.id;
    }

    // Get all versions from root
    const { data, error } = await supabase
      .from('strategy_instances')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
      .order('version', { ascending: true });

    if (error) {
      console.error('Error fetching version history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Delete a strategy instance (only if not in use)
   */
  static async deleteInstance(instanceId: string, userId: string): Promise<void> {
    const instance = await this.getInstanceById(instanceId, userId);
    if (!instance) {
      throw new Error('Strategy instance not found');
    }

    if (instance.is_in_use) {
      throw new Error('Cannot delete strategy instance that is in use by a bot');
    }

    const { error } = await supabase
      .from('strategy_instances')
      .delete()
      .eq('id', instanceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting instance:', error);
      throw new Error('Failed to delete strategy instance');
    }
  }

  /**
   * Archive a strategy instance
   */
  static async archiveInstance(instanceId: string, userId: string): Promise<void> {
    await this.updateInstance(instanceId, userId, { status: 'archived' });
  }

  /**
   * Clone a strategy instance
   */
  static async cloneInstance(
    instanceId: string,
    userId: string,
    newName: string
  ): Promise<StrategyInstance> {
    const instance = await this.getInstanceById(instanceId, userId);
    if (!instance) {
      throw new Error('Strategy instance not found');
    }

    return this.createInstance(userId, {
      template_id: instance.template_id,
      name: newName,
      description: instance.description,
      config: { ...instance.config },
      status: 'draft'
    });
  }

  /**
   * Mark instance as in use (called when assigned to a bot)
   */
  static async markAsInUse(instanceId: string, inUse: boolean): Promise<void> {
    const { error } = await supabase
      .from('strategy_instances')
      .update({
        is_in_use: inUse,
        last_used_at: inUse ? new Date().toISOString() : undefined
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error marking instance as in use:', error);
      throw new Error('Failed to update instance usage status');
    }
  }

  /**
   * Get the root (original) instance of a strategy family
   * Traverses parent_id chain to find the root
   */
  static async getRootInstance(instanceId: string, userId: string): Promise<StrategyInstance | null> {
    let current = await this.getInstanceById(instanceId, userId);
    if (!current) return null;

    // Traverse up the parent chain
    while (current.parent_id) {
      const parent = await this.getInstanceById(current.parent_id, userId);
      if (!parent) break;
      current = parent;
    }

    return current;
  }

  /**
   * Get the latest version in a strategy family
   * Returns the instance with the highest version number in the family
   */
  static async getLatestVersion(instanceId: string, userId: string): Promise<StrategyInstance | null> {
    // First, find the root of the family
    const root = await this.getRootInstance(instanceId, userId);
    if (!root) return null;

    // Get all instances in the family (root + all descendants)
    const { data, error } = await supabase
      .from('strategy_instances')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${root.id},parent_id.eq.${root.id}`)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error getting latest version:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if a newer version exists for a strategy instance
   * Returns the latest version if it's newer, null otherwise
   */
  static async checkForNewerVersion(instanceId: string, userId: string): Promise<{
    hasNewer: boolean;
    latestVersion: StrategyInstance | null;
    currentVersion: number;
  }> {
    const current = await this.getInstanceById(instanceId, userId);
    if (!current) {
      return { hasNewer: false, latestVersion: null, currentVersion: 0 };
    }

    const latest = await this.getLatestVersion(instanceId, userId);
    if (!latest) {
      return { hasNewer: false, latestVersion: null, currentVersion: current.version };
    }

    return {
      hasNewer: latest.version > current.version,
      latestVersion: latest.version > current.version ? latest : null,
      currentVersion: current.version,
    };
  }

  /**
   * Get all versions in a strategy family
   * Returns all instances in the family tree, ordered by version
   */
  static async getFamilyVersions(instanceId: string, userId: string): Promise<StrategyInstance[]> {
    const root = await this.getRootInstance(instanceId, userId);
    if (!root) return [];

    const { data, error } = await supabase
      .from('strategy_instances')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${root.id},parent_id.eq.${root.id}`)
      .order('version', { ascending: true});

    if (error) {
      console.error('Error getting family versions:', error);
      return [];
    }

    return data || [];
  }
}

