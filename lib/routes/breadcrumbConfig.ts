// lib/routes/breadcrumbConfig.ts
import type { ParsedUrlQuery } from 'querystring';

export type BreadcrumbContext = {
  pathname: string;
  query: ParsedUrlQuery;
};

export type BreadcrumbConfigEntry = {
  label: string | ((ctx: BreadcrumbContext) => string);
  parent?: string;
  /**
   * Allow individual entries to control the href that should be rendered
   * (useful when a page relies on query parameters instead of path params).
   */
  buildHref?: (ctx: BreadcrumbContext) => string | undefined;
};

const withAttemptQuery = (path: string) =>
  ({ query }: BreadcrumbContext) => {
    const attemptId = query.attemptId;
    if (typeof attemptId === 'string' && attemptId.length > 0) {
      return `${path}?attemptId=${encodeURIComponent(attemptId)}`;
    }
    return path;
  };

export const breadcrumbConfig: Record<string, BreadcrumbConfigEntry> = {
  '/dashboard': { label: 'Dashboard' },
  '/dashboard/analytics': { label: 'Analytics', parent: '/dashboard' },
  '/dashboard/goals': { label: 'Goals', parent: '/dashboard' },
  '/notifications': { label: 'Notifications', parent: '/dashboard' },

  '/mock': { label: 'Mock Hub', parent: '/dashboard' },
  '/mock/analytics': { label: 'Performance Analytics', parent: '/mock' },

  '/mock/listening': { label: 'Listening Mock', parent: '/mock' },
  '/mock/listening/overview': { label: 'Overview', parent: '/mock/listening' },
  '/mock/listening/run': {
    label: 'Test Session',
    parent: '/mock/listening',
    buildHref: withAttemptQuery('/mock/listening/run'),
  },
  '/mock/listening/submitted': {
    label: 'Results',
    parent: '/mock/listening',
    buildHref: withAttemptQuery('/mock/listening/submitted'),
  },

  '/mock/reading': { label: 'Reading Mock', parent: '/mock' },
  '/mock/reading/overview': { label: 'Overview', parent: '/mock/reading' },
  '/mock/reading/run': {
    label: 'Test Session',
    parent: '/mock/reading',
    buildHref: withAttemptQuery('/mock/reading/run'),
  },
  '/mock/reading/submitted': {
    label: 'Results',
    parent: '/mock/reading',
    buildHref: withAttemptQuery('/mock/reading/submitted'),
  },

  '/mock/writing': { label: 'Writing Mock', parent: '/mock' },
  '/mock/writing/overview': { label: 'Overview', parent: '/mock/writing' },
  '/mock/writing/run': {
    label: 'Test Room',
    parent: '/mock/writing',
    buildHref: withAttemptQuery('/mock/writing/run'),
  },
  '/mock/writing/submitted': {
    label: 'Feedback',
    parent: '/mock/writing',
    buildHref: withAttemptQuery('/mock/writing/submitted'),
  },

  '/mock/speaking': { label: 'Speaking Mock', parent: '/mock' },
  '/mock/speaking/overview': { label: 'Overview', parent: '/mock/speaking' },
  '/mock/speaking/run': {
    label: 'Virtual Interview',
    parent: '/mock/speaking',
    buildHref: withAttemptQuery('/mock/speaking/run'),
  },
  '/mock/speaking/submitted': {
    label: 'Results',
    parent: '/mock/speaking',
    buildHref: withAttemptQuery('/mock/speaking/submitted'),
  },
};
