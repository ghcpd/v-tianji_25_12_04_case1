# E-commerce Frontend Codebase — Architectural Ambiguity Review

## Overview
This document identifies design and architectural ambiguities discovered through static analysis of the frontend codebase. Each ambiguity represents an unclear or potentially conflicting architectural decision that requires team discussion and clarification.

---

## Ambiguity 1: Dual State Management Patterns

**Ambiguity:** Use of both Context API and Zustand for state management with unclear separation of concerns

**Question:** What is the intended boundary between Context API state (AuthContext) and Zustand store (dashboardStore)? Should user authentication and dashboard metrics be managed in the same pattern, or is this separation intentional based on specific criteria?

**Context:**
- `src/contexts/AuthContext.tsx`: Uses Context API with useState for user authentication state, including `user`, `isLoading`, and methods like `login()`, `logout()`, `refreshUser()`
- `src/store/dashboardStore.ts`: Uses Zustand with middleware (devtools) for dashboard metrics, including `metrics`, `selectedTimeRange`, `filters`, and `fetchMetrics()`
- Both manage loading states (`isLoading`) and async operations independently
- No documentation indicates why Context API was chosen for auth and Zustand for dashboard

**Impact:**
- Inconsistent state management patterns across the application make it harder for developers to understand which tool to use for new features
- Performance implications differ: Context triggers re-renders on all consumers; Zustand allows selective subscription
- Developers may duplicate patterns or make incorrect choices when adding new state features
- Team onboarding becomes more complex when the rationale isn't documented

**Discussion Points:**
- Is the choice of Context API for auth motivated by simplicity or other specific factors?
- Should dashboard metrics eventually migrate to Context API for consistency, or is Zustand preferred for specific performance reasons?
- Should other feature state (Settings, Analytics filters) follow the same pattern as dashboard or auth?
- Should a decision matrix be documented for when to use each pattern in future development?

---

## Ambiguity 2: Inconsistent Error Handling Across Services

**Ambiguity:** Services implement error handling inconsistently without a unified error handling strategy

**Question:** Should all services use a standardized error handling approach, or is the current approach of mixed throw patterns and error objects intentionally flexible?

**Context:**
- `src/services/authService.ts`: Throws generic errors directly
  ```typescript
  if (!response.ok) {
    throw new Error('Login failed')
  }
  ```
- `src/services/userService.ts`: Also throws generic errors
  ```typescript
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  ```
- `src/services/analyticsService.ts`: Same pattern of throwing generic errors
- `src/utils/apiUtils.ts`: Provides a structured `ApiResponse<T>` with error field but is not used by services
- `src/store/dashboardStore.ts`: Catches errors and stores them in state
  ```typescript
  set({
    error: error instanceof Error ? error.message : 'Unknown error',
    isLoading: false,
  })
  ```
- Components handle errors differently: Some use try-catch blocks, others display error state directly

**Impact:**
- API error details are lost (no error codes, status codes, or structured error metadata)
- Difficult to implement centralized error handling or logging
- Inconsistent error recovery strategies across the application
- Users may see generic "Failed" messages instead of actionable error information
- apiUtils.ts provides a structured pattern that goes unused, leading to code redundancy

**Discussion Points:**
- Should all services use the `createApiClient` utility from apiUtils.ts?
- Should services return structured error responses instead of throwing?
- How should HTTP error codes (401, 403, 500) be handled differently?
- Should there be a centralized error boundary or error handler component?
- Should error objects include metadata like timestamp, request ID, or endpoint?

---

## Ambiguity 3: Token Refresh and Authentication Persistence Strategy

**Ambiguity:** Unclear token management strategy with multiple refresh approaches and localStorage reliance

**Question:** How should token refresh and session persistence be coordinated between localStorage, the AuthContext, and the backend?

**Context:**
- `src/contexts/AuthContext.tsx` stores user object in localStorage:
  ```typescript
  localStorage.setItem('user', JSON.stringify(userData))
  ```
- On app initialization, it reads from localStorage and calls `refreshToken()`:
  ```typescript
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser)
    const refreshed = await authService.refreshToken(parsedUser.id)
    setUser(refreshed)
  }
  ```
