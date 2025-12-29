/**
 * Copy Trading Analytics Dashboard
 * 
 * Phase X.17 - Analytics Dashboard
 * 
 * Comprehensive analytics dashboard for copy trading performance
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CopyAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewType, setViewType] = useState<'master' | 'follower'>('master');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['copy-analytics', user?.id, timeRange, viewType],
    queryFn: async () => {
      if (!user) return null;

      const dateFilter = getDateFilter(timeRange);

      if (viewType === 'master') {
        return await fetchMasterAnalytics(user.id, dateFilter);
      } else {
        return await fetchFollowerAnalytics(user.id, dateFilter);
      }
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No analytics data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Copy Trading Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive performance insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={viewType} onValueChange={(v: 'master' | 'follower') => setViewType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="master">Master View</SelectItem>
              <SelectItem value="follower">Follower View</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {viewType === 'master' ? 'Followers' : 'Strategies'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.countChange >= 0 ? '+' : ''}{analytics.countChange} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.volumeChange >= 0 ? '+' : ''}${analytics.volumeChange.toLocaleString()} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.winRateChange >= 0 ? '+' : ''}{analytics.winRateChange.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${analytics.totalPnL >= 0 ? '+' : ''}{analytics.totalPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.pnlChange >= 0 ? '+' : ''}${analytics.pnlChange.toLocaleString()} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PnL Over Time</CardTitle>
              <CardDescription>Cumulative profit and loss</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.pnlOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pnl" stroke="#0088FE" name="PnL" />
                  <Line type="monotone" dataKey="cumulative" stroke="#00C49F" name="Cumulative" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade Volume</CardTitle>
              <CardDescription>Daily trading volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.volumeOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volume" fill="#0088FE" name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Distribution</CardTitle>
                <CardDescription>By performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.strategyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.strategyDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Win/Loss Distribution</CardTitle>
                <CardDescription>Trade outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.winLossDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top {viewType === 'master' ? 'Strategies' : 'Masters'}</CardTitle>
          <CardDescription>Best performing {viewType === 'master' ? 'strategies' : 'masters to follow'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer: any, index: number) => (
              <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{performer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {performer.trades} trades • {performer.winRate.toFixed(1)}% win rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${performer.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${performer.pnl >= 0 ? '+' : ''}{performer.pnl.toLocaleString()}
                  </div>
                  <Badge variant={performer.pnl >= 0 ? 'default' : 'destructive'}>
                    {performer.return.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getDateFilter(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return '2000-01-01T00:00:00Z';
  }
}

async function fetchMasterAnalytics(userId: string, dateFilter: string) {
  // Fetch master analytics
  const { data: strategies } = await supabase
    .from('copy_strategies')
    .select('id, name')
    .eq('owner_user_id', userId);

  if (!strategies || strategies.length === 0) {
    return getEmptyAnalytics();
  }

  const strategyIds = strategies.map(s => s.id);

  // Fetch trades
  const { data: trades } = await supabase
    .from('copy_trades_log')
    .select('*')
    .in('strategy_id', strategyIds)
    .gte('created_at', dateFilter);

  // Fetch followers
  const { data: followers } = await supabase
    .from('copy_followers')
    .select('*')
    .in('strategy_id', strategyIds)
    .eq('status', 'ACTIVE');

  return calculateAnalytics(trades || [], followers || [], strategies, 'master');
}

async function fetchFollowerAnalytics(userId: string, dateFilter: string) {
  // Fetch follower analytics
  const { data: followers } = await supabase
    .from('copy_followers')
    .select('*, copy_strategies(id, name)')
    .eq('follower_user_id', userId)
    .eq('status', 'ACTIVE');

  if (!followers || followers.length === 0) {
    return getEmptyAnalytics();
  }

  const strategyIds = followers.map(f => f.strategy_id);

  // Fetch trades
  const { data: trades } = await supabase
    .from('copy_trades_log')
    .select('*')
    .eq('follower_user_id', userId)
    .in('strategy_id', strategyIds)
    .gte('created_at', dateFilter);

  return calculateAnalytics(trades || [], followers, [], 'follower');
}

function calculateAnalytics(
  trades: any[],
  followers: any[],
  strategies: any[],
  type: 'master' | 'follower'
) {
  const totalCount = type === 'master' ? followers.length : followers.length;
  const totalVolume = trades.reduce((sum, t) => sum + (parseFloat(t.follower_position_size) || 0), 0);
  const totalPnL = trades
    .filter(t => t.pnl_amount)
    .reduce((sum, t) => sum + (parseFloat(t.pnl_amount) || 0), 0);
  
  const winningTrades = trades.filter(t => t.pnl_amount && parseFloat(t.pnl_amount) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  // Group by date for charts
  const pnlOverTime = groupByDate(trades, 'created_at', (t: any) => parseFloat(t.pnl_amount || 0));
  const volumeOverTime = groupByDate(trades, 'created_at', (t: any) => parseFloat(t.follower_position_size || 0));

  // Strategy distribution
  const strategyDistribution = type === 'master'
    ? strategies.map(s => ({
        name: s.name,
        value: trades.filter(t => t.strategy_id === s.id).length,
      }))
    : followers.map((f: any) => ({
        name: f.copy_strategies?.name || 'Unknown',
        value: trades.filter(t => t.strategy_id === f.strategy_id).length,
      }));

  // Win/Loss distribution
  const winLossDistribution = [
    { category: 'Wins', value: winningTrades },
    { category: 'Losses', value: trades.length - winningTrades },
  ];

  // Top performers
  const topPerformers = type === 'master'
    ? strategies.map(s => {
        const strategyTrades = trades.filter(t => t.strategy_id === s.id);
        const strategyPnL = strategyTrades
          .filter(t => t.pnl_amount)
          .reduce((sum, t) => sum + (parseFloat(t.pnl_amount) || 0), 0);
        const strategyWins = strategyTrades.filter(t => t.pnl_amount && parseFloat(t.pnl_amount) > 0).length;
        const strategyWinRate = strategyTrades.length > 0 ? (strategyWins / strategyTrades.length) * 100 : 0;
        
        return {
          id: s.id,
          name: s.name,
          trades: strategyTrades.length,
          winRate: strategyWinRate,
          pnl: strategyPnL,
          return: strategyWinRate > 0 ? (strategyPnL / totalVolume) * 100 : 0,
        };
      }).sort((a, b) => b.pnl - a.pnl).slice(0, 5)
    : followers.map((f: any) => {
        const followerTrades = trades.filter(t => t.strategy_id === f.strategy_id);
        const followerPnL = followerTrades
          .filter(t => t.pnl_amount)
          .reduce((sum, t) => sum + (parseFloat(t.pnl_amount) || 0), 0);
        const followerWins = followerTrades.filter(t => t.pnl_amount && parseFloat(t.pnl_amount) > 0).length;
        const followerWinRate = followerTrades.length > 0 ? (followerWins / followerTrades.length) * 100 : 0;
        
        return {
          id: f.strategy_id,
          name: f.copy_strategies?.name || 'Unknown',
          trades: followerTrades.length,
          winRate: followerWinRate,
          pnl: followerPnL,
          return: followerWinRate > 0 ? (followerPnL / totalVolume) * 100 : 0,
        };
      }).sort((a, b) => b.pnl - a.pnl).slice(0, 5);

  return {
    totalCount,
    countChange: 0, // TODO: Calculate from previous period
    totalVolume,
    volumeChange: 0, // TODO: Calculate from previous period
    winRate,
    winRateChange: 0, // TODO: Calculate from previous period
    totalPnL,
    pnlChange: 0, // TODO: Calculate from previous period
    pnlOverTime,
    volumeOverTime,
    strategyDistribution,
    winLossDistribution,
    topPerformers,
  };
}

function groupByDate(data: any[], dateField: string, valueFn: (item: any) => number) {
  const grouped = new Map<string, { pnl: number; cumulative: number }>();
  let cumulative = 0;

  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    const value = valueFn(item);
    cumulative += value;

    if (grouped.has(date)) {
      const existing = grouped.get(date)!;
      existing.pnl += value;
      existing.cumulative = cumulative;
    } else {
      grouped.set(date, { pnl: value, cumulative });
    }
  });

  return Array.from(grouped.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getEmptyAnalytics() {
  return {
    totalCount: 0,
    countChange: 0,
    totalVolume: 0,
    volumeChange: 0,
    winRate: 0,
    winRateChange: 0,
    totalPnL: 0,
    pnlChange: 0,
    pnlOverTime: [],
    volumeOverTime: [],
    strategyDistribution: [],
    winLossDistribution: [],
    topPerformers: [],
  };
}

