// lib/routes/routeLayoutMap.ts
export type LayoutType =
  | 'admin'
  | 'teacher'
  | 'institutions'
  | 'dashboard'
  | 'marketplace'
  | 'learning'
  | 'community'
  | 'reports'
  | 'marketing'
  | 'auth'
  | 'proctoring'
  | 'exam'
  | 'profile'
  | 'communication'
  | 'billing'
  | 'resources'
  | 'analytics'
  | 'support'
  | 'default';

export interface RouteConfig {
  layout: LayoutType;
  showChrome?: boolean;
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

// Comprehensive route mapping for all ~240 pages
export const ROUTE_LAYOUT_MAP: Record<string, RouteConfig> = {
  // ===== ADMIN ROUTES =====
  '/admin': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/users': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/analytics': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/settings': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/moderation': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/reports': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/billing': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },

  // ===== TEACHER ROUTES =====
  '/teacher': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/dashboard': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/classes': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/students': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/assignments': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/grading': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/analytics': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/profile': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/settings': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/register': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },

  // ===== INSTITUTIONS ROUTES =====
  '/institutions': { layout: 'institutions' },
  '/institutions/dashboard': { layout: 'institutions', requiresAuth: true },
  '/institutions/students': { layout: 'institutions', requiresAuth: true },
  '/institutions/teachers': { layout: 'institutions', requiresAuth: true },
  '/institutions/classes': { layout: 'institutions', requiresAuth: true },
  '/institutions/analytics': { layout: 'institutions', requiresAuth: true },
  '/institutions/billing': { layout: 'institutions', requiresAuth: true },
  '/institutions/settings': { layout: 'institutions', requiresAuth: true },

  // ===== DASHBOARD ROUTES =====
  '/dashboard': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/overview': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/progress': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/performance': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/study-plan': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/goals': { layout: 'dashboard', requiresAuth: true },

  // ===== PROFILE & SETTINGS ROUTES =====
  '/profile': { layout: 'profile', requiresAuth: true },
  '/profile/edit': { layout: 'profile', requiresAuth: true },
  '/profile/preferences': { layout: 'profile', requiresAuth: true },
  '/profile/achievements': { layout: 'profile', requiresAuth: true },
  '/settings': { layout: 'dashboard', requiresAuth: true },
  '/settings/account': { layout: 'dashboard', requiresAuth: true },
  '/settings/notifications': { layout: 'dashboard', requiresAuth: true },
  '/settings/privacy': { layout: 'dashboard', requiresAuth: true },
  '/settings/subscription': { layout: 'dashboard', requiresAuth: true },

  // ===== LEARNING ROUTES =====
  '/learning': { layout: 'learning', requiresAuth: true },
  '/learning/courses': { layout: 'learning', requiresAuth: true },
  '/learning/courses/[id]': { layout: 'learning', requiresAuth: true },
  '/learning/lessons': { layout: 'learning', requiresAuth: true },
  '/learning/lessons/[id]': { layout: 'learning', requiresAuth: true },
  '/learning/practice': { layout: 'learning', requiresAuth: true },
  '/learning/resources': { layout: 'learning', requiresAuth: true },
  '/learning/library': { layout: 'learning', requiresAuth: true },
  '/content/studio': { layout: 'learning', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },

  // ===== ASSESSMENT & TESTING ROUTES =====
  '/practice': { layout: 'learning', requiresAuth: true },
  '/practice/[category]': { layout: 'learning', requiresAuth: true },
  '/quiz': { layout: 'learning', requiresAuth: true },
  '/quiz/[id]': { layout: 'learning', requiresAuth: true },
  '/test': { layout: 'learning', requiresAuth: true },
  '/test/[id]': { layout: 'learning', requiresAuth: true },
  '/assignment': { layout: 'learning', requiresAuth: true },
  '/assignment/[id]': { layout: 'learning', requiresAuth: true },

