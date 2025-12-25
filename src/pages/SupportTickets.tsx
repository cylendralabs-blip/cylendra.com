/**
 * Support Tickets Page
 * 
 * Phase Admin E: User-side ticket management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserTickets, type Ticket } from '@/services/support/TicketService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CreateTicketForm from '@/components/support/CreateTicketForm';
import TicketList from '@/components/support/TicketList';

export default function SupportTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const loadTickets = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { tickets: ticketsData, error } = await getUserTickets(user.id, {
        status: activeTab !== 'all' ? activeTab as any : undefined,
      });

      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل التذاكر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user?.id, activeTab]);

  const getStatusBadge = (status: Ticket['status']) => {
    const configs = {
      open: { label: 'مفتوح', variant: 'default' as const, icon: MessageSquare },
      pending: { label: 'قيد المعالجة', variant: 'secondary' as const, icon: Clock },
      resolved: { label: 'محلول', variant: 'outline' as const, icon: CheckCircle },
      closed: { label: 'مغلق', variant: 'outline' as const, icon: XCircle },
    };
    return configs[status];
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const configs = {
      low: { label: 'منخفض', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700' },
      medium: { label: 'متوسط', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700' },
      high: { label: 'عالي', className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700' },
      critical: { label: 'حرج', className: 'bg-red-100 dark:bg-red-900/20 text-red-700' },
    };
    return configs[priority];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            تذاكر الدعم
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة طلبات الدعم والمساعدة
          </p>
        </div>
        <Button onClick={() => setActiveTab('create')}>
          <Plus className="w-4 h-4 mr-2" />
          تذكرة جديدة
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="open">مفتوح</TabsTrigger>
          <TabsTrigger value="pending">قيد المعالجة</TabsTrigger>
          <TabsTrigger value="resolved">محلول</TabsTrigger>
          <TabsTrigger value="closed">مغلق</TabsTrigger>
          <TabsTrigger value="create">تذكرة جديدة</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateTicketForm onSuccess={() => {
            setActiveTab('all');
            loadTickets();
          }} />
        </TabsContent>

        <TabsContent value="all">
          <TicketList tickets={tickets} loading={loading} onRefresh={loadTickets} />
        </TabsContent>

        <TabsContent value="open">
          <TicketList tickets={tickets} loading={loading} onRefresh={loadTickets} />
        </TabsContent>

        <TabsContent value="pending">
          <TicketList tickets={tickets} loading={loading} onRefresh={loadTickets} />
        </TabsContent>

        <TabsContent value="resolved">
          <TicketList tickets={tickets} loading={loading} onRefresh={loadTickets} />
        </TabsContent>

        <TabsContent value="closed">
          <TicketList tickets={tickets} loading={loading} onRefresh={loadTickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

