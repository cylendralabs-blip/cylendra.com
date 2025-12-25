/**
 * Create Ticket Form Component
 * 
 * Phase Admin E: User ticket submission form
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createTicket, type Ticket } from '@/services/support/TicketService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateTicketFormProps {
  onSuccess?: () => void;
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'api_issue' | 'trading_issue' | 'signals' | 'billing' | 'technical' | 'other'>('other');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; filename: string; file_type: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const categoryLabels: Record<string, string> = {
    api_issue: 'مشكلة في API',
    trading_issue: 'مشكلة في التداول',
    signals: 'الإشارات',
    billing: 'الفوترة',
    technical: 'تقني',
    other: 'أخرى',
  };

  const priorityLabels: Record<string, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
  };

  const handleFileUpload = async (file: File) => {
    if (!user?.id) return;

    if (attachments.length >= 5) {
      toast({
        title: '❌ خطأ',
        description: 'يمكنك رفع 5 ملفات كحد أقصى',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: '❌ خطأ',
        description: 'حجم الملف يجب أن يكون أقل من 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `ticket-attachments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(filePath);

      setAttachments([
        ...attachments,
        {
          url: publicUrl,
          filename: file.name,
          file_type: file.type || 'application/octet-stream',
        },
      ]);

      toast({
        title: '✅ نجح',
        description: 'تم رفع الملف بنجاح',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في رفع الملف',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

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

    if (!subject.trim() || !message.trim()) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { ticket, error } = await createTicket(
        user.id,
        subject,
        category,
        priority,
        message,
        attachments
      );

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else if (ticket) {
        toast({
          title: '✅ نجح',
          description: `تم إنشاء التذكرة ${ticket.ticket_number} بنجاح`,
        });
        
        // Reset form
        setSubject('');
        setCategory('other');
        setPriority('medium');
        setMessage('');
        setAttachments([]);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: '❌ خطأ',
        description: 'حدث خطأ أثناء إنشاء التذكرة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء تذكرة دعم جديدة</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإنشاء تذكرة دعم جديدة. سيتم الرد عليك في أقرب وقت ممكن.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">الموضوع *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: مشكلة في ربط API"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف *</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية *</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">الرسالة *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اشرح مشكلتك بالتفصيل..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">المرفقات (اختياري)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleFileUpload(file));
                }}
                disabled={uploading || attachments.length >= 5}
                accept="image/*,.pdf,.txt,.log"
                className="cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                ({attachments.length}/5) - حد أقصى 10MB لكل ملف
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted p-2 rounded text-sm"
                  >
                    <span>{attachment.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAttachments(attachments.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading || uploading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                إنشاء التذكرة
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

