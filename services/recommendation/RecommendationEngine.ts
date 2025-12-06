// services/recommendation/RecommendationEngine.ts

// Keep it loose for now so nothing explodes.
// You can tighten types later once the data shape is final.

type DashboardStats = any;

type Recommendation = {
  id: string;
  title: string;
  description: string;
  href?: string;
  type?: 'mock' | 'exercise' | 'tip';
  priority?: 'high' | 'medium' | 'low';
};

export const RecommendationEngine: any = {
  getDashboardRecommendations(stats: DashboardStats): Recommendation[] {
    if (!stats) {
      return [
        {
          id: 'get-started-mock',
          title: 'Start your first full mock test',
          description: 'Unlock your baseline band score with a full IELTS-style mock.',
          href: '/mock',
          type: 'mock',
          priority: 'high',
        },
      ];
    }

    const recs: Recommendation[] = [];

    if (!stats.totalAttempts || stats.totalAttempts === 0) {
      recs.push({
        id: 'first-mock',
        title: 'Take your first IELTS mock',
        description: 'No attempts yet. Start with a full mock to establish your baseline.',
        href: '/mock',
        type: 'mock',
        priority: 'high',
      });
    }

    if (stats.moduleBreakdown && Array.isArray(stats.moduleBreakdown)) {
      const weakest = [...stats.moduleBreakdown]
        .filter((m: any) => typeof m.avgBand === 'number')
        .sort((a: any, b: any) => a.avgBand - b.avgBand)[0];

      if (weakest) {
        recs.push({
          id: `focus-${weakest.module}`,
          title: `Focus on ${weakest.module}`,
          description: `Your weakest area right now is ${weakest.module}. Run a drill or mock focused on this skill.`,
          href: `/mock/${(weakest.module || '').toLowerCase()}`,
          type: 'exercise',
          priority: 'high',
        });
      }
    }

    if (stats.lastAttemptAt) {
      recs.push({
        id: 'review-last-attempt',
        title: 'Review your last attempt',
        description: 'Go through your last mock, review mistakes, and update your Mistakes Book.',
        href: '/mock/history',
        type: 'tip',
        priority: 'medium',
      });
    }

    if (recs.length === 0) {
      recs.push({
        id: 'default-mock',
        title: 'Run a timed practice',
        description: 'Stay consistent. A 40-minute timed mock keeps you exam-ready.',
        href: '/mock',
        type: 'mock',
        priority: 'medium',
      });
    }

    return recs;
  },
};
