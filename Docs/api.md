# REST API Plan

Base path: `/api/v1`. All protected routes require authentication and backend authorization. These endpoints are proposed implementation conventions; they are not explicitly enumerated in the SRS.

## Response convention
Success:
```json
{ "data": {}, "meta": {} }
```
Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": []
  }
}
```
Use suitable HTTP status codes. Do not expose stack traces or secrets in production.

## Auth
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Implement password reset securely. If email delivery is not configured, do not pretend reset emails are being sent.

## Users and dashboard
- `GET /users` — admin only, paginated.
- `POST /users` — admin only.
- `PATCH /users/:id` — admin only.
- `GET /dashboard/summary` — permission-aware counts and drill-down links.

## Leads
- `GET /leads?search=&status=&ownerId=&priority=&followUpDue=&page=&limit=`
- `POST /leads`
- `GET /leads/:id`
- `PATCH /leads/:id`
- `POST /leads/:id/follow-ups`
- `GET /leads/:id/follow-ups`
- `PATCH /follow-ups/:id`
- `POST /leads/:id/convert-to-client`

Lead create/update must validate required fields and check normalized phone duplicates. Return possible matches as warnings; do not silently merge records. Require a reason for Lost and On Hold statuses. Conversion must be idempotent and transactional.

## Pipeline
- `GET /pipeline` — grouped leads by status.
- `PATCH /leads/:id/status` — validate allowed status and preserve activity history.
- Admin-only stage configuration can be deferred until needed.

## Clients
- `GET /clients?search=&onboardingStatus=&page=&limit=`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`
- `POST /clients/:id/archive`
- `GET /clients/:id/onboarding`
- `PATCH /clients/:id/onboarding`

## Tasks and calendar basics
- `GET /tasks?from=&to=&status=`
- `POST /tasks`
- `PATCH /tasks/:id`
- `POST /tasks/:id/complete`

## Later-phase endpoints
Add project, quotation, change-request, invoice, payment, renewal, HR/document, tools and reporting endpoints only in their planned phases.

## Authorization rules
- Admin: broad access.
- Sales: assigned leads; shared lead access must be confirmed by the business.
- Project team: assigned projects and allowed details.
- Finance: finance records and reports.
- HR: employee/intern records and approved document templates.
- Enforce record-level checks on the server, not only in frontend routes.
