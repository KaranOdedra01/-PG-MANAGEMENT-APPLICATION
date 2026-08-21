# 🏠 PG Management System — Software Requirements Specification (SRS)

> **Project:** PG Management System (MERN + Gemini AI)  
> **Version:** 2.0 | **Date:** August 2026 | **Author:** Karan Odedra

---

## 📌 Table of Contents
1. [Project Overview & Purpose](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Functional Modules](#4-functional-modules)
5. [Database Schema Design](#5-database-schema-design)
6. [Security & Cybersecurity Specifications](#6-security--cybersecurity-specifications)
7. [AI Integration Specifications](#7-ai-integration-specifications)
8. [Automated Testing & QA](#8-automated-testing--qa)

---

## 1. Project Overview

### 1.1 Purpose
A full-stack **PG (Paying Guest) and Hostel Management System** designed to digitize and automate accommodation workflows — including room/bed management, tenant onboarding and KYC, rent invoice generation and payment tracking, maintenance ticketing, mess meal scheduling, gate visitor logging, and AI-assisted resident queries.

### 1.2 Scope
The system operates with three authenticated roles:
- 👑 **Admin (PG Owner / Manager)**: Full administrative authority over rooms, tenants, billing, expenses, announcements, staff assignments, and executive reports.
- 🛠️ **Staff (Caretaker / Maintenance)**: Operational management of maintenance tickets, room inspections, and visitor logs.
- 🎓 **Tenant (Resident)**: Self-service portal to view room details, download rent invoices, record payments, raise complaints, acknowledge notices, and interact with the AI assistant.

---

## 2. Tech Stack & Architecture

```text
React 19 + Vite 8 + Tailwind CSS (Frontend)
   ↓ (Axios HTTP / Bearer JWT)
Express.js 4 (REST API + Helmet + CORS + Rate Limit)
   ↓
Zod Validation Middleware
   ↓
Authentication & Authorization Middleware (IDOR Guard)
   ↓
Controllers & Services (MongoDB Transactions & Aggregations)
   ↓
Mongoose 8 ODM (Schemas, Indexes, Pre-save Hooks)
   ↓
MongoDB / MongoDB Atlas (Single Source of Truth)
   ↓
Google Gemini API (@google/generative-ai)
```

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide Icons, Axios, React Router DOM 7, jsPDF, jspdf-autotable |
| **Backend** | Node.js (v18+), Express.js 4, Mongoose 8, JWT, bcryptjs, Helmet, Express Rate Limit, Morgan |
| **Validation** | Zod (Reusable request schemas) |
| **Database** | MongoDB / MongoDB Atlas (Document DB with indexes, transactions & aggregations) |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) with dynamic database-backed context & PGSettings |
| **Testing** | Node.js Test Runner (`node:test`), `node:assert`, Supertest |

---

## 3. User Roles & Access Control

| Role | Permissions & Responsibilities |
|---|---|
| **Admin** | Unlimited read/write access. Manage rooms, onboard tenants, generate invoices, record expenses, assign staff to tickets, broadcast notices, view P&L executive reports, and configure PG policies. |
| **Staff** | Maintenance ticket processing, updating ticket status, logging visitors, updating daily mess menu, and inspecting room occupancy. |
| **Tenant** | Access personal profile, view assigned bed, track & record rent invoices, download PDF receipts, submit maintenance complaints, toggle daily mess attendance, and query AI assistant. |

---

## 4. Functional Modules

1. **Authentication & User Management**:
   - Secure login & registration using bcrypt salt-hashing (10 rounds).
   - Temporary password generation on admin onboarding with `mustChangePassword` enforcement.
   - Endpoint `/api/auth/change-password` for user self-service password update.
   - Demo accounts endpoint protected behind `DEMO_MODE=true` environment guard.

2. **Room & Bed Management**:
   - `beds` subdocument is the single source of truth for occupancy.
   - Automatic derivation of `occupiedBeds`, `availableBeds`, and `status` (`available`, `occupied`, `maintenance`).
   - Prevention of overbooking (`occupiedBeds > capacity`) and duplicate bed assignments.

3. **Tenant Lifecycle**:
   - Multi-document transactions (`withTransaction`) for onboarding and checkout.
   - Soft deletion preserving financial and operational audit trails.
   - Standardized pagination (`?page=1&limit=20&search=`) on tenant lists.

4. **Invoices & Billing**:
   - Server-side calculation: `baseRent + electricityCharge + maintenanceFee + messFee + lateFee - discount = totalAmount`.
   - Payment recording semantics supporting UPI, Net Banking, Cash, and Cheque.
   - PDF receipt download powered by jsPDF and jspdf-autotable.

5. **Complaints & Maintenance State Machine**:
   - Valid transition matrix: `open` ➔ `assigned` ➔ `in-progress` ➔ `waiting-for-parts` ➔ `resolved` ➔ `closed`.
   - Verified staff assignment checking active staff user accounts.
   - Timestamps: `assignedAt`, `resolvedAt`, `closedAt`.

6. **Date-Specific Mess Management**:
   - `MealAttendance` schema with unique compound index `{ userId: 1, date: 1 }`.
   - Headcount queries by date (`YYYY-MM-DD`) preventing cross-day data leakage.

7. **Visitor Gatekeeper**:
   - Authoritative room and active host tenant verification.
   - Late-night visitor detection (9:00 PM – 6:00 AM).

8. **Executive Reports & Analytics**:
   - Pure MongoDB aggregation pipelines (`$group`, `$sum`, `$project`, `$sort`) for financial summaries and occupancy audits.

9. **AI Resident Assistant**:
   - Dynamic hostel facts loaded from `PGSettings` collection.
   - Intent-based retrieval with strict role authorization.
   - Untrusted client conversation history sanitization.

---

## 5. Database Schema Design

- **`User`**: `name`, `email`, `password`, `role`, `phone`, `avatar`, `roomId`, `roomNumber`, `isActive`, `mustChangePassword`, `emergencyContact`.
- **`Room`**: `roomNumber`, `floor`, `type`, `capacity`, `occupiedBeds`, `rent`, `status`, `amenities`, `beds: [{ bedNumber, isOccupied, tenantId }]`, `tenants: [ObjectId]`.
- **`Tenant`**: `userId`, `roomId`, `roomNumber`, `bedNumber`, `name`, `email`, `phone`, `checkInDate`, `checkOutDate`, `securityDeposit`, `monthlyRent`, `idProofType`, `idProofNumber`, `emergencyContact`, `status`, `isActive`, `deletedAt`.
- **`Invoice`**: `tenantId`, `tenantName`, `roomNumber`, `invoiceNumber`, `month`, `baseRent`, `electricityCharge`, `maintenanceFee`, `messFee`, `lateFee`, `discount`, `totalAmount`, `status`, `dueDate`, `paidDate`, `paymentMode`, `transactionId`.
- **`Expense`**: `category`, `amount`, `description`, `date`, `paymentMode`, `receiptRef`, `addedBy`.
- **`Complaint`**: `ticketNumber`, `tenantId`, `tenantName`, `roomNumber`, `title`, `description`, `category`, `priority`, `status`, `assignedTo`, `assignedStaffId`, `assignedAt`, `resolvedAt`, `closedAt`, `resolutionNote`, `actualCost`.
- **`Notice`**: `title`, `content`, `category`, `priority`, `targetRoles`, `postedBy`, `isPinned`, `readBy`.
- **`MessMenu`**: `day`, `breakfast`, `lunch`, `snacks`, `dinner`, `specialNote`.
- **`MealSubscription`**: `userId`, `plan`, `monthlyCharge`, `diet`, `isActive`.
- **`MealAttendance`**: `userId`, `date (YYYY-MM-DD)`, `breakfast`, `lunch`, `dinner` (Compound Unique: `{ userId, date }`).
- **`PGSettings`**: `hostelName`, `address`, `gateOpeningTime`, `gateClosingTime`, `visitingHoursStart`, `visitingHoursEnd`, `silentHoursStart`, `silentHoursEnd`, `wifiSsid`, `wifiDetails`, `emergencyContacts`, `generalRules`.
- **`Visitor`**: `name`, `phone`, `visitorType`, `tenantId`, `tenantName`, `roomNumber`, `purpose`, `vehicleNumber`, `entryTime`, `exitTime`, `status`, `isLateNight`, `loggedBy`.
- **`Notification`**: `recipient`, `type`, `title`, `message`, `link`, `isRead`.
- **`ActivityLog`**: `actor: { userId, name, role }`, `action`, `entity`, `entityId`, `description`.

---

## 6. Security & Cybersecurity Specifications

1. **CORS Allowlist**: Explicit allowlist based on `CLIENT_URL` rejecting unknown origins.
2. **Environment Validation**: Startup sequence validates `JWT_SECRET`, `MONGO_URI`, `CLIENT_URL` and halts server on missing values.
3. **No Hardcoded Secrets**: Removed all hardcoded JWT fallback keys across the entire codebase.
4. **IDOR Guards**: Tenants can only read/mutate their own invoices, complaints, and profiles.
5. **Rate Limiting**: Auth brute-force protection (30 req / 15 min), AI rate limit (30 req / min), general API limiter (500 req / 15 min).
6. **Input Validation**: Zod schema validation on all incoming payload bodies and query parameters.
