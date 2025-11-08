// components/layouts/DashboardLayout.tsx
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { ProgressBar } from '@/components/design-system/ProgressBar';
import { DashboardSkeleton } from '@/components/common/Skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Mock data and fallbacks for when hooks fail
const MOCK_USER = { name: 'Student' };
const MOCK_STREAK = 7;
const MOCK_NEXT_TASK = {
  title: 'Academic Writing Task 2',
  description: 'Practice essay on technology and education',
  duration: '40 mins',
  difficulty: 'Intermediate',
  priority: 'high' as const,
  href: '/writing/practice'
};

interface DashboardStats {
  todayStudyTime: number;
  weeklyGoal: number;
  streak: number;
  completedTasks: number;
  totalTasks: number;
  accuracy: number;
}

const QUICK_LINKS = [
  { href: '/study-plan', label: 'Study Plan', icon: '📚', description: 'Your learning path', badge: 'Updated' },
  { href: '/progress', label: 'Analytics', icon: '📊', description: 'Performance insights', badge: 'New' },
  { href: '/listening', label: 'Listening', icon: '🎧', description: 'Practice exercises', badge: null },
  { href: '/reading', label: 'Reading', icon: '📖', description: 'Comprehension tests', badge: 'Practice' },
  { href: '/writing', label: 'Writing', icon: '✏️', description: 'Essay practice', badge: null },
  { href: '/speaking/simulator', label: 'Speaking', icon: '🎤', description: 'Speaking tests', badge: 'AI Coach' },
  { href: '/vocabulary', label: 'Vocabulary', icon: '📝', description: 'Word learning', badge: 'Daily' },
  { href: '/mock', label: 'Mock Test', icon: '🎯', description: 'Full test simulation', badge: 'Pro' },
] as const;

