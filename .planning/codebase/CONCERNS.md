# Codebase Concerns

**Analysis Date:** 2026-01-21

## Tech Debt

**Incomplete Authorization Verification:**
- Issue: Organization membership verification deferred to "better-auth" integration but not yet implemented
- Files: `packages/convex/convex/lib/auth.ts` (lines 111, 133, 153)
- Impact: Users can access organization resources if they pass basic authentication, but organization membership is not strictly enforced. This is a critical security gap for multi-tenant system.
- Fix approach: Implement proper organization membership checks via better-auth's organization member queries. Currently three functions have TODO comments (`requireTreaterAccess`, `requireGeneratorAccess`, `requireHaulerAccess`).

**Missing Cascade Delete Logic:**
- Issue: Soft delete operations exist but no cascade handling for related data
- Files: `packages/convex/convex/haulers/mutations.ts` (remove function), `packages/convex/convex/generators/mutations.ts` (remove function), `packages/convex/convex/organizationLinks/mutations.ts` (deleteLink function)
- Impact: When organizations/entities are deleted, related records (wasteBags, collectionRequests, treatments, disposalBatches) remain orphaned. Could cause data integrity issues and confusing queries.
- Fix approach: Implement cascade delete or cleanup mutations that handle all related entities. Document soft delete strategy clearly (mark isActive=false vs actual deletion).

**Data Consistency Risk with Denormalized Fields:**
- Issue: `wasteBags` table denormalizes `treaterId` for efficient queries, but no mechanism to keep in sync if generator-treater relationship changes
- Files: `packages/convex/convex/schema/wasteBags.ts` (line 16)
- Impact: If a generator is reassigned to a different treater, its waste bags retain old treaterId, causing query anomalies and incorrect DENR compliance tracking.
- Fix approach: Add mutation hooks to update all affected wasteBags when generator treater assignment changes, or accept this as a limitation and document it.

**Incomplete Error Handling in Async Operations:**
- Issue: Limited error handling in async communication actions (email/SMS)
- Files: `packages/convex/convex/communications/email.ts`, `packages/convex/convex/communications/sms.ts`
- Impact: If Resend or Twilio requests fail, exceptions are thrown but retry logic is absent. Critical notifications (password resets, invitations) may fail silently.
- Fix approach: Implement retry mechanism with exponential backoff. Add dead-letter queue for failed sends. Log failures for manual review.

**No Idempotency Guarantees:**
- Issue: Mutations creating entities don't check for duplicates or idempotent keys
- Files: Multiple mutation files including `packages/convex/convex/haulers/mutations.ts` (create), `packages/convex/convex/generators/mutations.ts` (create)
- Impact: Network retries or duplicate requests could create duplicate records. Particularly risky for critical entities like organizations and waste bags.
- Fix approach: Add unique constraints on key fields (email, facilityCode, qrCode). Implement idempotency tokens for critical mutations.

## Security Considerations

**Secrets Exposed in .env.local:**
- Risk: Mapbox API key and other sensitive credentials present in version control
- Files: `/Users/kyllo/dev/hwm/packages/convex/.env.local`, `/Users/kyllo/dev/hwm/apps/generator/.env.local`, `/Users/kyllo/dev/hwm/apps/treater/.env.local`, `/Users/kyllo/dev/hwm/apps/trucking/.env.local`
- Current mitigation: `.gitignore` includes `.env.local` and `*.local` patterns, so these are not committed to git
- Recommendations: Even though .gitignore is in place, rotate all exposed keys immediately. Mapbox token visible in git history should be regenerated. Implement pre-commit hooks to prevent accidental secret commits.

**Rate Limiting Configuration:**
- Risk: Auth rate limits may be insufficient for distributed attack or brute force
- Files: `packages/convex/convex/auth.ts` (lines 40-58)
- Current mitigation: Rate limiting enabled with 5 login attempts per minute, 3 signups per 5 minutes
- Recommendations: Consider even stricter limits (3 attempts per 5 minutes for login). Implement account lockout after X failed attempts. Monitor rate limit hits for attack patterns.

