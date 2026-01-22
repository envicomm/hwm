# Project Research Summary

**Project:** HWM Hospital Waste Management - v1.1 Waste Tracking
**Domain:** Multi-tenant SaaS for medical waste chain-of-custody tracking
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

Medical waste tracking systems follow a universal pattern: QR/barcode-based item identification with chain-of-custody documentation at every status transition. HWM's existing Convex schema already supports the full waste lifecycle (initialized -> to_be_collected -> collected -> treated -> aggregated -> disposal_requested -> disposed), making this milestone primarily a UI and mutation implementation effort rather than schema design work. The key competitive differentiator is **dual QR mode support** (pre-manufactured bags from treater inventory + hospital-generated QR codes for generic bags), which serves diverse generator capabilities without workflow disruption.

The recommended approach is to build the state machine and audit trail infrastructure first, then layer QR scanning on top. Research reveals that 86% of waste tracking failures stem from poor segregation discipline and inconsistent scanning -- the solution is better UX at scan points, not more features. Three new libraries are needed: `@yudiel/react-qr-scanner` for camera scanning, `qrcode.react` for label generation, and `react-signature-canvas` for pickup confirmation signatures. Convex's native real-time subscriptions handle all status update propagation; no WebSocket or state machine library is required.

Critical risks center on state machine race conditions (multiple apps mutating same bag), multi-tenant data leakage (missing tenant filters on queries), and offline scanning failures (hospital basements with no connectivity). All are preventable with server-side validation patterns documented in the pitfalls research. Certificate generation (PTT, COT) should be deferred to v1.2 per scope, focusing v1.1 on the core scan-track-transition workflow.

## Key Findings

### Recommended Stack

The existing Convex + React stack is sufficient. Three new runtime packages plus one type package are required.

**Stack additions for v1.1:**
- `@yudiel/react-qr-scanner` (trucking, generator apps): Camera-based QR scanning -- actively maintained, TypeScript, mobile-ready with torch/zoom controls
- `qrcode.react` (generator, treater apps): QR code generation for labels -- SVG/Canvas output, print-friendly, 1.8M+ weekly downloads
- `react-signature-canvas` (trucking app): Signature capture for pickup confirmation -- wrapper around proven signature_pad library
- `@types/react-signature-canvas` (trucking app): TypeScript support

**No libraries needed:**
- State machine: Use TypeScript discriminated unions + Convex mutation validation (XState overkill for linear status flow)
- Real-time: Convex `useQuery` provides automatic subscriptions
- PDF generation: Defer to v1.2; use browser print with CSS `@media print` for v1.1

**Bundle impact:** ~25KB gzipped total (scanner ~15KB, QR gen ~5KB, signature ~5KB)

### Expected Features

**Must have (table stakes):**
- QR code scanning (camera) with back/front camera support
- Manual waste entry form (type, weight, description, optional photo)
- QR activation for pre-manufactured bags (scan -> validate inventory -> create wasteBag)
- QR generation for hospital-generated mode (generate -> display for print -> attach to bag)
- Collection request workflow (generator requests -> hauler assigns driver -> driver scans)
- Driver pickup interface (view manifest, scan bags, signature capture, mark complete)
- Treater intake scanning (verify manifest, record treatment session)
- Disposal batch creation and seal with parent QR
- Real-time status display and status history timeline
- Audit trail with timestamp, actor, location at each transition

**Should have (differentiators):**
- Per-generator QR mode setting (pre_manufactured, hospital_generated, or both)
- Bulk scan mode for high-volume pickups
- Treatment method presets (autoclave settings, incineration settings)
- Manifest reconciliation (compare expected vs. received bags)

**Defer to v1.2:**
- Certificate generation (PTT, COT, Disposal Certificate) -- per scope definition
- Pre-manufactured bag inventory management UI (schema exists)
- Bag distribution tracking UI (schema exists)
- Offline scanning with local queue and sync (complexity vs. network availability)
- Waste volume analytics dashboards (needs historical data)
- HazwasteID generation (DENR integration, post-MVP)