- `refreshUser()` method exists but is never called in the codebase
- `authService.ts` has `validateToken()` method that is also unused
- No token expiration handling or automatic refresh mechanism
- No synchronization between tabs/windows
- User object is stored directly (including permissions array) without encryption

**Impact:**
- Unused `refreshUser()` and `validateToken()` methods indicate incomplete implementation
- No mechanism to detect expired tokens proactively
- Cross-tab session synchronization is missing, causing inconsistency
- Storing user permissions in localStorage creates a security risk
- Manual token refresh after page load may be too late if the user navigates immediately
- Developers unclear on when and how to trigger token refresh

**Discussion Points:**
- Should token refresh be automatic on app initialization or on first API call?
- Should a service worker or background task handle proactive token refresh?
- How should expired tokens be detected (through error response or validation)?
- Should tokens be stored separately from user data with proper security measures?
- Should there be cross-tab synchronization using storage events?
- What is the purpose of unused `refreshUser()` and `validateToken()` methods?

---

## Ambiguity 4: Data Fetching Responsibility Ambiguity

**Ambiguity:** Unclear which components/stores should be responsible for fetching data, causing potential duplication and race conditions

**Question:** Should data fetching be driven by stores (Zustand), services, pages, or a combination? What is the canonical pattern?

**Context:**
- Dashboard page uses Zustand store for fetching:
  ```typescript
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])
  ```
  where `fetchMetrics` is defined in `useDashboardStore`

- Analytics page fetches directly from service in component state:
  ```typescript
  const [data, setData] = useState<AnalyticsData | null>(null)
  const loadAnalytics = async () => {
    const result = await analyticsService.getAnalytics(filters)
    setData(result)
  }
  ```

- Users page fetches using service:
  ```typescript
  const loadUsers = async () => {
    const data = await userService.getUsers()
    setUsers(data)
  }
  ```

- Dashboard also has local fetch in store with no deduplication logic
- `useDashboardStore.setTimeRange()` and `setFilters()` both call `fetchMetrics()` without checking if one is already in flight

**Impact:**
- Inconsistent data fetching patterns mean developers must choose case-by-case
- Race conditions possible when filters and time range change simultaneously
- No deduplication of concurrent requests
- Analytics and Users pages cannot benefit from caching logic that could be in Zustand
- Difficult to implement global request deduplication or caching strategy
- New developers may not know which pattern to follow for new pages

**Discussion Points:**
- Should Zustand be the single source of truth for all data fetching?
- Should services be responsible for caching and deduplication?
- How should concurrent requests be handled?
- Should there be a request loading queue or debouncing mechanism?
- Should all pages follow the Dashboard pattern (Zustand) or Analytics pattern (component state)?

---

## Ambiguity 5: Type Definition Duplication Across Files

**Ambiguity:** User and related types are redefined in multiple locations without a single source of truth

**Question:** Should type definitions be centralized in a types file, or is the current distributed approach intentional?

**Context:**
- `src/contexts/AuthContext.tsx` defines:
  ```typescript
  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'user' | 'viewer'
    permissions: string[]
  }
  ```

- `src/services/userService.ts` defines:
  ```typescript
  interface User {
    id: string
    name: string
    email: string
    role: string
    status: 'active' | 'inactive' | 'pending'
    lastLogin: Date | null
  }
  ```

- `src/pages/Users.tsx` redefines User locally
- `src/components/Users/UserList.tsx` redefines User locally
- Role property differs: `'admin' | 'user' | 'viewer'` in AuthContext vs `string` in userService
- No consistency in field ordering or optional properties

**Impact:**
- Type definitions are out of sync between contexts and services
- Discrepancy in role type definition will cause runtime bugs or type errors
- Type changes require updates in multiple files, increasing maintenance burden
- Difficult to ensure all components use the same User shape
- New developers may not realize types are duplicated and create more copies
- IDE autocompletion and type checking become inconsistent

**Discussion Points:**
- Should a centralized `types/` or `types.ts` file exist for all domain types?
- Should User type be imported from AuthContext or a shared location?
- How should the discrepancy between role type definitions be resolved?
- Should interface extend or import to avoid duplication?
- Should there be a linting rule preventing type duplication?

---

## Ambiguity 6: Missing Data Validation and Sanitization Strategy

**Ambiguity:** Inconsistent application of input validation and sanitization across forms and API interactions

