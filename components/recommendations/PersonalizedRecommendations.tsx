// components/recommendations/PersonalizedRecommendations.tsx
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';
import { Progress } from '@/components/design-system/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/design-system/Tabs';
import { Tooltip } from '@/components/design-system/Tooltip';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils/date';

interface PersonalizedRecommendationsProps {
  recommendations?: Recommendation[];
  performance?: ModulePerformance[];
  className?: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'mock' | 'study' | 'practice' | 'review';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  impactScore: number; // 1-100
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed?: boolean;
  progress?: number; // 0-100
  actionItems: string[];
  relatedSkills: string[];
  aiGenerated?: boolean;
}

interface ModulePerformance {
  module: string;
  band: number;
  target: number;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    title: 'Complete Listening Mock Test',
    description: 'Focus on Section 3 conversations with multiple speakers',
    type: 'mock',
    priority: 'high',
    estimatedTime: 40,
    impactScore: 85,
    difficulty: 'intermediate',
    progress: 0,
    actionItems: [
      'Take the test under timed conditions',
      'Review incorrect answers with transcripts',
      'Practice identifying speaker attitudes',
    ],
    relatedSkills: ['listening', 'comprehension', 'note-taking'],
    aiGenerated: true,
  },
  {
    id: '2',
    title: 'Writing Task 2 Structure Practice',
    description: 'Improve essay organization with AI feedback',
    type: 'practice',
    priority: 'high',
    estimatedTime: 30,
    impactScore: 90,
    difficulty: 'intermediate',
    progress: 30,
    actionItems: [
      'Write 3 practice essays with clear thesis statements',
      'Use the AI writing assistant for structure feedback',
      'Review model essays for comparison',
    ],
    relatedSkills: ['writing', 'organization', 'coherence'],
    aiGenerated: true,
  },
  {
    id: '3',
    title: 'Vocabulary Building Session',
    description: 'Learn academic vocabulary for Writing Task 2',
    type: 'study',
    priority: 'medium',
    estimatedTime: 25,
    impactScore: 70,
    difficulty: 'beginner',
    progress: 0,
    actionItems: [
      'Complete vocabulary flashcards',
      'Practice using new words in sentences',
      'Review synonyms for common academic terms',
    ],
    relatedSkills: ['vocabulary', 'writing', 'speaking'],
    aiGenerated: true,
  },
  {
    id: '4',
    title: 'Speaking Fluency Practice',
    description: 'Improve speaking coherence and pronunciation',
    type: 'practice',
    priority: 'medium',
    estimatedTime: 20,
    impactScore: 75,
    difficulty: 'intermediate',
    progress: 60,
    actionItems: [
      'Record responses to common IELTS questions',
      'Use AI pronunciation analysis',
      'Practice with speaking partner',
    ],
    relatedSkills: ['speaking', 'fluency', 'pronunciation'],
    aiGenerated: true,
  },
];

