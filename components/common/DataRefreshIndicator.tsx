// components/common/DataRefreshIndicator.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/design-system/Tooltip';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/date';

interface DataRefreshIndicatorProps {
  isRefreshing?: boolean;
  lastUpdated?: string | Date;
  onRefresh?: () => void | Promise<void>;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  showLastUpdated?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DataRefreshIndicator({
  isRefreshing = false,
  lastUpdated,
  onRefresh,
  refreshInterval = 30000, // 30 seconds
  autoRefresh = false,
  showLastUpdated = true,
  className,
  size = 'md',
}: DataRefreshIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [refreshCount, setRefreshCount] = useState(0);

  // Update time since last update
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeDisplay = () => {
      setTimeSinceUpdate(formatTimeAgo(lastUpdated));
    };

    updateTimeDisplay();
    const interval = setInterval(updateTimeDisplay, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefreshEnabled || !onRefresh) return;

    const interval = setInterval(async () => {
      if (!isRefreshing) {
        try {
          await onRefresh();
          setRefreshCount((prev) => prev + 1);
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, onRefresh, isRefreshing]);

  const handleManualRefresh = async () => {
    if (isRefreshing || !onRefresh) return;

    try {
      await onRefresh();
      setRefreshCount((prev) => prev + 1);
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLastUpdated && lastUpdated && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default text-xs text-muted-foreground">
              {isRefreshing ? 'Updating...' : `Updated ${timeSinceUpdate}`}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </TooltipContent>
        </Tooltip>
      )}

      {onRefresh && (
        <>
          <Button
            variant="ghost"
            size={size}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={cn('gap-2', sizeClasses[size])}
          >
            <Icon
              name={isRefreshing ? 'Loader' : 'RefreshCw'}
              className={cn(isRefreshing && 'animate-spin')}
              size={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
            />
            <span className={size === 'sm' ? 'hidden sm:inline' : 'inline'}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </Button>

          {autoRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={cn(
                    'h-8 w-8',
                    autoRefreshEnabled && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon
                    name={autoRefreshEnabled ? 'Zap' : 'ZapOff'}
                    size={14}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {autoRefreshEnabled
                  ? 'Auto-refresh enabled'
                  : 'Auto-refresh disabled'}
              </TooltipContent>
            </Tooltip>
          )}

          {refreshCount > 0 && (
            <span className="text-xs text-muted-foreground">
              • {refreshCount} refresh{refreshCount !== 1 ? 'es' : ''}
            </span>
          )}
        </>
      )}

      {isRefreshing && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-ping rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Syncing data...</span>
        </div>
      )}
    </div>
  );
}

// Standalone auto-refresh component
export function AutoRefreshController({
  interval = 30000,
  onRefresh,
  enabled = true,
}: {
  interval?: number;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !onRefresh) return;

    const refreshData = async () => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        await onRefresh();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial refresh
    refreshData();

    // Set up interval
    const intervalId = setInterval(refreshData, interval);

    return () => clearInterval(intervalId);
  }, [interval, onRefresh, enabled, isLoading]);

  return null;
}

export default DataRefreshIndicator;
