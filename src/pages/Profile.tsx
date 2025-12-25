import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Calendar, Shield, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });

  const handleSave = () => {
    // هنا يمكن إضافة منطق حفظ البيانات
    toast({
      title: t('toast.success'),
      description: t('toast.updated')
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // إعادة تعيين البيانات للحالة الأصلية
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      bio: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src="" alt="User Avatar" />
                    <AvatarFallback className="text-2xl bg-accent text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{user?.email || t('user_card.default_user')}</CardTitle>
                <div className="mt-2 flex justify-center">
                  <Badge variant="secondary">
                    <Shield className="w-4 h-4 mr-1" />
                    {t('user_card.advanced_user')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('user_card.email')}</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('user_card.join_date')}</p>
                    <p className="font-medium">{t('user_card.join_date_val')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 space-x-reverse">
                      <User className="w-5 h-5" />
                      <span>{t('personal_info.title')}</span>
                    </CardTitle>
                    <CardDescription>
                      {t('personal_info.subtitle')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditing ? t('personal_info.cancel') : t('personal_info.edit')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('personal_info.fields.first_name')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      placeholder={t('personal_info.fields.first_name_placeholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('personal_info.fields.last_name')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      placeholder={t('personal_info.fields.last_name_placeholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('personal_info.fields.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder={t('personal_info.fields.phone_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('personal_info.fields.bio')}</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder={t('personal_info.fields.bio_placeholder')}
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
                  />
                </div>

                {isEditing && (
                  <>
                    <Separator />
                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <Button variant="outline" onClick={handleCancel}>
                        {t('personal_info.cancel')}
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('personal_info.save')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
