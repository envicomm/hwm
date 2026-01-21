# Domain Pitfalls: Waste Tracking Lifecycle Features

**Domain:** Multi-tenant SaaS waste tracking with QR scanning and cross-app workflows
**Researched:** 2026-01-21
**Context:** Adding waste tracking lifecycle to existing HWM app with Convex backend
**Overall Confidence:** HIGH (verified with Convex docs, existing schema analysis, and current research)

---

## Executive Summary

This document catalogs critical mistakes when adding waste tracking lifecycle features to the existing HWM multi-tenant system. The pitfalls are specific to:

- State machine transitions across multiple apps (generator, hauler, treater)
- QR code scanning and generation (hospital-generated and pre-manufactured)
- Real-time updates via Convex with optimistic concurrency
- Audit trail requirements for DENR Philippines compliance
- Offline/intermittent connectivity scenarios for mobile scanning

**Your specific risk profile:**
- Existing Convex schema with `wasteBags`, `wasteStatusHistory`, `bagInventory` tables
- Three React apps sharing Convex backend (`@hwm/convex/api`)
- State machine with 7 statuses: `initialized` -> `disposed`
- Multi-tenant hierarchy: Treater owns Generators and Haulers
- Compliance requirements: PTT (Permit to Transport), COT (Certificate of Treatment)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or compliance failures.

### Pitfall 1: State Machine Race Conditions in Multi-App Environment

**What goes wrong:** Multiple users across different apps (generator, hauler, treater) attempt status transitions simultaneously. Driver scans "collected" while dispatcher cancels pickup. Treater marks "treated" while collection is still "in_progress". The wasteBag ends up in an inconsistent state, or audit trail shows impossible transitions.

**Why it happens:** Each app sees the same real-time data from Convex but may issue mutations based on stale client-side state. Network latency between scan event and server mutation creates windows for conflict. Developers trust that "Convex handles it" without understanding the specific failure modes.

**Concrete example in your system:**
```typescript
// Race condition scenario:
// 1. Driver opens app, sees bag status: "to_be_collected"
// 2. Dispatcher cancels collection (sets status back to "initialized")
// 3. Driver scans bag (mutation based on stale state)
// 4. What happens? Without validation, bag goes to "collected"
//    even though collection was cancelled!

// BAD - Trusting client state
export const scanCollected = mutation({
  args: { wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    // No validation of current status!
    await ctx.db.patch(args.wasteBagId, {
      status: "collected",
      updatedAt: Date.now()
    });
  }
});

// GOOD - Server-side validation
export const scanCollected = mutation({
  args: { wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    const bag = await ctx.db.get(args.wasteBagId);
    if (!bag) throw new Error("Waste bag not found");

    // Validate current status allows this transition
    if (bag.status !== "to_be_collected") {
      throw new Error(
        `Cannot mark as collected: bag is "${bag.status}", expected "to_be_collected"`
      );
    }

    // Now safe to transition
    const now = Date.now();
    await ctx.db.patch(args.wasteBagId, {
      status: "collected",
      updatedAt: now
    });

    // Create audit trail atomically
    await ctx.db.insert("wasteStatusHistory", {
      wasteBagId: args.wasteBagId,
      fromStatus: "to_be_collected",
      toStatus: "collected",
      changedBy: await getCurrentUserId(ctx),
      timestamp: now,
      location: await getLocationFromContext(ctx),
      notes: null,
    });
  }
});
```

**Consequences:**
- Waste bags in impossible states (e.g., "treated" without ever being "collected")
- Audit trail gaps that fail DENR compliance reviews
- Certificates generated for incomplete workflows
- Legal liability if waste is mishandled and records are inconsistent

**Prevention:**
1. **Allowed transitions map**: Define explicitly which transitions are valid
   ```typescript
   const VALID_TRANSITIONS: Record<WasteStatus, WasteStatus[]> = {
     initialized: ["to_be_collected"],
     to_be_collected: ["collected", "initialized"], // can cancel
     collected: ["treated"],
     treated: ["aggregated"],
     aggregated: ["disposal_requested"],
     disposal_requested: ["disposed"],
     disposed: [], // terminal state
   };

   function validateTransition(from: WasteStatus, to: WasteStatus): boolean {
     return VALID_TRANSITIONS[from]?.includes(to) ?? false;
   }
   ```
