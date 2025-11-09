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
  showChrome?: boolean; // default true unless explicitly false
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

// ===== ROUTE MAP =====
export const ROUTE_LAYOUT_MAP: Record<string, RouteConfig> = {
  // ----- SYSTEM / ERR -----
  '/403': { layout: 'marketing' },
  '/404': { layout: 'marketing' },
  '/500': { layout: 'marketing' },

  // ----- MARKETING ROOTS -----
  '/': { layout: 'marketing' },
  '/pricing': { layout: 'marketing' },
  '/pricing/[plan]': { layout: 'marketing' },
  '/predictor': { layout: 'marketing' },
  '/predictor/result': { layout: 'marketing' },
  '/faq': { layout: 'marketing' },
  '/legal': { layout: 'marketing' },
  '/legal/privacy': { layout: 'marketing' },
  '/legal/terms': { layout: 'marketing' },
  '/data-deletion': { layout: 'marketing' },
  '/roadmap': { layout: 'marketing' },
  '/r': { layout: 'marketing' },
  '/r/[code]': { layout: 'marketing' },
  '/tokens-test': { layout: 'marketing' },
  '/word-of-the-day': { layout: 'marketing' },
  '/waitlist': { layout: 'marketing' },
  '/accessibility': { layout: 'marketing' },

  // ----- AUTH -----
  '/auth': { layout: 'auth', showChrome: false },
  '/auth/callback': { layout: 'auth', showChrome: false },
  '/auth/forgot': { layout: 'auth', showChrome: false },
  '/auth/reset': { layout: 'auth', showChrome: false },
  '/auth/mfa': { layout: 'auth', showChrome: false },
  '/auth/verify': { layout: 'auth', showChrome: false },
  '/login': { layout: 'auth', showChrome: false },
  '/login/index': { layout: 'auth', showChrome: false },
  '/login/email': { layout: 'auth', showChrome: false },
  '/login/password': { layout: 'auth', showChrome: false },
  '/login/phone': { layout: 'auth', showChrome: false },
  '/signup': { layout: 'auth', showChrome: false },
  '/signup/index': { layout: 'auth', showChrome: false },
  '/signup/email': { layout: 'auth', showChrome: false },
  '/signup/password': { layout: 'auth', showChrome: false },
  '/signup/phone': { layout: 'auth', showChrome: false },
  '/signup/verify': { layout: 'auth', showChrome: false },
  '/forgot-password': { layout: 'auth', showChrome: false },
  '/update-password': { layout: 'auth', showChrome: false },

  // ----- ACCOUNT (alias of dashboard/billing areas) -----
  '/account': { layout: 'dashboard', requiresAuth: true },
  '/account/index': { layout: 'dashboard', requiresAuth: true },
  '/account/billing': { layout: 'billing', requiresAuth: true },
  '/account/redeem': { layout: 'dashboard', requiresAuth: true },
  '/account/referrals': { layout: 'dashboard', requiresAuth: true },

  // ----- ADMIN -----
  '/admin': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/users': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/analytics': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/settings': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/moderation': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/reports': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/billing': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/imp-as': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },
  '/admin/stop-impersonation': { layout: 'admin', requiresAuth: true, allowedRoles: ['admin'] },

  // ----- TEACHER -----
  '/teacher': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/index': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/dashboard': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/classes': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/students': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/assignments': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/grading': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/analytics': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/profile': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/settings': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/register': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/onboarding': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },
  '/teacher/pending': { layout: 'teacher', requiresAuth: true, allowedRoles: ['teacher', 'admin'] },

  // ----- INSTITUTIONS -----
  '/institutions': { layout: 'institutions' },
  '/institutions/index': { layout: 'institutions' },
  '/institutions/[orgId]': { layout: 'institutions', requiresAuth: true },

  // ----- DASHBOARD -----
  '/dashboard': { layout: 'dashboard', requiresAuth: true },
  '/dashboard/index': { layout: 'dashboard', requiresAuth: true },
  '/welcome': { layout: 'dashboard', requiresAuth: true },

  // ----- PROFILE / SETTINGS -----
  '/profile': { layout: 'profile', requiresAuth: true },
  '/profile/index': { layout: 'profile', requiresAuth: true },
  '/profile/setup': { layout: 'profile', requiresAuth: true },
  '/profile/streak': { layout: 'profile', requiresAuth: true },
  '/settings': { layout: 'dashboard', requiresAuth: true },
  '/settings/index': { layout: 'dashboard', requiresAuth: true },
  '/settings/account': { layout: 'dashboard', requiresAuth: true },
  '/settings/notifications': { layout: 'dashboard', requiresAuth: true },
  '/settings/privacy': { layout: 'dashboard', requiresAuth: true },
  '/settings/subscription': { layout: 'dashboard', requiresAuth: true },
  '/settings/accessibility': { layout: 'dashboard', requiresAuth: true },
  '/settings/language': { layout: 'dashboard', requiresAuth: true },
  '/settings/security': { layout: 'dashboard', requiresAuth: true },

  // ----- LEARNING (global) -----
  '/learning': { layout: 'learning', requiresAuth: true },
  '/learning/index': { layout: 'learning', requiresAuth: true },
  '/learning/[slug]': { layout: 'learning', requiresAuth: true },
  '/learning/drills': { layout: 'learning', requiresAuth: true },
  '/learning/skills': { layout: 'learning', requiresAuth: true },
  '/learning/strategies': { layout: 'learning', requiresAuth: true },

  // ----- MODULE ROOTS (Listening/Reading/Speaking/Writing) -----
  '/listening': { layout: 'learning', requiresAuth: true },
  '/listening/index': { layout: 'learning', requiresAuth: true },
  '/listening/[slug]': { layout: 'learning', requiresAuth: true },

  '/reading': { layout: '', requiresAuth: true },
  '/reading/index': { layout: 'learning', requiresAuth: true },
  '/reading/[slug]': { layout: 'learning', requiresAuth: true },
  '/reading/passage': { layout: 'learning', requiresAuth: true },
  '/reading/stats': { layout: 'learning', requiresAuth: true },

  '/speaking': { layout: 'learning', requiresAuth: true },
  '/speaking/index': { layout: 'learning', requiresAuth: true },
  '/speaking/[promptId]': { layout: 'learning', requiresAuth: true },
  '/speaking/buddy': { layout: 'learning', requiresAuth: true },
  '/speaking/coach': { layout: 'learning', requiresAuth: true },
  '/speaking/library': { layout: 'learning', requiresAuth: true },
  '/speaking/live': { layout: 'learning', requiresAuth: true },
  '/speaking/packs': { layout: 'learning', requiresAuth: true },
  '/speaking/partner': { layout: 'learning', requiresAuth: true },
  '/speaking/settings': { layout: 'learning', requiresAuth: true },
  '/speaking/simulator': { layout: 'learning', requiresAuth: true },

  '/writing': { layout: 'learning', requiresAuth: true },
  '/writing/index': { layout: 'learning', requiresAuth: true },
  '/writing/[slug]': { layout: 'learning', requiresAuth: true },
  '/writing/library': { layout: 'learning', requiresAuth: true },
  '/writing/overview': { layout: 'learning', requiresAuth: true },
  '/writing/progress': { layout: 'learning', requiresAuth: true },
  '/writing/review': { layout: 'learning', requiresAuth: true },
  '/writing/reviews': { layout: 'learning', requiresAuth: true },

  // Writing mock shells vs attempts
  '/writing/mock': { layout: 'exam', showChrome: true },
  '/writing/mock/[id]': { layout: 'exam', showChrome: false },

  // ----- PRACTICE HUB -----
  '/practice': { layout: 'learning', requiresAuth: true },
  '/practice/index': { layout: 'learning', requiresAuth: true },
  '/practice/listening': { layout: 'learning', requiresAuth: true },
  '/practice/reading': { layout: 'learning', requiresAuth: true },
  '/practice/speaking': { layout: 'learning', requiresAuth: true },
  '/practice/writing': { layout: 'learning', requiresAuth: true },

  // ----- AI SPACE -----
  '/ai': { layout: 'learning', requiresAuth: true },
  '/ai/index': { layout: 'learning', requiresAuth: true },

  // ----- COMMUNITY -----
  '/community': { layout: 'community', requiresAuth: true },
  '/community/index': { layout: 'community', requiresAuth: true },
  '/community/chat': { layout: 'community', requiresAuth: true },
  '/community/questions': { layout: 'community', requiresAuth: true },
  '/community/review': { layout: 'community', requiresAuth: true },

  // ----- COMMUNICATION -----
  '/messages': { layout: 'communication', requiresAuth: true },
  '/messages/[id]': { layout: 'communication', requiresAuth: true },
  '/chat': { layout: 'communication', requiresAuth: true },
  '/chat/[id]': { layout: 'communication', requiresAuth: true },
  '/inbox': { layout: 'communication', requiresAuth: true },
  '/notifications': { layout: 'dashboard', requiresAuth: true },

  // ----- REPORTS / ANALYTICS -----
  '/reports': { layout: 'reports', requiresAuth: true },
  '/reports/band-analytics': { layout: 'reports', requiresAuth: true },
  '/analytics': { layout: 'analytics', requiresAuth: true },
  '/analytics/overview': { layout: 'analytics', requiresAuth: true },
  '/analytics/detailed': { layout: 'analytics', requiresAuth: true },
  '/analytics/writing': { layout: 'analytics', requiresAuth: true },
  '/progress': { layout: 'reports', requiresAuth: true },
  '/progress/index': { layout: 'reports', requiresAuth: true },
  '/progress/[token]': { layout: 'reports', requiresAuth: true },

  // ----- CERTIFICATES -----
  '/cert': { layout: 'reports', requiresAuth: true },
  '/cert/index': { layout: 'reports', requiresAuth: true },
  '/cert/[id]': { layout: 'reports', requiresAuth: true },
  '/cert/writing': { layout: 'reports', requiresAuth: true },

  // ----- MARKETPLACE / COACHES / CLASSES -----
  '/marketplace': { layout: 'marketplace' },
  '/marketplace/index': { layout: 'marketplace' },
  '/coach': { layout: 'marketplace' },
  '/coach/index': { layout: 'marketplace' },
  '/coach/[id]': { layout: 'marketplace' },
  '/classes': { layout: 'marketplace' },
  '/classes/index': { layout: 'marketplace' },
  '/classes/[id]': { layout: 'marketplace' },

  // ----- BOOKINGS -----
  '/bookings': { layout: 'marketplace', requiresAuth: true },
  '/bookings/index': { layout: 'marketplace', requiresAuth: true },
  '/bookings/[id]': { layout: 'marketplace', requiresAuth: true },

  // ----- BILLING / SUBSCRIPTION / CHECKOUT -----
  '/billing': { layout: 'billing', requiresAuth: true },
  '/billing/overview': { layout: 'billing', requiresAuth: true },
  '/billing/invoices': { layout: 'billing', requiresAuth: true },
  '/billing/payment-methods': { layout: 'billing', requiresAuth: true },
  '/payment': { layout: 'billing', requiresAuth: true },
  '/payment/success': { layout: 'billing', requiresAuth: true },
  '/payment/cancel': { layout: 'billing', requiresAuth: true },
  '/subscription': { layout: 'billing', requiresAuth: true },
  '/subscription/manage': { layout: 'billing', requiresAuth: true },
  '/checkout': { layout: 'billing', requiresAuth: true },
  '/checkout/index': { layout: 'billing', requiresAuth: true },
  '/checkout/save-card': { layout: 'billing', requiresAuth: true },
  '/checkout/confirm': { layout: 'billing', requiresAuth: true },
  '/checkout/success': { layout: 'billing', requiresAuth: true },
  '/checkout/cancel': { layout: 'billing', requiresAuth: true },
  '/checkout/crypto': { layout: 'billing', requiresAuth: true },

  // ----- RESOURCES -----
  '/resources': { layout: 'resources', requiresAuth: true },
  '/resources/index': { layout: 'resources', requiresAuth: true },
  '/resources/library': { layout: 'resources', requiresAuth: true },
  '/resources/materials': { layout: 'resources', requiresAuth: true },
  '/resources/downloads': { layout: 'resources', requiresAuth: true },
  '/resources/templates': { layout: 'resources', requiresAuth: true },

  // ----- SUPPORT -----
  '/support': { layout: 'support' },
  '/support/index': { layout: 'support' },
  '/support/help': { layout: 'support' },
  '/support/contact': { layout: 'support' },
  '/support/tickets': { layout: 'support', requiresAuth: true },
  '/support/tickets/[id]': { layout: 'support', requiresAuth: true },

  // ----- ONBOARDING -----
  '/onboarding': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/index': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/date': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/goal': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/schedule': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/skills': { layout: 'dashboard', requiresAuth: true },
  '/onboarding/teacher': { layout: 'dashboard', requiresAuth: true },

  // ----- ORGS -----
  '/orgs': { layout: 'institutions', requiresAuth: true },
  '/orgs/index': { layout: 'institutions', requiresAuth: true },

  // ----- PLACEMENT -----
  '/placement': { layout: 'reports', requiresAuth: true },
  '/placement/index': { layout: 'reports', requiresAuth: true },
  '/placement/start': { layout: 'reports', requiresAuth: true },
  '/placement/run': { layout: 'reports', requiresAuth: true },
  '/placement/result': { layout: 'reports', requiresAuth: true },

  // ----- REVIEW -----
  '/review': { layout: 'reports', requiresAuth: true },
  '/review/index': { layout: 'reports', requiresAuth: true },
  '/review/listening': { layout: 'reports', requiresAuth: true },
  '/review/reading': { layout: 'reports', requiresAuth: true },
  '/review/speaking': { layout: 'reports', requiresAuth: true },
  '/review/writing': { layout: 'reports', requiresAuth: true },
  '/review/share': { layout: 'reports', requiresAuth: true },

  // ----- SAVED / STUDY PLAN / VISAS / VOCAB -----
  '/saved': { layout: 'dashboard', requiresAuth: true },
  '/saved/index': { layout: 'dashboard', requiresAuth: true },
  '/study-plan': { layout: 'dashboard', requiresAuth: true },
  '/study-plan/index': { layout: 'dashboard', requiresAuth: true },
  '/visa': { layout: 'reports', requiresAuth: true },
  '/visa/index': { layout: 'reports', requiresAuth: true },
  '/vocab': { layout: 'learning', requiresAuth: true },
  '/vocab/index': { layout: 'learning', requiresAuth: true },
  '/vocabulary': { layout: 'learning', requiresAuth: true },
  '/vocabulary/index': { layout: 'learning', requiresAuth: true },
  '/vocabulary/[word]': { layout: 'learning', requiresAuth: true },
  '/vocabulary/infiniteapplications': { layout: 'learning', requiresAuth: true },
  '/vocabulary/learned': { layout: 'learning', requiresAuth: true },

  // ----- MOCK (shell pages should show chrome) -----
  '/mock': { layout: 'exam', showChrome: true },
  '/mock/index': { layout: 'exam', showChrome: true },
  '/mock/full': { layout: 'exam', showChrome: true },
  '/mock/analytics': { layout: 'exam', showChrome: true },
  '/mock/listening': { layout: 'exam', showChrome: true },
  '/mock/reading': { layout: 'exam', showChrome: true },
  '/mock/speaking': { layout: 'exam', showChrome: true },
  '/mock/resume': { layout: 'exam', showChrome: true },
  '/mock/[section]': { layout: 'exam', showChrome: true },

  // ----- EXAM / PROCTORING -----
  '/exam': { layout: 'exam', showChrome: true },
  '/exam/rehearsal': { layout: 'exam', showChrome: true },
  // Attempt-style pages (no chrome)
  '/exam/[id]': { layout: 'exam', showChrome: false },

  '/proctoring/check': { layout: 'proctoring', showChrome: false },
  '/proctoring/exam': { layout: 'proctoring', showChrome: false },

  // ----- PREMIUM AREA -----
  '/premium': { layout: 'default', showChrome: false },
  '/premium/index': { layout: 'default', showChrome: false },
  '/premium/room': { layout: 'default', showChrome: false },
  '/premium/pin': { layout: 'default', showChrome: false },
  '/premium/PremiumExamPage': { layout: 'default', showChrome: false },

  // ----- QUICK DRILLS -----
  '/quick': { layout: 'learning', requiresAuth: true },
  '/quick/index': { layout: 'learning', requiresAuth: true },
  '/quick/[skill]': { layout: 'learning', requiresAuth: true },

  // ----- MISC PAGES -----
  '/restricted': { layout: 'marketing' },
  '/whatsapp-tasks': { layout: 'dashboard', requiresAuth: true },
  '/pwa': { layout: 'marketing', showChrome: false },
  '/pwa/app': { layout: 'marketing', showChrome: false },

  // ----- PARTNERS / COMMUNITY-LIKE -----
  '/partners': { layout: 'marketplace' },
  '/partners/index': { layout: 'marketplace' },

  // ----- MISTAKES BOOK -----
  '/mistakes': { layout: 'learning', requiresAuth: true },
  '/mistakes/index': { layout: 'learning', requiresAuth: true },

  // ----- NOTIFICATIONS -----
  '/notifications/index': { layout: 'dashboard', requiresAuth: true },

  // ----- ORGANIZATION PAGES -----
  '/classes/[id]': { layout: 'marketplace' },
  '/coach/[id]': { layout: 'marketplace' },

  // ----- TOOLS (internal) -----
  '/tools': { layout: 'default' },
  '/tools/mark-sections': { layout: 'default' },
};

