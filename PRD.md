# Hospital Waste Management (HWM) Platform - Product Requirements Document

## Executive Summary

A multi-tenant SaaS platform for end-to-end hospital waste management, enabling compliant tracking from waste generation through treatment and final disposal. The platform serves three primary user groups through dedicated applications.

---

## System Overview

### Tenant Hierarchy

```
Treater (Primary Tenant)
├── Generators (Hospitals) - Waste producers, invited by Treater
├── Haulers (Trucking) - Transport partners
└── Users - Assigned to organizations with role-based access
```

### Applications

| App | Port | Purpose |
|-----|------|---------|
| **Generator** | 3001 | Hospital staff log waste, track collection, access certificates |
| **Treater** | 3002 | Treatment facilities manage intake, processing, disposal batching |
| **Trucking** | 3003 | Haulers manage pickups, routes, manifests, delivery confirmations |

---

## Waste Lifecycle

### Status Flow

```
┌─────────────┐     ┌──────────────────┐     ┌───────────┐     ┌─────────┐
│ initialized │ ──> │ to_be_collected  │ ──> │ collected │ ──> │ treated │
└─────────────┘     └──────────────────┘     └───────────┘     └─────────┘
       │                    │                      │                │
       │                    │                      │                │
    Hospital            Trucking app           Driver scan      Treater scan
    submits form        schedules pickup       at hospital      at facility
```

```
┌─────────┐     ┌────────────────────┐     ┌──────────┐
│ treated │ ──> │ aggregated         │ ──> │ disposed │
└─────────┘     │ disposal_requested │     └──────────┘
                └────────────────────┘
                        │
                  Batch QR created,
                  child bags linked
```

### Status Definitions

| Status | Trigger | Location | Actor |
|--------|---------|----------|-------|
| `initialized` | Form submission with waste details | Generator | Hospital Staff |
| `to_be_collected` | Collection scheduled in trucking app | Generator | Dispatcher |
| `collected` | Driver scans QR at pickup | Generator → Transit | Driver |
| `treated` | Treatment facility scans incoming QR | Treater Facility | Treater Staff |
| `aggregated` | Bags grouped into disposal batch | Treater Facility | Treater Staff |
| `disposal_requested` | Batch sealed, new parent QR generated | Treater Facility | Treater Staff |
| `disposed` | Driver scans batch QR, all children updated | Disposal Site | Driver |

---

## QR Code Strategy

### Two QR Sources

1. **Pre-manufactured**: Physical bags with embedded QR, tracked from manufacturing through use
2. **Hospital-generated**: On-demand QR codes printed and attached to generic bags

### QR Mode Per Generator

Generators configure their preference:
- `pre_manufactured` - Only use tracked inventory bags
- `hospital_generated` - Print QR codes as needed
- `both` - Support either method

### Pre-manufactured Bag Lifecycle

```
manufactured → distributed → activated → [becomes wasteBag]
```

Treaters ship bags to generators via `bagDistributions`. Upon waste creation, bag status becomes `activated` and links to `wasteBagId`.

---

## Feature Specifications

### Generator App (Hospital Portal)

#### Waste Logging
- **QR Scan**: Camera-based scanning to activate pre-manufactured bags
- **Vision Model**: Upload photo for AI-assisted waste classification and weight estimation
- **Manual Form**: Select waste type, enter weight, add description
- **Output**: Creates `wasteBag` with status `initialized`

#### Dashboard
- Active waste bags by status
- Pending collection requests
- Recent activity timeline
- Compliance alerts (approaching expiry dates)

#### Collection Requests
- Request pickup for accumulated waste
- View scheduled collections
- Track driver location during pickup
- Confirm pickup completion

#### Certificates
- Download treatment certificates per bag
- Batch download by date range
- Filter by waste type, status

#### Inventory (Pre-manufactured mode)
- View received bag shipments
- Track available vs. used bags
- Alert on low inventory

---

### Treater App (Treatment Facility Portal)

#### Generator Management
- Onboard new hospitals to platform
- Configure generator settings (QR mode, contacts)
- View generator activity and compliance status

#### Hauler Partnerships
- Manage `treaterHaulerPartners` relationships
- Assign haulers to generators/regions
- View hauler performance metrics

#### Incoming Waste
- Scan collected bags at facility intake
- Verify manifests against scanned QRs
- Flag discrepancies

#### Treatment Processing
- Record treatment sessions (`treatments` table)
- Log method, equipment, operator, validation results
- Generate treatment certificates

#### Disposal Batching
- Aggregate treated bags into `disposalBatches`
- Generate parent QR linking child bags
- Request disposal pickup from hauler

#### Bag Inventory Management
- Track manufactured bags (`bagInventory`)
- Create distributions to generators
- Monitor inventory levels per generator

#### Reporting
- Waste volumes by generator
- Treatment throughput
- Compliance documentation exports

---

### Trucking App (Hauler Portal)

#### Dispatch Dashboard
- Pending collection requests
- Pending disposal pickups
- Assigned driver schedules
- Route optimization view

