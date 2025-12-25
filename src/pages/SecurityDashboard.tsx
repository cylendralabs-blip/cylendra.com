/**
 * Security Dashboard
 * 
 * Phase Admin F: Security, permissions, and audit infrastructure
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, AlertTriangle, Users, Key, Settings } from 'lucide-react';
import RBACProtected from '@/components/admin/RBACProtected';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';
import SecurityEventsViewer from '@/components/admin/SecurityEventsViewer';
import ActiveSessionsManager from '@/components/admin/ActiveSessionsManager';
import PermissionsMatrix from '@/components/admin/PermissionsMatrix';
import AdminSecuritySettings from '@/components/admin/AdminSecuritySettings';

export default function SecurityDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          لوحة الأمان والصلاحيات
        </h1>
        <p className="text-muted-foreground mt-1">
          إدارة الأمان والصلاحيات وسجلات التدقيق
        </p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            سجلات التدقيق
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            الأحداث الأمنية
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الجلسات النشطة
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            مصفوفة الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات الأمان
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <RBACProtected requiredPermission="view_analytics">
            <AuditLogsViewer />
          </RBACProtected>
        </TabsContent>

        <TabsContent value="security">
          <RBACProtected requiredPermission="view_analytics">
            <SecurityEventsViewer />
          </RBACProtected>
        </TabsContent>

        <TabsContent value="sessions">
          <RBACProtected requiredRole="owner">
            <ActiveSessionsManager />
          </RBACProtected>
        </TabsContent>

        <TabsContent value="permissions">
          <RBACProtected requiredRole="owner">
            <PermissionsMatrix />
          </RBACProtected>
        </TabsContent>

        <TabsContent value="settings">
          <AdminSecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

