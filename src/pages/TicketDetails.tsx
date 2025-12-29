/**
 * Ticket Details Page
 * 
 * Phase Admin E: View and manage a single ticket
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Paperclip, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getTicketById, getTicketMessages, addTicketMessage, type Ticket, type TicketMessage } from '@/services/support/TicketService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadTicket = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const [ticketResult, messagesResult] = await Promise.all([
        getTicketById(ticketId),
        getTicketMessages(ticketId, false), // Don't include internal messages for users
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

    setSending(true);
    try {
      const { message, error } = await addTicketMessage(
        ticketId,
        user.id,
        'user',
        newMessage
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
        toast({
          title: '✅ نجح',
          description: 'تم إرسال الرسالة',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
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
            onClick={() => navigate('/dashboard/support/tickets')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
            <p className="text-muted-foreground">#{ticket.ticket_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{ticket.category}</Badge>
          <Badge>{ticket.priority}</Badge>
          <Badge>{ticket.status}</Badge>
        </div>
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>المحادثة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4',
                message.sender_type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-4',
                  message.sender_type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
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
      {ticket.status !== 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle>إرسال رد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب ردك هنا..."
              rows={4}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="w-full"
            >
              {sending ? (
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
      )}
    </div>
  );
}

