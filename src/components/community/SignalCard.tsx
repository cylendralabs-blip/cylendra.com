/**
 * Signal Card Component
 * 
 * Phase X.12 - Community Signals System
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Crown, Sparkles, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommunitySignal } from '@/core/community/types';
import { useVoteOnSignal } from '@/hooks/useCommunitySignals';
import { useState } from 'react';

interface SignalCardProps {
  signal: CommunitySignal;
  onSelect?: (signal: CommunitySignal) => void;
  showUserInfo?: boolean;
}

export function SignalCard({ signal, onSelect, showUserInfo = true }: SignalCardProps) {
  const voteMutation = useVoteOnSignal();
  const [userVote, setUserVote] = useState(signal.user_vote || 0);

  const handleVote = async (vote: 1 | -1) => {
    try {
      const newVote = userVote === vote ? 0 : vote;
      await voteMutation.mutateAsync({ signalId: signal.id, vote: newVote as 1 | -1 });
      setUserVote(newVote);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const sideColor = signal.side === 'BUY' ? 'text-emerald-500' : 'text-red-500';
  const sideBg = signal.side === 'BUY' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30';

  return (
    <Card
      className={cn(
        'cursor-pointer transition hover:shadow-lg',
        signal.status === 'CLOSED' && 'opacity-75'
      )}
      onClick={() => onSelect?.(signal)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {signal.symbol}
              <Badge variant="outline" className="text-xs">
                {signal.timeframe}
              </Badge>
              {signal.is_verified_influencer && (
                <Badge className="bg-purple-500/15 text-purple-500 border-purple-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  {signal.influencer_level}
                </Badge>
              )}
              {signal.ai_assisted && (
                <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Verified
                </Badge>
              )}
            </CardTitle>
            {showUserInfo && signal.user_stats && (
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                <span>Win Rate: {signal.user_stats.win_rate.toFixed(1)}%</span>
                <span>•</span>
                <span>Rank: {signal.user_stats.rank}</span>
              </div>
            )}
          </div>
          <div className={cn('px-3 py-1 rounded-full border', sideBg)}>
            {signal.side === 'BUY' ? (
              <TrendingUp className={cn('w-5 h-5', sideColor)} />
            ) : (
              <TrendingDown className={cn('w-5 h-5', sideColor)} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {signal.analysis_text && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {signal.analysis_text}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs">
          {signal.entry_price && (
            <div>
              <span className="text-muted-foreground">دخول:</span>
              <span className="font-semibold ml-1">${signal.entry_price}</span>
            </div>
          )}
          {signal.take_profit && (
            <div>
              <span className="text-muted-foreground">هدف:</span>
              <span className="font-semibold text-emerald-500 ml-1">${signal.take_profit}</span>
            </div>
          )}
          {signal.stop_loss && (
            <div>
              <span className="text-muted-foreground">وقف:</span>
              <span className="font-semibold text-red-500 ml-1">${signal.stop_loss}</span>
            </div>
          )}
        </div>

        {signal.status === 'CLOSED' && signal.result && (
          <div className={cn(
            'px-3 py-2 rounded-lg text-sm font-semibold',
            signal.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-500' :
            signal.result === 'LOSS' ? 'bg-red-500/15 text-red-500' :
            'bg-gray-500/15 text-gray-500'
          )}>
            {signal.result === 'WIN' ? '✅ ربح' : signal.result === 'LOSS' ? '❌ خسارة' : '➖ تعادل'}
            {signal.pnl_percentage !== undefined && (
              <span className="ml-2">
                ({signal.pnl_percentage > 0 ? '+' : ''}{signal.pnl_percentage.toFixed(2)}%)
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2',
                userVote === 1 && 'bg-emerald-500/15 text-emerald-500'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(1);
              }}
              disabled={voteMutation.isPending}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {signal.upvotes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2',
                userVote === -1 && 'bg-red-500/15 text-red-500'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(-1);
              }}
              disabled={voteMutation.isPending}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              {signal.downvotes}
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              {signal.views}
            </div>
          </div>

          {signal.confidence && (
            <Badge variant="outline" className="text-xs">
              {signal.confidence}% ثقة
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

