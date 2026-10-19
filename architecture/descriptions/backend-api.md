# Backend REST API Architecture

## Overview
The Hertzsoft ERP backend is built as a modular REST API using **Node.js**, **Express.js**, and **MySQL (phpMyAdmin / InnoDB)**.

## Key Modules
1. **Auth Module (`/api/auth`)**:
   - Handles staff/admin registration and login.
   - Issues short-lived JWT tokens signed with `JWT_SECRET`.
   - Protects downstream routes via `authMiddleware.js`.

2. **Leads Module (`/api/leads`)**:
   - Manages incoming inquiries split into two categories:
     - **Student Leads**: Interested in courses (`Data Science`, `FullStack Development`, `Digital Marketing`).
     - **Client Leads**: Interested in software development projects.
   - Status pipeline: `New` -> `Contacted` -> `Qualified` -> `Won` -> `Lost` / `On Hold`.

3. **Clients & Projects Module (`/api/clients`, `/api/projects`)**:
   - Converts won leads into client profiles.
   - Manages client projects with start date, deadline, status, and total deal cost.
   - Computes `total_paid` and `due_balance` in real-time.

4. **Payments Module (`/api/payments`)**:
   - Records installments (UPI, Bank, Cash, Card).
   - Keeps track of payment references and dates.
   - Computes overall company financial summary.

5. **Certificates & Offer Letters Module (`/api/certificates`)**:
   - Generates official Hertzsoft documents for students and interns.
