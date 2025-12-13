# PR task list

## PR1 – Safe fixes (imports, guards, redirects)
- **Scope**: middleware, auth state API, Supabase client imports.
- **Files**: `middleware.ts`; `pages/api/internal/auth/state.ts`; `lib/supabaseClient.ts`; `lib/supabaseSSR.ts` usages.
- **Changes**:
  - Use a single middleware Supabase helper (or add retry/backoff) instead of silent anonymous fallback when `/api/internal/auth/state` fails.
  - Require active Supabase session for `/premium` routes even when `pr_pin_ok` is set.
  - Remove/replace remaining `lib/supabaseSSR.ts` imports with `lib/supabaseServer.ts` to avoid duplicated client configuration.
  - Clarify `supabase` default export (browser-only) and ensure server code imports server helpers instead.
- **Acceptance criteria**:
  - Middleware redirects authenticated users consistently and logs/handles auth API failures without downgrading sessions.
  - Premium routes render only when both PIN and Supabase auth are present; otherwise redirect to login/PIN flow.
  - No references to `lib/supabaseSSR.ts` remain; server code uses server client factory.
  - Browser-only client is not imported in server-only modules (lint or code-level guard).

## PR2 – Subscription module alignment
- **Scope**: plan guards and plan resolution utilities.
- **Files**: `lib/withPlan.ts`; `lib/plan/withPlan.ts`; `lib/api/withPlan.ts`; shared plan resolver module.
- **Changes**:
  - Consolidate guard logic into a single module that supports API/SSR with consistent plan resolution and role bypass rules.
  - Standardize plan source (e.g., `resolveUserPlan` + tier mapper) and align upgrade responses/redirects.
  - Add shared error handling so auth errors differentiate between expired sessions vs infra failures.
- **Acceptance criteria**:
  - Only one exported `withPlan` entrypoint remains and is reused across API routes and pages.
  - Role bypass rules match across middleware/guards (admins/teachers configurable, defaults documented).
  - Plan comparison logic and upgrade messaging are uniform (same required tier, redirect, and API payload shape).

## PR3 – Refactor shared auth utilities
- **Scope**: Supabase client factories, env schema, service-role usage.
- **Files**: `lib/supabaseServer.ts`; `lib/supabaseBrowser.ts`; `lib/authServer.ts`; `lib/env.ts`; any service-role call sites.
- **Changes**:
  - Deprecate `lib/authServer.ts` or gate service-role creation behind explicit admin-only callers; ensure default server client uses anon key with RLS.
  - Update env validation to accept either `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (one required) and prefer server URLs for server helpers.
  - Add documentation and helper wrappers clarifying when to use browser vs server vs service clients; consider eslint rule to block service role in client bundles.
- **Acceptance criteria**:
  - No generic helpers default to service-role clients; service usage is opt-in and scoped.
  - Env validation passes when a single service credential is provided; server helpers pull from server-only envs.
  - Developer docs/code comments explain client selection, and automated checks/lints prevent misuse.
