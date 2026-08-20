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
React 18 + Vite + Tailwind CSS (Frontend)
   ↓ (Axios HTTP / Bearer JWT)
Express.js 4 (REST API + Helmet + CORS + Rate Limit)
   ↓
Zod Validation Middleware
   ↓
Authentication & Authorization Middleware (IDOR Guard)
   ↓
Controllers & Services
   ↓
Mongoose 8 ODM (Schemas, Indexes, Pre-save Hooks)
   ↓
MongoDB / MongoDB Atlas (Single Source of Truth)
   ↓
Google Gemini API (@google/generative-ai)
```

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM, jsPDF |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet, Express Rate Limit, Morgan |
| **Validation** | Zod (Reusable request schemas) |
| **Database** | MongoDB / MongoDB Atlas (Document DB with indexes and transactions) |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) with dynamic database-backed context |
| **Testing** | Node.js Test Runner (`node:test`), `node:assert`, Supertest |

---

## 3. User Roles & Access Control

| Module / Action | Admin | Staff | Tenant |
|---|---|---|---|
| **View Dashboard** | Full PG Metrics | Maintenance Queue | Personal Room & Dues |
| **Manage Rooms (CRUD)** | ✅ Full | 👁️ View & Status | 👁️ View |
| **Onboard / Checkout Tenant** | ✅ Full | ✅ Full | ❌ No |
| **Generate Invoices** | ✅ Full | 👁️ View | ❌ No |
| **View Invoices** | All Invoices | All Invoices | Own Invoices Only |
| **Record Payment** | ✅ Full | ✅ Full | ✅ Own Invoice |
| **Manage Expenses** | ✅ Full | 👁️ View | ❌ No |
| **Raise Complaint** | ✅ Full | ✅ Full | ✅ Own Ticket |
| **Assign Complaint / Update Status** | ✅ Full | ✅ Full | ❌ No |
| **Broadcast Notice** | ✅ Full | ✅ Full | 👁️ View Targeted |
| **Mess Menu & Attendance** | ✅ Full | ✅ Full | ✅ Personal Attendance |
| **Visitor Gate Check-in/out** | ✅ Full | ✅ Full | ❌ No |
| **Financial & Occupancy Reports** | ✅ Full | ❌ No | ❌ No |
| **AI Smart Assistant** | Full Context | Staff Context | Private Tenant Context |

---

## 4. Functional Modules

### 4.1 Module 1 — Authentication & Authorization
- **Public Registration**: Forces role `tenant`. Cannot register as admin or staff.
- **Admin User Creation**: Only admins can create staff or admin accounts (`POST /api/auth/users`).
- **Password Security**: Bcryptjs salt hashing. Passwords never returned in API responses.
- **JWT Protection**: Signed with environment-based `JWT_SECRET` and expiration.

### 4.2 Module 2 — Dashboard & Real-Time Analytics
- **Live Metrics**: Aggregate room occupancy, total beds, occupied beds, revenue collected, pending dues, total expenses, net profit, and open complaints.
- **Activity Log**: Database-driven audit feed recording all system events with timestamps and actors.

### 4.3 Module 3 — Room & Bed Management
- **Bed Tracking**: Room capacity, individual bed slots (`Bed A`, `Bed B`, etc.), occupancy counters, and status transitions (`available`, `occupied`, `maintenance`).
- **Integrity**: Prevents `occupiedBeds > capacity`, duplicate room numbers, and negative rent.

### 4.4 Module 4 — Tenant Lifecycle & KYC
- **Onboarding**: Room and bed assignment, KYC identification (Aadhaar, Passport, College ID), emergency contacts, and security deposit.
- **Checkout**: Marks status `checked-out`, sets `checkOutDate`, frees room bed slot, and decrements room occupancy.

### 4.5 Module 5 — Invoices & Billing
- **Server-Side Calculation**: `baseRent + electricityCharge + maintenanceFee + messFee + lateFee - discount = totalAmount`.
- **Payment Lifecycle**: `pending` ➔ `paid` / `partially_paid` / `overdue` / `cancelled`.
- **PDF Generation**: Instant client-side download of official rent receipts.

### 4.6 Module 6 — Operating Expenses
- **Expense Logging**: Categorized expenses (Electricity, Water, Salary, Maintenance, Internet, Groceries).
- **P&L Summary**: Revenue vs expenses, net profit, profit margins, and category distribution.

### 4.7 Module 7 — Maintenance & Complaints Hub
- **Status Lifecycle**: `open` ➔ `assigned` ➔ `in-progress` ➔ `waiting-for-parts` ➔ `resolved` ➔ `closed`.
- **Ticket Tracking**: Auto-generated ticket number, category tagging, priority levels (`low`, `medium`, `high`, `urgent`), resolution notes, and cost tracking.

### 4.8 Module 8 — Notice Board
- **Announcements**: Category, priority, pinned status, and role-based targeting (`all`, `tenant`, `staff`, `admin`).
- **Read Tracking**: Acknowledgment tracking per user.

### 4.9 Module 9 — Mess & Meal Management
- **Timetable**: 7-day weekly menu timetable (Breakfast, Lunch, Snacks, Dinner).
- **Attendance**: 1-click meal toggle to prevent kitchen food wastage with live meal headcounts.
- **Subscriptions**: Meal plans (`full`, `2-meal`, `none`) and dietary preferences.

### 4.10 Module 10 — Visitor Logging
- **Gate Logging**: Entry timestamp, host tenant association, purpose of visit, vehicle registration, late-night visitor flag, and check-out timestamp.

### 4.11 Module 11 — Reports & Analytics
- **Executive Summaries**: Aggregated operational, occupancy, and financial metrics.
- **Data Export**: CSV and PDF export capabilities.

### 4.12 Module 12 — Gemini AI Smart Assistant
- **Real-Time Context**: Dynamic queries to MongoDB (user's billing, user's room, available rooms, today's menu, active notices).
- **Privacy Filter**: Strict isolation preventing tenants from querying other tenants' private information.
- **Tools**: AI Chatbot, automated complaint classifier & priority tagger, and rent reminder composer.

---

## 5. Database Schema Design

### 5.1 Entities
- **`User`**: `name`, `email` (unique, indexed), `password` (select: false), `role`, `phone`, `roomId`, `roomNumber`, `isActive`, `emergencyContact`.
- **`Room`**: `roomNumber` (unique, indexed), `floor`, `type`, `capacity`, `occupiedBeds`, `rent`, `status`, `amenities`, `beds`, `tenants`.
- **`Tenant`**: `userId` (indexed), `roomId` (indexed), `roomNumber`, `bedNumber`, `name`, `email` (indexed), `phone`, `checkInDate`, `checkOutDate`, `securityDeposit`, `monthlyRent`, `idProofType`, `idProofNumber`, `status`.
- **`Invoice`**: `invoiceNumber` (unique, indexed), `tenantId` (indexed), `tenantName`, `roomNumber`, `month` (indexed), `baseRent`, `electricityCharge`, `maintenanceFee`, `messFee`, `lateFee`, `discount`, `totalAmount`, `status`, `dueDate`, `paidDate`, `paymentMode`.
- **`Expense`**: `category` (indexed), `amount`, `description`, `date` (indexed), `paymentMode`, `receiptRef`, `addedBy`.
- **`Complaint`**: `ticketNumber` (unique, indexed), `tenantId` (indexed), `tenantName`, `roomNumber`, `title`, `description`, `category`, `priority`, `status`, `assignedTo`, `assignedStaffId`, `resolutionNote`, `actualCost`.
- **`Notice`**: `title`, `content`, `category`, `priority`, `targetRoles`, `postedBy`, `isPinned`, `readBy`.
- **`MessMenu`**: `day` (unique, indexed), `breakfast`, `lunch`, `snacks`, `dinner`, `specialNote`.
- **`MealSubscription`**: `userId` (unique, indexed), `plan`, `monthlyCharge`, `diet`, `attendance`.
- **`Visitor`**: `name`, `phone`, `visitorType`, `tenantId`, `tenantName`, `roomNumber`, `purpose`, `vehicleNumber`, `entryTime`, `exitTime`, `status`, `isLateNight`.
- **`Notification`**: `recipient` (indexed), `type`, `title`, `message`, `link`, `isRead`.
- **`ActivityLog`**: `actor`, `action` (indexed), `entity` (indexed), `entityId`, `description`, `metadata`, `createdAt` (indexed).

---

## 6. Security & Cybersecurity Specifications

1. **Zero In-Memory Storage**: MongoDB is the sole source of truth.
2. **IDOR Defense**: All tenant routes verify resource ownership.
3. **Password Security**: Bcrypt with salt rounds, no plain-text storage or return.
4. **Input Validation**: Strict Zod schemas validating types, bounds, lengths, and formats.
5. **Rate Limiting**: Brute-force protection on authentication and AI endpoints.
6. **Security Headers**: Helmet with cross-origin policies and environment CORS.
7. **Environment Safety**: Production fails safely if `JWT_SECRET` is unset.

---

## 7. AI Integration Specifications

- **Integration**: Google Gemini API via `@google/generative-ai`.
- **Context Injection**: Live database state fetched dynamically per request based on user role.
- **Safety**: Strict prompt guardrails preventing credentials, password leaks, or cross-tenant private data disclosures.
- **Context Window Management**: Automatic conversation history truncation (last 6 messages).

---

## 8. Automated Testing & QA

- Automated unit and security tests verifying Zod schemas, JWT validation, password hashing, role authorization, business logic, bed occupancy calculations, and heuristic classifications.
- Build verification ensuring zero frontend bundle or syntax errors.