#### Collection Operations
- Accept/assign collection requests
- Generate pickup manifests
- Track driver location
- Confirm pickup (QR scan required)

#### Disposal Operations
- Accept disposal batch requests
- Track transport to disposal site
- Confirm disposal (batch QR scan)

#### Driver Mobile View
- Today's route with navigation
- QR scanner for pickups/deliveries
- Digital signature capture
- Photo documentation

#### Fleet Management
- Driver assignments
- Vehicle tracking
- Compliance documentation (DOT, EPA)

---

## Data Models

### Core Entities

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| `treaters` | Treatment facilities (primary tenants) | Has many generators, hauler partnerships |
| `generators` | Hospitals/waste sources | Belongs to treater, has many wasteBags |
| `haulers` | Transport companies | Has many driver users |
| `users` | Platform users | Belongs to one organization by role |
| `wasteBags` | Individual tracked waste items | Core entity with full lifecycle |
| `collectionRequests` | Batch pickups from generators | Links generator, hauler, driver |
| `treatments` | Treatment processing records | Links to multiple wasteBags |
| `disposalBatches` | Aggregated waste for disposal | Contains multiple treated bags |

### Certificate Entities

| Entity | Purpose |
|--------|---------|
| `treatmentCertificates` | Per-bag treatment proof for generator compliance |
| `disposalCertificates` | Per-batch final disposal documentation |

### Audit Trail

`wasteStatusHistory` captures every status transition with:
- Timestamp
- Actor (changedBy)
- Previous and new status
- Location (lat/lon)
- Notes

---

## User Roles & Permissions

| Role | Organization | Capabilities |
|------|--------------|--------------|
| `generator` | Generator | Log waste, request collection, view certificates |
| `treater` | Treater | Full facility operations, generator management |
| `hauler` | Hauler | Dispatch management, fleet oversight |
| `driver` | Hauler | Mobile pickup/delivery, QR scanning |
| `admin` | Treater | Cross-organization visibility, system config |

---

## Communication Channels

### Email (Resend)
- Collection request confirmations
- Treatment certificate delivery
- Low inventory alerts
- Compliance reminders

### SMS (Twilio)
- Driver pickup notifications
- Collection ETA updates
- Urgent compliance alerts

---

## Compliance Requirements

### Documentation
- Treatment certificates with unique certificate numbers
- Disposal certificates with batch tracking
- Full audit trail on status changes
- Location tracking at scan points

### DENR Philippines Compliance Documents

| Document | Trigger | Issued By | Issued To | Purpose |
|----------|---------|-----------|-----------|---------|
| **Permit to Transport (PTT)** | Waste collected from generator | System | Generator | Authorizes transport of waste; proof that waste is being properly transferred |
| **Certificate of Treatment (COT)** | QR trashbag disposed | Treater (auto-generated) | Generator | Proof of proper treatment; required for DENR compliance |
| **HazwasteID** | (Future) COT + PTT exist | System | Generator | Final compliance identifier for DENR reporting |

#### Document Workflow

```
Collection Event
      │
      ▼
┌─────────────┐
│ PTT issued  │ ──> Generator receives proof of authorized transport
└─────────────┘
      │
      ▼
  [Transport & Treatment]
      │
      ▼
┌─────────────┐
│ COT issued  │ ──> Generator receives proof of proper treatment
└─────────────┘
      │
      ▼
┌──────────────┐
│ HazwasteID   │ ──> (Future) Combined identifier for DENR reporting
└──────────────┘
```

### Retention
- All certificates stored with `documentUrl`
- Status history maintained indefinitely
- Timestamps on all records (createdAt, updatedAt)

### Regulatory
- EPA compliant waste classification
- DOT transport documentation
- State-specific manifest requirements
- DENR Philippines compliance (PTT, COT, HazwasteID)

---

## Technical Architecture

### Stack
- **Frontend**: React 19, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/ui
- **Backend**: Convex (serverless database + functions)
- **Monorepo**: pnpm workspaces, Turborepo, Biome

### Shared Packages
- `packages/convex` - Database schema, queries, mutations, actions
- `packages/typescript-config` - Shared TypeScript configuration
- `packages/biome-config` - Linting and formatting rules

---

## Integration Points

### QR Scanning
- Device camera access for web-based scanning
- Support for external Bluetooth scanners

### Vision AI
- Image upload for waste classification
- Weight estimation from visual analysis
- Store results in `imageAnalysis` field

### Document Generation
- PDF certificate generation
- Batch export capabilities
- Digital signing (future)

### Location Services
- GPS capture on mobile scans
- Driver location tracking
- Geofenced facility zones

---

## Success Metrics

### Operational
- Time from waste creation to collection
- Treatment processing throughput
- Disposal batch completion rate

### Compliance
- Certificate generation rate (100% target)
- Audit trail completeness
- Documentation retrieval time

### User Adoption
- Active users per organization
- Mobile scan success rate
- Feature utilization rates
