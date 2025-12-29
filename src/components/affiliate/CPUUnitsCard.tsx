/**
 * CPU Units Card Component
 * 
 * Displays CPU units allocation and vesting
 * 
 * Phase 11A: Influence Economy
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Cpu, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CPUUnit } from '@/services/affiliate/types';
import { calculateVestingProgress, isCPUVested } from '@/services/affiliate/cpuAllocator';
import { useToast } from '@/hooks/use-toast';

interface CPUUnitsCardProps {
  affiliateId: string;
}

export const CPUUnitsCard = ({ affiliateId }: CPUUnitsCardProps) => {
  const { toast } = useToast();
  const [cpuUnits, setCpuUnits] = useState<CPUUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadCPUUnits = useCallback(async () => {
    try {
      // Use type assertion to avoid deep type inference issues
      // The cpu_units table exists but isn't in generated types yet
      const cpuUnitsResult = await (supabase
        .from('cpu_units' as any)
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('allocation_period', { ascending: false }) as any) as { data: CPUUnit[] | null; error: any };

      if (cpuUnitsResult.error) throw cpuUnitsResult.error;
      setCpuUnits(cpuUnitsResult.data || []);
    } catch (error: any) {
      console.error('Error loading CPU units:', error);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    loadCPUUnits();
  }, [loadCPUUnits]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-claim', {
        body: { claimType: 'cpu' },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: `Claimed ${data.claimed_cpu.toFixed(4)} CPU units`,
        });
        loadCPUUnits();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const totalUnits = cpuUnits.reduce((sum, unit) => sum + parseFloat(unit.units.toString()), 0);
  const totalValue = cpuUnits.reduce(
    (sum, unit) => sum + (parseFloat(unit.estimated_value_usd?.toString() || '0')),
    0
  );
  const vestedUnits = cpuUnits.filter(u => isCPUVested(u));
  const claimableUnits = vestedUnits.reduce((sum, unit) => sum + parseFloat(unit.units.toString()), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CPU Units</CardTitle>
            <CardDescription>
              Profit sharing units based on your influence weight
            </CardDescription>
          </div>
          {claimableUnits > 0 && (
            <Button onClick={handleClaim} disabled={claiming} size="sm">
              {claiming ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Claim {claimableUnits.toFixed(4)} CPU
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-2xl font-bold">{totalUnits.toFixed(4)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Estimated Value</p>
            <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Units Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Vesting</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cpuUnits.map((unit) => {
              const progress = calculateVestingProgress(unit);
              const vested = isCPUVested(unit);

              return (
                <TableRow key={unit.id}>
                  <TableCell>
                    {new Date(unit.allocation_period).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {parseFloat(unit.units.toString()).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    ${parseFloat(unit.estimated_value_usd?.toString() || '0').toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2" />
                      <span className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        unit.status === 'claimed'
                          ? 'default'
                          : vested
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {unit.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

