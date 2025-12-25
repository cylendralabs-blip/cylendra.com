/**
 * Smart Tape Component (Orderflow-like Feed)
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveAISignals } from '@/hooks/useLiveAISignals';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function SmartTape() {
  const { t, i18n } = useTranslation('ai_live');
  const { signals } = useLiveAISignals({ maxSignals: 100 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tape.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            <div className="grid grid-cols-6 gap-2 p-2 text-xs font-semibold text-muted-foreground border-b sticky top-0 bg-background z-10">
              <div>{t('tape.time')}</div>
              <div>{t('tape.symbol')}</div>
              <div>{t('tape.side')}</div>
              <div>{t('tape.price')}</div>
              <div>{t('tape.strength')}</div>
              <div>{t('tape.indicators')}</div>
            </div>
            {signals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('feed.no_signals')}
              </div>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    'grid grid-cols-6 gap-2 p-2 text-xs rounded transition-colors hover:bg-muted/50',
                    signal.side === 'BUY' ? 'bg-green-500/5' :
                      signal.side === 'SELL' ? 'bg-red-500/5' :
                        'bg-gray-500/5'
                  )}
                >
                  <div className="text-muted-foreground">
                    {format(new Date(signal.timestamp), 'HH:mm:ss')}
                  </div>
                  <div className="font-semibold">{signal.symbol}</div>
                  <div className={cn(
                    'flex items-center gap-1',
                    signal.side === 'BUY' ? 'text-green-500' :
                      signal.side === 'SELL' ? 'text-red-500' :
                        'text-gray-500'
                  )}>
                    {signal.side === 'BUY' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : signal.side === 'SELL' ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : null}
                    {signal.side === 'BUY' ? t('filters.buy') : signal.side === 'SELL' ? t('filters.sell') : signal.side}
                  </div>
                  <div className="font-mono">
                    {signal.entryPrice ? `$${signal.entryPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : '-'}
                  </div>
                  <div className={cn(
                    'font-semibold',
                    signal.strength === 'STRONG' ? 'text-emerald-400' :
                      signal.strength === 'MODERATE' ? 'text-yellow-400' :
                        'text-gray-400'
                  )}>
                    {signal.strength === 'STRONG' ? t('feed.strong') :
                      signal.strength === 'MODERATE' ? t('feed.moderate') :
                        t('feed.weak')}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-purple-400">{signal.aiScore}</span>
                    <span className="text-blue-400">{signal.technicalScore}</span>
                    <span className="text-orange-400">{signal.volumeScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