  // ===== REPORTS & ANALYTICS ROUTES =====
  '/reports': { layout: 'reports', requiresAuth: true },
  '/reports/overview': { layout: 'reports', requiresAuth: true },
  '/reports/performance': { layout: 'reports', requiresAuth: true },
  '/reports/progress': { layout: 'reports', requiresAuth: true },
  '/reports/analytics': { layout: 'reports', requiresAuth: true },
  '/reports/detailed': { layout: 'reports', requiresAuth: true },
  '/placement': { layout: 'reports', requiresAuth: true },
  '/placement/test': { layout: 'reports', requiresAuth: true },
  '/placement/results': { layout: 'reports', requiresAuth: true },
  '/analytics': { layout: 'analytics', requiresAuth: true },
  '/analytics/overview': { layout: 'analytics', requiresAuth: true },
  '/analytics/detailed': { layout: 'analytics', requiresAuth: true },

  // ===== MARKETPLACE ROUTES =====
  '/marketplace': { layout: 'marketplace' },
  '/marketplace/courses': { layout: 'marketplace' },
  '/marketplace/tutors': { layout: 'marketplace' },
  '/marketplace/resources': { layout: 'marketplace' },
  '/marketplace/[id]': { layout: 'marketplace' },
  '/coach': { layout: 'marketplace' },
  '/coach/[id]': { layout: 'marketplace' },
  '/classes': { layout: 'marketplace' },
  '/classes/[id]': { layout: 'marketplace' },
  '/tutors': { layout: 'marketplace' },
  '/tutors/[id]': { layout: 'marketplace' },
  '/partners': { layout: 'marketplace' },

  // ===== COMMUNITY ROUTES =====
  '/community': { layout: 'community', requiresAuth: true },
  '/community/discussions': { layout: 'community', requiresAuth: true },
  '/community/discussions/[id]': { layout: 'community', requiresAuth: true },
  '/community/groups': { layout: 'community', requiresAuth: true },
  '/community/groups/[id]': { layout: 'community', requiresAuth: true },
  '/community/events': { layout: 'community', requiresAuth: true },
  '/community/events/[id]': { layout: 'community', requiresAuth: true },
  '/community/leaderboard': { layout: 'community', requiresAuth: true },

  // ===== COMMUNICATION ROUTES =====
  '/messages': { layout: 'communication', requiresAuth: true },
  '/messages/[id]': { layout: 'communication', requiresAuth: true },
  '/chat': { layout: 'communication', requiresAuth: true },
  '/chat/[id]': { layout: 'communication', requiresAuth: true },
  '/inbox': { layout: 'communication', requiresAuth: true },
  '/notifications': { layout: 'dashboard', requiresAuth: true },

  // ===== EXAM & PROCTORING ROUTES =====
  '/exam': { layout: 'exam', showChrome: false },
  '/exam/[id]': { layout: 'exam', showChrome: false },
  '/exam-room': { layout: 'exam', showChrome: false },
  '/exam-room/[id]': { layout: 'exam', showChrome: false },
  '/proctoring/check': { layout: 'proctoring', showChrome: false },
  '/proctoring/exam': { layout: 'proctoring', showChrome: false },
  '/mock': { layout: 'exam', showChrome: false },
  '/mock/[id]': { layout: 'exam', showChrome: false },
  '/writing/mock': { layout: 'exam', showChrome: false },
  '/writing/mock/[id]': { layout: 'exam', showChrome: false },

  // ===== AUTHENTICATION ROUTES =====
  '/login': { layout: 'auth', showChrome: false },
  '/signup': { layout: 'auth', showChrome: false },
  '/register': { layout: 'auth', showChrome: false },
  '/auth/login': { layout: 'auth', showChrome: false },
  '/auth/signup': { layout: 'auth', showChrome: false },
  '/auth/register': { layout: 'auth', showChrome: false },
  '/auth/mfa': { layout: 'auth', showChrome: false },
  '/auth/verify': { layout: 'auth', showChrome: false },
  '/forgot-password': { layout: 'auth', showChrome: false },
  '/reset-password': { layout: 'auth', showChrome: false },

