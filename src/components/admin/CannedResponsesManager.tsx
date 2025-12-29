/**
 * Canned Responses Manager Component
 * 
 * Phase Admin E: Manage canned responses
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  type CannedResponse,
} from '@/services/support/CannedResponseService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CannedResponsesManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message_text: '',
    category: 'none',
  });

  const loadResponses = async () => {
    setLoading(true);
    try {
      const { responses: responsesData, error } = await getCannedResponses();
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setResponses(responsesData);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الردود السريعة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: '❌ خطأ',
        description: 'يجب تسجيل الدخول',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.message_text.trim()) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editing) {
        const { success, error } = await updateCannedResponse(editing.id, {
          title: formData.title,
          message_text: formData.message_text,
          category: formData.category && formData.category !== 'none' ? formData.category : null,
        });

        if (success) {
          toast({
            title: '✅ نجح',
            description: 'تم تحديث الرد السريع',
          });
          setEditing(null);
          setFormData({ title: '', message_text: '', category: 'none' });
          loadResponses();
        } else {
          toast({
            title: '❌ خطأ',
            description: error || 'فشل في التحديث',
            variant: 'destructive',
          });
        }
      } else {
        const { response, error } = await createCannedResponse(
          formData.title,
          formData.message_text,
          user.id,
          formData.category && formData.category !== 'none' ? formData.category : undefined
        );

        if (response) {
          toast({
            title: '✅ نجح',
            description: 'تم إنشاء الرد السريع',
          });
          setFormData({ title: '', message_text: '', category: 'none' });
          loadResponses();
        } else {
          toast({
            title: '❌ خطأ',
            description: error || 'فشل في الإنشاء',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleEdit = (response: CannedResponse) => {
    setEditing(response);
    setFormData({
      title: response.title,
      message_text: response.message_text,
      category: response.category || 'none',
    });
  };

  const handleDelete = async (responseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرد السريع؟')) {
      return;
    }

    try {
      const { success, error } = await deleteCannedResponse(responseId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم حذف الرد السريع',
        });
        loadResponses();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في الحذف',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting response:', error);
    }
  };

  const categoryLabels: Record<string, string> = {
    api_issue: 'مشكلة في API',
    trading_issue: 'مشكلة في التداول',
    signals: 'الإشارات',
    billing: 'الفوترة',
    technical: 'تقني',
    other: 'أخرى',
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {editing ? 'تعديل رد سريع' : 'إضافة رد سريع جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: مشكلة في API"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف (اختياري)</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">نص الرد *</Label>
              <Textarea
                id="message"
                value={formData.message_text}
                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                placeholder="اكتب نص الرد السريع هنا..."
                rows={6}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editing ? 'تحديث' : 'إنشاء'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormData({ title: '', message_text: '', category: 'none' });
                  }}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>الردود السريعة ({responses.length})</CardTitle>
          <CardDescription>إدارة الردود السريعة للدعم</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : responses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد ردود سريعة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>عدد الاستخدامات</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">{response.title}</TableCell>
                    <TableCell>
                      {response.category ? categoryLabels[response.category] || response.category : '-'}
                    </TableCell>
                    <TableCell>{response.usage_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(response)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(response.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

