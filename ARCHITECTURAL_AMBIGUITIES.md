# E-commerce Frontend Codebase — Architectural Ambiguity Review

This document lists design and architectural ambiguities found in the frontend codebase. Each section contains a concise question, the code context (file paths and relevant excerpts), the potential impact, and discussion points for the engineering team.

---

Ambiguity: Mixed state-management approaches (Zustand, Context, local state)

Question: Should the repository adopt a single global state-management approach (Zustand or React Context) with clear rules about when to use local component state, or are multiple approaches intentionally used for different concerns?

Context:
- Files: `src/store/dashboardStore.ts`, `src/contexts/AuthContext.tsx`, `src/pages/Users.tsx`, `src/components/Analytics/FilterPanel.tsx`
- Examples:
  - `src/store/dashboardStore.ts` uses Zustand to store `metrics`, `filters`, and `fetchMetrics`.
    ```ts
    export const useDashboardStore = create<DashboardState>()(...)
    ```
  - `src/contexts/AuthContext.tsx` uses React Context for authentication state:
    ```tsx
    const AuthContext = createContext<AuthContextType | undefined>(undefined)
    export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
      const [user, setUser] = useState<User | null>(null)
      // ...
    }
    ```
  - Multiple pages and components use local React state widely: `src/pages/Users.tsx` uses `useState` for pagination, loading state and users list.

Inconsistent or contradictory pattern:
- Global state present as Zustand for dashboard-only concerns while authentication uses Context and other domain state is local to pages/components.

Impact:
- Team confusion over where to store shared state (auth, UI, domain data) causing duplicated state and incorrect synchronization.
- Risk of duplicated effects for caching, inconsistent fetching strategies, and increased refactor cost when features span multiple areas.

Discussion Points:
- Decide whether to use Zustand for all cross-cutting/global state, Context for only semantic contexts (theme, auth), or prefer React Query/other solutions for server state.
- Define rules for what belongs in global state vs local state (e.g., caching domain data, UI-only state, auth data).
- Decide how to migrate or integrate current stores and contexts with minimal churn.

---

Ambiguity: Dual approach to HTTP clients — `fetch` vs `axios` and unused `apiUtils` helper

Question: Which HTTP client should be the standard (built-in fetch, axios, or an `apiUtils` wrapper) and should `createApiClient()` and `retryRequest()` be the canonical path for all network calls?

Context:
- Files: `src/utils/apiUtils.ts`, `src/services/*.ts`, `package.json`
- Examples:
  - `src/utils/apiUtils.ts` exports `createApiClient` and `retryRequest` which wrap fetch and return { data, status, error }.
  - Service classes (`src/services/userService.ts`, `src/services/authService.ts`, `src/services/analyticsService.ts`) call `fetch` directly and throw exceptions on non-OK responses.
  - `package.json` lists `axios` as a dependency but repository code does not use axios.

Inconsistent pattern:
- Existence of an API utility but services bypass it; axios included but unused — leads to unclear canonical strategy.

Impact:
- Duplicate error-handling patterns across services.
- Missed opportunities to consolidate retry logic, common headers, auth token injection, and consistent response shape.
- Risk of higher maintenance cost and subtle behavioral differences across modules.

Discussion Points:
- Choose the canonical HTTP client (fetch with shared wrapper vs axios) and deprecate unused options.
- Decide whether `createApiClient` should be used by service implementations and whether it should normalize error shapes and response parsing.
- Standardize retry and backoff strategies and how auth headers or tokens are injected into requests.

---

Ambiguity: Duplicated and inconsistent `User` type definitions across modules

Question: Should the codebase centralize domain types (such as `User`) in a single `types/` or `models/` module to avoid duplication and subtle mismatches between modules?

Context:
- Files with `User` interfaces: `src/contexts/AuthContext.tsx`, `src/services/authService.ts`, `src/services/userService.ts`, `src/components/Users/UserList.tsx`, `src/pages/Users.tsx`.
- Example differences:
  - In `src/contexts/AuthContext.tsx` and `src/services/authService.ts`: `role: 'admin' | 'user' | 'viewer'` and `permissions: string[]`.
  - In `src/services/userService.ts` and `src/components/Users/*`: `role: string` and `status: 'active' | 'inactive' | 'pending'` plus `lastLogin: Date | null`.

Inconsistent pattern:
- Multiple `User` definitions with differing fields and types; duplication across files.

Impact:
- Type mismatches and runtime errors when moving user objects between layers (auth vs user management).
- Difficulties in refactoring, code comprehension, and ensuring cross-module contracts remain valid.

Discussion Points:
- Centralize domain interfaces (User, Metric, etc.) under `src/types/` or `src/models/` and import them across modules.
- Clarify the shape of a `User` (which fields are canonical) and whether admin/viewer roles or status flags are mutually exclusive.
- Agree on how server responses are transformed into domain types (date parsing, optional fields).

---

Ambiguity: Authentication/session model is unclear (stored user vs token handling)

Question: Should the app store user objects in `localStorage` or store an auth token (and optionally refresh tokens), and what is the expected session refresh mechanism?

