/**
 * User Support Dashboard
 * 
 * Phase Admin D: Complete support view for a specific user
 */

import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, AlertCircle, Key, Wrench, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import UserTimeline from '@/components/admin/UserTimeline';
import UserErrorLogs from '@/components/admin/UserErrorLogs';
import ApiHealthMonitor from '@/components/admin/ApiHealthMonitor';
import SupportActions from '@/components/admin/SupportActions';
import SupportNotes from '@/components/admin/SupportNotes';

import { useTranslation } from 'react-i18next';

export default function UserSupportDashboard() {
  const { t } = useTranslation('support');
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('user_dashboard.id_not_provided')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('user_dashboard.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('user_dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('user_dashboard.user_id', { userId })}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('user_dashboard.tabs.timeline')}
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t('user_dashboard.tabs.errors')}
          </TabsTrigger>
          <TabsTrigger value="api-health" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('user_dashboard.tabs.api_health')}
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            {t('user_dashboard.tabs.actions')}
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            {t('user_dashboard.tabs.notes')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <UserTimeline userId={userId} />
        </TabsContent>

        <TabsContent value="errors">
          <UserErrorLogs userId={userId} />
        </TabsContent>

        <TabsContent value="api-health">
          <ApiHealthMonitor userId={userId} />
        </TabsContent>

        <TabsContent value="actions">
          <SupportActions userId={userId} />
        </TabsContent>

        <TabsContent value="notes">
          <SupportNotes userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

