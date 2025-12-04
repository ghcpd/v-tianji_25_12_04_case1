Ambiguities for E-commerce Frontend Codebase — Architectural Ambiguity Review

Ambiguity: Inconsistent HTTP client usage (native fetch vs. centralized api client)
Question: Should the codebase standardize on a single API client abstraction (e.g., `createApiClient` / `apiUtils`) or allow ad-hoc use of the native `fetch` in services and stores?
Context: 
- `src/utils/apiUtils.ts` defines `createApiClient` with request wrappers, `retryRequest`, and `handleApiError`.
- Many service files and the zustand store call `fetch` directly instead of using the utility: 
  - `src/services/authService.ts` uses `fetch(${this.baseUrl}/login...)` directly.
  - `src/services/userService.ts` uses `fetch(this.baseUrl)` and manual JSON parsing.
  - `src/services/analyticsService.ts` uses `fetch(${this.baseUrl}/data...)` directly.
  - `src/store/dashboardStore.ts` uses `fetch('/api/metrics'...)` directly inside `fetchMetrics`.
- `src/utils/apiUtils.ts` has conventions for returning `{ data, status, error }` while direct `fetch` call sites handle `response.ok` and `response.json()` ad-hoc.
Impact:
- Inconsistent error shapes and handling across code: some layers expect a normalized ApiResponse, others expect raw JSON or throw errors.
- Duplicate logic for headers, JSON parsing, error messages, and retries increases maintenance burden and bugs.
- Harder to implement cross-cutting concerns (auth token injection, logging, retry/backoff) when calls are spread across ad-hoc fetches.
- Tests and mocks become inconsistent: some tests would mock the api client, others must intercept `fetch`.
Discussion Points:
- Decide on a single source of truth for HTTP requests (use `createApiClient` everywhere vs. keep services as simple wrappers).
- Define a contract: standard response shape and error model across services.
- Plan a migration strategy and deprecation timeline for ad-hoc `fetch` calls.
- Decide where to handle auth tokens, global headers, and retries (client-level interceptors vs. per-service logic).

Ambiguity: Mixed state management approaches (Zustand store + heavy component-level state)
Question: What is the intended scope for global stores (e.g., `zustand` in `src/store`) versus component-local state? Should shared UI state be centralized or left to local components?
Context:
- `src/store/dashboardStore.ts` implements a `zustand` store for dashboard metrics and lifecycle methods like `fetchMetrics`.
- Pages like `src/pages/Analytics.tsx` and `src/pages/Users.tsx` use component-level `useState` for data and loading states and call services directly (e.g., `analyticsService.getAnalytics`, `userService.getUsers`).
- There is no consistent pattern or guideline about when to use the store vs component state. Only the dashboard uses `zustand`.
Impact:
- Unclear ownership of data and synchronization across components; duplication of fetching logic may produce stale or conflicting UI states.
- Inconsistent debugging and developer experience: some state is reachable via devtools (`DashboardStore`), other state is opaque in components.
- Potential duplicated network requests when multiple components fetch the same data independently.
Discussion Points:
- Define guidelines for what belongs in the global store (e.g., cross-page, shared, or cached data) vs local state.
- Decide whether data fetching should live in stores (with caching) or remain in pages/components.
- Choose a single state library or document how `zustand` should be used, including conventions for side effects and devtools.
- Consider memoization/caching and request deduplication strategies.

Ambiguity: Duplicate and inconsistent type definitions for `User` and domain models
Question: Where should canonical type definitions (e.g., `User`, `Metric`, API response shapes) live, and which files are the authoritative source?
Context:
- `User` interface appears in multiple files with slight differences: 
  - `src/contexts/AuthContext.tsx` defines `User` with `id, email, name, role: 'admin'|'user'|'viewer', permissions: string[]`.
  - `src/services/userService.ts` defines `User` with `role: string` and `lastLogin: Date | null`.
  - `src/pages/Users.tsx` defines a local `User` type similar to `userService` but repeated.
- `Metric`/analytics types appear in `analyticsService.ts`, `dashboardStore.ts`, and `Analytics.tsx` with overlapping shapes.
Impact:
- Risk of type drift, mismatches, and runtime errors when different parts of the app expect different fields or types (e.g., `lastLogin` as string vs Date).
- Harder to refactor or update API contracts because changes must be propagated to multiple duplicated interfaces.
- Inconsistent developer experience and potential compile-time false negatives if some files don't import shared types.
Discussion Points:
- Decide on a central `types/` or `models/` module for canonical types and export them for use across contexts, services, stores, and components.
- Agree on how to handle server-side vs client-side transformations (e.g., date parsing) and where to convert types like `lastLogin` into `Date` objects.
- Consider publishing shared API response interfaces and using codegen if API is changing frequently.

Ambiguity: Error handling and user feedback patterns are not uniform
Question: Should the application adopt a uniform error handling strategy (e.g., global error boundary + standardized toast/notification service), and where should error normalization occur?
Context:
- `src/utils/apiUtils.ts` returns `{ data, status, error }` while many services throw `Error` when response.ok is false.
- Pages/components handle errors differently: `Analytics.tsx` sets a local `error` string state, `Users.tsx` logs errors to console and shows a loading UI, `dashboardStore.ts` sets `error` state inside the store.
- No centralized notification/toast or error boundary is visible in the codebase.
Impact:
- Inconsistent UX for error cases: some pages display inline messages, others only console.log, some set state in a store.
- Developers may be uncertain whether to surface errors or swallow them, leading to silent failures.
- Hard to implement global retry, telemetry, or Sentry integration without a unified approach.
Discussion Points:
- Define how errors propagate: should services return normalized error objects or throw errors?
- Decide on a global UI mechanism for user-facing errors (toast, modal, inline) and a developer-facing logging policy.
- Choose a single place to integrate telemetry and global error handling (top-level error boundary, API client, or middleware).

