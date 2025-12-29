
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Trash2,
  Play,
  BarChart3
} from 'lucide-react';
import { TradingViewSignal } from '@/types/tradingview';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface TradingViewSignalsTableProps {
  signals: TradingViewSignal[];
  onSignalExecution: (signal: TradingViewSignal) => void;
  onDeleteSignal: (signalId: string) => void;
  isLoading?: boolean;
}

const TradingViewSignalsTable = ({
  signals,
  onSignalExecution,
  onDeleteSignal,
  isLoading
}: TradingViewSignalsTableProps) => {
  const { t, i18n } = useTranslation('tradingview');
  const isMobile = useIsMobile();
  const currentLocale = i18n.language === 'ar' ? ar : enUS;

  const getSignalIcon = (signalType: string) => {
    return signalType.includes('BUY') ?
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getSignalBadgeVariant = (signalType: string) => {
    if (signalType.includes('STRONG_BUY')) return 'default';
    if (signalType.includes('BUY')) return 'secondary';
    if (signalType.includes('STRONG_SELL')) return 'destructive';
    return 'outline';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': { variant: 'default' as const, text: t('table.status.active') },
      'TRIGGERED': { variant: 'secondary' as const, text: t('table.status.triggered') },
      'EXPIRED': { variant: 'outline' as const, text: t('table.status.expired') },
      'CANCELLED': { variant: 'destructive' as const, text: t('table.status.cancelled') },
    };
    return variants[status as keyof typeof variants] || { variant: 'default' as const, text: t('table.status.active') };
  };

  const getStrengthColor = (strength: string) => {
    const colors = {
      'WEAK': 'text-gray-500',
      'MODERATE': 'text-blue-500',
      'STRONG': 'text-orange-500',
      'VERY_STRONG': 'text-red-500',
      'EXCEPTIONAL': 'text-purple-500',
    };
    return colors[strength as keyof typeof colors] || colors.MODERATE;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('table.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">{t('table.no_signals')}</h3>
          <p className="text-muted-foreground">
            {t('table.no_signals_desc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {signals.map((signal) => (
          <Card key={signal.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                {getSignalIcon(signal.signal_type)}
                <span className="font-bold text-lg">{signal.symbol}</span>
                <Badge variant={getSignalBadgeVariant(signal.signal_type)}>
                  {signal.signal_type}
                </Badge>
              </div>
              <Badge variant={getStatusBadge(signal.status).variant}>
                {getStatusBadge(signal.status).text}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">{t('table.columns.price')}:</span>
                <div className="font-medium">${signal.entry_price.toFixed(4)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('table.columns.confidence')}:</span>
                <div className="font-medium">{signal.confidence_score.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('table.columns.strategy')}:</span>
                <div className="font-medium">{signal.strategy_name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('table.columns.timeframe')}:</span>
                <div className="font-medium">{signal.timeframe}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(signal.created_at), {
                  addSuffix: true,
                  locale: currentLocale
                })}
              </span>
              <div className="flex space-x-2 space-x-reverse">
                {signal.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    onClick={() => onSignalExecution(signal)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {t('table.actions.execute')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteSignal(signal.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>{t('table.title')}</span>
        </CardTitle>
        <CardDescription>
          {t('table.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.columns.symbol')}</TableHead>
              <TableHead>{t('table.columns.type')}</TableHead>
              <TableHead>{t('table.columns.price')}</TableHead>
              <TableHead>{t('table.columns.stop_loss')}</TableHead>
              <TableHead>{t('table.columns.take_profit')}</TableHead>
              <TableHead>{t('table.columns.confidence')}</TableHead>
              <TableHead>{t('table.columns.strength')}</TableHead>
              <TableHead>{t('table.columns.strategy')}</TableHead>
              <TableHead>{t('table.columns.timeframe')}</TableHead>
              <TableHead>{t('table.columns.status')}</TableHead>
              <TableHead>{t('table.columns.time')}</TableHead>
              <TableHead>{t('table.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getSignalIcon(signal.signal_type)}
                    <span className="font-medium">{signal.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getSignalBadgeVariant(signal.signal_type)}>
                    {signal.signal_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  ${signal.entry_price.toFixed(4)}
                </TableCell>
                <TableCell className="font-mono">
                  {signal.stop_loss_price ? (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Shield className="w-3 h-3 text-red-500" />
                      <span>${signal.stop_loss_price.toFixed(4)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {signal.take_profit_price ? (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Target className="w-3 h-3 text-green-500" />
                      <span>${signal.take_profit_price.toFixed(4)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <div className={`w-2 h-2 rounded-full ${signal.confidence_score >= 80 ? 'bg-green-500' :
                      signal.confidence_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    <span>{signal.confidence_score.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${getStrengthColor(signal.signal_strength)}`}>
                    {signal.signal_strength}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{signal.strategy_name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{signal.timeframe}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadge(signal.status).variant}>
                    {getStatusBadge(signal.status).text}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(signal.created_at), {
                        addSuffix: true,
                        locale: currentLocale
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {signal.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        onClick={() => onSignalExecution(signal)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {t('table.actions.execute')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteSignal(signal.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TradingViewSignalsTable;
