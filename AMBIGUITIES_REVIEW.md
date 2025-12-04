# E-commerce Frontend Codebase — Architectural Ambiguity Review

**Scope:** Review of frontend codebase to identify unclear or conflicting architectural decisions. Findings below contain only observed ambiguities (no code changes or remediation proposals).

---

Ambiguity: State management strategy (Zustand vs React Context)

Question: Which state management approach should be the standard for global/shared state: lightweight stores (Zustand) or React Context, and where should each be used?

Context:
- Files: `src/store/dashboardStore.ts`, `src/contexts/AuthContext.tsx`, `src/pages/Dashboard.tsx`
- Excerpts:
  - `dashboardStore.ts` defines a Zustand store with methods and direct data fetching: `export const useDashboardStore = create<DashboardState>()(...)` and `fetchMetrics: async () => { ... fetch('/api/metrics', ...) }`
  - `AuthContext.tsx` provides authentication state and methods via React Context: `const AuthContext = createContext<AuthContextType | undefined>(undefined)` and `AuthProvider` persisting to `localStorage`
- Inconsistent patterns: global UI state (dashboard metrics, filters) is handled by a Zustand store, while auth state is handled via Context; some page-level states still use useState (pages/Analytics.tsx)

Impact:
- Confusion about where new global state should live; duplicated patterns may lead to fractured mental models for developers
- Onboarding friction and inconsistent performance characteristics (Context re-renders vs store granularity)

Discussion Points:
- Establish a clear guideline: which types of state belong in stores, context, or local component state
- Agree on criteria (size, frequency of updates, cross-cutting concerns) to choose one mechanism
- Decide if data fetching belongs inside stores or outside (see Data Fetching ambiguity)

---

Ambiguity: Data fetching responsibility (services vs stores vs components)

Question: Where should data fetching live (service classes, stores like Zustand, or at the page/component level)?

Context:
- Files: `src/store/dashboardStore.ts`, `src/services/*Service.ts`, `src/pages/Analytics.tsx`, `src/pages/Users.tsx`
- Excerpts:
  - `dashboardStore.fetchMetrics` performs a `fetch('/api/metrics', ...)` directly within the store
  - `userService.getUsers` and `analyticsService.getAnalytics` each call `fetch` inside service classes
  - `Analytics.tsx` invokes `analyticsService.getAnalytics(filters)` from a page-level useEffect
- Contradiction: Some features fetch inside service classes and are invoked by pages; the dashboard store fetches data internally instead of delegating to a service or to page-level logic

Impact:
- Unclear single source of truth for API interactions; duplicated endpoint strings and error logic
- Harder to standardize retries, logging, and error handling if fetch logic is spread across services, stores, and components
- Increases maintenance cost when endpoints change or when adding cross-cutting behaviors (auth headers, retries)

Discussion Points:
- Decide whether stores should orchestrate fetching or simply hold state updated by service-driven calls
- Agree on a canonical flow for fetch: page -> service -> store, or store -> service, etc.
- Determine how to centralize concerns such as auth headers, retries, and telemetry for all fetches

---

Ambiguity: Inconsistent use of the API client utilities

Question: Should `createApiClient` and `handleApiError` in `src/utils/apiUtils.ts` be the canonical way to call APIs, and if so, why are many services and stores directly calling `fetch` instead?

Context:
- Files: `src/utils/apiUtils.ts`, `src/services/*.ts`, `src/store/dashboardStore.ts` 
- Excerpts:
  - `apiUtils.ts` exposes `createApiClient`, typed responses, `handleApiError`, and `retryRequest`
  - `userService`, `authService`, `analyticsService`, and `dashboardStore` use raw `fetch` with duplicate headers and logic (e.g., `headers: { 'Content-Type': 'application/json' }` repeated)
- Pattern: utilities exist but are not uniformly adopted

Impact:
- Missed opportunity to centralize error handling, response normalization, and observability
- Increased risk of inconsistent behavior across API calls (different error messages or retry semantics)