Context:
- `src/contexts/AuthContext.tsx` stores the user object in `localStorage` (`localStorage.setItem('user', JSON.stringify(userData))`).
- `src/services/authService.ts` exposes `refreshToken(userId: string)` and `validateToken(token: string)` but `refreshToken` accepts a `userId` not a refresh token and returns `User`.

Inconsistent/unclear pattern:
- Storing the full `user` object in localStorage suggests the server doesn't return or use tokens, yet `authService` implements `validateToken` and `refreshToken` methods that imply tokens.
- `refreshToken(userId)` signature is unusual; typical flows use a refresh token rather than a user ID.

Impact:
- Risk of insecure session handling and ambiguity about how sessions are validated across tabs and services.
- Hard to implement token rotation or centralized token renewal if the current storage model is based on serialized user objects.

Discussion Points:
- Choose a session model: token-based (access/refresh tokens) or cookie/session-id approach.
- If token-based: define where tokens are stored (httpOnly cookie vs in-memory/localStorage) and how refresh flow works.
- Decide how `AuthProvider` should validate/refresh sessions and how services authenticate their requests (headers, cookies).

---

Ambiguity: Date handling and serialization inconsistencies

Question: Should the repository standardize date serialization/parsing across all services and layers (strings vs Date objects), and define helper utilities for conversion?

Context:
- `src/services/userService.ts` maps `lastLogin` to a `Date` object explicitly:
  ```ts
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : null
  ```
- `src/store/dashboardStore.ts` defines `timestamp: Date` in `Metric` interface and sets metrics via `set({ metrics: data.metrics })` without explicit date parsing.

Inconsistent pattern:
- Some services convert date strings to Date objects; other modules store and expect Date values without parsing, so behavior may depend on server response format.

Impact:
- Potential runtime errors when UI components assume `Date` objects but receive strings (or vice versa).
- Inconsistent date formatting across components and risk of timezone/serialization bugs.

Discussion Points:
- Decide canonical date serialization format in server responses (ISO strings) and agree on where parsing to Date occurs (service layer vs component layer).
- Provide a shared utility `dateUtils` with documented helpers (parseServerDate, formatDisplayDate) and adopt across services/components.

---

Ambiguity: Error-handling strategy and inconsistent shapes

Question: Should the project adopt a single error-handling strategy and error shape (exceptions vs response objects with { error }) and centralize reporting/logging?

Context:
- `src/utils/apiUtils.ts` returns `{ data, status, error }` consistently.
- Service classes (`userService`, `authService`, `analyticsService`) generally throw `Error('...')` when a response is not OK.

Inconsistent pattern:
- Some modules expect thrown errors; others may expect normalized error objects. No standardized error codes or typed error shapes are used across layers.

Impact:
- UI layers calling different services must handle both thrown exceptions and service-returned error objects, leading to duplicated try/catch blocks.
- Hard to implement global error reporting or telemetry when error shapes are inconsistent.

Discussion Points:
- Choose a canonical error shape and decide whether services should throw exceptions or return normalized result objects with `error` fields.
- Define guidelines for HTTP status handling, retry logic, and user-facing error messages.

---

Ambiguity: Styling conventions and CSS strategy

Question: Should the project adopt a CSS scoping strategy (CSS Modules, BEM naming, CSS-in-JS) and document conventions for shared utilities, or remain with global component-scoped `.css` files?

Context:
- Files: Many files under `src/components/*/*.css` (e.g., `src/components/Users/UserList.css`, `src/components/Layout/Sidebar.css`).
- Pattern: Plain `.css` files are used; no CSS Modules or styled-components. Classnames like `.user-name`, `.user-email` appear across multiple components.

Inconsistent pattern:
- Potential collisions or lack of clear scoping rules; repeated styles like `text-transform: capitalize` in multiple files.

Impact:
- Risk of global stylesheet collisions and difficulty scaling the styles as the app grows.
- Hard to reuse common styles or theme tokens without duplication.

Discussion Points:
- Choose a strategy for scoping and naming (CSS Modules vs BEM vs CSS-in-JS) and adopt a set of style tokens and common utilities.
- Consider introducing shared `styles` directory for common variables, utilities, and mixins.

---

Ambiguity: Unused or undocumented utilities and dependencies

Question: Which utilities and dependencies are intended to be used or removed (e.g., `axios`, `retryRequest`), and should the README explicitly document architectural decisions?

Context:
- `package.json` lists `axios` but code uses `fetch` and `apiUtils` instead.
- `src/utils/apiUtils.ts` exports `retryRequest` which is not used by services.

Impact:
- Unclear maintenance scope: removing or keeping dependencies, misalignment between docs and implementation, and confusion during dependency security upgrades.

Discussion Points:
- Audit dependencies and remove unused ones (or adopt them across the codebase if preferred).
- Update README to state architectural decisions for HTTP client, state management, and type centralization.

---

Notes

- The above findings are intentionally descriptive and do not propose direct code changes.
- Team should review each ambiguity and decide on a canonical approach before any refactor or feature work that hinges on these choices.

Generated: December 4, 2025