**Missing Input Validation on Key Fields:**
- Risk: QR codes accept any string, facility codes not validated, email formats not strictly checked
- Files: `packages/convex/convex/schema/wasteBags.ts` (qrCode as v.string()), `packages/convex/convex/schema/generators.ts` (facilityCode as v.string())
- Current mitigation: Database schema uses basic type validation, but no format constraints
- Recommendations: Add regex validators for QR codes (alphanumeric, length constraints), facility codes (DENR format if applicable), emails (strict RFC validation).

**No Explicit Data Encryption:**
- Risk: Sensitive medical waste data stored unencrypted
- Files: All schema files in `packages/convex/convex/schema/`
- Current mitigation: Convex provides database encryption at rest by default
- Recommendations: For DENR compliance and medical data protection, consider field-level encryption for sensitive fields (wasteType descriptions, generator names, treatment details). Document data classification.

## Performance Bottlenecks

**Inefficient Partnership Queries:**
- Problem: `treaterHaulerPartners` queried by index then filtered in memory for active status
- Files: `packages/convex/convex/haulers/mutations.ts` (line 68-74), `packages/convex/convex/lib/auth.ts` (line 169-175)
- Cause: No composite index on (treaterId, isActive), so query returns all partnerships then filters in code
- Improvement path: Add index on `["treaterId", "isActive"]` in `treaterHaulerPartners` schema. Update queries to use index filters.

**Full Collection Scans in Common Queries:**
- Problem: Multiple status lookups scan entire collections
- Files: Various mutation and query files
- Cause: Some queries check for status conditions without using indexed fields
- Improvement path: Verify all status lookups use existing indices like `by_status` and `by_treater_status`. Add missing indices for (treaterId, status) combinations.

**N+1 Queries for Organization Links:**
- Problem: Fetching organization details requires separate lookup via organizationLinks
- Files: `packages/convex/convex/lib/auth.ts` (getOrganizationLink functions)
- Cause: No denormalization of organization type/reference in main tables
- Improvement path: Consider denormalizing organizationType in treaters/generators/haulers tables to avoid secondary lookup on every auth check.

**Large Mock Data Sets:**
- Problem: Mock data files are 600+ lines with hardcoded large datasets
- Files: `apps/generator/src/lib/mock-data.ts` (605 lines), `apps/trucking/src/lib/mock-data.ts` (570 lines), `apps/treater/src/lib/mock-data.ts` (260 lines)
- Cause: Comprehensive mock data for dashboard previews
- Improvement path: Extract to JSON files or lazy-load only needed data. Current bundle impact unknown but worth analyzing.

## Fragile Areas

**Organization Membership Sync:**
- Files: `packages/convex/convex/lib/auth.ts`, `packages/convex/convex/auth.ts`
- Why fragile: Multiple systems involved (better-auth, Convex, organizationLinks table). No single source of truth for "who belongs to org".
- Safe modification: Add integration tests verifying that creating user, creating org, and inviting user to org all result in proper authorization checks passing.
- Test coverage: Missing - no tests verify authorization enforcement.

**Waste Lifecycle State Machine:**
- Files: `packages/convex/convex/schema/wasteBags.ts`, `packages/convex/convex/schema/validators.ts` (lines 4-12)
- Why fragile: Seven state transitions (initialized → disposed) but no state machine enforcement. Invalid transitions possible (e.g., disposed → collected).
- Safe modification: Create explicit state transition validator that whitelist allowed transitions. Add unit tests for each transition.
- Test coverage: Missing - states can be set to any valid value without transition validation.

**Multi-Tenant Data Isolation:**
- Files: All schema files, all mutation handlers
- Why fragile: Relies on treater_id denormalization and proper filtering in queries. Missing filter in one place exposes data.
- Safe modification: Require all data queries to explicitly specify treater context. Add middleware/wrapper to enforce tenancy checks.
- Test coverage: Gaps - no tests verify that users of tenant A cannot read/write tenant B data.

**DENR Compliance Certificate Generation:**
- Files: Likely in treatment and disposal modules (not fully explored)
- Why fragile: Business requirement demands auto-generated certificates but no error handling if generation fails
- Safe modification: Wrap certificate generation in try-catch with fallback to manual generation flag
- Test coverage: Needs tests for: valid generation, invalid inputs, API failures, certificate re-generation

