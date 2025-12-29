/**
 * Permissions Matrix Component
 * 
 * Phase Admin F: Visual permissions management for Owner
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { getAllRoles, getRolePermissions, updateRolePermission } from '@/services/admin/RBACService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/services/admin/RBACService';

const PERMISSIONS = [
  { key: 'view_analytics', label: 'عرض التحليلات' },
  { key: 'modify_analytics', label: 'تعديل التحليلات' },
  { key: 'risk_management', label: 'إدارة المخاطر' },
  { key: 'kill_switch', label: 'Kill Switch' },
  { key: 'bot_control', label: 'التحكم في البوتات' },
  { key: 'feature_flags', label: 'Feature Flags' },
  { key: 'user_actions', label: 'إجراءات المستخدمين' },
  { key: 'support_actions', label: 'إجراءات الدعم' },
  { key: 'system_config', label: 'إعدادات النظام' },
  { key: 'api_key_visibility', label: 'رؤية API Keys' },
  { key: 'ticket_categories', label: 'إدارة التذاكر' },
];

export default function PermissionsMatrix() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const { roles: rolesData } = await getAllRoles();
      setRoles(rolesData);

      // Load permissions for each role
      const perms: Record<string, Record<string, boolean>> = {};
      for (const role of rolesData) {
        const { permissions: rolePerms } = await getRolePermissions(role.id);
        perms[role.id] = rolePerms;
      }
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الصلاحيات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePermission = async (roleId: string, permissionKey: string, currentValue: boolean) => {
    if (!user?.id) return;

    setSaving({ ...saving, [`${roleId}-${permissionKey}`]: true });
    try {
      const { success, error } = await updateRolePermission(roleId, permissionKey, !currentValue);
      if (success) {
        setPermissions({
          ...permissions,
          [roleId]: {
            ...permissions[roleId],
            [permissionKey]: !currentValue,
          },
        });
        toast({
          title: '✅ نجح',
          description: 'تم تحديث الصلاحية',
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في تحديث الصلاحية',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    } finally {
      setSaving({ ...saving, [`${roleId}-${permissionKey}`]: false });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>مصفوفة الصلاحيات</CardTitle>
        <CardDescription>
          إدارة الصلاحيات لكل دور (Owner فقط)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصلاحية</TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center">
                    {role.display_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((permission) => (
                <TableRow key={permission.key}>
                  <TableCell className="font-medium">
                    {permission.label}
                  </TableCell>
                  {roles.map((role) => {
                    const isOwner = role.name === 'owner';
                    const hasPermission = isOwner || (permissions[role.id]?.[permission.key] ?? false);
                    const isSaving = saving[`${role.id}-${permission.key}`];

                    return (
                      <TableCell key={role.id} className="text-center">
                        {isOwner ? (
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
                            دائماً
                          </Badge>
                        ) : (
                          <Switch
                            checked={hasPermission}
                            onCheckedChange={() => handleTogglePermission(role.id, permission.key, hasPermission)}
                            disabled={isSaving}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

