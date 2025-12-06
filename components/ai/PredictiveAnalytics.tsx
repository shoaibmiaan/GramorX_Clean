// components/ai/PredictiveAnalytics.tsx
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';
import { Progress } from '@/components/design-system/Progress';
import { Skeleton } from '@/components/design-system/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/design-system/Tabs';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/design-system/Tooltip';
import { cn } from '@/lib/utils';
import { formatBandScore } from '@/lib/utils/bandScore';
import { formatDate } from '@/lib/utils/date';

const PredictionChart = dynamic(
  () =>
    import('@/components/charts/PredictionChart').then(
      (mod: any) => mod.PredictionChart ?? mod.default
    ),
  { loading: () => <Skeleton className="h-[300px] w-full" />, ssr: false }
);

interface PredictiveAnalyticsProps {
  userId?: string;
  showDetailed?: boolean;
  className?: string;
}

interface PredictionData {
  currentBand: number;
  predictedBand: number;
  confidence: number;
  targetDate: string;
  improvementRate: number;
  keyFactors: {
    factor: string;
    impact: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: number;
    actionItems: string[];
  }>;
  milestonePredictions: Array<{
    date: string;
    predictedBand: number;
    confidence: number;
  }>;
}

// 🔹 Used only when API fails AND you still want the UI to preview in dev
const MOCK_PREDICTION_DATA: PredictionData = {
  currentBand: 6.5,
  predictedBand: 7.0,
  confidence: 85,
  targetDate: '2024-12-15',
  improvementRate: 12.5,
  keyFactors: [
    { factor: 'Reading Comprehension', impact: 25, trend: 'improving' },
    { factor: 'Writing Task Response', impact: 20, trend: 'stable' },
    { factor: 'Speaking Fluency', impact: 18, trend: 'improving' },
    { factor: 'Listening Accuracy', impact: 15, trend: 'declining' },
    { factor: 'Time Management', impact: 22, trend: 'stable' },
  ],
  recommendations: [
    {
      id: '1',
      title: 'Focus on Listening Section',
      description: 'Improve listening accuracy with targeted practice',
      priority: 'high',
      estimatedImpact: 15,
      actionItems: [
        'Complete 5 listening practice tests',
        'Review missed questions with transcripts',
        'Practice with different accents',
      ],
    },
    {
      id: '2',
      title: 'Writing Task Structure',
      description: 'Improve essay organization and coherence',
      priority: 'medium',
      estimatedImpact: 10,
      actionItems: [
        'Study model essays',
        'Practice planning essays in 5 minutes',
        'Get AI feedback on structure',
      ],
    },
  ],
  milestonePredictions: [
    { date: '2024-11-01', predictedBand: 6.7, confidence: 80 },
    { date: '2024-12-01', predictedBand: 6.9, confidence: 82 },
    { date: '2024-12-15', predictedBand: 7.0, confidence: 85 },
    { date: '2025-01-01', predictedBand: 7.2, confidence: 78 },
  ],
};

