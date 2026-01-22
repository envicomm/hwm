# Requirements: Hospital Waste Management v1.1

**Defined:** 2026-01-21
**Core Value:** Treaters can manage their complete waste tracking ecosystem — creating and overseeing generators and haulers with role-based access control — ensuring regulatory compliance and operational visibility.

## v1.1 Requirements

Requirements for Authentication + Organization Management milestone.

### Authentication

- [ ] **AUTH-01**: Treater can sign up with email and password
- [ ] **AUTH-02**: Treater receives email verification after signup
- [ ] **AUTH-03**: Treater can log in with email and password
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Generator user can log in (account created by treater)
- [ ] **AUTH-06**: Hauler user can log in (account created by treater)
- [ ] **AUTH-07**: User can reset password via email link

### Organization Management

- [ ] **ORG-01**: Treater creates generator organization with initial owner
- [ ] **ORG-02**: Treater creates hauler organization with initial owner
- [ ] **ORG-03**: Treater views list of their generators
- [ ] **ORG-04**: Treater views list of their haulers
- [ ] **ORG-05**: Treater can view generator organization details
- [ ] **ORG-06**: Treater can view hauler organization details

### Team Management

- [ ] **TEAM-01**: Org owner can invite team members via email
- [ ] **TEAM-02**: Invited user receives email with signup/join link
- [ ] **TEAM-03**: Org owner/admin can assign roles (owner, admin, member)
- [ ] **TEAM-04**: Org owner/admin can remove team members
- [ ] **TEAM-05**: Team member list shows name, email, role, status

### Access Control

- [ ] **RBAC-01**: Owner role has full access including billing
- [ ] **RBAC-02**: Admin role can manage team and settings
- [ ] **RBAC-03**: Member role can use features only
- [ ] **RBAC-04**: Role-based UI shows appropriate features per role
- [ ] **RBAC-05**: Treaters see own data + linked generators/haulers
- [ ] **RBAC-06**: Generators see only their own org data
- [ ] **RBAC-07**: Haulers see only their own org data

### Cross-App Authentication

- [ ] **XAUTH-01**: Session works across generator app (port 3001)
- [ ] **XAUTH-02**: Session works across treater app (port 3002)
- [ ] **XAUTH-03**: Session works across trucking app (port 3003)
- [ ] **XAUTH-04**: User redirected to appropriate app based on org type

## v1.2 Requirements (Deferred)

Waste Tracking features — deferred until auth foundation is stable.

### Waste Logging

- **WASTE-01**: Hospital can log waste bag with QR code
- **WASTE-02**: Pre-manufactured QR mode supported
- **WASTE-03**: Hospital-generated QR mode supported

### Collection Workflow

- **COLL-01**: Generator can request collection
- **COLL-02**: Treater can assign hauler to collection
- **COLL-03**: Driver can mark bags as collected

### Treatment & Disposal

- **TREAT-01**: Treater can record treatment processing
- **TREAT-02**: Treater can create disposal batches
- **TREAT-03**: Disposal confirmation with certificates

## Out of Scope

Explicitly excluded from v1.1 milestone.

| Feature | Reason |
|---------|--------|
| Self-registration for generators/haulers | Treaters create these accounts directly |
| Hauler partnerships with multiple treaters | Haulers exclusive to one treater (simplifies access control) |
| DENR compliance documents (COT, PTT, HazwasteID) | Deferred to v1.2 (requires stable waste tracking) |
| Vision AI for waste classification | Nice-to-have, not core |
| Driver location tracking | Requires mobile app optimization |
| OAuth/SSO login | Email/password sufficient for v1.1 |
| MFA/2FA | Can add in v1.2 once core auth stable |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 4 | Complete |
| AUTH-06 | Phase 4 | Complete |
| AUTH-07 | Phase 1 | Complete |
| ORG-01 | Phase 2 | Complete |
| ORG-02 | Phase 2 | Complete |
| ORG-03 | Phase 3 | Complete |
| ORG-04 | Phase 3 | Complete |
| ORG-05 | Phase 3 | Complete |
| ORG-06 | Phase 3 | Complete |
| TEAM-01 | Phase 4 | Complete |
| TEAM-02 | Phase 4 | Complete |
| TEAM-03 | Phase 4 | Complete |
| TEAM-04 | Phase 4 | Complete |
| TEAM-05 | Phase 4 | Complete |
| RBAC-01 | Phase 5 | Pending |
| RBAC-02 | Phase 5 | Pending |
| RBAC-03 | Phase 5 | Pending |
| RBAC-04 | Phase 5 | Pending |
| RBAC-05 | Phase 5 | Pending |
| RBAC-06 | Phase 5 | Pending |
| RBAC-07 | Phase 5 | Pending |
| XAUTH-01 | Phase 6 | Pending |
| XAUTH-02 | Phase 6 | Pending |
| XAUTH-03 | Phase 6 | Pending |
| XAUTH-04 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 (100% coverage)

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-22 after Phase 4 completion*
