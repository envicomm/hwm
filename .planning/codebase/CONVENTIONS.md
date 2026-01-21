# Coding Conventions

**Analysis Date:** 2026-01-21

## Naming Patterns

**Files:**
- Components (React): kebab-case (e.g., `waste-bags-table.tsx`, `dashboard-layout.tsx`, `auth-context.tsx`)
- Routes: use underscores for layout routes (e.g., `_dashboard.tsx`), kebab-case with params (e.g., `auth.$authView.tsx`, `account.$accountView.tsx`)
- Utilities: kebab-case (e.g., `mock-data.ts`, `utils.ts`)
- Schema definitions: camelCase (e.g., `generators.ts`, `wasteBags.ts`, `validators.ts`)
- API functions: organized by domain in index/mutations/queries pattern

**Functions:**
- Component names: PascalCase (e.g., `WasteBagsTable`, `ExampleWrapper`, `Sidebar`)
- Helper functions: camelCase (e.g., `getStatusVariant`, `getTypeClassName`, `formatDate`, `formatWeight`)
- Exported functions: named exports (e.g., `export function useAuth()`, `export function cn()`)
- Hook functions: camelCase with `use` prefix (e.g., `useAuth`, `useLocation`, `useContext`)
- Higher-order functions: camelCase (e.g., `createRootRoute`, `createFileRoute`, `withIndex`)

**Variables:**
- Local variables: camelCase (e.g., `generatorId`, `treaterId`, `wasteType`, `isActive`)
- Constants: UPPER_SNAKE_CASE (e.g., `AUTH_STORAGE_KEY`)
- State variables: camelCase (e.g., `user`, `isLoading`, `isAuthenticated`)
- Maps/records: camelCase (e.g., `classes`, `statusLabels`, `typeLabels`, `navItems`)

**Types:**
- Interfaces: PascalCase (e.g., `WasteBagsTableProps`, `AuthContextType`, `MockWasteBag`)
- Type unions: named with domain context (e.g., `WasteStatus`, `WasteType`, `UserRole`, `OrganizationType`)
- Generic type parameters: single uppercase letter or descriptive (e.g., `T`, `User`)

## Code Style

**Formatting:**
- Tool: Biome 2.2.4
- Tab indentation enabled
- Double quotes for strings (JavaScript)
- Automatic code organization on save

**Linting:**
- Tool: Biome 2.2.4
- Config: `biome.json` with recommended rules
- Assist actions: `organizeImports` enabled
- Command to check: `pnpm check` or `pnpm lint`

**TypeScript:**
- Target: ES2022
- Module resolution: bundler
- Strict mode: enabled
- Additional strictness: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`

## Import Organization

**Order:**
1. React/Framework imports (e.g., `import React from "react"`, `import { createContext } from "react"`)
2. Third-party library imports (e.g., `import { cva } from "class-variance-authority"`, `import { Slot } from "radix-ui"`)
3. Local imports from aliases (e.g., `import { cn } from "@/lib/utils"`)
4. Other local imports (e.g., `import type { MockWasteBag }`)

**Path Aliases:**
- `@/` points to app source root (configured in `vite-tsconfig-paths`)
- `@hwm/` points to workspace packages (e.g., `@hwm/convex`, `@hwm/types`, `@hwm/auth`)
- Import patterns: `import { api } from "@hwm/convex/api"`

**Automatic Organization:**
- Biome's `organizeImports` action is enabled - imports are automatically sorted on formatting

## Error Handling

**Patterns:**
- Backend (Convex): Use `ConvexError` for validation/auth failures with descriptive messages (e.g., `throw new ConvexError("Unauthorized: Please log in to continue")`)
- Backend (Convex): Use descriptive error messages including context (e.g., `"Forbidden: No active partnership exists with this hauler"`)
- Frontend: Try-catch blocks around JSON.parse for safe parsing (e.g., `try { JSON.parse() } catch { localStorage.removeItem() }`)
- Null checks: Handle explicitly before operations (e.g., `if (!user || !user.email) { throw new Error(...) }`)
- Environment validation: Check for required env vars and throw early (e.g., `if (!apiKey) { throw new Error("RESEND_API_KEY is not configured") }`)

## Logging

**Framework:** No global logging framework configured. Uses browser `console` or Convex logging.

**Patterns:**
- Errors and important events use descriptive messages
- API errors captured as text: `const error = await response.text()`
- Error context included in thrown errors: `throw new Error("Failed to send email: ${error}")`

## Comments

**When to Comment:**
- Comments explain WHY, not WHAT (code itself shows what)
- Multiline comments (`/* */`) for section headers and complex logic
- Single-line comments (`//`) for inline explanations and context
- TODO/FIXME comments mark incomplete implementations

**Examples from codebase:**
- `// Verify user has access to this treater organization` - explains intent
- `// Requires access to the generator (either as generator member or parent treater)` - explains authorization logic
- `// TODO: Add proper organization membership verification via better-auth` - marks future work

**JSDoc/TSDoc:**
- Used for public functions and complex procedures
- Format: Single-line JSDoc with description
- Example from `lib/auth.ts`:
  ```typescript
  /**
   * Require authentication - throws if user is not logged in
   * Returns the user identity from Convex auth
   */
  export async function requireAuth(ctx: QueryCtx | MutationCtx)
  ```

## Function Design

**Size:** Functions are generally focused and under 50 lines of logic. Complex operations decomposed into helper functions.

**Parameters:**
- Named parameters with types (e.g., `{ bags }: WasteBagsTableProps`)
- Use destructuring for component props
- Optional parameters marked with `v.optional()` in Convex or `?` in TypeScript

**Return Values:**
- Explicit return types on functions
- Void functions for mutations with side effects
- Return IDs/objects for queries and mutations
- Promise-based for async operations

**React Components:**
- Functional components with arrow functions or declarations
- Props spread with rest operator (`...props`)
- Use of `React.ComponentProps<"div">` for extending native elements
- Event handlers inline or extracted to named functions

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function Button()`, `export { Sidebar }`)
- Type exports: `export type WasteBag = ...`
- Barrel files used in some directories (`export * from "./index"` pattern)

**Barrel Files:**
- Used in `/routes/` with `export const Route = ...`
- Used in `/components/ui/` to group related components
- Not universally used - direct imports also common

**Organization by Feature:**
- Backend: `/convex/[domain]/` structure with `index.ts`, `queries.ts`, `mutations.ts`
- Frontend: `/components/` organized by purpose (`layout/`, `ui/`, `dashboard/`)
- Shared validators in single file: `schema/validators.ts`

## Convex-Specific Patterns

**Mutation/Query Definition:**
- Use object syntax with `args` and `handler` properties
- Validation through Convex `v.` schema (e.g., `v.string()`, `v.id("table")`)
- Auth checks at start of handler via `requireAuth()`, `requireTreaterAccess()`
- Timestamps: use `Date.now()` for milliseconds

**Schema Patterns:**
- Inline comments for field documentation (e.g., `// QR code identifier (unique, scannable)`)
- Denormalized fields for query efficiency (e.g., `treaterId` stored in `wasteBags`)
- Indexes for all filter and sort operations
- Compound indexes for multi-field queries (e.g., `"by_treater_status": ["treaterId", "status"]`)

---

*Convention analysis: 2026-01-21*