Ambiguity: Authentication data storage and token lifecycle handling
Question: Where should authentication tokens and user identity be stored and how should token refresh/validation be handled across services and fetch calls?
Context:
- `AuthContext.tsx` reads `localStorage.getItem('user')` and stores the entire user object in localStorage as a JSON string.
- `authService` exposes `refreshToken(userId: string)` and `validateToken(token: string)` but there is no clear integration between token storage and `fetch` calls across services.
- Services and store `fetch` calls do not include any Authorization header handling; there is no central injection of tokens into requests.
Impact:
- Potential security risk storing full user objects in localStorage; unclear where auth tokens are kept.
- Requests may be unauthenticated if token headers are not included consistently, causing intermittent auth errors.
- Refresh strategy is coupled to a `userId`-based refresh instead of token-based refresh flows; this may not match backend expectations.
Discussion Points:
- Decide what to store in `localStorage` (access token, refresh token, or minimal user info) and prefer secure storage patterns.
- Establish a central middleware or API client responsibility to attach Authorization headers to requests and to transparently handle token refresh.
- Agree on token lifecycle: who triggers refresh, how to queue requests during refresh, and how to handle refresh failures (logout vs retry).

Ambiguity: Date serialization and timezone handling
Question: Where should date parsing and serialization occur to ensure consistent use of `Date` vs string timestamps across services and components?
Context:
- `userService` converts `lastLogin` strings to `Date` objects when mapping server responses.
- `analyticsService.getMetrics` accepts `Date` objects and directly serializes them in `fetch` body using `JSON.stringify({ startDate, endDate, granularity })`.
- `dashboardStore.ts` expects `Metric.timestamp` as `Date` in the interface, but the `fetchMetrics` response handling sets `metrics: data.metrics` without explicit parsing.
Impact:
- Inconsistent date formats may cause serialization bugs, timezone mismatches, or invalid value errors when sending `Date` via JSON.
- Some components may receive `Date` objects while others receive strings, causing runtime errors or unexpected render output.
- Testing date-dependent features becomes harder without a canonical approach.
Discussion Points:
- Decide on a canonical transport format for dates (ISO strings) and a single responsibility for parsing into `Date` objects (service layer vs component layer).
- Define timezone expectations (UTC vs local) and document them.
- Add helper utilities for parsing/serializing dates and decide when to use them.

Ambiguity: CSS and styling conventions (global CSS files vs modular/scoped styles)
Question: Should the project adopt a consistent styling approach (CSS Modules, styled-components, or global CSS) and how should component styles be organized and named?
Context:
- Many components and pages import CSS files with global class names, e.g., `src/pages/Analytics.css`, `src/components/Analytics/AdvancedChart.css`, `src/components/Layout/Layout.css`.
- There is no clear naming convention visible for class names or file scoping; styles are present as global `.css` files next to components.
Impact:
- Risk of style leakage and conflicts as the app grows, since styles are global by default.
- Difficult to reason about component encapsulation and to migrate to CSS-in-JS or modules.
- Lack of documented conventions may slow new contributors and increase regressions due to cascading selectors.
Discussion Points:
- Decide on a styling strategy (continue plain CSS with strict naming, adopt CSS Modules, or use a CSS-in-JS solution).
- If staying with global CSS, adopt a naming convention (BEM or component-prefixed classes) and decide on scoping rules.
- Consider tooling (linting, stylelint, preprocessor) to enforce conventions.

Ambiguity: Shared utilities usage and placement (e.g., `retryRequest` vs local retry logic)
Question: When should developers use shared utilities in `src/utils` (like `retryRequest`) versus writing local logic in services or components?
Context:
- `src/utils/apiUtils.ts` exports `retryRequest` and a generic `createApiClient` but services tend not to consume these utilities.
- `dashboardStore` implements its own retry/backoff behavior implicitly via direct fetch and try/catch.
Impact:
- Reinventing logic in multiple places increases risk of inconsistent behavior and bugs.
- Developers may be unsure where to look for shared helpers and whether they are safe/stable to depend on.
Discussion Points:
- Create guidelines and examples demonstrating how to use `src/utils` helpers.
- Decide which helpers are stable and part of the public app API vs experimental.
- Document code ownership and testing expectations for shared utilities.

Ambiguity: Component responsibilities and prop drilling vs composition
Question: Should components prefer composition and context usage over deep prop drilling, and what conventions should be used for event/callback naming and data flow?
Context:
- `Analytics.tsx` passes `filters` and `onChange` callbacks into `FilterPanel` and `ExportButton` as props.
- `Layout` uses `useAuth` context for auth gating, while other components still receive data via props.
- There's no clear pattern for when to rely on context vs props for sibling communication.
Impact:
- Inconsistent patterns may lead to prop drilling, duplication of state lift-up, or overuse of context.
- Harder to maintain component contracts and to refactor component trees.
Discussion Points:
- Decide when to use context (auth, theme, i18n) vs explicit props for local component coordination.
- Adopt naming conventions for callbacks (onChange vs handleChange) and event payload shapes.
- Consider using a shared UI primitives library and document composition patterns.

End of report.