**Question:** Where and how should input validation occur? Should validation happen at the component level, service level, or both?

**Context:**
- `src/utils/validationUtils.ts` provides validation functions:
  - `validateEmail()`, `validatePassword()`, `validateUrl()`, `sanitizeInput()`, `validateRequired()`
  - These functions exist but are **never imported or used** anywhere in the codebase

- `src/components/Users/UserForm.tsx` uses HTML5 validation only:
  ```typescript
  <input type="email" required />
  ```

- `src/pages/Settings.tsx` accepts settings changes without validation:
  ```typescript
  handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  }
  ```

- `src/pages/Analytics.tsx` FilterPanel accepts filters without validation:
  ```typescript
  const handleChange = (key: string, value: any) => {
    onChange(newFilters)
  }
  ```

**Impact:**
- Security vulnerabilities: User input is not sanitized before sending to backend
- Client-side validation is missing, allowing invalid data to reach the API
- Unused validation utilities indicate incomplete implementation or unclear requirements
- Developers unfamiliar with available utilities may implement custom validation
- XSS and injection attack risks are higher
- API may receive unexpected data formats

**Discussion Points:**
- Should the validation utilities be used or removed if not needed?
- Should all forms use the validation utilities before submission?
- Should validation occur at form level or be enforced by components?
- Should there be an async validation strategy for checking backend constraints (e.g., email uniqueness)?
- Should input sanitization be applied in all user input components?
- Should API payloads be validated on the client before sending?

---

## Ambiguity 7: Permission-Based Access Control Implementation

**Ambiguity:** Role-based access control (RBAC) is partially implemented with unclear enforcement strategy

**Question:** How comprehensively should permission checks be implemented? Are sidebar permission checks sufficient, or should page-level and component-level checks also exist?

**Context:**
- `src/contexts/AuthContext.tsx` provides `hasPermission()` method:
  ```typescript
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions.includes(permission)
  }
  ```

- `src/components/Layout/Sidebar.tsx` filters menu items based on permissions:
  ```typescript
  const filteredItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )
  ```

- However, the actual page components are not protected:
  - Navigating directly to `/users` with URL manipulation bypasses sidebar permission check
  - `src/pages/Dashboard.tsx`, `src/pages/Analytics.tsx`, etc. have no permission guards
  - No role-based redirect or "not authorized" page

- Permission strings are inconsistent:
  - Sidebar defines `'view_analytics'`, `'view_users'`, `'manage_settings'`
  - No centralized permission constant file
  - No documentation of available permissions

**Impact:**
- Users can bypass UI restrictions by navigating directly to URLs
- No backend integration visible for permission enforcement
- Inconsistent permission checking logic creates security gaps
- New developers may not realize pages need additional permission checks
- Permission strings scattered in code make it hard to maintain a permission inventory
- Admins automatically have all permissions, but no way to assign granular permissions to non-admins

**Discussion Points:**
- Should every page component check permissions before rendering content?
- Should there be a ProtectedRoute wrapper component that enforces permissions?
- Should unauthorized access redirect to a 403 page or show an error message?
- Should permissions be fetched from backend on each app load or trusted from localStorage?
- Should there be a centralized permission registry or enum?
- What is the relationship between role and permissions? Can non-admins have granular permissions?

---

## Ambiguity 8: Settings Management and Persistence

**Ambiguity:** Settings are managed entirely in local component state with unclear persistence mechanism

**Question:** Should application settings (theme, language, timezone, notifications) be managed via Redux/Zustand, persisted to backend, or cached locally?

**Context:**
- `src/pages/Settings.tsx` manages all settings in local state:
  ```typescript
  const [settings, setSettings] = useState({
    notifications: { email: true, push: false, sms: false },
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    autoRefresh: true,
    refreshInterval: 30,
  })
  ```

- Settings are only saved when user clicks "Save Changes":
  ```typescript
  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  }
  ```

