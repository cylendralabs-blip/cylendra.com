import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface SignalFiltersState {
  symbol: string;
  timeframe: string;
  side: 'ALL' | 'BUY' | 'SELL' | 'WAIT';
  minConfidence: number;
  strongOnly: boolean;
}

interface SignalFiltersProps {
  filters: SignalFiltersState;
  onChange: (filters: SignalFiltersState) => void;
  onReset?: () => void;
  availableSymbols: string[];
  availableTimeframes: string[];
  showDateRange?: boolean;
  onDateRangeChange?: (start?: string, end?: string) => void;
  dateRange?: { start?: string; end?: string };
}

export const SignalFilters = ({
  filters,
  onChange,
  onReset,
  availableSymbols,
  availableTimeframes,
  showDateRange = false,
  onDateRangeChange,
  dateRange
}: SignalFiltersProps) => {
  const { t } = useTranslation('ultra_signals');
  const symbolOptions = useMemo(() => ['ALL', ...availableSymbols], [availableSymbols]);
  const timeframeOptions = useMemo(
    () => ['ALL', ...availableTimeframes],
    [availableTimeframes]
  );

  const handleUpdate = (patch: Partial<SignalFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <Card className="p-4 border border-border/60 bg-muted/40 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col space-y-2">
          <Label>{t('common.filters.symbol')}</Label>
          <Select
            value={filters.symbol}
            onValueChange={(value) => handleUpdate({ symbol: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('common.filters.all_symbols')} />
            </SelectTrigger>
            <SelectContent>
              {symbolOptions.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol === 'ALL' ? t('common.filters.all_symbols') : symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label>{t('common.filters.timeframe')}</Label>
          <Select
            value={filters.timeframe}
            onValueChange={(value) => handleUpdate({ timeframe: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('common.filters.all_timeframes')} />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf === 'ALL' ? t('common.filters.all_timeframes') : tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label>{t('common.filters.side')}</Label>
          <Select
            value={filters.side}
            onValueChange={(value: SignalFiltersState['side']) => handleUpdate({ side: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('common.filters.all_sides')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('common.filters.all_sides')}</SelectItem>
              <SelectItem value="BUY">{t('common.filters.buy')}</SelectItem>
              <SelectItem value="SELL">{t('common.filters.sell')}</SelectItem>
              <SelectItem value="WAIT">{t('common.filters.wait')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label>{t('common.filters.min_confidence')} (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.minConfidence}
            onChange={(event) =>
              handleUpdate({ minConfidence: Number(event.target.value) || 0 })
            }
          />
        </div>
      </div>

      {showDateRange && (
        <>
          <Separator className="my-4" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col space-y-2">
              <Label>{t('common.filters.start_date')}</Label>
              <Input
                type="date"
                value={dateRange?.start || ''}
                onChange={(e) => onDateRangeChange?.(e.target.value || undefined, dateRange?.end)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>{t('common.filters.end_date')}</Label>
              <Input
                type="date"
                value={dateRange?.end || ''}
                onChange={(e) => onDateRangeChange?.(dateRange?.start, e.target.value || undefined)}
              />
            </div>
          </div>
        </>
      )}

      <Separator className="my-4" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            checked={filters.strongOnly}
            onCheckedChange={(checked) => handleUpdate({ strongOnly: checked })}
            id="strong-signals"
          />
          <Label htmlFor="strong-signals">{t('common.filters.strong_only')}</Label>
        </div>

        <div className="flex gap-2 justify-end">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              {t('common.filters.reset')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