### Architecture Approach

Three React apps (generator, treater, trucking) share a single Convex backend. All waste tracking mutations live in `packages/convex/convex/` and are imported via `@hwm/convex/api`. State transitions are validated server-side using an allowed-transitions map; every transition atomically writes both the status update and audit trail entry. Multi-tenant isolation is enforced at the query level using the existing `by_treater` and `by_generator` indexes, with tenant context derived from the authenticated user's organization.

**Major components:**
1. **State Machine Service** (`lib/wasteStateMachine.ts`): Transition validator, allowed-transitions map, status history creation
2. **QR Scanning Components** (per app): Camera scanner wrapper with manual fallback, scan confirmation UI
3. **Collection Workflow** (generator + trucking): Request creation, driver assignment, pickup scan loop, signature capture
4. **Treatment Processing** (treater): Intake scanning, treatment session recording, batch management
5. **Disposal Batching** (treater + trucking): Batch creation, seal with parent QR, disposal scan

### Critical Pitfalls

1. **State machine race conditions** -- Driver scans "collected" while dispatcher cancels pickup; bag ends up in impossible state. **Prevention:** Server-side validation of current status before every transition; use allowed-transitions map; Convex transaction guarantees atomic status + history write.

2. **Multi-tenant data leakage** -- Query returns all waste bags across tenants. **Prevention:** Always filter by `treaterId`; derive tenant context from authenticated user, not request body; code review checklist for every query PR.

3. **QR code collision** -- Hospital-generated QR duplicates pre-manufactured QR. **Prevention:** Use UUID v4 for all generated QRs; cross-table uniqueness check against both `wasteBags` and `bagInventory`; namespace QRs by source (HWM-INV-xxx vs HWM-GEN-xxx).

4. **Audit trail gaps** -- Status changed but no wasteStatusHistory entry created. **Prevention:** Single atomic mutation for all transitions (never separate operations); server-generated timestamps; never expose update/delete for history table.