Discussion Points:
- Decide whether to mandate use of `createApiClient` across all services and stores
- If keeping raw `fetch` in some places, define clear exceptions and document them
- Align on standardized response shapes and error handling patterns

---

Ambiguity: Typing and domain model inconsistencies

Question: What typing standards and domain models should be enforced — strict TypeScript interfaces/DTOs vs liberal use of `any`/`Record<string, any>`?

Context:
- Files: `src/store/dashboardStore.ts`, `src/components/Analytics/FilterPanel.tsx`, `src/utils/apiUtils.ts`, `src/services/*`
- Excerpts:
  - `filters: Record<string, any>` in `DashboardState`, `AnalyticsService.getAnalytics(filters: Record<string, any>)`, `FilterPanel` props
  - `userService` maps `data.users.map((user: any) => ...)` and several functions return `Promise<any[]>` or `Promise<any>`
  - Validation utilities use `value: any`
- Contradiction: Some interfaces are explicitly defined (`interface User`, `interface Metric`), while many boundaries use `any` or `Record<string, any>`

Impact:
- Weak typing reduces compiler protection and leads to runtime bugs during refactors
- Increased uncertainty about API contracts and expected shapes for `filters` and responses

Discussion Points:
- Define and document expected DTOs for main domain entities (User, Metric, AnalyticsData, Filters)
- Require concrete typing for public service/store APIs and avoid `any` in exported function signatures
- Consider leveraging types inferred from API schemas or generate types from backend contracts if possible

---

Ambiguity: Auth token lifecycle and storage responsibilities

Question: Who owns token lifecycle concerns (refresh, storage, validation): `authService`, `AuthContext`, or shared API client/middleware?

Context:
- Files: `src/contexts/AuthContext.tsx`, `src/services/authService.ts`, `src/utils/apiUtils.ts`
- Excerpts:
  - `AuthProvider` persists `user` to `localStorage` and calls `authService.refreshToken(parsedUser.id)` on init
  - `authService` contains `refreshToken(userId: string)` and `validateToken(token: string)` but `createApiClient` does not show token injection or automatic refresh flows
- Contradiction: token/refresh logic is split between the auth service and the React context, while no central middleware handles attaching tokens to outgoing requests

Impact:
- Risk of missing or inconsistent token attachment for API calls, potential 401 handling gaps
- Duplication of refresh logic and unclear failure recovery paths

Discussion Points:
- Agree on a single owner for token management and refresh (service + middleware, or context-driven with hooks into API client)
- Define where to store tokens (localStorage vs httpOnly cookies) and how to rotate/refresh them securely
- Decide on mechanism for global 401 handling, request retries, and forced logout

---

Ambiguity: Filter data modeling and propagation

Question: What is the canonical structure and lifecycle for `filters` across components, pages, services, and stores?

Context:
- Files: `src/components/Analytics/FilterPanel.tsx`, `src/pages/Analytics.tsx`, `src/store/dashboardStore.ts`, `src/services/analyticsService.ts`
- Excerpts:
  - `FilterPanel` uses `filters: Record<string, any>` and updates via `onChange(newFilters)`
  - `Analytics.tsx` keeps `filters` in local state and passes them to `analyticsService.getAnalytics(filters)`
  - `dashboardStore` keeps `filters` in state and calls `fetchMetrics()` when `setFilters` is invoked
- Contradiction: filters exist in multiple places with unfixed shape and unclear ownership and validation

Impact:
- Bugs where filters diverge across features, or where downstream consumers expect different key names/semantics
- Hard to add new filter types without updating multiple contracts

Discussion Points:
- Define a shared Filter type and document allowed keys and value types
- Decide the canonical owner for filters (global store vs page-level) and how to synchronize when shared
- Establish validation and serialization rules for server requests

---

Ambiguity: Styling conventions and component CSS strategy