const STATS_CARDS = [
  { key: 'streak', label: 'Current Streak', icon: '🔥', color: 'text-orange-500', gradient: 'from-orange-500 to-red-500' },
  { key: 'todayStudyTime', label: 'Today Study', icon: '⏱️', color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  { key: 'accuracy', label: 'Accuracy', icon: '🎯', color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  { key: 'completion', label: 'Weekly Progress', icon: '📈', color: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
] as const;

const DashboardLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { pathname } = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(MOCK_USER);
  const [stats, setStats] = React.useState<DashboardStats>({
    todayStudyTime: 0,
    weeklyGoal: 120,
    streak: 0,
    completedTasks: 0,
    totalTasks: 7,
    accuracy: 0,
  });

  const [nextTask, setNextTask] = React.useState(MOCK_NEXT_TASK);
  const [nextTaskLoading, setNextTaskLoading] = React.useState(false);

  // Safe data loading with error handling
  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Simulate API calls with error handling
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock data - replace with actual API calls
        setStats({
          todayStudyTime: 45,
          weeklyGoal: 120,
          streak: MOCK_STREAK,
          completedTasks: 4,
          totalTasks: 7,
          accuracy: 78,
        });

        setNextTask(MOCK_NEXT_TASK);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Fallback to basic data
        setStats({
          todayStudyTime: 0,
          weeklyGoal: 120,
          streak: 0,
          completedTasks: 0,
          totalTasks: 7,
          accuracy: 0,
        });
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const progressPercentage = Math.round((stats.completedTasks / stats.totalTasks) * 100);
  const weeklyProgress = Math.round((stats.todayStudyTime / stats.weeklyGoal) * 100);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <DashboardSkeleton />
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header streak={stats.streak} />

      {/* Main Dashboard Content */}
      <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/30">
        {/* Enhanced Dashboard Header */}
        <section className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <Container className="space-y-6 py-6">
            {/* Welcome Section with User Info */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h1 className="font-slab text-2xl sm:text-3xl font-bold">
                      Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
                    </h1>
                    <p className="text-small text-mutedText">
                      Ready to continue your IELTS journey? You're doing amazing!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 flex-wrap">
                <Button size="sm" variant="outline" asChild className="gap-2">
                  <Link href="/quick">
                    <span>⚡</span>
                    Quick Drill
                  </Link>
                </Button>
                <Button size="sm" asChild className="gap-2">
                  <Link href="/study-plan">
                    <span>📚</span>
                    Continue Plan
                  </Link>
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Overview with Gradient Backgrounds */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS_CARDS.map(({ key, label, icon, color, gradient }) => (
                <Card
                  key={key}
                  className="p-4 text-center border-border/50 bg-card/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  {/* Gradient Background Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className={`text-2xl mb-2 ${color} relative z-10`}>{icon}</div>
                  <div className="text-sm font-medium text-mutedText mb-1 relative z-10">{label}</div>
                  <div className="text-xl font-bold relative z-10">
                    {key === 'streak' && (
                      <div className="flex items-center justify-center gap-1">
                        {stats.streak}
                        <span className="text-sm text-mutedText">days</span>
                      </div>
                    )}
                    {key === 'todayStudyTime' && formatTime(stats.todayStudyTime)}
                    {key === 'accuracy' && `${stats.accuracy}%`}
                    {key === 'completion' && `${progressPercentage}%`}
                  </div>
                </Card>
              ))}
            </div>

            {/* Progress Bars with Labels */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4 border-border/50 bg-card/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Weekly Study Goal</span>
                    <span className="text-mutedText text-sm">
                      {formatTime(stats.todayStudyTime)} / {formatTime(stats.weeklyGoal)}
                    </span>
                  </div>
                  <ProgressBar value={weeklyProgress} className="h-3" />
                  <div className="flex justify-between text-xs text-mutedText">
                    <span>0 min</span>
                    <span>{formatTime(stats.weeklyGoal)} goal</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-border/50 bg-card/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Task Completion</span>
                    <span className="text-mutedText text-sm">
                      {stats.completedTasks} / {stats.totalTasks} tasks
                    </span>
                  </div>
                  <ProgressBar value={progressPercentage} className="h-3" />
                  <div className="flex justify-between text-xs text-mutedText">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Enhanced Navigation with Hover Effects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Quick Access</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/practice" className="text-sm text-mutedText hover:text-foreground">
                    View All →
                  </Link>
                </Button>
              </div>

              <nav
                aria-label="Dashboard quick links"
                className="grid grid-cols-2 gap-4 sm:grid-cols-4"
              >
                {QUICK_LINKS.map(({ href, label, icon, description, badge }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-300 ${
                        active
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl transition-transform group-hover:scale-110">
                          {icon}
                        </div>
                        {badge && (
                          <Badge
                            tone={active ? "primary" : "secondary"}
                            size="sm"
                            className="text-xs"
                          >
                            {badge}
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-tight mb-1">{label}</div>
                        <div className="text-xs text-mutedText line-clamp-2">{description}</div>
                      </div>

                      {active && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </Container>
        </section>

        {/* Dashboard Content Area */}
        <Container className="py-8 sm:py-10">
          {/* Smart Recommendation Section */}
          <Card className="mb-8 p-6 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(120,119,198,0.15)_1px,transparent_0)] bg-[length:16px_16px] opacity-50" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge tone="primary" className="gap-1">
                    <span>🎯</span>
                    Smart Recommendation
                  </Badge>
                  <span className="text-sm text-mutedText">Based on your learning pattern</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{nextTask.title}</h3>
                <p className="text-sm text-mutedText mb-3">{nextTask.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-mutedText">
                    <span>⏱️</span>
                    {nextTask.duration}
                  </span>
                  <span className="flex items-center gap-1 text-mutedText">
                    <span>📊</span>
                    {nextTask.difficulty}
                  </span>
                  <Badge tone={getPriorityColor(nextTask.priority)} size="sm">
                    {nextTask.priority} priority
                  </Badge>
                </div>
              </div>
              <Button asChild size="lg" className="gap-2 shrink-0">
                <Link href={nextTask.href}>
                  <span>🚀</span>
                  Start Now
                </Link>
              </Button>
            </div>
          </Card>

          {/* Main Dashboard Content */}
          <div className="space-y-8">
            {children}
          </div>

          {/* Motivational Section */}
          <Card className="mt-12 text-center p-8 border-border/50 bg-card/30 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />

            <div className="max-w-2xl mx-auto relative z-10">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-3">Keep up the great work!</h3>
              <p className="text-mutedText mb-6 leading-relaxed">
                Consistency is key to IELTS success. You've completed <strong>{stats.completedTasks} tasks</strong> this week
                and maintained a <strong>{stats.streak}-day streak</strong>! Your dedication is paying off.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button variant="outline" asChild className="gap-2">
                  <Link href="/progress">
                    <span>📈</span>
                    View Detailed Progress
                  </Link>
                </Button>
                <Button asChild className="gap-2">
                  <Link href="/study-plan">
                    <span>✨</span>
                    Plan Next Session
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
export { DashboardLayout };