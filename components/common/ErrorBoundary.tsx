// components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
  resetOnChange?: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // Log error to analytics/service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined') {
      window.gtag?.('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (prevProps.resetOnChange !== this.props.resetOnChange) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, className } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Card className={cn('mx-auto max-w-md p-6', className)}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Icon name="AlertTriangle" className="text-destructive" size={24} />
            </div>

            <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {error?.message || 'An unexpected error occurred'}
            </p>

            {retryCount < 3 ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={this.resetErrorBoundary}
                  className="w-full"
                >
                  <Icon name="RefreshCw" className="mr-2" size={16} />
                  Try Again
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Multiple retries failed. Please try reloading the page.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Application
                </Button>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Developer Details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </Card>
      );
    }

    return children;
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error(error);

    // Report to error tracking service
    if (typeof window !== 'undefined') {
      window.gtag?.('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

export default ErrorBoundary;