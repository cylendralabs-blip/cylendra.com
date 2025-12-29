/**
 * AI Settings Suggestion Card
 * 
 * Shows AI-suggested settings changes with comparison and apply/reject flow
 * 
 * Phase 11: AI Assistant Integration - Task 9
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { AISuggestion } from '@/services/ai/types';
import { BotSettingsForm } from '@/core/config';
import { validateAISuggestion } from '@/services/ai/guardrails';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AiSettingsSuggestionCardProps {
  suggestions: AISuggestion[];
  currentSettings: Partial<BotSettingsForm>;
  onApply: (appliedSettings: Partial<BotSettingsForm>) => void;
  onReject?: () => void;
}

export const AiSettingsSuggestionCard = ({
  suggestions,
  currentSettings,
  onApply,
  onReject,
}: AiSettingsSuggestionCardProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const settingChanges = suggestions
    .filter((s) => s.type === 'setting_change' && s.data)
    .map((suggestion, idx) => {
      const { setting, suggested, current } = suggestion.data!;
      const validation = validateAISuggestion(suggestion, currentSettings);

      return {
        index: idx,
        suggestion,
        setting,
        current,
        suggested,
        validation,
      };
    });

  const handleApply = () => {
    const changesToApply: Partial<BotSettingsForm> = {};

    selectedSuggestions.forEach((idx) => {
      const change = settingChanges[idx];
      if (change && change.validation.valid) {
        // Type assertion needed because change.suggested is any and TypeScript
        // can't verify it matches the property type at this key
        (changesToApply as any)[change.setting as keyof BotSettingsForm] = change.suggested;
      }
    });

    if (Object.keys(changesToApply).length === 0) {
      toast({
        title: 'No Changes Selected',
        description: 'Please select at least one setting change to apply.',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation
    setIsOpen(true);
  };

  const handleConfirmApply = () => {
    const changesToApply: Partial<BotSettingsForm> = {};

    selectedSuggestions.forEach((idx) => {
      const change = settingChanges[idx];
      if (change && change.validation.valid) {
        // Type assertion needed because change.suggested is any and TypeScript
        // can't verify it matches the property type at this key
        (changesToApply as any)[change.setting as keyof BotSettingsForm] = change.suggested;
      }
    });

    onApply(changesToApply);
    setIsOpen(false);
    setSelectedSuggestions(new Set());

    toast({
      title: 'Settings Applied',
      description: 'AI suggested settings have been applied successfully.',
    });
  };

  const handleReject = () => {
    setSelectedSuggestions(new Set());
    if (onReject) {
      onReject();
    }
    toast({
      title: 'Suggestions Rejected',
      description: 'AI suggestions have been dismissed.',
    });
  };

  const toggleSuggestion = (idx: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      const change = settingChanges[idx];
      if (change && change.validation.valid) {
        newSelected.add(idx);
      } else {
        toast({
          title: 'Invalid Suggestion',
          description: change?.validation.error || 'This suggestion is not valid.',
          variant: 'destructive',
        });
      }
    }
    setSelectedSuggestions(newSelected);
  };

  const getSettingLabel = (setting: string): string => {
    const labels: Record<string, string> = {
      risk_percentage: 'Risk Percentage',
      leverage: 'Leverage',
      max_active_trades: 'Max Active Trades',
      dca_levels: 'DCA Levels',
      take_profit_percentage: 'Take Profit %',
      stop_loss_percentage: 'Stop Loss %',
      max_daily_loss_pct: 'Daily Loss Limit %',
      max_drawdown_pct: 'Max Drawdown %',
    };
    return labels[setting] || setting;
  };

  if (settingChanges.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Suggested Settings
            </CardTitle>
            <CardDescription>
              Review and apply AI-recommended settings improvements
            </CardDescription>
          </div>
          <Badge variant="outline">{settingChanges.length} suggestions</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Setting</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Suggested</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settingChanges.map((change, idx) => {
                const isSelected = selectedSuggestions.has(idx);
                const isInvalid = !change.validation.valid;

                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      isSelected && 'bg-primary/10',
                      isInvalid && 'opacity-50'
                    )}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSuggestion(idx)}
                        disabled={isInvalid}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {getSettingLabel(change.setting)}
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof change.current === 'number'
                        ? change.current.toFixed(2)
                        : String(change.current)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {typeof change.suggested === 'number'
                        ? change.suggested.toFixed(2)
                        : String(change.suggested)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isInvalid ? (
                        <Badge variant="destructive" className="text-xs">
                          Invalid
                        </Badge>
                      ) : change.validation.warning ? (
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Valid
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Warnings */}
        {settingChanges.some((c) => c.validation.warning) && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                {settingChanges
                  .filter((c) => c.validation.warning)
                  .map((c) => c.validation.warning)
                  .join(' ')}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={handleReject}>
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss All
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedSuggestions.size === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Apply Selected ({selectedSuggestions.size})
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Settings Changes</DialogTitle>
              <DialogDescription>
                You are about to apply {selectedSuggestions.size} AI-suggested setting changes.
                Review them carefully before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(selectedSuggestions).map((idx) => {
                const change = settingChanges[idx];
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{getSettingLabel(change.setting)}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{String(change.current)}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-semibold text-primary">
                        {String(change.suggested)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  Make sure to test these settings in paper trading mode before going live.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmApply}>
                Confirm & Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

