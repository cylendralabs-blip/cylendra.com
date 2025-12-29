/**
 * Users Management Page
 * 
 * Dedicated page for user management (separate from Admin Dashboard)
 */

import UsersManagement from '@/components/admin/UsersManagement';

const UsersManagementPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          عرض وإدارة جميع المستخدمين في النظام
        </p>
      </div>
      <UsersManagement />
    </div>
  );
};

export default UsersManagementPage;

