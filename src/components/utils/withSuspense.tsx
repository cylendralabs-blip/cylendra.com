/**
 * withSuspense Utility
 * 
 * Higher-order component wrapper that adds Suspense boundary
 * Separated from components for Fast Refresh compatibility
 */

import { Suspense, ComponentType } from 'react';
import PageSkeleton from '@/components/loading/PageSkeleton';

export const withSuspense = (Component: ComponentType, fallback?: React.ReactNode) => {
  return (props: any) => (
    <Suspense fallback={fallback || <PageSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};