export function PersonalizedRecommendations({
  recommendations = MOCK_RECOMMENDATIONS,
  performance = [],
  className,
}: PersonalizedRecommendationsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [completedRecs, setCompletedRecs] = useState<string[]>([]);

  // Fix: Ensure recommendations is always an array
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  const filteredRecommendations = useMemo(() => {
    if (activeTab === 'all') return safeRecommendations;
    if (activeTab === 'completed') return safeRecommendations.filter(r => r.completed);
    if (activeTab === 'in-progress') {
      return safeRecommendations.filter(r => r.progress && r.progress > 0 && r.progress < 100);
    }
    return safeRecommendations.filter(r => r.priority === activeTab);
  }, [safeRecommendations, activeTab]);

  const handleStartRecommendation = (id: string) => {
    setSelectedRec(id);
    // In a real app, this would navigate to the activity
    console.log('Starting recommendation:', id);
  };

  const handleCompleteRecommendation = (id: string) => {
    setCompletedRecs(prev => [...prev, id]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'neutral';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mock': return 'Timer';
      case 'study': return 'BookOpen';
      case 'practice': return 'Target';
      case 'review': return 'RefreshCw';
      default: return 'CheckCircle';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'destructive';
      default: return 'neutral';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalized Recommendations</h2>
          <p className="text-sm text-muted-foreground">
            AI-generated study plan based on your performance
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30">
          <Icon name="Sparkles" className="mr-2" size={14} />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="low">Low</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {!filteredRecommendations || filteredRecommendations.length === 0 ? (
            <Card className="p-8 text-center">
              <Icon name="CheckCircle" className="mx-auto text-success" size={32} />
              <h3 className="mt-4 text-lg font-semibold">All Caught Up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You've completed all recommendations. New ones will be generated based on your next mock test.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className={cn(
                    'group relative overflow-hidden transition-all hover:shadow-lg',
                    selectedRec === rec.id && 'ring-2 ring-primary',
                    completedRecs.includes(rec.id) && 'opacity-75'
                  )}
                >
                  {/* Priority indicator */}
                  <div className={cn(
                    'absolute left-0 top-0 h-full w-1',
                    rec.priority === 'high' ? 'bg-destructive' :
                    rec.priority === 'medium' ? 'bg-warning' : 'bg-success'
                  )} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(rec.priority)} size="sm">
                            {rec.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={getDifficultyColor(rec.difficulty)} size="sm">
                            {rec.difficulty}
                          </Badge>
                          {rec.aiGenerated && (
                            <Badge variant="outline" size="sm" className="border-primary/30">
                              AI
                            </Badge>
                          )}
                        </div>

                        <h3 className="mt-2 text-lg font-semibold group-hover:text-primary transition-colors">
                          {rec.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {rec.description}
                        </p>
                      </div>

                      <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon name={getTypeIcon(rec.type)} className="text-primary" size={20} />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Time Required</p>
                        <p className="font-medium">{formatTime(rec.estimatedTime)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Impact Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={rec.impactScore} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{rec.impactScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {rec.progress !== undefined && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{rec.progress}%</span>
                        </div>
                        <Progress value={rec.progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Items Preview */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground">Quick Actions:</p>
                      <ul className="mt-1 space-y-1">
                        {rec.actionItems.slice(0, 2).map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs">
                            <Icon name="CheckCircle" className="text-success" size={12} />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                        {rec.actionItems.length > 2 && (
                          <li className="text-xs text-muted-foreground">
                            +{rec.actionItems.length - 2} more actions
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Related Skills */}
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        {rec.relatedSkills.map((skill) => (
                          <Badge key={skill} variant="outline" size="xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-2">
                      {completedRecs.includes(rec.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          disabled
                        >
                          <Icon name="CheckCircle" size={14} />
                          Completed
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => handleStartRecommendation(rec.id)}
                          >
                            <Icon name="PlayCircle" size={14} />
                            Start
                          </Button>
                          <Tooltip content="Mark as complete">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompleteRecommendation(rec.id)}
                            >
                              <Icon name="Check" size={16} />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommendation Summary */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Target" className="text-primary" size={16} />
              <h4 className="font-medium">Recommendation Summary</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your current performance and goals
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Recommendations</span>
              <span className="font-medium">{safeRecommendations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed</span>
              <span className="font-medium text-success">
                {completedRecs.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Estimated Time</span>
              <span className="font-medium">
                {formatTime(safeRecommendations.reduce((acc, rec) => acc + rec.estimatedTime, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Impact</span>
              <span className="font-medium">
                {safeRecommendations.length > 0
                  ? Math.round(safeRecommendations.reduce((acc, rec) => acc + rec.impactScore, 0) / safeRecommendations.length)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Insights */}
      {performance.length > 0 && (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Brain" className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">AI Insights</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on your performance in recent mocks, we recommend focusing on your
                  weakest module to maximize band score improvement. Consider completing
                  high-priority recommendations first for the quickest results.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PersonalizedRecommendations;