/**
 * Orbitra AI - Strategies Page (Phase 1 Refactor)
 *
 * Two-level strategy system:
 * 1. Browse strategy templates (system-level)
 * 2. Create and manage strategy instances (user-level with versioning)
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Target, Grid3x3, TrendingUp, Activity } from 'lucide-react';
import { useStrategyTemplatesGrouped } from '@/hooks/useStrategyTemplates';
import { useStrategyInstances } from '@/hooks/useStrategyInstances';
import { useDeleteStrategyInstance, useCloneStrategyInstance } from '@/hooks/useStrategyInstances';
import {
  StrategyTemplateCard,
  StrategyInstanceCard,
  CreateStrategyDialog,
} from '@/components/strategy-system';
import { StrategyTemplate, StrategyInstance } from '@/types/strategy-system';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const Strategies = () => {
  const { t } = useTranslation('strategies');
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('instances');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | undefined>();
  const [selectedInstance, setSelectedInstance] = useState<StrategyInstance | undefined>();

  // Fetch data
  const { data: templatesGrouped, isLoading: loadingTemplates } = useStrategyTemplatesGrouped();
  const { data: instances, isLoading: loadingInstances } = useStrategyInstances({
    includeTemplate: true,
  });

  // Mutations
  const deleteMutation = useDeleteStrategyInstance();
  const cloneMutation = useCloneStrategyInstance();

  // Handlers
  const handleCreateFromTemplate = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setSelectedInstance(undefined);
    setDialogOpen(true);
  };

  const handleEditInstance = (instance: StrategyInstance) => {
    setSelectedInstance(instance);
    setSelectedTemplate(undefined);
    setDialogOpen(true);
  };

  const handleDeleteInstance = async (instance: StrategyInstance) => {
    if (confirm(t('management.confirm.delete', { name: instance.name }))) {
      await deleteMutation.mutateAsync(instance.id);
    }
  };

  const handleCloneInstance = async (instance: StrategyInstance) => {
    const newName = prompt(t('management.confirm.clone_prompt'), `${instance.name} (${t('management.confirm.clone_copy')})`);
    if (newName) {
      await cloneMutation.mutateAsync({
        instanceId: instance.id,
        newName,
      });
    }
  };

  const handleViewHistory = (instance: StrategyInstance) => {
    // TODO: Implement version history dialog
    console.log('View history for:', instance);
  };

  return (
    <div className="px-2 lg:px-3 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 mt-2">
        <div className="mb-2 lg:mb-0">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1">
            {t('management.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {t('management.subtitle')}
          </p>
        </div>

        <Button onClick={() => setActiveTab('templates')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('management.create_new')}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instances">
            <Target className="w-4 h-4 mr-2" />
            {t('management.tabs.instances', { count: instances?.length || 0 })}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Grid3x3 className="w-4 h-4 mr-2" />
            {t('management.tabs.templates')}
          </TabsTrigger>
        </TabsList>

        {/* My Strategy Instances */}
        <TabsContent value="instances" className="space-y-4">
          {loadingInstances ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : instances && instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map((instance) => (
                <StrategyInstanceCard
                  key={instance.id}
                  instance={instance}
                  onEdit={handleEditInstance}
                  onDelete={handleDeleteInstance}
                  onClone={handleCloneInstance}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {t('management.no_instances')}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Strategy Templates */}
        <TabsContent value="templates" className="space-y-6">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : templatesGrouped ? (
            <>
              {/* DCA Strategies */}
              {templatesGrouped.DCA && templatesGrouped.DCA.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {t('management.categories.dca')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesGrouped.DCA.map((template) => (
                      <StrategyTemplateCard
                        key={template.id}
                        template={template}
                        onCreateInstance={handleCreateFromTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Grid Strategies */}
              {templatesGrouped.GRID && templatesGrouped.GRID.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5" />
                    {t('management.categories.grid')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesGrouped.GRID.map((template) => (
                      <StrategyTemplateCard
                        key={template.id}
                        template={template}
                        onCreateInstance={handleCreateFromTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Momentum Strategies */}
              {templatesGrouped.MOMENTUM && templatesGrouped.MOMENTUM.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t('management.categories.momentum')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesGrouped.MOMENTUM.map((template) => (
                      <StrategyTemplateCard
                        key={template.id}
                        template={template}
                        onCreateInstance={handleCreateFromTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                {t('management.no_templates')}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <CreateStrategyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        instance={selectedInstance}
      />
    </div>
  );
};

export default Strategies;
