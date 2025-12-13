# Supabase + Auth + Subscription Audit

## Executive summary (top issues)
1) **Inconsistent plan gating APIs** – three different `withPlan` helpers (`lib/withPlan.ts`, `lib/plan/withPlan.ts`, `lib/api/withPlan.ts`) resolve plan/tier differently (profiles.plan vs resolveUserPlan vs plan tiers) and accept different bypass roles, creating uneven authorization between pages, API routes, and SSR props. 【F:lib/withPlan.ts†L1-L129】【F:lib/plan/withPlan.ts†L1-L142】【F:lib/api/withPlan.ts†L1-L116】
2) **Service-role fallback in general auth utility** – `lib/authServer.ts` always prepares a service-role client (`supabaseDb`) when the env is set, bypassing RLS for any API that imports it, regardless of caller’s authorization. 【F:lib/authServer.ts†L1-L51】
3) **Browser client exported as default `supabase`** – `lib/supabaseClient.ts` re-exports the browser PKCE client for general consumption, so imports named `supabase` in shared code risk being used during SSR or server contexts inadvertently. 【F:lib/supabaseClient.ts†L1-L1】【F:lib/supabaseBrowser.ts†L1-L71】
4) **Middleware relies on internal fetch** – auth middleware calls `/api/internal/auth/state` using incoming cookies; any network failure silently treats the user as anonymous, so protected routes may flash or mis-redirect during transient outages. 【F:middleware.ts†L69-L200】【F:pages/api/internal/auth/state.ts†L20-L64】
5) **Premium PIN bypass precedes login checks** – `/premium` paths only require the `pr_pin_ok` cookie and skip authentication entirely, allowing unauthenticated access to premium UI without subscription verification. 【F:middleware.ts†L133-L161】
6) **Environment strictness mismatch** – `lib/env.ts` requires both `SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` even though runtime helpers already fall back between them, leading to build-time failures in environments that only supply one. 【F:lib/env.ts†L45-L109】
7) **Server client creation duplicates** – legacy `lib/supabaseSSR.ts` and new `lib/supabaseServer.ts` coexist; pages still import both patterns, increasing risk of cookie/header inconsistencies and duplicated configuration. 【F:lib/supabaseSSR.ts†L1-L29】【F:lib/supabaseServer.ts†L401-L485】
8) **Role resolution differences** – middleware resolves role via `profiles.role` or metadata, while `withPlan` variants read either `profiles.role`, `user_roles.role`, or omit role entirely, so redirects/allow lists can diverge. 【F:middleware.ts†L181-L199】【F:lib/plan/withPlan.ts†L69-L124】【F:lib/withPlan.ts†L21-L129】
9) **Auth state API lacks error hardening** – `/api/internal/auth/state` returns 200 unauthenticated when Supabase errors occur, so middleware cannot distinguish token expiration vs infra issues; no retry/backoff. 【F:pages/api/internal/auth/state.ts†L20-L64】
10) **Public env values used for server auth helper** – `lib/authServer.ts` uses `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` for server-side client creation, risking accidental use of public keys instead of server-only URL if these diverge. 【F:lib/authServer.ts†L6-L39】

## Security risks
- **Service-role leakage into business logic**: `supabaseDb` in `lib/authServer.ts` defaults to the service role whenever the env is present, meaning any API using this helper bypasses RLS even for read paths; recommends scoping service usage to explicit admin flows only. 【F:lib/authServer.ts†L31-L51】
- **Unauthenticated premium access**: middleware’s PIN gate allows `/premium` subtree for anyone with the cookie, without subscription verification or user identity, potentially exposing premium content. 【F:middleware.ts†L133-L161】
- **Multiple client factories without clear boundaries**: coexistence of `lib/supabaseSSR.ts`, `lib/supabaseServer.ts`, and `lib/supabaseClient.ts` encourages accidental use of browser clients in server code and vice versa; no lint/guard preventing misuse. 【F:lib/supabaseSSR.ts†L1-L29】【F:lib/supabaseBrowser.ts†L6-L71】【F:lib/supabaseServer.ts†L401-L512】

## Auth flow inconsistencies
- **Login/redirect sources**: middleware redirects unauthenticated users to `/login?next=…`, while `lib/withPlan` redirects SSR/API failures to `/pricing?required=…` and login to `/login` without preserving `next`, creating divergent post-login landing behavior. 【F:middleware.ts†L164-L179】【F:lib/withPlan.ts†L73-L84】
- **Role detection**: middleware trusts `profiles.role` or metadata; `lib/plan/withPlan` also checks `user_roles` table, but `lib/withPlan` only checks `profiles`, so role-based bypass differs between API handlers and SSR guards. 【F:middleware.ts†L181-L199】【F:lib/plan/withPlan.ts†L69-L88】【F:lib/withPlan.ts†L21-L129】
- **Session fallback behavior**: middleware treats any fetch failure as unauthenticated, while `lib/withPlan` treats Supabase auth errors as 401/redirect; missing shared error handling increases risk of loops or silent access loss. 【F:middleware.ts†L69-L200】【F:lib/withPlan.ts†L38-L124】

