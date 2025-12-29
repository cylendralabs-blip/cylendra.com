/**
 * Orbitra AI - Strategy Template Service
 * 
 * Handles system-level strategy templates
 * Templates are read-only for users (managed by system)
 */

import { supabase } from '@/integrations/supabase/client';
import { StrategyTemplate, StrategyCategory } from '@/types/strategy-system';

export class StrategyTemplateService {
  /**
   * Get all active strategy templates
   */
  static async getAllTemplates(): Promise<StrategyTemplate[]> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching strategy templates:', error);
      throw new Error('Failed to fetch strategy templates');
    }

    return data || [];
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: StrategyCategory): Promise<StrategyTemplate[]> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching templates by category:', error);
      throw new Error('Failed to fetch templates');
    }

    return data || [];
  }

  /**
   * Get a single template by ID
   */
  static async getTemplateById(id: string): Promise<StrategyTemplate | null> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  /**
   * Get a template by key
   */
  static async getTemplateByKey(key: string): Promise<StrategyTemplate | null> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Error fetching template by key:', error);
      return null;
    }

    return data;
  }

  /**
   * Get templates grouped by category
   */
  static async getTemplatesGroupedByCategory(): Promise<Record<StrategyCategory, StrategyTemplate[]>> {
    const templates = await this.getAllTemplates();
    
    const grouped: Record<string, StrategyTemplate[]> = {};
    
    templates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });

    return grouped as Record<StrategyCategory, StrategyTemplate[]>;
  }

  /**
   * Validate configuration against template schema
   */
  static validateConfig(template: StrategyTemplate, config: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.schema || !template.schema.fields) {
      return { isValid: true, errors: [] };
    }

    template.schema.fields.forEach(field => {
      const value = config[field.key];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
        return;
      }

      // Skip validation if field is not required and not provided
      if (!field.required && (value === undefined || value === null)) {
        return;
      }

      // Type validation
      if (field.type === 'number') {
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${field.label} must be a valid number`);
          return;
        }

        if (field.min !== undefined && value < field.min) {
          errors.push(`${field.label} must be at least ${field.min}`);
        }

        if (field.max !== undefined && value > field.max) {
          errors.push(`${field.label} must be at most ${field.max}`);
        }
      }

      if (field.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field.label} must be an array`);
      }

      if (field.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field.label} must be a boolean`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