const calculateTimeToTarget = (targetDate: string | null | undefined) => {
  if (!targetDate) return 0;
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  if (Number.isNaN(diffTime)) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export function PredictiveAnalytics({
  userId,
  showDetailed = false,
  className,
}: PredictiveAnalyticsProps) {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔌 Fetch real prediction data from API
  useEffect(() => {
    // No user -> show clear error, no fake data
    if (!userId) {
      setPredictionData(null);
      setError('Sign in to view AI-powered band predictions.');
      return;
    }

    let isMounted = true;
    const fetchPrediction = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/ai/predict-band?userId=${encodeURIComponent(userId)}`);

        if (!res.ok) {
          throw new Error(`Prediction API error: ${res.status}`);
        }

        const data = (await res.json()) as PredictionData;

        if (!isMounted) return;

        // Very basic runtime validation
        if (!data || typeof data.currentBand !== 'number') {
          throw new Error('Invalid prediction payload');
        }

        setPredictionData(data);
      } catch (err) {
        console.error('PredictiveAnalytics fetch failed:', err);
        if (!isMounted) return;
        setPredictionData(null);
        setError(
          'We could not load your predictive analytics right now. Please try again later.'
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPrediction();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 🔻 COMPACT CARD MODE (e.g. sidebar tile)
  if (!showDetailed) {
    if (isLoading && !predictionData) {
      return (
        <Card className={cn('p-5', className)}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="mt-4 h-2 w-full" />
        </Card>
      );
    }

    if (!predictionData || error) {
      return (
        <Card className={cn('p-5', className)}>
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" className="text-warning" size={20} />
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Predictions unavailable</h3>
              <p className="text-xs text-muted-foreground">
                {error ||
                  'We could not load your AI predictions. Complete at least one full mock to unlock this view.'}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    const timeToTarget = calculateTimeToTarget(predictionData.targetDate);

    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="Brain" className="text-primary" size={20} />
              <h3 className="font-semibold">AI Predictions</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your current performance
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30">
            {predictionData.confidence}% Confidence
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Band</p>
            <p className="text-2xl font-bold">
              {formatBandScore(predictionData.currentBand)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Predicted Band</p>
            <p className="text-2xl font-bold text-primary">
              {formatBandScore(predictionData.predictedBand)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span>Progress to Target</span>
            <span>{timeToTarget} days remaining</span>
          </div>
          <Progress value={predictionData.confidence} className="mt-1 h-2" />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full"
          onClick={() => {
            // parent controls showDetailed; here we just fire a custom event
            window.dispatchEvent(
              new CustomEvent('mock-dashboard:open-predictions', {
                detail: { source: 'compact-card' },
              })
            );
          }}
        >
          View Detailed Analysis
        </Button>
      </Card>
    );
  }

  // 🔻 DETAILED DASHBOARD MODE

  if (isLoading && !predictionData) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  if (!predictionData || error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <Icon name="AlertTriangle" className="mx-auto text-warning" size={32} />
        <h3 className="mt-3 text-lg font-semibold">Prediction data unavailable</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          {error ||
            'We could not load your AI-powered prediction data. Make sure you are signed in and have completed at least one mock test, then try again.'}
        </p>
      </Card>
    );
  }

  const timeToTarget = calculateTimeToTarget(predictionData.targetDate);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered insights into your IELTS performance trajectory
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30">
          <Icon name="Shield" className="mr-2" size={14} />
          Model Accuracy: 92%
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="factors">Key Factors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 text-lg font-semibold">Band Score Prediction</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-3xl font-bold">
                      {formatBandScore(predictionData.currentBand)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-4">
                    <p className="text-sm text-primary">Predicted</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatBandScore(predictionData.predictedBand)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Level</span>
                    <span className="font-medium">{predictionData.confidence}%</span>
                  </div>
                  <Progress value={predictionData.confidence} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Improvement Rate</span>
                    <span className="font-medium text-success">
                      +{predictionData.improvementRate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on your recent mock performance trend
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 text-lg font-semibold">Target Timeline</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Target Date</span>
                    <Badge variant="outline">
                      {formatDate(predictionData.targetDate)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Days Remaining</span>
                    <span className="font-medium">{timeToTarget} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily Improvement Needed</span>
                    <span className="font-medium">
                      +
                      {timeToTarget > 0
                        ? (
                            (predictionData.predictedBand - predictionData.currentBand) /
                            timeToTarget
                          ).toFixed(3)
                        : '0.000'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                  <div className="flex items-center gap-2">
                    <Icon name="Lightbulb" className="text-primary" size={16} />
                    <p className="text-sm font-medium">AI Insight</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Based on your current trajectory, you're on track to achieve your
                    target band score. Focus on listening and writing practice to
                    accelerate progress.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-4 text-lg font-semibold">Prediction Chart</h3>
            <PredictionChart
              data={predictionData.milestonePredictions}
              height={250}
            />
          </Card>
        </TabsContent>

        {/* Key Factors Tab */}
        <TabsContent value="factors">
          <Card className="p-5">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Key Performance Factors</h3>
              <p className="text-sm text-muted-foreground">
                Factors influencing your predicted band score
              </p>
            </div>

            <div className="space-y-4">
              {predictionData.keyFactors.map((factor, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          factor.trend === 'improving'
                            ? 'bg-success/10'
                            : factor.trend === 'stable'
                            ? 'bg-warning/10'
                            : 'bg-destructive/10'
                        )}
                      >
                        <Icon
                          name={
                            factor.trend === 'improving'
                              ? 'TrendingUp'
                              : factor.trend === 'stable'
                              ? 'Minus'
                              : 'TrendingDown'
                          }
                          className={cn(
                            factor.trend === 'improving'
                              ? 'text-success'
                              : factor.trend === 'stable'
                              ? 'text-warning'
                              : 'text-destructive'
                          )}
                          size={20}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{factor.factor}</h4>
                        <p className="text-sm text-muted-foreground">
                          Impact: {factor.impact}% on overall score
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        factor.trend === 'improving'
                          ? 'success'
                          : factor.trend === 'stable'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {factor.trend.charAt(0).toUpperCase() + factor.trend.slice(1)}
                    </Badge>
                  </div>
                  <Progress value={factor.impact} className="mt-3 h-2" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card className="p-5">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Actionable steps to improve your predicted band score
              </p>
            </div>

            <div className="space-y-4">
              {predictionData.recommendations.map((rec) => (
                <Card key={rec.id} className="overflow-hidden">
                  <div className="border-l-4 border-l-primary bg-primary/5 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              rec.priority === 'high'
                                ? 'destructive'
                                : rec.priority === 'medium'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {rec.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Estimated impact: +{rec.estimatedImpact}% on band score
                          </span>
                        </div>

                        <h4 className="mt-2 text-lg font-semibold">{rec.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {rec.description}
                        </p>

                        <div className="mt-4">
                          <p className="text-sm font-medium">Action Items:</p>
                          <ul className="mt-2 space-y-2">
                            {rec.actionItems.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Icon
                                  name="CheckCircle"
                                  className="text-success"
                                  size={14}
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icon name="PlayCircle" size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start this recommendation</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="p-5">
            <h3 className="mb-4 text-lg font-semibold">Prediction Timeline</h3>
            <div className="space-y-6">
              {predictionData.milestonePredictions.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        milestone.confidence >= 80
                          ? 'bg-success/10'
                          : milestone.confidence >= 70
                          ? 'bg-warning/10'
                          : 'bg-destructive/10'
                      )}
                    >
                      <span className="font-bold">
                        {formatBandScore(milestone.predictedBand)}
                      </span>
                    </div>
                    {index <
                      predictionData.milestonePredictions.length - 1 && (
                      <div className="mt-2 h-8 w-0.5 bg-border" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {formatDate(milestone.date)}
                      </h4>
                      <Badge
                        variant={
                          milestone.confidence >= 80
                            ? 'success'
                            : milestone.confidence >= 70
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {milestone.confidence}% Confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Predicted band score:{' '}
                      {formatBandScore(milestone.predictedBand)}
                    </p>
                    <Progress value={milestone.confidence} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PredictiveAnalytics;
