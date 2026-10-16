# Database Design — MySQL (phpMyAdmin)

## Design principles
- MySQL (managed via phpMyAdmin / InnoDB engine) is used for linked CRM records.
- Use UUID primary keys (`CHAR(36) DEFAULT (UUID())`); never use display names as identifiers.
- Store timestamps in `TIMESTAMP` / `DATETIME` and normalize phone numbers for duplicate checks.
- Use `DECIMAL(12,2)` for money amounts; never floating-point types for currency.
- Use foreign keys, unique constraints, and indexes with InnoDB engine.
- Use archive/soft-delete for linked records; do not casually cascade-delete business history.
- The included `database_schema.sql` is a Phase 1 starter schema for MySQL/phpMyAdmin, not the complete schema for all four phases.

## Phase 1 entities
### users
Login identity, name, email, password hash, active status and timestamps.

### roles
Named role records such as Administrator, Sales, Project Manager, Finance and HR.

### user_roles
Many-to-many mapping allows a user to have one or more roles. If the business confirms exactly one role per user, this can be simplified.

### leads
Lead identity, contact details, requirement, status, assigned owner, priority, source, budget, expected decision date, domain/hosting availability, notes, lost/on-hold reasons, creator and timestamps.

Required SRS fields: automatic Lead ID, name, phone, requirement, status and assigned employee. Additional fields are optional unless confirmed by the business.

### follow_ups
Belongs to a lead; records scheduled date/time, type, outcome, notes, owner, next follow-up and completion state.

### clients
Created manually or from a Won lead. Contains client/contact/billing details, onboarding status and notes. Preserve `converted_from_lead_id` and the original lead.

### onboarding_items
Checklist items associated with a client, with status, owner and due date as appropriate.

### tasks
Basic personal to-do/calendar items for Phase 1. Project-specific tasks can be extended in Phase 2.

### audit_logs
Records important actions, actor, entity type/id, action, timestamp and minimal change metadata. Never record passwords/tokens.

## Planned later-phase entities
- `projects`, `project_members`, `milestones`, `project_tasks`
- `change_requests`, `quotations`, `quotation_items`, `quotation_versions`
- `invoices`, `invoice_items`, `payments`, `receipts`, `expenses`
- `maintenance_contracts`, `subscriptions`
- `employees`, `interns`, `document_templates`, `generated_documents`
- `tools`, `notifications`, `settings`

Do not implement every later-phase table before Phase 1 is tested.

## Main relationships
```text
users ──< leads (assigned owner)
users ──< follow_ups (owner/creator)
leads ──< follow_ups
leads ──0..1 clients (conversion link)
clients ──< onboarding_items
users ──< tasks
users ──< audit_logs
```

Later:
```text
clients ──< projects ──< tasks/milestones
projects ──< quotations ──< quotation_items
clients/projects ──< invoices ──< invoice_items
invoices ──< payments ──0..1 receipts
clients ──< subscriptions/maintenance_contracts
```

## Important constraints
- Lead statuses: New, Contacted, Qualified, Quotation Sent, Negotiation, Won, Lost, On Hold.
- Lost requires a reason.
- On Hold requires a reason; revisit date is optional.
- Lead owner must be an active user.
- Duplicate phone numbers should trigger a warning, not an automatic merge or silent rejection.
- A lead can be converted only once.
- Archive records rather than deleting linked business records.
- Store money amounts in decimal fields and calculate balances server-side.
- Keep quotation, invoice, payment and receipt separate.
- Use transactions for lead conversion and financial operations.

## Indexing
Initial useful indexes include leads by status, owner and follow-up date; normalized phone; clients by phone/name/company; and foreign-key columns. Add indexes based on actual query plans and observed usage.
