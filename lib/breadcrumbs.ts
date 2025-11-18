// lib/breadcrumbs.ts
import type { ParsedUrlQuery } from 'querystring';

import {
  breadcrumbConfig,
  type BreadcrumbConfigEntry,
  type BreadcrumbContext,
} from '@/lib/routes/breadcrumbConfig';

export type BreadcrumbItem = {
  key: string;
  label: string;
  href?: string;
  isCurrent: boolean;
};

const DYNAMIC_SEGMENT = /^\[(.+)]$/;

const normalizePathname = (pathname: string) => {
  if (!pathname) return '/';
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
};

const splitPath = (path: string) => path.split('/').filter(Boolean);

const getQueryValue = (query: ParsedUrlQuery, key: string) => {
  const raw = query[key];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
};

const patternToHref = (pattern: string, query: ParsedUrlQuery): string | undefined => {
  if (!pattern) return undefined;
  const parts = splitPath(pattern);
  if (parts.length === 0) return '/';
  const built: string[] = [];
  for (const part of parts) {
    const match = part.match(DYNAMIC_SEGMENT);
    if (match) {
      const value = getQueryValue(query, match[1]);
      if (!value) return undefined;
      built.push(encodeURIComponent(value));
    } else {
      built.push(part);
    }
  }
  return `/${built.join('/')}`;
};

const resolveConfigKey = (pathname: string): string | undefined => {
  if (breadcrumbConfig[pathname]) return pathname;
  const targetParts = splitPath(pathname);
  return Object.keys(breadcrumbConfig).find((pattern) => {
    const patternParts = splitPath(pattern);
    if (patternParts.length !== targetParts.length) return false;
    return patternParts.every((part, index) => {
      if (DYNAMIC_SEGMENT.test(part)) return true;
      return part === targetParts[index];
    });
  });
};

const resolveLabel = (entry: BreadcrumbConfigEntry, ctx: BreadcrumbContext) =>
  typeof entry.label === 'function' ? entry.label(ctx) : entry.label;

const resolveHref = (key: string, entry: BreadcrumbConfigEntry, ctx: BreadcrumbContext) =>
  entry.buildHref?.(ctx) ?? patternToHref(key, ctx.query);

export function buildBreadcrumbs(pathname: string, query: ParsedUrlQuery): BreadcrumbItem[] {
  const normalizedPath = normalizePathname(pathname);
  const resolvedKey = resolveConfigKey(normalizedPath);
  if (!resolvedKey) return [];

  const items: BreadcrumbItem[] = [];
  const visited = new Set<string>();
  let currentKey: string | undefined = resolvedKey;

  const ctx: BreadcrumbContext = {
    pathname: normalizedPath,
    query,
  };

  while (currentKey) {
    if (visited.has(currentKey)) break;
    visited.add(currentKey);
    const entry = breadcrumbConfig[currentKey];
    if (!entry) break;

    items.push({
      key: currentKey,
      label: resolveLabel(entry, ctx),
      href: resolveHref(currentKey, entry, ctx),
      isCurrent: false,
    });

    currentKey = entry.parent;
  }

  return items.reverse().map((item, index, arr) => ({
    ...item,
    isCurrent: index === arr.length - 1,
  }));
}