  // ===== MARKETING ROUTES =====
  '/': { layout: 'marketing' },
  '/pricing': { layout: 'marketing' },
  '/pricing/[plan]': { layout: 'marketing' },
  '/predictor': { layout: 'marketing' },
  '/faq': { layout: 'marketing' },
  '/legal': { layout: 'marketing' },
  '/legal/privacy': { layout: 'marketing' },
  '/legal/terms': { layout: 'marketing' },
  '/data-deletion': { layout: 'marketing' },
  '/about': { layout: 'marketing' },
  '/about/team': { layout: 'marketing' },
  '/about/mission': { layout: 'marketing' },
  '/contact': { layout: 'marketing' },
  '/contact/support': { layout: 'marketing' },
  '/blog': { layout: 'marketing' },
  '/blog/[slug]': { layout: 'marketing' },

  // ===== BILLING & SUBSCRIPTION ROUTES =====
  '/billing': { layout: 'billing', requiresAuth: true },
  '/billing/overview': { layout: 'billing', requiresAuth: true },
  '/billing/invoices': { layout: 'billing', requiresAuth: true },
  '/billing/payment-methods': { layout: 'billing', requiresAuth: true },
  '/payment': { layout: 'billing', requiresAuth: true },
  '/payment/success': { layout: 'billing', requiresAuth: true },
  '/payment/cancel': { layout: 'billing', requiresAuth: true },
  '/subscription': { layout: 'billing', requiresAuth: true },
  '/subscription/manage': { layout: 'billing', requiresAuth: true },

  // ===== RESOURCES ROUTES =====
  '/resources': { layout: 'resources', requiresAuth: true },
  '/resources/library': { layout: 'resources', requiresAuth: true },
  '/resources/materials': { layout: 'resources', requiresAuth: true },
  '/resources/downloads': { layout: 'resources', requiresAuth: true },
  '/resources/templates': { layout: 'resources', requiresAuth: true },

  // ===== SUPPORT ROUTES =====
  '/support': { layout: 'support' },
  '/support/help': { layout: 'support' },
  '/support/contact': { layout: 'support' },
  '/support/tickets': { layout: 'support', requiresAuth: true },
  '/support/tickets/[id]': { layout: 'support', requiresAuth: true },

  // ===== PREMIUM ROUTES =====
  '/premium': { layout: 'default', showChrome: false },
  '/premium/features': { layout: 'default', showChrome: false },
  '/premium/room': { layout: 'default', showChrome: false },
  '/premium-pin': { layout: 'default', showChrome: false },

  // ===== FOCUS MODE ROUTES =====
  '/focus-mode': { layout: 'default', showChrome: false },
  '/focus-mode/session': { layout: 'default', showChrome: false },

  // ===== DEFAULT CATCH-ALL =====
  '/404': { layout: 'marketing' },
  '/500': { layout: 'marketing' },
  '/restricted': { layout: 'marketing' },
};

// Helper function to get route config with pattern matching
export function getRouteConfig(pathname: string): RouteConfig {
  // Exact match first
  if (ROUTE_LAYOUT_MAP[pathname]) {
    return ROUTE_LAYOUT_MAP[pathname];
  }

  // Pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(ROUTE_LAYOUT_MAP)) {
    if (pattern.includes('[') && pattern.includes(']')) {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\[([^\]]+)\]/g, '([^/]+)')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${regexPattern}$`);

      if (regex.test(pathname)) {
        return config;
      }
    }
  }

  // Prefix matching for nested routes
  const matchingPrefix = Object.keys(ROUTE_LAYOUT_MAP)
    .filter(key => !key.includes('[')) // Exclude dynamic routes
    .sort((a, b) => b.length - a.length) // Longest first for specificity
    .find(key => pathname.startsWith(key));

  if (matchingPrefix) {
    return ROUTE_LAYOUT_MAP[matchingPrefix];
  }

  // Default fallback
  return { layout: 'default', showChrome: true };
}

// Helper to check if path is an attempt path (no chrome)
export function isAttemptPath(pathname: string): boolean {
  const config = getRouteConfig(pathname);
  return !config.showChrome;
}