## Test Coverage Gaps

**No Application Tests:**
- What's not tested: Any business logic beyond type definitions
- Files: Apps in `apps/*/src/` have no `.test.ts` or `.spec.ts` files visible
- Risk: Regressions in routes, auth flows, data mutations not caught by automated tests
- Priority: High - multi-tenant system with auth and compliance requirements needs integration tests

**Authorization Logic Untested:**
- What's not tested: `requireTreaterAccess`, `requireGeneratorAccess`, `requireHaulerAccess`, `requireTreaterHaulerPartnership` functions
- Files: `packages/convex/convex/lib/auth.ts`
- Risk: Authorization bypasses, incorrect access control, cross-tenant data leaks not caught
- Priority: High - security-critical code

**State Machine Transitions Untested:**
- What's not tested: Valid/invalid waste bag status transitions
- Files: `packages/convex/convex/schema/validators.ts` status validators
- Risk: Invalid state transitions not caught, data in inconsistent states
- Priority: High - core business logic

**Error Scenarios Untested:**
- What's not tested: Missing required fields, network failures, duplicate creation attempts, cascade delete scenarios
- Files: All mutation handlers
- Risk: Error paths not exercised, bugs in error messages, missing error recovery
- Priority: Medium

**Email/SMS Delivery Untested:**
- What's not tested: Actual Resend/Twilio integration, failure cases, retry logic
- Files: `packages/convex/convex/communications/email.ts`, `packages/convex/convex/communications/sms.ts`
- Risk: Critical notifications fail silently, users don't receive invitations or password resets
- Priority: High - user-facing feature

## Scaling Limits

**Single Convex Deployment:**
- Current capacity: Standard Convex free/pro tier limits
- Limit: As waste volume and multi-tenant usage grows, Convex deployment may hit rate limits or storage constraints
- Scaling path: Monitor Convex metrics. Plan migration to dedicated deployment if needed. Implement query caching/pagination for large result sets.

**Denormalized Treater ID in Waste Bags:**
- Current capacity: Efficient for queries by treater_id, but creates sync burden
- Limit: As generators move between treaters, bulk update operations could become expensive
- Scaling path: Implement batch update jobs. Add migration tooling for generator reassignment. Monitor query performance on large waste bag collections.

**Better-Auth Organization Scale:**
- Current capacity: Unknown - depends on better-auth's scalability
- Limit: As user count grows, organization management operations could bottleneck
- Scaling path: Profile org creation/member addition flows. Consider caching org structure client-side. Implement eventual consistency if needed.

## Known Bugs

**Console Logging in Production:**
- Symptoms: console.log statements may be present in code, leaking to browser devtools and potentially logs
- Files: Multiple app files (count: 8+ occurrences found in console grep)
- Trigger: Any route/component execution
- Workaround: Use proper logging library (e.g., pino, winston) with log levels that respect NODE_ENV

## Dependencies at Risk

**Better-Auth Integration:**
- Risk: Custom `@convex-dev/better-auth` package version 0.10.9, latest convex-helpers 0.1.108. Integration still being built (auth foundations commit recent).
- Impact: API changes in better-auth could break auth flows. Missing org membership verification is pending this integration.
- Migration plan: Keep better-auth locked to tested version. Have fallback custom auth if needed. Monitor better-auth changelog for breaking changes.

**Mapbox GL (3.17.0):**
- Risk: Commercial license required for production use. Large bundle size.
- Impact: If Mapbox terms change or token exposed, service disruption. Bundle size affects performance.
- Migration plan: Consider switching to open-source alternative (Leaflet + OpenStreetMap) if cost or license becomes issue.

## Missing Critical Features

**Audit Trail Completeness:**
- Problem: `wasteStatusHistory` table exists but no mechanism visible to ensure all status changes are logged
- Blocks: DENR compliance audit requirements, forensic investigation of waste tracking issues
- Priority: High - regulatory requirement

**Transaction Rollback/Compensation:**
- Problem: No multi-step transaction handling. If part of waste lifecycle fails, partial state persists.
- Blocks: Data consistency guarantees, reliable waste tracking
- Priority: High - core business process

---

*Concerns audit: 2026-01-21*
