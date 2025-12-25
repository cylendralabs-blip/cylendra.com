import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, Shield, Trash2, Ban, MoreHorizontal, Eye, Bot, Monitor, DollarSign, TrendingUp, Power, PowerOff, Wrench } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminUser } from '@/types/admin';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserDetailsModal from './UserDetailsModal';
import { UserManagementService } from '@/services/admin/UserManagementService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UsersManagement = () => {
  const { users, addUserRole, removeUserRole, deactivateUser, deleteUser, searchUsers, refreshData } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Phase Admin A: Trading status for each user
  const [tradingStatuses, setTradingStatuses] = useState<Record<string, boolean>>({});
  const [loadingTradingStatus, setLoadingTradingStatus] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedUserId(null);
    setIsDetailsModalOpen(false);
  };
  
  const displayUsers = searchResults.length > 0 ? searchResults : users;
  
  // Phase Admin A: Load trading status for all users
  useEffect(() => {
    const loadTradingStatuses = async () => {
      const usersToCheck = searchResults.length > 0 ? searchResults : users;
      const statuses: Record<string, boolean> = {};
      for (const user of usersToCheck) {
        try {
          const { enabled } = await UserManagementService.getUserTradingStatus(user.id);
          statuses[user.id] = enabled;
        } catch (error) {
          console.error(`Error loading trading status for user ${user.id}:`, error);
          statuses[user.id] = true; // Default to enabled
        }
      }
      setTradingStatuses(statuses);
    };
    
    if (users.length > 0 || searchResults.length > 0) {
      loadTradingStatuses();
    }
  }, [users, searchResults]);
  
  // Phase Admin A: Handle enable/disable trading
  const handleToggleTrading = async (userId: string, enabled: boolean) => {
    setLoadingTradingStatus(prev => ({ ...prev, [userId]: true }));
    try {
      const result = enabled
        ? await UserManagementService.enableUserTrading(userId)
        : await UserManagementService.disableUserTrading(userId, 'Disabled by admin');
      
      if (result.success) {
        setTradingStatuses(prev => ({ ...prev, [userId]: enabled }));
        toast({
          title: enabled ? '✅ تم تفعيل التداول' : '✅ تم تعطيل التداول',
          description: `تم ${enabled ? 'تفعيل' : 'تعطيل'} التداول للمستخدم بنجاح`,
        });
        refreshData();
      } else {
        toast({
          title: '❌ خطأ',
          description: result.error || 'فشل في تحديث حالة التداول',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling trading:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحديث حالة التداول',
        variant: 'destructive',
      });
    } finally {
      setLoadingTradingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'moderator': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'user': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث عن المستخدمين
          </CardTitle>
          <CardDescription>
            ابحث عن المستخدمين بالاسم أو المعرف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="ابحث بالاسم أو المعرف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="w-4 h-4 mr-2" />
              بحث
            </Button>
            {searchResults.length > 0 && (
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}>
                مسح البحث
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({displayUsers.length})</CardTitle>
          <CardDescription>
            إدارة جميع حسابات المستخدمين في النظام مع تفاصيل شاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>التداول</TableHead>
                  <TableHead>الاستراتيجيات</TableHead>
                  <TableHead>المحفظة</TableHead>
                  <TableHead>المنصات</TableHead>
                  <TableHead>البوت</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && (
                          <Badge variant="secondary">مستخدم عادي</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{user.total_trades}</span>
                        {user.active_trades !== undefined && (
                          <span className="text-xs text-blue-600">({user.active_trades} نشطة)</span>
                        )}
                      </div>
                      {user.total_profit !== undefined && (
                        <div className={`text-xs ${user.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ربح: {formatCurrency(user.total_profit)}
                        </div>
                      )}
                      {/* Phase Admin A: Trading Status Badge */}
                      {tradingStatuses[user.id] !== undefined && (
                        <Badge 
                          variant={tradingStatuses[user.id] ? 'default' : 'destructive'} 
                          className="text-xs mt-1"
                        >
                          {tradingStatuses[user.id] ? '✅ التداول مفعّل' : '❌ التداول معطّل'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{user.total_strategies}</span>
                        {user.active_strategies !== undefined && (
                          <div className="text-xs text-green-600">
                            {user.active_strategies} نشطة
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{formatCurrency(user.account_balance)}</span>
                      </div>
                      {user.total_capital !== undefined && user.total_capital > 0 && (
                        <div className="text-xs text-gray-500">
                          رأس مال: {formatCurrency(user.total_capital)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Monitor className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{user.connected_platforms?.length || 0}</span>
                      </div>
                      {user.api_keys_count !== undefined && (
                        <div className="text-xs text-purple-600">
                          {user.api_keys_count} مفاتيح
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Bot className={`w-4 h-4 ${user.bot_active ? 'text-green-500' : 'text-gray-400'}`} />
                        <Badge variant={user.bot_active ? 'default' : 'secondary'} className="text-xs">
                          {user.bot_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                      {user.risk_level !== undefined && user.risk_level > 0 && (
                        <div className="text-xs text-orange-600">
                          مخاطر: {user.risk_level}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ar')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View Details */}
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          
                          {/* Phase Admin D: Support Dashboard */}
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/support`)}>
                            <Wrench className="w-4 h-4 mr-2" />
                            لوحة الدعم
                          </DropdownMenuItem>
                          
                          {/* Add Role */}
                          <DropdownMenuItem onClick={() => {
                            const roleToAdd = window.prompt('أدخل الدور (admin/moderator/user):');
                            if (roleToAdd && ['admin', 'moderator', 'user'].includes(roleToAdd)) {
                              addUserRole(user.id, roleToAdd as 'admin' | 'moderator' | 'user');
                            }
                          }}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            إضافة دور
                          </DropdownMenuItem>
                          
                          {/* Remove Role */}
                          {user.roles.length > 0 && (
                            <DropdownMenuItem onClick={() => {
                              const roleToRemove = window.prompt(`أدخل الدور المراد إزالته (${user.roles.join('/')}):`) ;
                              if (roleToRemove && user.roles.includes(roleToRemove)) {
                                removeUserRole(user.id, roleToRemove);
                              }
                            }}>
                              <Shield className="w-4 h-4 mr-2" />
                              إزالة دور
                            </DropdownMenuItem>
                          )}
                          
                          {/* Phase Admin A: Enable/Disable Trading */}
                          {tradingStatuses[user.id] !== undefined && (
                            <>
                              {tradingStatuses[user.id] ? (
                                <DropdownMenuItem 
                                  onClick={() => handleToggleTrading(user.id, false)}
                                  disabled={loadingTradingStatus[user.id]}
                                  className="text-orange-600"
                                >
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  تعطيل التداول
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleToggleTrading(user.id, true)}
                                  disabled={loadingTradingStatus[user.id]}
                                  className="text-green-600"
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  تفعيل التداول
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          
                          {/* Deactivate User */}
                          <DropdownMenuItem onClick={() => deactivateUser(user.id)}>
                            <Ban className="w-4 h-4 mr-2" />
                            تعطيل الحساب
                          </DropdownMenuItem>
                          
                          {/* Delete User */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                حذف نهائي
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف حساب {user.full_name} نهائياً مع جميع بياناته. هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUser(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف نهائي
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {displayUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد مستخدمين للعرض</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={refreshData}
                >
                  إعادة تحميل البيانات
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <UserDetailsModal
        userId={selectedUserId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        onUserUpdate={refreshData}
      />
    </div>
  );
};

export default UsersManagement;
