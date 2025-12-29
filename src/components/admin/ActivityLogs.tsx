
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Shield, Trash2, Ban, CheckCircle, UserPlus, UserMinus } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

const ActivityLogs = () => {
  const { activities } = useAdmin();

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'ROLE_ADDED': return UserPlus;
      case 'ROLE_REMOVED': return UserMinus;
      case 'USER_ACTIVATED': return CheckCircle;
      case 'USER_DEACTIVATED': return Ban;
      case 'USER_DELETED': return Trash2;
      default: return Activity;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'ROLE_ADDED': return 'text-green-600';
      case 'ROLE_REMOVED': return 'text-orange-600';
      case 'USER_ACTIVATED': return 'text-blue-600';
      case 'USER_DEACTIVATED': return 'text-yellow-600';
      case 'USER_DELETED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.action_type) {
      case 'ROLE_ADDED':
        return `تم إضافة دور ${activity.action_details?.role_added || 'غير محدد'}`;
      case 'ROLE_REMOVED':
        return `تم إزالة دور ${activity.action_details?.role_removed || 'غير محدد'}`;
      case 'USER_ACTIVATED':
        return 'تم تفعيل الحساب';
      case 'USER_DEACTIVATED':
        return 'تم تعطيل الحساب';
      case 'USER_DELETED':
        return 'تم حذف الحساب نهائياً';
      default:
        return activity.action_type;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            سجل نشاطات الإدارة
          </CardTitle>
          <CardDescription>
            جميع الإجراءات التي تم تنفيذها من قبل المديرين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد نشاطات مسجلة</p>
              </div>
            ) : (
              activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.action_type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${getActivityColor(activity.action_type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {activity.action_type}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString('ar')}
                        </span>
                      </div>
                      
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getActivityDescription(activity)}
                      </p>
                      
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>المدير: {activity.admin_user_id}</p>
                        {activity.target_user_id && (
                          <p>المستخدم المستهدف: {activity.target_user_id}</p>
                        )}
                        {activity.ip_address && (
                          <p>عنوان IP: {activity.ip_address}</p>
                        )}
                      </div>

                      {/* Additional Details */}
                      {Object.keys(activity.action_details || {}).length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            تفاصيل إضافية:
                          </p>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {JSON.stringify(activity.action_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;
