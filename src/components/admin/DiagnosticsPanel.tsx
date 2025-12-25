/**
 * Diagnostics Panel Component
 * 
 * Admin panel for viewing logs, system health, and diagnostics
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 8
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Filter, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Log {
  id: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: string;
  action: string;
  message: string;
  context?: any;
  trade_id?: string;
  position_id?: string;
  signal_id?: string;
  exchange?: string;
  symbol?: string;
  source?: string;
  created_at: string;
}

interface ComponentHealth {
  component: string;
  component_type: string;
  status: 'healthy' | 'degraded' | 'down';
  health_score: number;
  last_heartbeat: string | null;
  response_time_ms: number | null;
  error_count: number;
  message?: string;
}

export const DiagnosticsPanel = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [health, setHealth] = useState<ComponentHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(200);
  
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use type assertion to avoid deep type inference issues
      // The logs table exists but isn't in generated types yet
      let query = (supabase
        .from('logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit) as any);
      
      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,symbol.ilike.%${searchTerm}%`);
      }
      
      const logsResult = await (query as any) as { data: Log[] | null; error: any };
      const { data, error: fetchError } = logsResult;
      
      if (fetchError) {
        throw fetchError;
      }
      
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [levelFilter, categoryFilter, searchTerm, limit]);
  
  const fetchHealth = useCallback(async () => {
    try {
      // Use type assertion to avoid deep type inference issues
      const healthResult = await (supabase
        .from('system_health' as any)
        .select('*')
        .order('component') as any) as { data: ComponentHealth[] | null; error: any };
      
      const { data, error } = healthResult;
      
      if (error) {
        console.error('Error fetching health:', error);
        return;
      }
      
      setHealth(data || []);
    } catch (err) {
      console.error('Error fetching health:', err);
    }
  }, []);
  
  useEffect(() => {
    if (!user) return;
    
    fetchLogs();
    fetchHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLogs();
      fetchHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, fetchLogs, fetchHealth]);
  
  const exportLogs = () => {
    const csv = [
      ['Level', 'Category', 'Action', 'Message', 'Source', 'Symbol', 'Exchange', 'Created At'].join(','),
      ...logs.map(log => [
        log.level,
        log.category,
        log.action,
        `"${log.message.replace(/"/g, '""')}"`,
        log.source || '',
        log.symbol || '',
        log.exchange || '',
        log.created_at
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'outline';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {health.map((component) => (
              <div
                key={component.component}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{component.component}</p>
                  {getStatusIcon(component.status)}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={component.status === 'healthy' ? 'default' : 'destructive'}>
                      {component.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-semibold">{component.health_score}/100</span>
                  </div>
                  {component.last_heartbeat && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last:</span>
                      <span>{formatDistanceToNow(new Date(component.last_heartbeat), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Logs</CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportLogs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="signal">Signal</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading logs...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No logs found</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border text-sm ${
                        log.level === 'critical' || log.level === 'error'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                          : log.level === 'warn'
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mb-1">{log.message}</p>
                      {(log.symbol || log.exchange || log.source) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.symbol && <span>Symbol: {log.symbol}</span>}
                          {log.exchange && <span>Exchange: {log.exchange}</span>}
                          {log.source && <span>Source: {log.source}</span>}
                        </div>
                      )}
                      {log.context && Object.keys(log.context).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Context
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

