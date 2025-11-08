import raw from '@/config/route-layout-map.json';

export type LayoutKey =
  | 'publicMarketing' | 'auth' | 'dashboard' | 'learning' | 'examResources'
  | 'mockHub' | 'reviewReports' | 'teacher' | 'institutions' | 'marketplace'
  | 'admin' | 'proctoring' | 'premiumUi';

export type RouteLayoutMap = {
  layouts: Record<LayoutKey, string[]>;
  attemptRoutes: string[];
};

const data = raw as RouteLayoutMap;

export const routeLayoutMap = data;

export function isAttemptPath(pathname: string): boolean {
  return data.attemptRoutes.some((re) => new RegExp(re).test(pathname));
}

/** Returns the first matching layout key for a given path, or null if none. */
export function matchLayout(pathname: string): LayoutKey | null {
  const entries = Object.entries(data.layouts) as [LayoutKey, string[]][];
  for (const [key, patterns] of entries) {
    for (const pattern of patterns) {
      const re = new RegExp('^' + pattern
        .replace(/\//g, '\\/')
        .replace(/\.\*/g, '.*')
        .replace(/\*/g, '.*')
        .replace(/:([A-Za-z0-9_]+)/g, '[^/]+')
      + '$');
      if (re.test(pathname)) return key;
    }
  }
  return null;
}