Question: Should the codebase use global component-level CSS files, CSS modules, or a design system (tokens/CSS-in-JS)?

Context:
- Files: `src/components/**/*.css`, `src/pages/*.css`
- Excerpt patterns: each component imports a plain CSS file (e.g., `import './SearchBar.css'`, `import './FilterPanel.css'`). Pages use global class names like `className="analytics-header"`
- Missing artifacts: no consistent variables/themes or token usage; no CSS modules or clear naming conventions beyond simple class names

Impact:
- Potential CSS clashes and scaling challenges as the app grows
- Inconsistent visual language and difficulty enforcing design tokens or responsive behavior

Discussion Points:
- Choose an approach (plain CSS, CSS Modules, styled-components, Tailwind, or design tokens) and define naming conventions
- Decide on a theming mechanism and how colors/spacing should be centralized
- Establish guidelines for responsive behaviors and utility classes vs component styles

---

Ambiguity: Internationalization and formatting strategy

Question: Is internationalization (i18n) and locale-aware formatting required, and if so, how will it be integrated?

Context:
- Files: `src/utils/dateUtils.ts`, UI strings in components and pages (hard-coded English)
- Excerpts:
  - `dateUtils.ts` uses `toLocaleDateString('en-US', {...})` and `toLocaleString('en-US', {...})`
  - All labels, options, and messages are English-only in code (e.g., `h1>Analytics</h1>`, `Clear` button)
- Contradiction: No i18n tooling or string extraction present; locale explicitly hard-coded

Impact:
- Difficult to support multiple locales; potential UX issues for non-US users
- Added future migration cost if the product needs multi-language support

Discussion Points:
- Decide whether i18n is required and select a library/approach (react-intl, i18next, etc.)
- Replace hard-coded formats with locale-configurable utilities and loadable translation strings
- Determine scope and timeline for retrofitting existing UI strings

---

Ambiguity: Service instantiation and dependency injection

Question: Should services be singletons exported as instances (current pattern) or should there be a DI-friendly approach enabling mocking and testing?

Context:
- Files: `src/services/*.ts`
- Excerpts:
  - Services export single instances: `export const authService = new AuthService()`
- Consequence: consumers import singletons directly (pages/stores import `authService`, `userService`, `analyticsService`), which simplifies use but complicates testing/mocking without additional abstraction

Impact:
- Harder to replace service implementations in tests or to inject alternative implementations (e.g., for feature flags, pluggable backends)
- Tight coupling increases risk when changing initialization behavior (adding config, interceptors)

Discussion Points:
- Decide whether to retain singleton exports for simplicity or move to a factory/DI pattern
- If keeping singletons, define a pattern for test-time stubbing or a wrapper that allows swapping implementations
- Consider a centralized initialization path for services to apply cross-cutting concerns (auth headers, base URLs)

---

Ambiguity: Error handling and message propagation

Question: What is the consistent error handling and user-facing messaging strategy (throw errors, return structured errors, or use result objects)?

Context:
- Files: `src/utils/apiUtils.ts`, service methods, pages like `Analytics.tsx` and `Dashboard.tsx`
- Excerpts:
  - `apiUtils.request` returns `{ data, error?: string, status }` while many service functions `throw new Error('...')` on non-ok responses
  - Pages capture exceptions differently: `setError(err instanceof Error ? err.message : '...')` or console.log/ignored cases
- Inconsistency: mixed styles — structured responses vs thrown exceptions; inconsistent mapping to user messages

Impact:
- Inconsistent user feedback and duplicated error-to-message mapping logic across consumers
- Harder to implement global error tracking, retry policies, or A/B error behaviors

Discussion Points:
- Define a unified error contract for services (throw vs return structured result) and enforce it across the codebase
- Standardize mapping from internal errors to user-visible messages and logging/telemetry hooks
- Decide how to handle transient vs fatal errors and retry policies across layers

---

End of findings. This file contains only observed ambiguities and evidence collected from the current codebase. No modifications were made to source files.
