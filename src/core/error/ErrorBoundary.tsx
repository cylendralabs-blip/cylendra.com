/**
 * Error Boundary Component
 * 
 * Catches React errors and logs them
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 6
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError, logCritical } from '@/services/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to logging service
    logCritical(
      'ui',
      'UI_ERROR',
      `React Error Boundary caught an error: ${error.message}`,
      {
        error: {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        }
      }
    );

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {this.state.error && (
                <div>
                  <p className="font-semibold text-sm mb-1">Error:</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              {this.state.errorInfo && import.meta.env.DEV && (
                <div>
                  <p className="font-semibold text-sm mb-1">Component Stack:</p>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

