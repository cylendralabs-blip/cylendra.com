/**
 * Export Service
 * 
 * Phase Admin C: Export analytics data to CSV/PDF
 */

import { BusinessKPIs } from './BusinessAnalyticsService';
import { RevenueMetrics } from './RevenueAnalyticsService';
import { FeatureUsageStats } from './FeatureUsageService';
import { FunnelStage } from './UserFunnelService';
import { CohortData } from './CohortAnalysisService';

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: any[],
  filename: string,
  headers?: string[]
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        // Escape commas and quotes
        const stringValue = String(value || '');
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export Business KPIs to CSV
 */
export function exportBusinessKPIsToCSV(kpis: BusinessKPIs): void {
  const data = [
    {
      'Metric': 'Total Users',
      'Value': kpis.totalUsers,
    },
    {
      'Metric': 'Active Users (24h)',
      'Value': kpis.activeUsers24h,
    },
    {
      'Metric': 'Active Users (7d)',
      'Value': kpis.activeUsers7d,
    },
    {
      'Metric': 'Active Users (30d)',
      'Value': kpis.activeUsers30d,
    },
    {
      'Metric': 'New Users Today',
      'Value': kpis.newUsersToday,
    },
    {
      'Metric': 'New Users This Month',
      'Value': kpis.newUsersThisMonth,
    },
    {
      'Metric': 'User Growth Rate (%)',
      'Value': kpis.userGrowthRate.toFixed(2),
    },
    {
      'Metric': 'Retention Rate 7d (%)',
      'Value': kpis.retentionRate7d.toFixed(2),
    },
    {
      'Metric': 'Retention Rate 30d (%)',
      'Value': kpis.retentionRate30d.toFixed(2),
    },
    {
      'Metric': 'Churn Rate (%)',
      'Value': kpis.churnRate.toFixed(2),
    },
    {
      'Metric': 'Conversion Rate Free to Paid (%)',
      'Value': kpis.conversionRateFreeToPaid.toFixed(2),
    },
  ];

  exportToCSV(data, 'business_kpis', ['Metric', 'Value']);
}

/**
 * Export Revenue Metrics to CSV
 */
export function exportRevenueMetricsToCSV(metrics: RevenueMetrics): void {
  const data = [
    {
      'Metric': 'MRR',
      'Value': metrics.mrr,
    },
    {
      'Metric': 'ARR',
      'Value': metrics.arr,
    },
    {
      'Metric': 'ARPU',
      'Value': metrics.arpu,
    },
    {
      'Metric': 'LTV',
      'Value': metrics.ltv,
    },
    {
      'Metric': 'New Revenue',
      'Value': metrics.newRevenue,
    },
    {
      'Metric': 'Churned Revenue',
      'Value': metrics.churnedRevenue,
    },
    {
      'Metric': 'Projected Revenue Growth (%)',
      'Value': metrics.projectedRevenueGrowth.toFixed(2),
    },
  ];

  exportToCSV(data, 'revenue_metrics', ['Metric', 'Value']);
}

/**
 * Export Feature Usage to CSV
 */
export function exportFeatureUsageToCSV(stats: FeatureUsageStats[]): void {
  const data = stats.map(stat => ({
    'Feature': stat.featureKey,
    'Total Usage': stat.totalUsage,
    'Unique Users': stat.uniqueUsers,
    'Last Used': stat.lastUsedAt ? new Date(stat.lastUsedAt).toLocaleDateString() : 'N/A',
  }));

  exportToCSV(data, 'feature_usage', ['Feature', 'Total Usage', 'Unique Users', 'Last Used']);
}

/**
 * Export Funnel Stages to CSV
 */
export function exportFunnelStagesToCSV(stages: FunnelStage[]): void {
  const data = stages.map(stage => ({
    'Stage': stage.stage,
    'Count': stage.count,
    'Percentage (%)': stage.percentage.toFixed(2),
    'Drop-off Rate (%)': stage.dropOffRate.toFixed(2),
  }));

  exportToCSV(data, 'user_funnel', ['Stage', 'Count', 'Percentage (%)', 'Drop-off Rate (%)']);
}

/**
 * Export Cohort Analysis to CSV
 */
export function exportCohortAnalysisToCSV(cohorts: CohortData[]): void {
  const data = cohorts.map(cohort => ({
    'Cohort Month': cohort.cohortMonth,
    'Total Users': cohort.totalUsers,
    'ARPU': cohort.arpu,
    'Conversion Rate (%)': cohort.conversionRate.toFixed(2),
    'Churn Rate (%)': cohort.churnRate.toFixed(2),
    'Retention Data': JSON.stringify(cohort.retentionByMonth),
  }));

  exportToCSV(data, 'cohort_analysis', ['Cohort Month', 'Total Users', 'ARPU', 'Conversion Rate (%)', 'Churn Rate (%)', 'Retention Data']);
}

/**
 * Export all analytics to a single CSV file
 */
export function exportAllAnalyticsToCSV(
  kpis: BusinessKPIs | null,
  revenue: RevenueMetrics | null,
  features: FeatureUsageStats[],
  funnel: FunnelStage[],
  cohorts: CohortData[]
): void {
  const allData: any[] = [];

  // Add KPIs
  if (kpis) {
    allData.push({ Section: 'Business KPIs', Metric: 'Total Users', Value: kpis.totalUsers });
    allData.push({ Section: 'Business KPIs', Metric: 'Active Users (30d)', Value: kpis.activeUsers30d });
    allData.push({ Section: 'Business KPIs', Metric: 'Growth Rate (%)', Value: kpis.userGrowthRate.toFixed(2) });
  }

  // Add Revenue
  if (revenue) {
    allData.push({ Section: 'Revenue', Metric: 'MRR', Value: revenue.mrr });
    allData.push({ Section: 'Revenue', Metric: 'ARR', Value: revenue.arr });
    allData.push({ Section: 'Revenue', Metric: 'ARPU', Value: revenue.arpu });
  }

  // Add Features
  features.forEach(stat => {
    allData.push({
      Section: 'Feature Usage',
      Metric: stat.featureKey,
      Value: stat.totalUsage,
    });
  });

  // Add Funnel
  funnel.forEach(stage => {
    allData.push({
      Section: 'User Funnel',
      Metric: stage.stage,
      Value: stage.count,
    });
  });

  exportToCSV(allData, 'all_analytics', ['Section', 'Metric', 'Value']);
}

