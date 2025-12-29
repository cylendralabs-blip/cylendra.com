/**
 * CPU Units Allocator
 * 
 * Allocates CPU (profit sharing) units based on influence weight
 * 
 * Phase 11A: Influence Economy
 */

import { CPUUnit } from './types';

/**
 * Allocate CPU Units
 * 
 * Formula:
 * CPU = (Affiliate Weight / Total Weight Pool) × Total CPU Pool
 */
export function allocateCPUUnits(
  affiliateWeight: number,
  totalWeightPool: number,
  profitPoolUsd: number,
  cpuAllocationPct: number = 0.10 // 10% of profits
): {
  units: number;
  estimatedValueUsd: number;
} {
  if (totalWeightPool === 0 || affiliateWeight === 0) {
    return { units: 0, estimatedValueUsd: 0 };
  }

  // Calculate weight percentage
  const weightPercentage = affiliateWeight / totalWeightPool;

  // Calculate CPU allocation from profit pool
  const cpuPoolUsd = profitPoolUsd * cpuAllocationPct;

  // Allocate units (1 unit = $1 of profit pool)
  const units = weightPercentage * cpuPoolUsd;
  const estimatedValueUsd = units;

  return {
    units: Math.round(units * 10000) / 10000, // 4 decimal places
    estimatedValueUsd: Math.round(estimatedValueUsd * 100) / 100,
  };
}

/**
 * Calculate total CPU value for affiliate
 */
export function calculateTotalCPUValue(
  cpuUnits: CPUUnit[]
): {
  totalUnits: number;
  totalValueUsd: number;
  vestedUnits: number;
  claimedUnits: number;
  pendingUnits: number;
} {
  let totalUnits = 0;
  let totalValueUsd = 0;
  let vestedUnits = 0;
  let claimedUnits = 0;
  let pendingUnits = 0;

  for (const unit of cpuUnits) {
    totalUnits += unit.units;
    totalValueUsd += unit.estimated_value_usd || unit.units;

    switch (unit.status) {
      case 'vested':
        vestedUnits += unit.units;
        break;
      case 'claimed':
        claimedUnits += unit.units;
        break;
      case 'allocated':
        pendingUnits += unit.units;
        break;
    }
  }

  return {
    totalUnits: Math.round(totalUnits * 10000) / 10000,
    totalValueUsd: Math.round(totalValueUsd * 100) / 100,
    vestedUnits: Math.round(vestedUnits * 10000) / 10000,
    claimedUnits: Math.round(claimedUnits * 10000) / 10000,
    pendingUnits: Math.round(pendingUnits * 10000) / 10000,
  };
}

/**
 * Check if CPU units are vested
 */
export function isCPUVested(
  cpuUnit: CPUUnit,
  currentDate: Date = new Date()
): boolean {
  if (cpuUnit.status === 'vested' || cpuUnit.status === 'claimed') {
    return true;
  }

  if (!cpuUnit.vesting_schedule) {
    return false;
  }

  const allocationDate = new Date(cpuUnit.allocation_period);
  const vestingPeriod = cpuUnit.vesting_schedule.period || 365; // Default 1 year
  const vestingDate = new Date(allocationDate);
  vestingDate.setDate(vestingDate.getDate() + vestingPeriod);

  return currentDate >= vestingDate;
}

/**
 * Calculate vesting progress
 */
export function calculateVestingProgress(
  cpuUnit: CPUUnit,
  currentDate: Date = new Date()
): number {
  if (cpuUnit.status === 'vested' || cpuUnit.status === 'claimed') {
    return 100;
  }

  if (!cpuUnit.vesting_schedule) {
    return 0;
  }

  const allocationDate = new Date(cpuUnit.allocation_period);
  const vestingPeriod = cpuUnit.vesting_schedule.period || 365;
  const vestingDate = new Date(allocationDate);
  vestingDate.setDate(vestingDate.getDate() + vestingPeriod);

  const totalDays = vestingPeriod;
  const daysPassed = Math.floor(
    (currentDate.getTime() - allocationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const progress = Math.min((daysPassed / totalDays) * 100, 100);
  return Math.round(progress * 100) / 100;
}