- No loading from backend on component mount
- No error handling for failed saves
- No notification of successful save to user beyond alert()
- Settings are not shared across pages (Dashboard's autoRefresh and refreshInterval in settings but useDashboardStore has its own selectedTimeRange)
- No way to revert unsaved changes except by refreshing the page

**Impact:**
- Settings changes are lost on page refresh (not hydrated from backend)
- No global state for settings, so other pages cannot access user preferences
- Settings inconsistency: `selectedTimeRange` in dashboardStore and `autoRefresh`/`refreshInterval` in Settings are separate
- No error recovery if save fails
- Poor UX: users don't know if settings were saved
- Hard to implement global theme switching without centralizing settings
- New features that depend on settings must either duplicate state or access localStorage directly

**Discussion Points:**
- Should settings be moved to a dedicated Zustand store (similar to dashboardStore)?
- Should settings be fetched from backend on app load and cached?
- Should settings changes be persisted immediately (on-change) or only on explicit save?
- Should there be an optimistic UI update pattern for settings?
- How should conflicting changes be handled if user changes settings in multiple tabs?
- Should app-wide theme and language changes trigger immediate re-renders?

---

## Ambiguity 9: API Base URL and Environment Configuration

**Ambiguity:** API endpoints are hardcoded in services with no visible environment configuration strategy

**Question:** How should environment-specific configurations (API base URLs, feature flags, timeouts) be managed across dev, staging, and production?

**Context:**
- `src/services/authService.ts`:
  ```typescript
  private baseUrl = '/api/auth'
  ```

- `src/services/userService.ts`:
  ```typescript
  private baseUrl = '/api/users'
  ```

- `src/services/analyticsService.ts`:
  ```typescript
  private baseUrl = '/api/analytics'
  ```

- `src/utils/apiUtils.ts` has `createApiClient()` factory but it's not used by any service
- `src/store/dashboardStore.ts` also hardcodes:
  ```typescript
  const response = await fetch('/api/metrics', {
  ```

- No `.env` or `.env.example` file visible
- No environment detection or configuration
- vite.config.ts not examined but likely uses default environment handling

**Impact:**
- Hardcoding API URLs makes it difficult to run against different backends
- No support for feature flags or conditional behavior
- Testing against mock APIs is complex
- Developers must manually edit code to test against staging/production
- The unused `createApiClient()` utility suggests incomplete implementation
- No centralized request timeout or retry configuration
- CORS issues or API URL changes require code edits and redeployment

**Discussion Points:**
- Should environment variables be used for API base URLs?
- Should Vite's environment variables be leveraged?
- Should `createApiClient()` be refactored to be the standard way services initialize?
- Should there be a runtime configuration file that can be deployed separately?
- Should feature flags be stored in configuration or fetched from backend?
- Should request timeouts and retry policies be configurable?

---

## Ambiguity 10: Data Normalization and Transformation Logic

**Ambiguity:** Date transformations are implemented inconsistently across services and components

**Question:** Where should data transformation (e.g., string to Date conversions) occur: in services, stores, or components?

**Context:**
- `src/services/userService.ts` converts string dates to Date objects:
  ```typescript
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
  ```

- `src/utils/dateUtils.ts` has formatting functions that accept Date | string:
  ```typescript
  export const formatDate = (date: Date | string | null): string => {
    const d = typeof date === 'string' ? new Date(date) : date
  ```

- `src/components/Dashboard/DataTable.tsx` formats dates independently:
  ```typescript
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {...}).format(new Date(date))
  }
  ```

- `src/components/Users/UserList.tsx` also has a formatDate function with slightly different format
- Multiple format functions exist with similar names causing potential confusion
- No normalized data representation layer

**Impact:**
- Date handling logic is scattered across the codebase
- Multiple formatDate implementations with slightly different behaviors
- If API response format changes, updates needed in multiple places
- Developers may not know which utility function to use
- Difficulty enforcing consistent date formatting across the application
- Performance: repeated date object creation
- New developers may create yet another date formatting function

**Discussion Points:**
- Should all date transformations happen in services (before data reaches components)?
- Should there be a single source of truth for date formatting (utility functions)?
- Should date utilities be extended to handle more complex transformations?
- Should API response interceptors normalize data automatically?
- Should there be a data normalization layer (like Redux's selectors)?

---

## Ambiguity 11: Component Responsibility and Data Flow

**Ambiguity:** Inconsistent responsibility distribution between pages and components regarding data fetching and state management

**Question:** Should page components be responsible for data fetching and state management, or should they primarily orchestrate components?

**Context:**
- `src/pages/Dashboard.tsx` uses store directly and components are data-agnostic:
  ```typescript
  const { metrics, isLoading, error, fetchMetrics } = useDashboardStore()
  <MetricCard key={metric.id} metric={metric} />
  ```

- `src/pages/Users.tsx` manages users array, search, pagination, and form state locally, passing callbacks to components:
  ```typescript
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  ```

- Components like `UserList.tsx` receive users and callbacks but don't fetch data
- `Analytics.tsx` manages data and filters in component state, similar to Users pattern

- No consistent pattern:
  - Dashboard delegates to store
  - Users/Analytics manage everything in page component
  - Components like MetricCard are simple presentational
  - Components like UserForm handle form state and submission

**Impact:**
- Developers must decide case-by-case how to structure new pages
- Difficulty reusing logic across pages with different patterns
- Testing components is complex when they're tightly coupled to pages
- Analytics and Users pages have duplicate logic (search, pagination) that could be shared
- Dashboard's store pattern doesn't scale well if multiple pages need similar data
- Difficult to understand data flow for new developers

**Discussion Points:**
- Should all pages use Zustand stores for consistency with Dashboard?
- Should there be container (smart) vs presentational (dumb) component separation?
- Should pages always delegate to stores/services rather than managing state directly?
- Should common patterns (search, pagination, filters) be extracted to reusable hooks?
- Should there be a component composition guideline document?
- How should pages coordinate between store state and local component state?

---

## Ambiguity 12: Chart/Visualization Data Structure Inconsistency

**Ambiguity:** Different data structures are used for charts across components, making it difficult to reuse visualization logic

**Question:** Should there be a unified data structure for all chart inputs, or is flexibility intentional?

**Context:**
- `src/components/Dashboard/ChartWidget.tsx` expects Metric array:
  ```typescript
  interface ChartWidgetProps {
    data: Metric[]
  }
  const chartData = data.map((metric) => ({
    name: metric.name,
    value: metric.value,
    change: metric.change,
  }))
  ```

- `src/components/Analytics/AdvancedChart.tsx` expects AnalyticsData structure:
  ```typescript
  interface AnalyticsData {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      color: string
    }>
  }
  ```

- Both use Recharts but transform data differently
- ChartWidget supports `'line' | 'bar'` types
- AdvancedChart supports `'line' | 'multi-line' | 'area'` but only implements LineChart
- No abstraction for chart configuration

**Impact:**
- Data preparation logic is duplicated across pages
- Difficult to add new chart types without modifying multiple components
- Inconsistent props and type definitions make components hard to reuse
- AdvancedChart declares support for 'area' type but doesn't implement it
- New visualization features require writing new components from scratch
- Team must decide which structure to use for new charts

**Discussion Points:**
- Should there be a unified chart data transformer function?
- Should a single Chart component support all chart types?
- Should there be a chart configuration/factory pattern?
- How should common chart options (colors, legends, tooltips) be managed?
- Should AdvancedChart's 'area' type be implemented or removed from the type?
- Should there be a chart library or design system component?

---

## Ambiguity 13: Error Boundary and Global Error Handling

**Ambiguity:** No visible error boundary implementation or global error handling strategy

**Question:** How should application-level errors be handled? Should there be error boundaries, a global error handler, or a combination?

**Context:**
- No Error Boundary component found in the codebase
- Error handling is implemented locally in pages:
  ```typescript
  if (error) {
    return <div className="error-message">Error: {error}</div>
  }
  ```

- Layout component checks for loading but not errors:
  ```typescript
  if (!user) {
    return <div className="auth-required">Authentication required</div>
  }
  ```

- Analytics page handles errors:
  ```typescript
  if (error) {
    return <div className="analytics-error">Error: {error}</div>
  }
  ```

- No global error logging or monitoring
- Console.error() used but no structured error logging
- No recovery mechanism for critical errors

**Impact:**
- Unhandled errors in child components can break the entire app
- No consistent error UI or messaging
- Developers must implement error handling in every page/component
- Difficult to track and debug errors in production
- Users see inconsistent error messages
- No mechanism for error recovery or retry after failure
- Performance issues or infinite loops can hang the app with no visibility

**Discussion Points:**
- Should there be an Error Boundary wrapper at the Layout level?
- Should there be a global error handler for uncaught errors?
- Should errors be logged to a remote service?
- Should there be a standard error modal or toast notification?
- How should network errors vs application errors be handled differently?
- Should there be a fallback UI for critical errors?

---

## Ambiguity 14: Loading States and User Feedback

**Ambiguity:** Inconsistent implementation of loading states and lack of user feedback for async operations

**Question:** Should loading states be managed at page level, store level, or component level? How detailed should loading feedback be?

**Context:**
- Dashboard uses store's `isLoading`:
  ```typescript
  if (isLoading) {
    <div className="loading">Loading metrics...</div>
  }
  ```

- Users page has `isLoading` state but loads asynchronously without intermediate feedback during search/pagination
- Analytics page shows loading state but filters don't show individual loading indicators
- Some operations show only text "Loading..." without spinners or progress indication
- No skeleton loaders or progressive content rendering
- When filters change in Analytics, entire view goes blank while loading
- Settings page has no feedback when saving settings (only alert() on completion)
- No indication of how long operations will take

**Impact:**
- Users don't know if the app is frozen or just slow
- Poor UX on slow networks without visual feedback
- Search and pagination in Users page lack feedback, potentially confusing users
- Inconsistent UI patterns across pages
- No way to cancel long-running operations
- Difficult to implement global loading indicator
- Developers must choose how to implement loading state for new features

**Discussion Points:**
- Should there be a global loading overlay or toast for all async operations?
- Should there be skeleton loaders instead of simple "Loading..." text?
- Should components show partial content while loading (progressive rendering)?
- Should there be timeout handling for operations that take too long?
- Should there be a way to cancel in-flight requests?
- Should there be progress indicators for long-running operations?
- Should loading state be managed by a custom hook or store?

---

## Ambiguity 15: Testing Strategy and Test Doubles

**Ambiguity:** No visible test infrastructure, mocking strategy, or test file structure

**Question:** How should the application be tested? What mocking strategy should be used for services and stores?

**Context:**
- No test files found in the codebase (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- No testing libraries in package.json (Jest, Vitest, React Testing Library not visible)
- Services directly fetch from `/api/` endpoints with no abstraction for testing
- No mock service implementations or test doubles
- Zustand store with devtools but no testing utilities configured
- Components tightly coupled to services and stores, making them hard to test in isolation

**Impact:**
- Difficult to write unit tests without mocking entire service layer
- No way to test components in isolation
- Changes to APIs or services can break the app without warning
- Difficult to implement CI/CD pipeline without test coverage
- Developers unsure how to test their changes
- New developers must set up testing infrastructure
- No regression test suite to catch breaking changes

**Discussion Points:**
- Should there be a testing framework (Jest, Vitest)?
- Should services be injected or use dependency injection for testability?
- Should there be mock implementations of services?
- Should there be MSW (Mock Service Worker) setup for API mocking?
- Should components use custom hooks for services to enable easier mocking?
- What test coverage targets should be set?
- Should integration tests be part of the strategy?

---

## Summary

The codebase demonstrates a functional structure but has **15 significant architectural ambiguities** that should be discussed and resolved as a team:

1. **State Management**: Dual Context API + Zustand pattern lacks clear separation criteria
2. **Error Handling**: Inconsistent error strategies across services and components
3. **Authentication**: Token management and session persistence incomplete
4. **Data Fetching**: Multiple competing patterns without clear canonical approach
5. **Types**: Duplicate type definitions scattered across codebase
6. **Validation**: Validation utilities exist but unused
7. **Permissions**: Access control incomplete with security gaps
8. **Settings**: Settings management not integrated into application architecture
9. **Configuration**: Hardcoded API URLs with no environment support
10. **Data Transformation**: Date handling logic inconsistently distributed
11. **Component Responsibilities**: Inconsistent page vs component patterns
12. **Visualizations**: Multiple chart data structures without unified approach
13. **Error Boundaries**: No global error handling or error boundary components
14. **Loading States**: Inconsistent loading UI and feedback patterns
15. **Testing**: No visible testing infrastructure or strategy

**Recommended Next Steps:**
- Schedule architecture discussion to address ambiguities 1-4 as high priority
- Document decisions in ADR (Architecture Decision Records) format
- Create style guides for patterns (component structure, data fetching, state management)
- Refactor duplicated patterns using established decisions
- Set up testing infrastructure to prevent regressions