## Subscription gating issues
- **Multiple plan resolvers**: `lib/withPlan` uses `resolveUserTier` (tier-based), `lib/plan/withPlan` uses `resolveUserPlan` (plan id) with legacy aliases, and `lib/api/withPlan` reads `profiles.plan`, leading to different required-plan comparisons across surfaces. 【F:lib/withPlan.ts†L4-L124】【F:lib/plan/withPlan.ts†L1-L140】【F:lib/api/withPlan.ts†L1-L116】
- **Bypass roles differ**: API `withPlan` defaults to allow `admin` (and `teacher` for master) while SSR `withPlan` requires explicit `allowRoles`; users may be blocked on pages but allowed via API. 【F:lib/api/withPlan.ts†L80-L110】【F:lib/withPlan.ts†L90-L129】
- **Upgrade path divergence**: SSR `withPlan` redirects to `/pricing?required=…`, API `withPlan` returns 402 JSON with upgrade URL, and middleware doesn’t pass through required tier info, so UX varies by entry point. 【F:lib/withPlan.ts†L68-L121】【F:lib/api/withPlan.ts†L102-L116】【F:middleware.ts†L164-L200】

## SSR guard issues
- **Protected routes list is static**: middleware only guards prefixes enumerated in `PROTECTED_PREFIXES`, leaving routes like `/ai`, `/coach`, or other new features unguarded unless manually added. Risk of regressions when new pages are added without middleware updates. 【F:middleware.ts†L17-L44】
- **Middleware relies on auth API**: any failure to reach `/api/internal/auth/state` results in anonymous state, causing SSR data prefetch for protected pages to redirect even if valid cookies exist; no retry or cache fallback. 【F:middleware.ts†L69-L106】
- **Premium section bypass**: `/premium` content is exempt from auth when PIN cookie is set, so SSR pages under that path may render without a Supabase session, missing user context/plan checks. 【F:middleware.ts†L133-L161】

## Env var issues
- **Over-strict schema**: `lib/env.ts` mandates both `SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` though helpers already fall back; deployments with only one value will fail validation despite workable runtime behavior. 【F:lib/env.ts†L45-L109】
- **Server helpers use public keys**: `lib/authServer.ts` uses `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, not the server URL/key, so discrepancies between public and private endpoints wouldn’t be caught. 【F:lib/authServer.ts†L6-L39】

## Recommended refactor plan (phased)
1. **Unify Supabase client factories**: consolidate on `lib/supabaseServer.ts` for server/SSR, `lib/supabaseBrowser.ts` for client, and deprecate `lib/supabaseSSR.ts` and `lib/authServer.ts`; add lint rule or helper to prevent service-role use in request-scoped handlers. 【F:lib/supabaseSSR.ts†L1-L29】【F:lib/authServer.ts†L31-L51】
2. **Single plan guard module**: merge `lib/withPlan.ts`, `lib/plan/withPlan.ts`, and `lib/api/withPlan.ts` into one implementation with shared plan resolver and role bypass list; expose consistent redirect/response helpers. 【F:lib/withPlan.ts†L1-L129】【F:lib/plan/withPlan.ts†L1-L142】【F:lib/api/withPlan.ts†L1-L116】
3. **Harden middleware**: cache auth state from Supabase directly (using `createMiddlewareClient`) or add retry/backoff when `/api/internal/auth/state` fails; ensure protected routes are derived from a shared config to avoid omissions. 【F:middleware.ts†L17-L200】【F:pages/api/internal/auth/state.ts†L20-L64】
4. **Align env schema**: relax `lib/env.ts` to accept either service key name, and ensure server-only helpers prefer `SUPABASE_URL`/service key while browser uses public values. 【F:lib/env.ts†L45-L109】【F:lib/authServer.ts†L6-L39】
5. **Add subscription verification to premium PIN**: require active Supabase session + plan check when honoring `pr_pin_ok` cookie to avoid unauthenticated premium access. 【F:middleware.ts†L133-L161】

## Auth/Subscription touchpoints (inventory)
- Supabase clients: `lib/supabaseBrowser.ts`, `lib/supabaseClient.ts`, `lib/supabaseServer.ts`, `lib/supabaseSSR.ts`, `lib/supabaseAdmin.ts`, `lib/supabaseService.ts`, `lib/authServer.ts`. 【F:lib/supabaseBrowser.ts†L1-L71】【F:lib/supabaseServer.ts†L401-L512】【F:lib/supabaseSSR.ts†L1-L29】【F:lib/supabaseAdmin.ts†L1-L80】【F:lib/supabaseService.ts†L1-L22】【F:lib/authServer.ts†L1-L51】
- Middleware/auth API: `middleware.ts`, `pages/api/internal/auth/state.ts`. 【F:middleware.ts†L1-L200】【F:pages/api/internal/auth/state.ts†L20-L64】
- Auth context: `context/UserContext.tsx` uses browser client for session/role. 【F:context/UserContext.tsx†L1-L94】
- Plan guards: `lib/withPlan.ts`, `lib/plan/withPlan.ts`, `lib/api/withPlan.ts`, usages across API/pages (e.g., writing drill/review SSR). 【F:lib/withPlan.ts†L1-L129】【F:lib/plan/withPlan.ts†L1-L142】【F:lib/api/withPlan.ts†L1-L116】【F:pages/writing/drills/[slug].tsx†L15-L213】
- Subscription UI: `pages/account/subscription.tsx`, billing/portal API routes (e.g., `pages/api/subscriptions/portal.ts`). 【F:pages/account/subscription.tsx†L85-L218】【F:pages/api/subscriptions/portal.ts†L1-L116】
