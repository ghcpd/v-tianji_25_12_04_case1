# E-commerce Frontend Codebase — Architectural Ambiguity Review


## Ambiguity: Product domain and branding mismatch
**Question:** Is this codebase intended for an e-commerce frontend or an enterprise analytics dashboard?
**Context:**
- `package.json` → `"name": "enterprise-dashboard"`, `"description": "Enterprise analytics dashboard application"`
- `src/components/Layout/Sidebar.tsx` → logo label `"Enterprise"`
- Features/endpoints center on analytics (`/api/analytics`, `/api/metrics`) and user management, with no e-commerce domain artifacts
**Impact:** Misaligned product scope can drive conflicting requirements, UX decisions, and API contracts; onboarding and documentation may diverge from actual domain.
**Discussion Points:**
- Confirm the target product domain and rename artifacts accordingly
- Align navigation, copy, and API endpoints with the confirmed domain
- Update documentation and backlog to match the agreed scope


## Ambiguity: Authentication flow entry point and token strategy
**Question:** How are users expected to authenticate, and how are tokens propagated across API calls?
**Context:**
- `src/components/Layout/Layout.tsx` gates all content: `if (!user) return <div className="auth-required">Authentication required</div>`
- `src/contexts/AuthContext.tsx` exposes `login/logout/refreshUser` and seeds state from `localStorage`, but no route/component invokes `login`
- `src/services/authService.ts` defines `validateToken` and `refreshToken(userId)` (no token), yet services and stores make unauthenticated `fetch` calls
**Impact:** Users cannot access the app without a pre-seeded `localStorage` user; token validation/propagation is undefined, risking security gaps and brittle session handling.
**Discussion Points:**
- Define the authentication UX (login route, forms, redirects) and session bootstrap flow
- Decide on token storage/refresh strategy and inject auth headers into all API calls
- Clarify responsibility for `validateToken` and error handling on expired/invalid tokens


## Ambiguity: User model consistency across modules
**Question:** Are the `User` shapes in auth, user management, and UI meant to represent the same entity, and which fields are canonical?
**Context:**
- `src/contexts/AuthContext.tsx` → `User` includes `permissions: string[]` and `role: 'admin'|'user'|'viewer'`
- `src/services/userService.ts` → `User` includes `status`, `lastLogin: Date|null`, `role: string` (no `permissions`)
- `src/components/Users/*` redefine `User` locally; `Sidebar` relies on `hasPermission` and `user.role`
**Impact:** Divergent models lead to runtime assumptions (e.g., missing `permissions`), duplicated types, and inconsistent permission gating.
**Discussion Points:**
- Establish a shared domain model for `User` (types/interfaces) and reuse it across layers
- Define how permissions are sourced (backend payload vs derived) and ensure availability wherever required
- Clarify whether `role` is an enum or free-form string and align services accordingly


## Ambiguity: HTTP client strategy (fetch vs apiUtils vs axios)
**Question:** Should the codebase standardize on the handcrafted `apiUtils`, `axios`, or raw `fetch`?
**Context:**
- `src/utils/apiUtils.ts` provides `createApiClient`, `handleApiError`, `retryRequest`
- `package.json` lists `axios` and `clsx` as dependencies, but neither is used
- Services (`authService`, `analyticsService`, `userService`), `store/dashboardStore.ts`, and `pages/Settings.tsx` all call `fetch` directly with ad-hoc error handling
**Impact:** Inconsistent request/response handling, duplicated error logic, and difficulty injecting cross-cutting concerns (auth headers, retries, logging).
**Discussion Points:**
- Pick a single HTTP abstraction and migrate calls to it
- Define response/error shapes and retry semantics
- Remove unused dependencies or adopt them intentionally


## Ambiguity: Metrics/analytics data access and typing
**Question:** Should metrics be sourced via `analyticsService.getMetrics` or directly in `dashboardStore.fetchMetrics`, and what is the canonical `Metric` shape?
**Context:**
- `src/services/analyticsService.ts` exposes `getMetrics(startDate, endDate, granularity): Promise<any[]>` (unused)
- `src/store/dashboardStore.ts` posts to `/api/metrics` with `{ timeRange, filters }` and stores `data.metrics` without converting `timestamp` strings to `Date`
- `Metric` is redefined in `store` and multiple components; `timestamp` typed as `Date` but likely serialized
**Impact:** Duplicate data access paths, untyped payloads, and potential runtime bugs when `timestamp` remains a string; unclear single source of truth for metrics.
**Discussion Points:**
- Consolidate metric fetching into one service/store pathway
- Define and share a `Metric` type, including serialization/deserialization rules
- Clarify the contract for `getMetrics` vs `/api/metrics` payloads


## Ambiguity: Formatting and date utility usage
**Question:** Should components rely on shared formatting utilities (`dateUtils`, `formatUtils`) or implement formatting inline?
**Context:**
- `src/utils/dateUtils.ts` and `src/utils/formatUtils.ts` exist; `date-fns` is installed but unused
- `DataTable` and `UserList` each implement their own `formatDate`; `MetricCard` formats numbers ad hoc
- Formatting utilities are not imported anywhere
**Impact:** Duplicated logic, inconsistent UX (dates/numbers), and unused dependencies/abstractions.
**Discussion Points:**
- Decide on a standard formatting library/pattern and apply it consistently
- Remove or adopt `date-fns`/utilities; centralize formatting helpers


## Ambiguity: Settings persistence contract
**Question:** Are settings user-specific or global, and how should defaults be sourced and saved?
**Context:**
- `src/pages/Settings.tsx` initializes hardcoded defaults in local state; no initial fetch from `/api/settings`
- `handleSave` POSTs the entire `settings` object without typing the response or handling failures beyond `alert`
- Profile fields are read-only from `useAuth.user`, with no linkage to persisted preferences
**Impact:** Potentially overwriting server defaults, unclear ownership (user vs org), and brittle error handling.
**Discussion Points:**
- Define the settings schema and scope (per-user vs global)
- Load initial settings from the backend and reconcile with defaults
- Specify error/reporting behavior and optimistic vs pessimistic updates


## Ambiguity: Navigation header content vs current route
**Question:** How should the header reflect the active route or page context?
**Context:**
- `src/components/Layout/Header.tsx` renders a static title "Dashboard" for all pages
- `Layout` wraps `Dashboard`, `Analytics`, `Users`, `Settings`; `Sidebar` highlights routes correctly
**Impact:** Inaccurate page context in the header can confuse users and require manual updates when routes change.
**Discussion Points:**
- Introduce route-aware header titles (route metadata or context)
- Decide whether the header should show breadcrumbs/actions per page


## Ambiguity: Permission enforcement layer
**Question:** Should permissions be enforced only in navigation or also at the route/component level?
**Context:**
- `Sidebar` filters menu items via `hasPermission`
- Pages (`src/pages/Users.tsx`, `Analytics.tsx`, `Settings.tsx`) do not perform permission checks; direct navigation could bypass UI gating
- `Layout` checks only for authenticated `user`
**Impact:** Unauthorized access pathways if frontend relies solely on nav filtering; inconsistent UX when permissions are missing.
**Discussion Points:**
- Decide on client-side route guards/higher-order components for permissions
- Align with backend authorization and error handling for forbidden responses
- Standardize how permission requirements are declared and consumed
