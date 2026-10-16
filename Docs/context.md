# Context — Hertzsoft Centralized CRM & Operations System

## Product purpose
Build one secure, cloud-hosted, responsive web application for Hertzsoft Technologies to manage leads, clients, projects, documents, payments, maintenance and renewals in one place. Users must be able to access the same shared records from mobile and desktop browsers.

## Source of truth
The approved baseline is **Hertzsoft Centralized CRM & Operations System — SRS v1.0, dated 15 October 2026**. If this context pack conflicts with that SRS, follow the SRS and flag the conflict instead of guessing.

## Core goals
- Centralize business records rather than scattering them across files and messages.
- Track leads and follow-ups, then convert Won leads into clients without re-entering shared data.
- Link clients, projects, quotations, invoices, payments and renewals.
- Provide search, reminders, permissions, audit history and mobile-friendly pages.
- Build incrementally; keep v1 dependable rather than over-engineered.

## User roles
- **Administrator:** users, settings, all records, permissions and audit history.
- **Sales / Lead owner:** assigned leads, follow-ups, and conversion requests; shared-lead access depends on company decision.
- **Project manager / team member:** assigned projects and permitted project details; tasks/milestones where enabled.
- **Finance user:** quotations, invoices, receipts, payment status and finance reports.
- **HR user:** employee/intern records and approved document templates.

Implement authorization on the backend. Hiding a menu item in the frontend is not security.

## Phase 1 scope
- Authentication and role-based access.
- Dashboard with permission-aware summary cards.
- Leads CRUD, search/filter/sort/pagination and status pipeline.
- Follow-up records and due/overdue in-app reminders.
- Duplicate phone warning against leads and client contacts; do not silently block, merge or discard.
- Won lead conversion to client, with original lead retained and linked.
- Client CRUD/archive and onboarding checklist.
- Basic to-do/calendar functionality.

## Later phases
- Phase 2: projects, tasks, milestones, change requests, quotations and basic document generation.
- Phase 3: invoices, receipts, partial payments, expenses, maintenance contracts, subscriptions and renewals.
- Phase 4: HR/intern records, document templates, tools register, expanded reports and settings.

## Explicitly out of scope for v1
- Native Android/iOS applications.
- Offline editing and background sync.
- Automated WhatsApp/SMS campaigns, AI lead scoring or AI business decisions.
- Full payroll, attendance, leave management or statutory accounting.
- Automatic online payments, automatic renewal charges or bank integrations.
- Complex workflow builders and deeply customizable dashboards.

## Quality requirements
- HTTPS, secure password hashing, session expiry and password reset.
- Role/record-level authorization where applicable.
- Audit important changes and preserve payment/document history.
- Regular database and document backups, with a documented restore process.
- Validation, unique IDs, relational integrity, soft-delete/archive for linked records.
- Clear errors when saving fails; paginate larger lists.
- Collect only necessary personal data and restrict HR/finance records.

## Development rules for the coding agent
1. Do not build all phases at once. Complete and test each phase.
2. Do not invent business rules for tax, shared-lead visibility, document approval or retention. Use configurable defaults and flag unresolved decisions.
3. Do not hard-delete linked business records; archive them where appropriate.
4. Keep quotation, invoice, payment and receipt as distinct concepts.
5. A Won lead may be converted only once. Keep the lead and preserve its history.
6. Do not mark a change request Approved until approval details are recorded.
7. Do not automatically issue/sign HR documents or certificates; require authorized confirmation.
8. Never put secrets, credentials or production data in source control.
