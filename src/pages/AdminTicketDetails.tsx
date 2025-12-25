/**
 * Admin Ticket Details Page
 * 
 * Phase Admin E: Admin-side ticket conversation and management
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Send, Download, User, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  getTicketById,
  getTicketMessages,
  addTicketMessage,
  updateTicket,
  type Ticket,
  type TicketMessage,
} from '@/services/support/TicketService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getCannedResponses, type CannedResponse } from '@/services/support/CannedResponseService';

export default function AdminTicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [updating, setUpdating] = useState(false);

  const loadTicket = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const [ticketResult, messagesResult, cannedResult] = await Promise.all([
        getTicketById(ticketId),
        getTicketMessages(ticketId, true), // Include internal messages for admin
        getCannedResponses(),
      ]);

      if (ticketResult.error) {
        toast({
          title: '❌ خطأ',
          description: ticketResult.error,
          variant: 'destructive',
        });
      } else {
        setTicket(ticketResult.ticket);
      }

      if (messagesResult.error) {
        toast({
          title: '❌ خطأ',
          description: messagesResult.error,
          variant: 'destructive',
        });
      } else {
        setMessages(messagesResult.messages);
      }

      if (cannedResult.responses) {
        setCannedResponses(cannedResult.responses);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل التذكرة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const handleSendMessage = async () => {
    if (!ticketId || !user?.id || !newMessage.trim()) return;

    setUpdating(true);
    try {
      const { message, error } = await addTicketMessage(
        ticketId,
        user.id,
        'admin',
        newMessage,
        [],
        isInternal
      );

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else if (message) {
        setMessages([...messages, message]);
        setNewMessage('');
        setIsInternal(false);
        toast({
          title: '✅ نجح',
          description: 'تم إرسال الرسالة',
        });
        loadTicket(); // Reload to update ticket status
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTicket = async (field: 'status' | 'priority' | 'category', value: any) => {
    if (!ticketId || !user?.id || !ticket) return;

    setUpdating(true);
    try {
      const updates: any = { [field]: value };
      const { success, error } = await updateTicket(ticketId, updates, user.id);

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else if (success) {
        loadTicket();
        toast({
          title: '✅ نجح',
          description: 'تم تحديث التذكرة',
        });
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleInsertCannedResponse = (response: CannedResponse) => {
    setNewMessage(response.message_text);
    toast({
      title: '✅ نجح',
      description: 'تم إدراج الرد السريع',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !ticket) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            التذكرة غير موجودة
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
            onClick={() => navigate('/dashboard/admin/tickets')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
            <p className="text-muted-foreground">#{ticket.ticket_number}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Messages */}
        <div className="lg:col-span-2 space-y-4">
          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>المحادثة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-4',
                    message.sender_type === 'user' ? 'justify-start' : 'justify-end'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg p-4',
                      message.sender_type === 'user'
                        ? 'bg-muted'
                        : message.is_internal
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-500'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.sender_type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {message.sender_type === 'user' ? 'المستخدم' : 'الأدمن'}
                        {message.is_internal && ' (ملاحظة داخلية)'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.message_text}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm underline"
                          >
                            <Download className="w-4 h-4" />
                            {attachment.filename}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>إرسال رد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cannedResponses.length > 0 && (
                <div className="space-y-2">
                  <Label>الردود السريعة</Label>
                  <div className="flex flex-wrap gap-2">
                    {cannedResponses.map((response) => (
                      <Button
                        key={response.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertCannedResponse(response)}
                      >
                        {response.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="message">الرسالة</Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  rows={6}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal" className="cursor-pointer">
                  ملاحظة داخلية (غير مرئية للمستخدم)
                </Label>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={updating || !newMessage.trim()}
                className="w-full"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    إرسال
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Ticket Info & Actions */}
        <div className="space-y-4">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات التذكرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleUpdateTicket('status', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="pending">قيد المعالجة</SelectItem>
                    <SelectItem value="resolved">محلول</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handleUpdateTicket('priority', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={ticket.category}
                  onValueChange={(value) => handleUpdateTicket('category', value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_issue">مشكلة في API</SelectItem>
                    <SelectItem value="trading_issue">مشكلة في التداول</SelectItem>
                    <SelectItem value="signals">الإشارات</SelectItem>
                    <SelectItem value="billing">الفوترة</SelectItem>
                    <SelectItem value="technical">تقني</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <p className="font-medium">{formatDate(ticket.created_at)}</p>
                </div>
                {ticket.first_response_at && (
                  <div>
                    <span className="text-muted-foreground">أول رد:</span>
                    <p className="font-medium">{formatDate(ticket.first_response_at)}</p>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div>
                    <span className="text-muted-foreground">تاريخ الحل:</span>
                    <p className="font-medium">{formatDate(ticket.resolved_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

