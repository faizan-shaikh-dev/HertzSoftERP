# Hertzsoft Centralized CRM & Operations System

Documentation pack for implementing the CRM in Antigravity. Treat the approved SRS as the source of truth. This pack translates the SRS into implementation context, architecture, folder structure, database design, API conventions, and phased delivery.

## Recommended starting point
1. Read `context.md` and `design.md`.
2. Review `database.md` and `database_schema.sql`.
3. Create the Phase 1 skeleton using `structure.md`.
4. Implement only Phase 1 modules listed in `implementation-plan.md`.
5. Do not silently add out-of-scope features.

## Files
- `context.md` — product goals, roles, scope, constraints and source-of-truth rules.
- `design.md` — system architecture, security, data flow and key workflows.
- `structure.md` — suggested frontend/backend project structure.
- `database.md` — entities, relationships, constraints and data rules.
- `database_schema.sql` — MySQL (phpMyAdmin) starter schema for core entities; intentionally focused on Phase 1.
- `api.md` — REST conventions and proposed Phase 1 endpoints.
- `implementation-plan.md` — phases, acceptance checks and build order.

## Decisions that must be confirmed by Hertzsoft
- Final hosting provider and domain.
- Whether sales users can see shared leads or only their own.
- Invoice tax requirements and company invoice format.
- Backup frequency and retention period.
- Whether reminders are in-app only for v1 (recommended default from SRS).