5. **Offline scanning failures** -- Driver scans in hospital basement, mutation never reaches server. **Prevention:** Explicit confirmation UI (don't show success until server confirms); local operation queue with retry; connectivity indicator; forced sync before completing route.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core State Machine and Audit Trail
**Rationale:** All subsequent features depend on reliable status transitions and audit logging. Building this foundation first prevents architectural debt.
**Delivers:** Transition validator, allowed-transitions map, atomic status+history mutations, tenant-scoped query helpers
**Addresses:** State history logging, timestamp on creation, location capture
**Avoids:** Race conditions (#1), audit trail gaps (#4), multi-tenant leakage (#2)

### Phase 2: QR Scanning Infrastructure
**Rationale:** Scanning is the primary input mechanism; must be solid before building workflows that depend on it.
**Delivers:** Camera scanner component with manual fallback, QR validation layer, cross-table uniqueness checks
**Uses:** @yudiel/react-qr-scanner, qrcode.react
**Implements:** QR activation (pre-manufactured), QR generation (hospital-generated)
**Avoids:** QR collision (#3), scanning library brittleness (#8)

### Phase 3: Waste Logging (Generator App)
**Rationale:** Logging is the entry point to the lifecycle; needed before collection can happen.
**Delivers:** Waste entry form, QR mode switching, label display/print, pending bags list
**Implements:** Manual waste entry, waste type selection, weight capture, photo attachment

### Phase 4: Collection Workflow (Generator + Trucking Apps)
**Rationale:** Collection bridges generator and treatment; most complex cross-app workflow.
**Delivers:** Collection request creation, driver assignment, pickup scan loop, signature capture, manifest display
**Uses:** react-signature-canvas
**Implements:** Request pickup, driver pickup interface, bulk scan mode, mark pickup complete
**Avoids:** OCC thrashing (#5), offline failures (#6), cross-app coordination failures (#7)

### Phase 5: Treatment Processing (Treater App)
**Rationale:** Builds on collection completion; treatment records required before disposal.
**Delivers:** Intake scanning, treatment session creation, bag-to-treatment linking, treatment batch tracking
**Implements:** Scan incoming waste, manifest reconciliation, record treatment session, treatment validation logging

### Phase 6: Disposal Batching (Treater + Trucking Apps)
**Rationale:** Final workflow step; depends on all prior phases.
**Delivers:** Batch creation UI, batch seal with parent QR generation, disposal scan at disposal site, final status update
**Implements:** Create disposal batch, add/remove bags, seal batch, generate batch QR, disposal confirmation
**Avoids:** Batch consistency errors (#11)

### Phase Ordering Rationale

- **Dependencies flow downward:** Each phase depends on the one above (can't scan without state machine, can't collect without logging, can't treat without collecting)
- **Risk mitigation early:** Critical pitfalls (race conditions, tenant leakage, audit gaps) addressed in Phase 1 before any user-facing features
- **Cross-app complexity contained:** Phase 4 (Collection) and Phase 6 (Disposal) have multi-app interactions; grouped logically rather than by app
- **Schema already exists:** No schema migration phases needed; focus is on mutations and UI

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 4 (Collection Workflow):** Complex driver UX, offline considerations, signature storage patterns -- may need research on mobile PWA offline capabilities
- **Phase 6 (Disposal Batching):** Parent-child QR relationship, batch aggregation patterns -- less documented than individual item tracking

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (State Machine):** Well-documented Convex transaction patterns; pitfalls research provides all needed patterns
- **Phase 2 (QR Scanning):** Library selection complete; stack research provides integration code
- **Phase 3 (Waste Logging):** Standard CRUD with form; no special patterns needed
- **Phase 5 (Treatment):** Similar to logging; intake scanning reuses Phase 2 infrastructure

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Libraries verified via npm, version-checked, integration patterns documented |
| Features | HIGH | Industry patterns + DENR requirements + existing PRD alignment |
| Architecture | HIGH | Existing Convex schema verified; Better Auth integration already researched |
| Pitfalls | HIGH | Convex OCC docs, UUID RFC, multi-tenant isolation patterns all HIGH sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Offline sync patterns:** Medium confidence on exact Convex behavior during reconnection. Validate with Convex docs during Phase 4 planning if offline support prioritized.
- **QR scanner device compatibility:** Library selected but not tested on representative hospital device fleet. Build device test matrix before Phase 2 development.
- **Certificate deferral scope:** Confirm with stakeholders that PTT/COT can be truly deferred to v1.2 without blocking DENR compliance.

## Sources

### Primary (HIGH confidence)
- [Convex OCC Documentation](https://docs.convex.dev/database/advanced/occ) -- transaction atomicity, conflict handling
- [Convex Real-time](https://docs.convex.dev/realtime) -- automatic subscriptions, dependency tracking
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) -- background job patterns
- [UUID RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) -- collision probability, format specification
- [AWS Tenant Isolation Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html) -- multi-tenant security patterns

### Secondary (MEDIUM confidence)
- [Medical Waste Management Software](https://www.osplabs.com/medical-waste-management-software/) -- feature expectations
- [Chain of Custody Protocols](https://www.trihazsolutions.com/medical-waste-chain-of-custody-protocols/) -- documentation requirements
- [Browser Barcode Scanning Challenges](https://www.dynamsoft.com/blog/insights/browser-barcode-scanning-challenges-best-practices/) -- device compatibility issues
- [@yudiel/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner) -- library evaluation
- [qrcode.react](https://github.com/zpao/qrcode.react) -- library evaluation

### Tertiary (LOW confidence)
- Offline-first architecture guides -- general patterns, not Convex-specific; needs validation

---
*Research completed: 2026-01-21*
*Ready for roadmap: yes*
