# Implementation Plan and Acceptance Checklist

## Phase 0 — Decisions and foundation
- [ ] Confirm stack, hosting and authentication strategy.
- [ ] Confirm sales shared-lead visibility.
- [ ] Confirm currency (SRS default: INR), tax/invoice requirements and numbering.
- [ ] Confirm backup frequency, retention and recovery owner.
- [ ] Initialize frontend, backend, MySQL (phpMyAdmin) and schema.
- [ ] Add linting, environment examples, logging, error handling and health check.
- [ ] Establish API response and validation conventions.

## Phase 1 — Central CRM
1. Authentication, users, roles and authorization.
2. Responsive application shell and permission-aware navigation.
3. Leads CRUD with automatic ID, owner assignment, search/filter/sort/pagination.
4. Lead statuses and pipeline.
5. Follow-up logging and due/overdue in-app reminders.
6. Duplicate phone warning with matching-record link and override audit.
7. Won lead conversion to client in one transaction; preserve lead history and prevent duplicate conversion.
8. Client CRUD/archive and onboarding checklist.
9. Dashboard cards with drill-down to underlying records.
10. Basic to-do/calendar.
11. Tests, security checks and backup/restore rehearsal.

### Phase 1 acceptance checks
- Authorized user can sign in from mobile or desktop and see shared updated records.
- Users cannot access records/modules outside their permissions.
- Leads can be created, assigned, searched, edited and moved through valid statuses.
- Lost and On Hold reasons are enforced.
- Duplicate phone match generates a warning; no silent merge.
- Follow-ups can be scheduled/completed and shown due/overdue.
- Won lead converts only once and original history remains available.
- Client data can be searched and archived.
- Dashboard numbers match the underlying permitted records.
- Save failures show clear errors.
- Backup restore procedure is documented and tested.

## Phase 2 — Delivery
- Projects, project owners/team, tasks, milestones and progress.
- Change requests and recorded approvals.
- Quotations with line items, PDF output and version history.
- Tests for permissions, date/status transitions and linked-record integrity.

## Phase 3 — Money and renewals
- Invoices and line items, payment entries, partial payments, receipts and basic expenses.
- Server-calculated paid/outstanding balance.
- Maintenance contracts, domain/hosting subscriptions and renewal reminders.
- Test decimal arithmetic, duplicate payment submissions, permissions and audit history.

## Phase 4 — Internal operations
- Employee and intern records.
- Approved document templates, preview, PDF download and generated-document history.
- Tools register, expanded reports and settings.
- HR access restrictions and explicit confirmation before issuing documents.

## Definition of done for each module
- Requirements and role permissions are documented.
- Server-side validation and authorization are implemented.
- Loading, empty, success and error states exist in UI.
- Migrations are reversible where practical.
- Tests cover key business rules and failure paths.
- Audit events exist for sensitive changes.
- No secrets are committed.
- Manual verification steps are documented.