2. **Server-side state validation**: Every status transition mutation MUST verify current status
3. **Atomic transition + history**: Write status change and audit record in same mutation (Convex transactions guarantee this)
4. **Optimistic UI with validation**: Show pending state on client but revert on server rejection

**Detection (warning signs):**
- `wasteStatusHistory` entries where `fromStatus` doesn't match previous `toStatus`
- User complaints about "bag status jumped back"
- Certificates generated but `wasteBagId.status` doesn't match certificate type
- Console errors with "Cannot transition" messages

**Phase to address:** Phase 1 (Core State Machine) - Build transition validator before any scanning features

**Sources:**
- [Convex OCC Documentation](https://docs.convex.dev/database/advanced/occ) - HIGH confidence
- [Handling Race Conditions in Distributed Systems](https://www.geeksforgeeks.org/computer-networks/handling-race-condition-in-distributed-system/) - MEDIUM confidence

---

### Pitfall 2: Multi-Tenant Data Leakage via Missing Tenant Filters

**What goes wrong:** A query or mutation reads/writes waste data without filtering by `treaterId`. Hospital A sees Hospital B's waste bags. Driver from Hauler X sees routes for Hauler Y. Treater admin accidentally processes another treater's waste.

**Why it happens:** Convex queries are powerful and flexible - developers write `ctx.db.query("wasteBags").collect()` forgetting tenant scope. New features copy existing query patterns without understanding implicit assumptions. The existing schema has `treaterId` denormalized on `wasteBags` but enforcement is at application level, not database level.

**Concrete example with your existing schema:**
```typescript
// Your wasteBags schema already has treaterId:
// treaterId: v.id("treaters"), // Denormalized for efficient queries

// BAD - Returns ALL waste bags!
export const getAllWasteBags = query(async (ctx) => {
  return await ctx.db.query("wasteBags").collect();
});

// GOOD - Always filter by tenant
export const getWasteBagsForTreater = query({
  args: { treaterId: v.id("treaters") },
  handler: async (ctx, args) => {
    // First verify the authenticated user has access to this treater
    const user = await getCurrentUser(ctx);
    await verifyUserAccessToTreater(ctx, user, args.treaterId);

    return await ctx.db
      .query("wasteBags")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .collect();
  }
});

// BETTER - Derive treater from authenticated user
export const getMyWasteBags = query(async (ctx) => {
  const user = await getCurrentUser(ctx);
  const treaterId = await getTreaterIdForUser(ctx, user);

  return await ctx.db
    .query("wasteBags")
    .withIndex("by_treater", (q) => q.eq("treaterId", treaterId))
    .collect();
});
```

**Consequences:**
- HIPAA/privacy violations if healthcare waste data crosses tenants
- DENR compliance failure
- Complete loss of customer trust
- Potential legal action

**Prevention:**
1. **Mandatory tenant context in all queries**: Create helper functions that ALWAYS filter by tenant
2. **Code review checklist**: Every PR touching queries must verify tenant filter
3. **Test with multiple tenants**: Seed test data for 2+ treaters, verify isolation
4. **User context validation**: Extract `treaterId` from authenticated user, not from request body
5. **Leverage existing indexes**: Your schema has `by_treater`, `by_treater_status` - use them

**Detection:**
- Query functions that don't use `by_treater` or similar tenant-scoped indexes
- Tests that only use single-tenant fixtures
- Bug reports showing "unexpected data" from users

**Phase to address:** Phase 1 (Core State Machine) - Establish tenant-scoped query patterns before building features

**Sources:**
- [AWS Tenant Isolation Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html) - HIGH confidence
- [Tenant Isolation Architecture and Security](https://securityboulevard.com/2025/12/tenant-isolation-in-multi-tenant-systems-architecture-identity-and-security/) - MEDIUM confidence

---

### Pitfall 3: QR Code Collision and Duplication

**What goes wrong:** Two waste bags have the same QR code. Hospital-generated QR duplicates a pre-manufactured QR. Same QR scanned twice creates duplicate entries. QR format inconsistency (with/without prefix) causes lookup failures.

**Why it happens:**
- Hospital-generated QR uses weak randomness (e.g., timestamp-based)
- Pre-manufactured QR batches imported without uniqueness validation
- No cross-table uniqueness check between `bagInventory.qrCode` and hospital-generated codes
- Scanning creates record before checking if QR already activated

**Your specific risk:** Your schema has two QR sources that must not collide:
```typescript
// wasteBags.ts
qrCode: v.string(),
qrSource: v.union(v.literal("pre_manufactured"), v.literal("hospital_generated")),
bagInventoryId: v.optional(v.id("bagInventory")), // Set if pre-manufactured

// bagInventory.ts
qrCode: v.string(),
```

**Collision scenario:**
```typescript
// 1. Treater manufactures bag with QR "HWM-ABC123" (stored in bagInventory)
// 2. Hospital generates QR for generic bag, coincidentally "HWM-ABC123"
// 3. Both QRs now exist - which wasteBag does scanning find?

// BAD - No collision check
export const createHospitalGeneratedBag = mutation({
  args: { generatorId: v.id("generators"), wasteType: v.string() },
  handler: async (ctx, args) => {
    const qrCode = `HWM-${Date.now()}`; // Weak! Could collide
    await ctx.db.insert("wasteBags", {
      qrCode,
      qrSource: "hospital_generated",
      // ...
    });
  }
});

// GOOD - Cross-table uniqueness check with UUID
import { v4 as uuidv4 } from 'uuid';

export const createHospitalGeneratedBag = mutation({
  args: { generatorId: v.id("generators"), wasteType: v.string() },
  handler: async (ctx, args) => {
    const qrCode = `HWM-${uuidv4()}`; // Cryptographically unique

    // Check both tables for collision
    const existingWasteBag = await ctx.db
      .query("wasteBags")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", qrCode))
      .first();

    const existingInventory = await ctx.db
      .query("bagInventory")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", qrCode))
      .first();

    if (existingWasteBag || existingInventory) {
      // Virtually impossible with UUID, but handle gracefully
      throw new Error("QR code collision - please retry");
    }

    await ctx.db.insert("wasteBags", {
      qrCode,
      qrSource: "hospital_generated",
      // ...
    });
  }
});
```

**Consequences:**
- Waste bag lookups return wrong record
- Treatment certificates issued for wrong waste
- Audit trail becomes meaningless
- Regulatory inspection fails on chain-of-custody

**Prevention:**
1. **UUID v4 for all QR codes**: Use cryptographically strong random IDs (collision probability: 1 in 2^122)
2. **Cross-table uniqueness validation**: Check both `wasteBags` and `bagInventory` before creating
3. **Canonical QR format**: Normalize all QR codes on read (uppercase, trim, prefix validation)
4. **Idempotent scanning**: Scanning existing active bag returns it rather than creating duplicate
5. **Namespace QR codes by source**: `HWM-INV-xxx` for inventory, `HWM-GEN-xxx` for hospital-generated

**Detection:**
- Multiple `wasteBags` rows with same `qrCode` (run periodic audit query)
- Scan operations that "can't find" QR codes that visually exist
- Treatment certificates referencing wrong generator

**Phase to address:** Phase 2 (QR Scanning) - Build QR validation layer before any scanning UI

**Sources:**
- [UUID RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) - HIGH confidence
- [UUID Collision Probability](https://orbit2x.com/blog/uuid-complete-guide-generate-validate-use-unique-identifiers) - HIGH confidence

---

### Pitfall 4: Audit Trail Gaps and Tampering Vulnerability

**What goes wrong:** Status changes happen without corresponding `wasteStatusHistory` entries. Audit records can be modified or deleted. Timestamps are client-provided and unreliable. Location data missing on mobile scans. Audit trail doesn't capture WHO made the change (uses generic system user).

**Why it happens:**
- Status update and history write are separate operations (not atomic)
- Developer forgets to add history entry in new status transition code path
- Error handling catches exception after status write but before history write
- Mobile app doesn't request location permissions
- `changedBy` field populated with service account, not actual user

**Your existing schema already supports audit trail:**
```typescript
// wasteStatusHistory.ts
export const wasteStatusHistory = defineTable({
  wasteBagId: v.id("wasteBags"),
  fromStatus: v.optional(wasteStatus),
  toStatus: wasteStatus,
  changedBy: v.id("users"),
  notes: v.optional(v.string()),
  location: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
    })
  ),
  timestamp: v.number(),
});
```

**Gap scenario:**
```typescript
// BAD - Status update separate from history (not atomic)
export const updateStatus = mutation({
  args: { wasteBagId: v.id("wasteBags"), newStatus: wasteStatus },
  handler: async (ctx, args) => {
    const bag = await ctx.db.get(args.wasteBagId);

    // Update status
    await ctx.db.patch(args.wasteBagId, {
      status: args.newStatus,
      updatedAt: Date.now()
    });

    // If this throws, status is changed but no audit record!
    await ctx.db.insert("wasteStatusHistory", {
      wasteBagId: args.wasteBagId,
      fromStatus: bag.status,
      toStatus: args.newStatus,
      changedBy: await getCurrentUserId(ctx),
      timestamp: Date.now(),
      location: null, // Missing location!
      notes: null,
    });
  }
});

// GOOD - Single atomic transaction (Convex guarantees this)
export const transitionStatus = mutation({
  args: {
    wasteBagId: v.id("wasteBags"),
    newStatus: wasteStatus,
    location: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bag = await ctx.db.get(args.wasteBagId);
    if (!bag) throw new Error("Bag not found");

    const userId = await getCurrentUserId(ctx);
    const now = Date.now(); // Server timestamp, not client

    // Validate transition
    if (!validateTransition(bag.status, args.newStatus)) {
      throw new Error(`Invalid transition: ${bag.status} -> ${args.newStatus}`);
    }

    // Both operations in same transaction
    await ctx.db.patch(args.wasteBagId, {
      status: args.newStatus,
      updatedAt: now
    });

    await ctx.db.insert("wasteStatusHistory", {
      wasteBagId: args.wasteBagId,
      fromStatus: bag.status,
      toStatus: args.newStatus,
      changedBy: userId,
      timestamp: now,
      location: args.location ?? null,
      notes: args.notes ?? null,
    });

    // Convex transaction: both succeed or both fail
  }
});
```

**Consequences:**
- DENR compliance audit failure (PTT, COT requirements)
- Cannot prove chain of custody in legal dispute
- Certificate validity questioned
- Regulatory fines

**Prevention:**
1. **Single atomic mutation for all transitions**: Never separate status update from history (Convex transactions guarantee atomicity)
2. **Server-generated timestamps**: Never trust client-provided time
3. **Location capture at scan point**: Require location for all scan-triggered transitions
4. **Immutable history design**: Never expose update/delete mutations for `wasteStatusHistory`
5. **Background validation job**: Periodic check that every status transition has corresponding history entry

**Detection:**
- `wasteBags` with `status !== "initialized"` but no `wasteStatusHistory` entries
- History entries with null `changedBy` or null `timestamp`
- Time gaps in history (bag went from A to C with no B transition)
- Query: `SELECT * FROM wasteBags WHERE status != 'initialized' AND id NOT IN (SELECT wasteBagId FROM wasteStatusHistory)`

**Phase to address:** Phase 1 (Core State Machine) - Build audit trail into transition system from day one

**Sources:**
- [Audit Trail Best Practices](https://www.inscopehq.com/post/audit-trail-requirements-guidelines-for-compliance-and-best-practices) - MEDIUM confidence
- [Convex Transaction Atomicity](https://docs.convex.dev/database/advanced/occ) - HIGH confidence

---

## Moderate Pitfalls

Mistakes that cause delays, poor UX, or technical debt requiring significant refactoring.

### Pitfall 5: Convex OCC Thrashing on High-Frequency Updates

**What goes wrong:** Multiple drivers scanning bags from same collection request cause rapid mutations. Counter increments (bag count, total weight) on shared documents conflict repeatedly. Optimistic updates shown to users get "snapped back" when server rejects. Users see flickering UI or report "my changes disappeared."

**Why it happens:** Convex's OCC retries transactions on conflict, but if conflict rate exceeds retry capacity, mutations fail. Mutations that read entire tables or large document sets have high conflict surface. Multiple clients updating same aggregate document simultaneously.

**Convex-specific behavior:**
```typescript
// From Convex docs:
// "Transactions have three main ingredients: a begin timestamp, their read set,
//  and their write set. If a concurrent write overlaps with a transaction's
//  read set, the transaction must be aborted."

// BAD - Wide read set causes frequent conflicts
export const addBagToCollection = mutation({
  args: { collectionRequestId: v.id("collectionRequests"), wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    // Reading all bags for this collection = large read set
    const allBags = await ctx.db
      .query("wasteBags")
      .withIndex("by_collection_request", q => q.eq("collectionRequestId", args.collectionRequestId))
      .collect();

    const newCount = allBags.length + 1;
    const newWeight = allBags.reduce((sum, b) => sum + (b.weightKg ?? 0), 0);

    // Another driver scanning concurrently will conflict!
    await ctx.db.patch(args.collectionRequestId, {
      estimatedBagCount: newCount,
      updatedAt: Date.now(),
    });
  }
});

// GOOD - Minimal read set, precise query
export const addBagToCollection = mutation({
  args: { collectionRequestId: v.id("collectionRequests"), wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    // Only read the specific bag being added
    const bag = await ctx.db.get(args.wasteBagId);

    // Link bag to collection
    await ctx.db.patch(args.wasteBagId, {
      collectionRequestId: args.collectionRequestId,
      status: "collected",
      updatedAt: Date.now(),
    });

    // Don't update aggregates synchronously - compute on read or use scheduled job
  }
});
```

**Consequences:**
- Failed scans requiring manual retry
- User frustration and distrust of system
- Data inconsistencies if partial operations complete
- Performance degradation under load

**Prevention:**
1. **Minimize read set in mutations**: Use precise indexed queries, not table scans
2. **Sharded counters for aggregates**: Don't increment single document for concurrent updates
3. **Compute aggregates on read**: Instead of storing count, query `COUNT(*)` when needed
4. **Debounce rapid client operations**: Don't fire mutation on every keystroke
5. **Design for single-writer patterns**: Collection request assigned to one driver at a time

**Detection:**
- Convex dashboard showing high OCC retry rates
- Error logs with "Write conflict" messages
- User reports of "flickering" or "values jumping"

**Phase to address:** Phase 3 (Collection Workflow) - When multiple drivers interact with same data

**Sources:**
- [Convex OCC Documentation](https://docs.convex.dev/database/advanced/occ) - HIGH confidence
- [Convex High Throughput Patterns](https://stack.convex.dev/high-throughput-mutations-via-precise-queries) - HIGH confidence

---

### Pitfall 6: Offline/Intermittent Connectivity Failures

**What goes wrong:** Driver scans bag in hospital basement with no signal. Scan appears successful (local), but mutation never reaches Convex. Driver leaves, bag status unchanged on server. Hospital thinks collection happened, treater never receives bags.

**Why it happens:**
- Web apps assume persistent connectivity
- Convex real-time subscription silently reconnects but doesn't replay failed mutations
- Optimistic UI shows success without server confirmation
- No local queue for offline operations

**Concrete failure scenario:**
```
1. Driver in hospital basement (no signal)
2. Scans QR code, UI shows "Collected!" (optimistic update)
3. Mutation silently fails to reach Convex
4. Driver moves to next bag, scans again
5. Eventually gets signal, app reconnects
6. Only latest mutation sent, previous scans lost
7. Hospital reports: "We gave you 20 bags, you only scanned 5"
```

**Consequences:**
- Lost scan events
- Waste bags in wrong location (physically vs. system state)
- Collection requests stuck in limbo
- Chain of custody broken
- Customer disputes about what was collected

**Prevention:**
1. **Explicit confirmation UI**: Don't show "success" until server confirms
   ```typescript
   // Show clear sync status
   const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'confirmed' | 'failed'>('idle');

   const handleScan = async (qrCode: string) => {
     setSyncStatus('syncing');
     try {
       await mutation({ qrCode });
       setSyncStatus('confirmed');
     } catch (error) {
       setSyncStatus('failed');
       // Add to retry queue
     }
   };
   ```
2. **Local operation queue with retry**: Store pending scans in IndexedDB/localStorage
3. **Connectivity indicator**: Show users current connection status
4. **Forced sync before critical actions**: Before driver "completes" route, force sync check
5. **Background sync worker**: Retry failed mutations when connectivity restored
6. **Convex subscription status**: Monitor `useConvex()` connection state

**Detection:**
- Gap between client-side "scanned" count and server-side `wasteStatusHistory` count
- Collection requests marked complete but bags still in old status
- User complaints about "lost" scans

**Phase to address:** Phase 2-3 (Scanning and Collection) - Build sync reliability before field deployment

**Sources:**
- [Offline-First Architecture Guide](https://www.droidcon.com/2025/12/16/the-complete-guide-to-offline-first-architecture-in-android/) - MEDIUM confidence
- [Offline-First Sync Patterns](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/) - MEDIUM confidence

---

### Pitfall 7: Cross-App Workflow Coordination Failures

**What goes wrong:** Generator requests collection, trucking app shows request, but hauler assignment doesn't propagate. Driver completes pickup, but generator app still shows "pending." Treater processes bag, but certificate generation fails silently. Each app shows different "truth."

**Why it happens:**
- Real-time subscriptions may miss updates during reconnection
- Apps subscribe to different queries with different refresh rates
- Background jobs (certificate generation) fail without user notification
- No global "workflow orchestrator" coordinating cross-app state

**Your specific workflow:**
```
Generator App                 Trucking App                  Treater App
--------------                ------------                  -----------
[Request Pickup] -----> [See Request]
                        [Assign Driver] ----->
                        [Driver Scans: collected] -----> [See Incoming]
                                                         [Scan: treated]
                                                         [Generate COT] --> Generator sees COT?
```

**Failure scenario:**
```typescript
// 1. Driver scans bag as "collected"
// 2. Mutation succeeds, updates wasteBag.status
// 3. Convex scheduled function generates PTT document
// 4. PDF generation fails (external service down)
// 5. No retry, no notification
// 6. Bag is "collected" but no PTT exists
// 7. Compliance gap!

// BAD - Fire and forget certificate generation
export const markCollected = mutation({
  args: { wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.wasteBagId, { status: "collected" });
    // Schedule certificate generation
    await ctx.scheduler.runAfter(0, api.certificates.generatePTT, { wasteBagId: args.wasteBagId });
    // What if generatePTT fails? No tracking!
  }
});

// GOOD - Track certificate generation status
export const markCollected = mutation({
  args: { wasteBagId: v.id("wasteBags") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.wasteBagId, {
      status: "collected",
      pttStatus: "pending", // Track certificate status
    });

    const jobId = await ctx.scheduler.runAfter(0, api.certificates.generatePTT, {
      wasteBagId: args.wasteBagId
    });

    // Store job reference for monitoring
    await ctx.db.insert("pendingJobs", {
      wasteBagId: args.wasteBagId,
      jobType: "ptt_generation",
      scheduledAt: Date.now(),
      status: "pending",
    });
  }
});
```

**Consequences:**
- Users lose trust in system accuracy
- Manual reconciliation required
- Compliance gaps when documents don't generate
- Customer support burden

**Prevention:**
1. **Single source of truth design**: All apps read same Convex queries
2. **Track background job status**: Don't just schedule, track completion
3. **Status includes sub-states**: Track "collected_pending_ptt" vs "collected_ptt_generated"
4. **Cross-app notification system**: Use Convex actions to send push/SMS on critical transitions
5. **Dashboard reconciliation view**: Admin can see bags with missing certificates
6. **Retry mechanisms**: Scheduled functions should retry on failure

**Detection:**
- Bags in "collected" status without `transportPermitId`
- Bags in "treated" status without `treatmentCertificateId`
- Collection requests in "completed" but linked bags still "to_be_collected"
- User reports across apps showing different data

**Phase to address:** Phase 4 (Treatment Integration) - When multiple apps interact on same records

**Sources:**
- [Saga Pattern Pitfalls](https://dev.to/yedf2/how-to-manage-anomalies-in-saga-pattern-in-microservices-7ki) - MEDIUM confidence
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) - HIGH confidence

---

### Pitfall 8: QR Scanning Library Brittleness

**What goes wrong:** QR scanner works on developer's iPhone but fails on older Android devices in hospital. Scanning in low light fails silently. Library update breaks scanning. External Bluetooth scanner integration conflicts with camera scanner.

**Why it happens:**
- Browser camera APIs vary significantly across devices
- Open-source libraries (ZXing-js, QuaggaJS) have known issues with newer devices
- Testing only on modern devices in good conditions
- No fallback for scanning failures

**Research findings on browser QR scanning:**
- "ZXing is officially in maintenance mode and is no longer under active development"
- "Users have reported issues with newer operating systems and devices, such as Android 14 or the iPhone 14 Pro Max"
- "QuaggaJS performs well for 1D barcodes but struggles with low light, motion blur, angled barcodes"
- "Performance varies noticeably by device and can feel slower on lower-end hardware"

**Consequences:**
- Field deployment failures
- Users resort to manual entry, defeating QR purpose
- Inconsistent experience across device types
- Support burden

**Prevention:**
1. **Test matrix**: Test on representative hospital device fleet (often older Android)
2. **Multiple decode attempts**: Try different library configurations before failing
3. **Manual fallback**: Always allow manual QR entry as backup
   ```typescript
   // UI offers both scan and manual entry
   <QRScanner onScan={handleScan} onError={handleScanError} />
   <Button onClick={() => setShowManualEntry(true)}>Enter QR Manually</Button>
   <ManualQRInput onSubmit={handleManualEntry} />
   ```
4. **Camera permission handling**: Graceful degradation if camera denied
5. **Scan feedback**: Audible/haptic confirmation that scan registered
6. **External scanner support**: Test with common Bluetooth barcode scanners
7. **Consider proven libraries**: Dynamsoft, Scandit have enterprise support

**Detection:**
- High rate of manual QR entries vs. scans
- User complaints from specific device types
- Scan success rate metrics by device/browser

**Phase to address:** Phase 2 (QR Scanning) - Build robust scanning before field deployment

**Sources:**
- [Browser Barcode Scanning Challenges](https://www.dynamsoft.com/blog/insights/browser-barcode-scanning-challenges-best-practices/) - MEDIUM confidence
- [JavaScript Barcode Scanners Comparison](https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/) - MEDIUM confidence

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major refactoring.

### Pitfall 9: Certificate Document Generation Failures

**What goes wrong:** PDF generation times out. Certificate shows wrong data (stale cache). Generated PDF not stored properly. Download links expire. Certificate numbers not sequential/unique.

**Prevention:**
- Generate certificates asynchronously with retry
- Store generated PDFs in Convex file storage with permanent URLs
- Use database-generated certificate numbers (not random)
- Cache certificate data at generation time, not lookup time
- Implement certificate regeneration for error recovery

**Phase to address:** Phase 4 (Treatment) and Phase 5 (Disposal)

---

### Pitfall 10: Location Data Quality Issues

**What goes wrong:** GPS shows hospital location when driver is at treater facility. Location captured as null on many scans. Coordinates have wrong precision. Location spoofing not detected.

**Prevention:**
- Require location permission before allowing status transitions
- Validate coordinates against known facility locations (geofencing)
- Log location capture failures, don't silently swallow
- Consider location optional for non-critical transitions
- Store both raw GPS and resolved address

**Phase to address:** Phase 3 (Collection) when driver location matters

---

### Pitfall 11: Disposal Batch Consistency Errors

**What goes wrong:** Batch total weight doesn't match sum of child bag weights. Bags added to sealed batch. Batch disposed but child bags not updated. Parent QR collision with child QRs.

**Your specific risk with existing schema:**
```typescript
// disposalBatches.ts
totalBagCount: v.optional(v.number()),
totalWeightKg: v.optional(v.number()),

// If these are stored, they can drift from actual child bags
```

**Prevention:**
- Compute aggregates at query time or via transaction
- Immutable batch once sealed (status-based write protection)
- Batch status transition updates all children atomically
- Namespace batch QR codes distinctly from bag QR codes (e.g., `HWM-BATCH-xxx`)
- Validate all children in valid state before sealing batch

**Phase to address:** Phase 5 (Disposal Batching)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core State Machine | Race conditions on transitions (#1) | Server-side validation, allowed transitions map |
| Core State Machine | Audit trail gaps (#4) | Atomic mutation pattern, server timestamps |
| Core State Machine | Multi-tenant leakage (#2) | Tenant-scoped query helpers |
| QR Scanning | Library compatibility issues (#8) | Device test matrix, manual fallback |
| QR Scanning | Duplicate/collision (#3) | UUID v4, cross-table uniqueness check |
| Collection Workflow | OCC thrashing (#5) | Minimal read sets, precise queries |
| Collection Workflow | Offline failures (#6) | Local queue, sync confirmation |
| Treatment Processing | Cross-app coordination (#7) | Event-driven jobs, status sub-states |
| Disposal Batching | Batch/child consistency (#11) | Atomic updates, computed aggregates |

---

## Integration Warnings (Existing HWM System)

The HWM codebase already has schema definitions. Key integration risks when adding waste tracking:

### Existing Schema Constraints

The current `wasteBags` schema has `qrCode: v.string()` but no uniqueness enforcement. Adding scanning features requires:
1. Migration to add uniqueness validation to all QR-related mutations
2. Audit of existing QR codes for duplicates before production scanning
3. Decision on QR format standardization (current schema allows any string)

### Multi-App Shared Backend

All three apps import from `@hwm/convex/api`. Changes to mutations affect all apps simultaneously:
1. Deploy backend changes before frontend features that depend on them
2. Maintain backward compatibility during rolling deployments
3. Test mutations with requests from all three app contexts
4. Use feature flags for gradual rollout

### Existing User/Role System

The `users` table has roles but tenant context must be derived:
1. Generator users: derive `treaterId` via their `generators.treaterId`
2. Hauler users: may interact with multiple treaters via `treaterHaulerPartners`
3. All mutations need role-appropriate authorization checks
4. Driver role needs special handling (mobile-focused, scan-heavy)

### Existing Index Usage

Your schema already has good indexes - use them:
```typescript
// wasteBags indexes to leverage
.index("by_qr_code", ["qrCode"])           // QR lookup
.index("by_generator", ["generatorId"])     // Generator's bags
.index("by_treater", ["treaterId"])         // Tenant filtering
.index("by_status", ["status"])             // Status filtering
.index("by_treater_status", ["treaterId", "status"])  // Combined
.index("by_collection_request", ["collectionRequestId"])  // Collection grouping
.index("by_disposal_batch", ["disposalBatchId"])  // Batch grouping
```

---

## Testing Checklist

Before marking waste tracking complete, verify these scenarios work correctly:

**State Machine:**
- [ ] Each valid transition works (initialized -> to_be_collected, etc.)
- [ ] Invalid transitions are rejected with clear error
- [ ] Concurrent transitions to same bag handled correctly
- [ ] Audit trail entry created for every transition

**Multi-Tenant Isolation:**
- [ ] Generator A cannot see Generator B's waste bags
- [ ] Driver from Hauler A cannot scan bags for Hauler B
- [ ] Treater A cannot process Treater B's bags
- [ ] All queries use tenant-scoped indexes

**QR Codes:**
- [ ] Hospital-generated QRs are unique (UUID v4)
- [ ] Pre-manufactured QRs validated against inventory
- [ ] Duplicate QR creation rejected
- [ ] QR lookup works regardless of case/whitespace

**Audit Trail:**
- [ ] Every status change has wasteStatusHistory entry
- [ ] Timestamps are server-generated
- [ ] changedBy is actual user, not system
- [ ] Location captured on mobile scans

**Offline/Sync:**
- [ ] Failed mutations queued for retry
- [ ] User sees clear sync status
- [ ] App handles reconnection gracefully
- [ ] No duplicate entries from retries

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| State machine patterns | HIGH | Verified with Convex OCC docs and existing schema |
| Multi-tenant isolation | HIGH | Aligned with existing auth pitfalls research |
| QR collision prevention | HIGH | UUID RFC verified, probability calculations accurate |
| Audit trail requirements | HIGH | DENR compliance requirements documented in PRD |
| Offline handling | MEDIUM | General patterns, Convex-specific behavior needs validation |
| QR scanning libraries | MEDIUM | WebSearch findings, library-specific testing needed |

---

## Sources

- [Convex OCC Documentation](https://docs.convex.dev/database/advanced/occ) - HIGH confidence
- [Convex Errors and Warnings](https://docs.convex.dev/error) - HIGH confidence
- [AWS Tenant Isolation Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html) - HIGH confidence
- [Tenant Isolation Architecture and Security](https://securityboulevard.com/2025/12/tenant-isolation-in-multi-tenant-systems-architecture-identity-and-security/) - MEDIUM confidence
- [UUID RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) - HIGH confidence
- [Saga Pattern Pitfalls](https://dev.to/yedf2/how-to-manage-anomalies-in-saga-pattern-in-microservices-7ki) - MEDIUM confidence
- [Offline-First Architecture Guide](https://www.droidcon.com/2025/12/16/the-complete-guide-to-offline-first-architecture-in-android/) - MEDIUM confidence
- [Audit Trail Best Practices](https://www.inscopehq.com/post/audit-trail-requirements-guidelines-for-compliance-and-best-practices) - MEDIUM confidence
- [Browser Barcode Scanning Challenges](https://www.dynamsoft.com/blog/insights/browser-barcode-scanning-challenges-best-practices/) - MEDIUM confidence
- [Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - MEDIUM confidence
- [Convex High Throughput Patterns](https://stack.convex.dev/high-throughput-mutations-via-precise-queries) - HIGH confidence

---

**Last Updated:** 2026-01-21

**Related Documents:**
- `/Users/kyllo/dev/hwm/.planning/research/PITFALLS.md` - Auth/organization pitfalls
- `/Users/kyllo/dev/hwm/PRD.md` - Product requirements with waste lifecycle
