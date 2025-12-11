# EPIC-1 — Mock Layout Unification (Tasks 1.1–1.4)

Structured tasks for EPIC-1 tailored for a Notion-style board. Each task lists the epic context, section, status, deliverables, and completion checks.

---

## Task 1.1 — Detect All `/mock/*` Routes in AppLayoutManager
- **Epic:** EPIC-1 — Mock Layout Unification
- **Section:** 1 — AppLayoutManager Upgrade (Root-Level Architecture)
- **Status:** To Do
- **Priority:** High
- **Goal:** Make the layout auto-wrap mock routes without touching each page individually.
- **Deliverables:**
  - Add `isMockRoute = pathname.startsWith('/mock')` stored near the top of the component.
  - Ensure detection works for `/mock`, `/mock/...`, `/mock/listening/exam/[slug]`, and all nested mock structures.
- **Completion Criteria:** Mock route detection works universally without per-page changes and remains easy to read at the component entry point.

## Task 1.2 — Wrap Mock Pages With `<MockPortalLayout>`
- **Epic:** EPIC-1 — Mock Layout Unification
- **Section:** 1 — AppLayoutManager Upgrade (Root-Level Architecture)
- **Status:** To Do
- **Priority:** High
- **Goal:** Replace `<Layout>` with `<MockPortalLayout>` only for mock routes.
- **Deliverables:**
  - Conditional wrapper:
    ```tsx
    return isMockRoute
      ? <MockPortalLayout>{page}</MockPortalLayout>
      : <Layout>{page}</Layout>;
    ```
  - Ensure no global header/footer inside exam pages and that `MockPortalLayout` is the parent shell for everything under `/mock`.
- **Completion Criteria:** All mock routes render inside `MockPortalLayout`, while non-mock routes keep the standard layout with no duplicate global chrome in exam contexts.

## Task 1.3 — Remove Duplicate Layout Logic From Individual Pages
- **Epic:** EPIC-1 — Mock Layout Unification
- **Section:** 1 — AppLayoutManager Upgrade (Root-Level Architecture)
- **Status:** To Do
- **Priority:** High
- **Goal:** Clean pages that import their own mock layout to avoid double-wrapping.
- **Deliverables:**
  - Search `/pages/mock/**/*.tsx` for `MockPortalLayout` imports and wrappers.
  - Remove layout imports and wrappers, leaving plain page exports, e.g.:
    ```tsx
    const Page = () => { ... }
    export default Page;
    ```
- **Completion Criteria:** No mock page contains its own layout wrapper; layout responsibility sits solely in `AppLayoutManager`.

## Task 1.4 — Create a Type-Safe Layout Boundary
- **Epic:** EPIC-1 — Mock Layout Unification
- **Section:** 1 — AppLayoutManager Upgrade (Root-Level Architecture)
- **Status:** To Do
- **Priority:** High
- **Goal:** Let `MockPortalLayout` enforce strict boundaries so mock pages avoid global navigation and footer.
- **Deliverables:**
  - Add a dedicated wrapper in `MockPortalLayout`:
    ```tsx
    <div className="min-h-screen bg-app-mock">{children}</div>
    ```
  - Prevent any navigation that belongs to non-mock space.
- **Completion Criteria:** `MockPortalLayout` clearly isolates mock surfaces with the `bg-app-mock` wrapper and excludes non-mock navigation elements.