// ---- Helpers ----
export function getRouteConfig(pathname: string): RouteConfig {
  // Exact match
  if (ROUTE_LAYOUT_MAP[pathname]) return ROUTE_LAYOUT_MAP[pathname];

  // Dynamic patterns e.g. /foo/[id]
  for (const [pattern, config] of Object.entries(ROUTE_LAYOUT_MAP)) {
    if (pattern.includes('[') && pattern.includes(']')) {
      const regexPattern = pattern
        .replace(/\[([^\]]+)\]/g, '([^/]+)')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) return config;
    }
  }

  // Longest static prefix fallback
  const matchingPrefix = Object.keys(ROUTE_LAYOUT_MAP)
    .filter(k => !k.includes('['))
    .sort((a, b) => b.length - a.length)
    .find(k => pathname.startsWith(k));

  if (matchingPrefix) return ROUTE_LAYOUT_MAP[matchingPrefix];

  // Default
  return { layout: 'default', showChrome: true };
}

export function isAttemptPath(pathname: string): boolean {
  // If a route explicitly hides chrome, treat as attempt
  const cfg = getRouteConfig(pathname);
  if (cfg.showChrome === false) return true;

  // Heuristics: exam attempts and writing mock attempts
  if (/^\/exam\/[^/]+$/.test(pathname)) return true;
  if (/^\/writing\/mock\/[^/]+$/.test(pathname)) return true;

  // All other mock shells default to chrome (explicitly mapped above)
  return false;
}
