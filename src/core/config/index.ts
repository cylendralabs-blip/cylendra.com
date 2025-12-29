/**
 * Core Configuration - Unified Export
 * 
 * هذا الملف يجمع جميع إعدادات البوت في مكان واحد
 * 
 * Phase 1: توحيد الإعدادات
 */

export { botSettingsSchema, validateBotSettings } from './botSettings.schema';
export type { BotSettingsForm } from './botSettings.schema';
export { defaultBotSettings, mapSettingsToFormData } from './defaults';


