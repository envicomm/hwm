# Testing Patterns

**Analysis Date:** 2026-01-21

## Test Framework Status

**Note:** No test infrastructure currently implemented in the codebase. The following analysis reflects the tools and patterns available through dependencies.

**Runner:**
- Testing framework: Not configured in any app (`@hwm/generator`, `@hwm/treater`, `@hwm/trucking`, `@hwm/convex`)
- No test runner scripts in package.json files
- No jest.config.js or vitest.config.ts files present
- Test libraries: Not installed as dev dependencies

**Build/Type Checking Only:**
```bash
pnpm typecheck       # TypeScript checking via tsc --noEmit
pnpm lint           # Biome linting
pnpm check          # Biome lint + format check
```

## Recommended Test Setup

Based on tech stack (React 19, TanStack ecosystem, Convex), here's the intended approach:

**Frontend (Apps):**
- Framework: Vitest or Jest
- Setup: React Testing Library for component testing
- Mocking: MSW (Mock Service Worker) for API calls
- Run: `vitest` with watch mode

**Backend (Convex):**
- Framework: Vitest (Convex-compatible)
- Approach: Unit tests for mutation/query logic
- Mocking: Mock Convex context and database calls
- Run: `vitest` in packages/convex

## Import Organization (Test Files)

**Recommended Order:**
1. Testing framework imports (e.g., `import { describe, it, expect }`)
2. React imports (e.g., `import React from "react"`)
3. Third-party library imports
4. Code under test (e.g., `import { MyComponent }`)
5. Test utilities and mocks (e.g., `import { render, screen }`)

## Test Structure (Frontend Example)

**File Organization:**
- Co-located pattern recommended: `Component.tsx` + `Component.test.tsx` in same directory
- Alternative: `__tests__/` directory for shared test utilities

**Example Structure:**
```
src/components/
├── dashboard/
│   ├── waste-bags-table.tsx
│   ├── waste-bags-table.test.tsx    # Test file
│   ├── activity-timeline.tsx
│   └── activity-timeline.test.tsx
```

**Test Suite Pattern:**
```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { WasteBagsTable } from "./waste-bags-table"

describe("WasteBagsTable", () => {
  it("renders table headers", () => {
    const bags = []
    render(<WasteBagsTable bags={bags} />)
    expect(screen.getByText("QR Code")).toBeInTheDocument()
  })

  it("displays waste bags", () => {
    const bags = [
      { id: "1", qrCode: "QR001", wasteType: "infectious", status: "initialized" }
    ]
    render(<WasteBagsTable bags={bags} />)
    expect(screen.getByText("QR001")).toBeInTheDocument()
  })
})
```

## Test Structure (Backend Example)

**File Organization:**
- Co-located pattern: `mutations.ts` + `mutations.test.ts` or `mutations.spec.ts`

**Example Mutation Test:**
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { create } from "./mutations"

