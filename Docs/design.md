# System Design — Hertzsoft CRM

## 1. Architecture
Use a **modular monolith** for v1: one frontend application, one REST API backend, and one relational database. Avoid microservices until real scale or operational needs justify them.

### Recommended stack
- Frontend: Next.js + Tailwind CSS.
- Frontend architecture: React Context for cross-cutting global state (Auth, Notifications); centralized service modules in `src/services/` for all API requests.
- Backend: Node.js + Express.js.
- Database: MySQL (managed via phpMyAdmin).
- API style: REST/JSON over HTTPS.
- Authentication: secure server-validated session or short-lived access token with a supported refresh/session strategy. Choose and document one before implementation; do not mix patterns casually.
- File storage: private object/file storage for generated PDFs and uploaded documents; store metadata and access-controlled references in MySQL.
- Hosting: cloud hosting with HTTPS; final provider is a business decision.
- Reminders: in-app notifications first. Email/WhatsApp delivery is not in v1 unless separately approved.

MySQL (InnoDB) is used with foreign keys, check constraints, and transactions because clients, projects, quotations, invoices and payments have relational integrity requirements.

## 2. High-level diagram
```text
Browser (desktop/mobile)
        |
        | HTTPS / JSON
        v
Next.js UI
        |
        | REST API
        v
Express API
  | Auth + RBAC middleware
  | Validation
  | Modules / services
  | Audit logging
  | Reminder processing
        |
        v
MySQL database (phpMyAdmin)
        |
        +---- Private document storage (PDFs/files)
        +---- Scheduled backup/restore process
```

## 3. Backend module boundaries
- `auth`: login, logout, current user, password reset/session management.
- `users`: user accounts, roles, activation/deactivation.
- `dashboard`: permission-aware counts and drill-down links.
- `leads`: lead lifecycle, duplicate checks, assignment and conversion.
- `follow-ups`: interaction log, next follow-up, due/overdue status.
- `clients`: client records, archive, onboarding.
- `tasks`: personal to-do/calendar basics for Phase 1.
- Later: `projects`, `change-requests`, `quotations`, `invoices`, `payments`, `renewals`, `hr`, `documents`, `reports`, `settings`.

Keep HTTP controllers thin. Put business rules in service functions. Put request validation in schemas/middleware. Use a repository/data-access layer only if it improves consistency; avoid unnecessary abstraction.

## 4. Request flow
1. User signs in.
2. Frontend calls API via dedicated functions in `src/services/` with the chosen secure authentication mechanism.
3. Authentication middleware identifies the user.
4. RBAC and record-ownership checks authorize the action.
5. Validation checks the request body and parameters.
6. Service layer executes the business operation.
7. Database transaction is used for multi-record operations.
8. Audit entry is written for important changes.
9. API returns a consistent response; frontend shows success/error state.

## 5. Critical workflows
### Lead to client
Create lead -> assign owner -> log follow-up -> move through pipeline -> mark Won -> confirm conversion -> transaction creates client and links it to lead -> retain lead history -> start onboarding checklist.

Conversion must be idempotent: repeated requests must not create duplicate clients.

### Duplicate phone warning
Normalize phone number before comparison. Search leads and client contacts. If a possible match exists, return a warning and link to the matching record. Do not silently merge or block. If the user overrides, record the override in audit history.

### Payment workflow (Phase 3)
Invoice -> one or more payment entries -> calculate paid amount and outstanding balance -> receipt references the actual payment. A quotation is not money received. Use database transactions and decimal/numeric currency fields, never floating-point money.

### Change request (Phase 2)
Draft -> Quoted -> Awaiting Approval -> Approved/Rejected -> In Progress -> Completed. Approval requires recorded approver and approval time. Preserve original project scope and quotation versions.

## 6. Security design
- Hash passwords with a modern password-hashing library; never store plaintext passwords.
- Enforce permissions on every protected API endpoint and record query.
- Use HTTPS in production, secure cookies if cookie-based auth is selected, CSRF protection where applicable, rate limits on authentication endpoints, and safe CORS configuration.
- Validate inputs server-side; parameterize database queries.
- Keep secrets in environment variables/secret manager, not committed `.env` files.
- Use least-privilege access for finance and HR.
- Store document files privately; authorize every download.
- Audit sensitive operations without logging passwords, tokens or unnecessary personal data.
- Back up database and documents; test restore before production.

## 7. Reliability and operations
- Use migrations for schema changes.
- Use database transactions for lead conversion and payment operations.
- Add indexes for search/filter columns and foreign keys as usage grows.
- Paginate large lists.
- Return useful error messages without leaking stack traces or secrets.
- Set up production logging, health check endpoint, backup schedule and documented recovery owner.
- Do not claim backups are working until a restore has been tested.

## 8. Non-functional targets
The SRS requires responsive common pages, secure access, backups, auditability and data integrity but does not specify numeric performance or availability SLAs. Do not invent contractual targets; agree them with the business.
