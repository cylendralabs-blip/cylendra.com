/**
 * My Signals Page
 * 
 * Phase X.12 - Community Signals System
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignalCard } from '@/components/community/SignalCard';
import { useCommunitySignals } from '@/hooks/useCommunitySignals';
import { useMyTraderStats } from '@/hooks/useTraderRanking';
import { useCloseSignal } from '@/hooks/useCommunitySignals';
import { Loader2, TrendingUp, Trophy, Target, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export default function MySignals() {
  const { t } = useTranslation('signals');
  const { user } = useAuth();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [closeForm, setCloseForm] = useState({ result: 'WIN' as 'WIN' | 'LOSS' | 'BREAKEVEN', pnl: 0 });

  // Fetch user's own signals
  const { data: allSignals = [], isLoading } = useCommunitySignals({
    limit: 100,
  });

  // Filter to current user's signals
  const mySignals = allSignals.filter(s => s.user_id === user?.id);

  const { data: myStats } = useMyTraderStats(user?.id);
  const closeMutation = useCloseSignal();

  const handleCloseSignal = async () => {
    if (!selectedSignalId) return;

    try {
      await closeMutation.mutateAsync({
        signalId: selectedSignalId,
        result: closeForm.result,
        pnlPercentage: closeForm.pnl,
      });
      setCloseDialogOpen(false);
      setSelectedSignalId(null);
    } catch (error) {
      console.error('Error closing signal:', error);
    }
  };

  const openSignals = mySignals.filter(s => s.status === 'OPEN');
  const closedSignals = mySignals.filter(s => s.status === 'CLOSED');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          {t('my_signals.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('my_signals.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      {myStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('my_signals.stats.rank')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{myStats.rank}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('my_signals.stats.win_rate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-bold">{myStats.win_rate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('my_signals.stats.avg_return')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {myStats.avg_return > 0 ? '+' : ''}{myStats.avg_return.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('my_signals.stats.lp_points')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold">{myStats.lp_points}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Open Signals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('my_signals.open_signals.title', { count: openSignals.length })}</CardTitle>
          <CardDescription>{t('my_signals.open_signals.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : openSignals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('my_signals.open_signals.no_signals')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openSignals.map((signal) => (
                <div key={signal.id} className="relative">
                  <SignalCard signal={signal} showUserInfo={false} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setSelectedSignalId(signal.id);
                      setCloseDialogOpen(true);
                    }}
                  >
                    {t('my_signals.open_signals.close_button')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Signals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('my_signals.closed_signals.title', { count: closedSignals.length })}</CardTitle>
          <CardDescription>{t('my_signals.closed_signals.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {closedSignals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('my_signals.closed_signals.no_signals')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} showUserInfo={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Signal Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('my_signals.close_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('my_signals.close_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('my_signals.close_dialog.result_label')}</Label>
              <Select
                value={closeForm.result}
                onValueChange={(value) => setCloseForm(prev => ({ ...prev, result: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">{t('my_signals.close_dialog.win')}</SelectItem>
                  <SelectItem value="LOSS">{t('my_signals.close_dialog.loss')}</SelectItem>
                  <SelectItem value="BREAKEVEN">{t('my_signals.close_dialog.breakeven')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('my_signals.close_dialog.pnl_label')}</Label>
              <Input
                type="number"
                step="0.01"
                value={closeForm.pnl}
                onChange={(e) => setCloseForm(prev => ({ ...prev, pnl: Number(e.target.value) }))}
                placeholder={t('my_signals.close_dialog.pnl_placeholder')}
              />
            </div>
            <Button
              onClick={handleCloseSignal}
              disabled={closeMutation.isPending}
              className="w-full"
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('my_signals.close_dialog.closing')}
                </>
              ) : (
                t('my_signals.close_dialog.close_button')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

