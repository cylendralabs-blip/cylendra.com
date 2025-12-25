
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/admin/AdminService';
import { AdminUser, AdminActivity } from '@/types/admin';
import { SystemStats } from '@/services/admin/SystemStatsService';
import { useToast } from '@/hooks/use-toast';

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);

  useEffect(() => {
    // Wait for auth to finish loading before checking admin status
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user?.id, authLoading]); // Depend on authLoading to wait for auth to complete

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const adminStatus = await AdminService.isAdmin(user.id);
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // تحديث إحصائيات النظام أولاً
      await AdminService.calculateSystemStats();
      
      const [usersData, statsData, activitiesData] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getSystemStats(),
        AdminService.getAdminActivities()
      ]);

      console.log('Loaded admin data:', {
        users: usersData.length,
        stats: statsData.length,
        activities: activitiesData.length
      });

      setUsers(usersData);
      setSystemStats(statsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'فشل في تحميل بيانات الإدارة',
        variant: 'destructive'
      });
    }
  };

  const addUserRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    if (!user) return;

    try {
      await AdminService.addUserRole(userId, role, user.id);
      await loadAdminData();
      toast({
        title: 'تم إضافة الدور',
        description: `تم إضافة دور ${role} للمستخدم بنجاح`
      });
    } catch (error) {
      toast({
        title: 'خطأ في إضافة الدور',
        description: 'فشل في إضافة الدور للمستخدم',
        variant: 'destructive'
      });
    }
  };

  const removeUserRole = async (userId: string, role: string) => {
    if (!user) return;

    try {
      await AdminService.removeUserRole(userId, role, user.id);
      await loadAdminData();
      toast({
        title: 'تم إزالة الدور',
        description: `تم إزالة دور ${role} من المستخدم بنجاح`
      });
    } catch (error) {
      toast({
        title: 'خطأ في إزالة الدور',
        description: 'فشل في إزالة الدور من المستخدم',
        variant: 'destructive'
      });
    }
  };

  const deactivateUser = async (userId: string) => {
    if (!user) return;

    try {
      await AdminService.deactivateUser(userId, user.id);
      await loadAdminData();
      toast({
        title: 'تم تعطيل المستخدم',
        description: 'تم تعطيل الحساب بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ في تعطيل المستخدم',
        description: 'فشل في تعطيل الحساب',
        variant: 'destructive'
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user) return;

    try {
      await AdminService.deleteUser(userId, user.id);
      await loadAdminData();
      toast({
        title: 'تم حذف المستخدم',
        description: 'تم حذف الحساب نهائياً'
      });
    } catch (error) {
      toast({
        title: 'خطأ في حذف المستخدم',
        description: 'فشل في حذف الحساب',
        variant: 'destructive'
      });
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const searchResults = await AdminService.searchUsers(query);
      return searchResults;
    } catch (error) {
      toast({
        title: 'خطأ في البحث',
        description: 'فشل في البحث عن المستخدمين',
        variant: 'destructive'
      });
      return [];
    }
  };

  const calculateStats = async () => {
    try {
      await AdminService.calculateSystemStats();
      await loadAdminData();
      toast({
        title: 'تم تحديث الإحصائيات',
        description: 'تم حساب إحصائيات النظام بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ في حساب الإحصائيات',
        description: 'فشل في حساب إحصائيات النظام',
        variant: 'destructive'
      });
    }
  };

  return {
    isAdmin,
    loading,
    users,
    systemStats,
    activities,
    addUserRole,
    removeUserRole,
    deactivateUser,
    deleteUser,
    searchUsers,
    calculateStats,
    refreshData: loadAdminData
  };
};