describe("generators.mutations.create", () => {
  let ctx: any

  beforeEach(() => {
    ctx = {
      db: {
        insert: vi.fn().mockResolvedValue("gen_123"),
      },
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue({ subject: "user_1" }),
      },
    }
  })

  it("creates a generator with provided args", async () => {
    const result = await create.handler(ctx, {
      treaterId: "tre_456",
      name: "Hospital A",
      address: "123 Main St",
      contactEmail: "contact@hospital.com",
      contactPhone: "555-1234",
      qrMode: "hospital_generated",
    })

    expect(result).toBe("gen_123")
    expect(ctx.db.insert).toHaveBeenCalledWith(
      "generators",
      expect.objectContaining({
        name: "Hospital A",
        treaterId: "tre_456",
      })
    )
  })
})
```

## Mocking

**Frontend Mocking:**
- Framework: MSW (Mock Service Worker) - already in dependencies
- Pattern: Set up mock handlers before tests
- HTTP interception: Mock fetch calls to Convex

**Example MSW Setup:**
```typescript
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const server = setupServer(
  http.post("*/api/convex/query", () => {
    return HttpResponse.json({ data: [] })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Backend Mocking:**
- Mock Convex context: `ctx.db`, `ctx.auth`, `ctx.runQuery`
- Use `vi.fn()` from Vitest for function mocking
- Mock database operations to test business logic in isolation

**What to Mock:**
- External API calls (email, SMS services)
- Database operations (return test data)
- Authentication context
- Convex query/mutation dependencies

**What NOT to Mock:**
- Core business logic (waste status transitions)
- Validation logic (test actual validators)
- Type checking (test actual types)

## Fixtures and Factories

**Test Data:**
- Example from `mock-data.ts` in generator app shows the pattern:
  ```typescript
  interface MockWasteBag {
    id: string
    qrCode: string
    wasteType: WasteType
    status: WasteStatus
    // ...
  }
  ```

**Recommended Factory Pattern:**
```typescript
// test/factories.ts
export function createMockWasteBag(overrides = {}) {
  return {
    id: "bag_123",
    qrCode: "QR001",
    wasteType: "infectious",
    status: "initialized",
    createdAt: Date.now(),
    ...overrides,
  }
}

export function createMockGenerator(overrides = {}) {
  return {
    id: "gen_123",
    treaterId: "tre_456",
    name: "Hospital A",
    isActive: true,
    ...overrides,
  }
}
```

**Location:**
- Create in `test/fixtures/` or `test/factories/`
- Import in test files as needed
- Share across related tests in same domain

## Coverage

**Requirements:** None currently enforced

**View Coverage (Recommended Setup):**
```bash
vitest --coverage              # Run with coverage report
vitest --coverage --reporter=html  # Generate HTML report
```

**Target Coverage Goals:**
- Utility functions: 100%
- Components: 80%+
- Business logic (mutations): 90%+
- Error handling: 100%

## Test Types

**Unit Tests:**
- Scope: Individual functions, components, validators
- Approach: Test in isolation with mocked dependencies
- Focus areas: Pure functions, type guards, formatters

**Integration Tests:**
- Scope: Multiple components or systems working together
- Approach: More realistic setup, limited mocking
- Focus areas: Auth flows, data mutations, multi-step workflows

**E2E Tests:**
- Framework: Not currently used
- Recommended: Playwright or Cypress for future
- Scope: Full user journeys across apps

## Common Patterns

**Async Testing:**
```typescript
it("fetches data on mount", async () => {
  const { rerender } = render(<Component />)
  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument()
  })
})
```

**Error Testing:**
```typescript
it("throws on missing auth", async () => {
  const ctx = {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(null),
    },
  }

  await expect(
    requireAuth(ctx)
  ).rejects.toThrow("Unauthorized: Please log in to continue")
})

it("handles invalid input gracefully", () => {
  expect(() => {
    JSON.parse("invalid json")
  }).toThrow()
})
```

**Component Testing with Props:**
```typescript
it("renders with different statuses", () => {
  const statuses = ["initialized", "collected", "treated", "disposed"]

  statuses.forEach((status) => {
    const { unmount } = render(
      <WasteBagsTable bags={[{ ...mockBag, status }]} />
    )
    expect(screen.getByText(statusLabel[status])).toBeInTheDocument()
    unmount()
  })
})
```

## Test Execution

**Current Commands:**
```bash
pnpm test              # (Not configured, would run turbo run test)
pnpm typecheck         # TypeScript checking
pnpm lint              # Code quality checking
```

**Recommended Setup After Implementation:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Run in watch mode
pnpm test:coverage     # Generate coverage report
pnpm test:ui           # Vitest UI dashboard (if enabled)
```

---

*Testing analysis: 2026-01-21*

**Note:** This codebase currently lacks test infrastructure. The patterns documented above represent best practices aligned with the existing tech stack and should be implemented as the project matures.
