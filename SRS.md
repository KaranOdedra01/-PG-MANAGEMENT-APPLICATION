# 🏠 PG Management System — Software Requirements Specification (SRS)

> **Project Type:** Student Project | **AI-Assisted Build:** Google Gemini  
> **Version:** 1.0 | **Date:** August 2026

---

## 📌 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack & Tools](#2-tech-stack--tools-free--student-friendly)
3. [System Modules](#3-system-modules)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Database Schema](#6-database-schema-overview)
7. [Security Architecture](#7-security-architecture)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Deployment Plan](#9-deployment-plan-free-tier)
10. [Gemini Integration Strategy](#10-gemini-integration-strategy)
11. [Project Timeline](#11-project-timeline)

---

## 1. Project Overview

### 1.1 Purpose
A full-stack **PG (Paying Guest) Management System** to digitize and automate the daily operations of a PG/hostel — including room management, tenant onboarding, rent collection, complaint tracking, and more.

### 1.2 Scope
The system serves **three roles**:
- 🏢 **Admin / PG Owner** — Full control
- 👤 **Tenant** — Self-service portal
- 🔧 **Staff** — Maintenance & daily operations

### 1.3 Goals
- Eliminate paper-based processes
- Automate rent reminders & invoicing
- Provide real-time occupancy dashboard
- AI-powered features via **Google Gemini API**

---

## 2. Tech Stack & Tools (Free & Student-Friendly)

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React.js + Tailwind CSS + shadcn/ui | Modern, attractive UI |
| **Backend** | Node.js + Express.js | Fast, scalable REST API |
| **Database** | MongoDB Atlas (Free Tier) | 512MB free, no credit card |
| **Auth** | Firebase Auth (Free) | Google/Email login, secure |
| **Storage** | Firebase Storage (Free) | Document/image uploads |
| **Hosting** | Vercel (Frontend) + Render (Backend) | Both free tiers |
| **AI** | Google Gemini API (Free tier) | Core AI features |
| **Email** | Resend.com (Free tier) | 3000 emails/month free |
| **Charts** | Recharts / Chart.js | Dashboard analytics |

---

## 3. System Modules

### 🔷 Module 1 — Auth & Role Management
- Google SSO + Email/Password login
- Role-based access: Admin, Tenant, Staff
- JWT + Firebase Auth tokens
- Session management & logout

### 🔷 Module 2 — Dashboard (Admin)
- Real-time occupancy rate (rooms filled/total)
- Monthly revenue chart
- Pending dues summary
- Recent complaints widget
- Quick actions panel

### 🔷 Module 3 — Room Management
- Add/Edit/Delete rooms
- Room types: Single, Double, Triple, Dormitory
- Room status: Available, Occupied, Under Maintenance
- Room amenities tagging (AC, WiFi, Attached Bath, etc.)
- Floor/wing-wise view

### 🔷 Module 4 — Tenant Management
- Tenant onboarding with ID proof upload
- Police verification form / Aadhaar upload
- Emergency contact details
- Tenant history (past PGs)
- Tenant profile with photo
- Check-in / Check-out management

### 🔷 Module 5 — Rent & Payment Management
- Auto-generate monthly rent invoices
- Track paid / unpaid / partial payments
- Payment modes: Cash, UPI, Bank Transfer
- PDF invoice download
- Overdue alerts with penalty calculation
- Receipt generation

### 🔷 Module 6 — Expense Tracker
- Log PG expenses (electricity, water, maintenance, salaries)
- Category-wise expense breakdown
- Monthly P&L summary (Revenue vs Expense)
- Export to CSV/Excel

### 🔷 Module 7 — Complaint & Maintenance System
- Tenant raises complaint with photo/description
- Admin assigns to staff
- Status tracking: Open → In Progress → Resolved
- Priority levels: Low, Medium, High, Urgent
- Complaint history per room

### 🔷 Module 8 — Notice Board & Communication
- Admin posts notices (visible to all tenants)
- Email/push notifications for critical alerts
- Announcement categories: Maintenance, Rules, Events
- Read receipts for notices

### 🔷 Module 9 — Food / Mess Management (Optional)
- Weekly meal plan setup
- Tenant meal subscription (full/half/no mess)
- Monthly mess bill calculation
- Daily attendance for mess

### 🔷 Module 10 — Visitor & Gate Management
- Log visitor entries with timestamp
- Visitor type: Family, Friend, Delivery
- Late-night visitor alerts
- Export visitor logs

### 🔷 Module 11 — Reports & Analytics
- Occupancy report (monthly/quarterly)
- Revenue report
- Tenant turnover report
- Complaint resolution time report
- PDF / Excel export

### 🔷 Module 12 — AI Features (Gemini-Powered) 🤖
- **Smart Complaint Categorizer** — Auto-tags complaints
- **Rent Reminder Generator** — Personalized reminder messages
- **Tenant Query Chatbot** — 24/7 AI assistant for tenants
- **Expense Anomaly Detector** — Flags unusual expenses
- **Occupancy Trend Predictor** — Forecasts vacancy trends
- **Document Summarizer** — Summarizes lease agreements
- **Smart Notice Generator** — Drafts notices from bullet points

---

## 4. Functional Requirements

### 4.1 Admin Requirements
| ID | Requirement |
|---|---|
| FR-01 | Admin shall be able to add/edit/delete rooms with amenities |
| FR-02 | Admin shall onboard tenants with document upload |
| FR-03 | Admin shall generate and send monthly rent invoices |
| FR-04 | Admin shall view real-time occupancy dashboard |
| FR-05 | Admin shall manage complaint lifecycle |
| FR-06 | Admin shall post and schedule notices |
| FR-07 | Admin shall generate financial reports |
| FR-08 | Admin shall configure rent rules and late fees |
| FR-09 | Admin shall add/manage staff accounts |
| FR-10 | Admin shall export all data to CSV/PDF |

### 4.2 Tenant Requirements
| ID | Requirement |
|---|---|
| FR-11 | Tenant shall log in with email/Google |
| FR-12 | Tenant shall view their room details and invoice history |
| FR-13 | Tenant shall raise complaints with attachments |
| FR-14 | Tenant shall view notice board |
| FR-15 | Tenant shall download rent receipts as PDF |
| FR-16 | Tenant shall chat with Gemini AI assistant |
| FR-17 | Tenant shall update profile & emergency contacts |

### 4.3 Staff Requirements
| ID | Requirement |
|---|---|
| FR-18 | Staff shall view assigned maintenance tasks |
| FR-19 | Staff shall update task status |
| FR-20 | Staff shall log visitor entries |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page load < 2 seconds, API response < 500ms |
| **Security** | HTTPS, JWT auth, input validation, rate limiting |
| **Scalability** | Support 200+ tenants without degradation |
| **Availability** | 99.5% uptime (Vercel + Render SLA) |
| **Usability** | Mobile-responsive, accessible (WCAG 2.1 AA) |
| **Maintainability** | Modular code, documented APIs (Swagger) |
| **Data Privacy** | GDPR-aware, encrypted sensitive documents |

---

## 6. Database Schema Overview

### Collections (MongoDB)

#### `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "role": "admin | tenant | staff",
  "photo": "url",
  "phone": "string",
  "firebaseUID": "string",
  "createdAt": "Date"
}
```

#### `rooms`
```json
{
  "_id": "ObjectId",
  "roomNumber": "string",
  "floor": "number",
  "type": "single | double | triple | dormitory",
  "status": "available | occupied | maintenance",
  "rent": "number",
  "amenities": ["AC", "WiFi", "TV"],
  "currentTenants": ["userId"],
  "capacity": "number"
}
```

#### `tenants`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "roomId": "ObjectId",
  "checkInDate": "Date",
  "checkOutDate": "Date",
  "idProof": "url",
  "emergencyContact": { "name": "string", "phone": "string" },
  "securityDeposit": "number",
  "status": "active | inactive"
}
```

#### `invoices`
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "month": "string",
  "baseRent": "number",
  "extras": [{ "label": "string", "amount": "number" }],
  "totalAmount": "number",
  "dueDate": "Date",
  "paidDate": "Date",
  "status": "pending | paid | overdue | partial",
  "paymentMode": "cash | upi | bank"
}
```

#### `complaints`
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "roomId": "ObjectId",
  "title": "string",
  "description": "string",
  "category": "plumbing | electrical | cleaning | other",
  "priority": "low | medium | high | urgent",
  "status": "open | in-progress | resolved",
  "assignedTo": "userId",
  "attachments": ["url"],
  "aiTag": "string",
  "createdAt": "Date"
}
```

#### `notices`
```json
{
  "_id": "ObjectId",
  "title": "string",
  "content": "string",
  "category": "maintenance | rules | events | general",
  "postedBy": "userId",
  "targetRoles": ["tenant", "staff"],
  "scheduledAt": "Date",
  "readBy": ["userId"]
}
```

#### `expenses`
```json
{
  "_id": "ObjectId",
  "category": "electricity | water | salary | maintenance | other",
  "amount": "number",
  "description": "string",
  "date": "Date",
  "addedBy": "userId",
  "receipt": "url"
}
```

---

## 7. Security Architecture

```
┌─────────────────────────────────────────────┐
│              Client (React)                 │
│  - Firebase Auth Token (JWT)                │
│  - HTTPS Only                               │
│  - Input sanitization (DOMPurify)           │
└──────────────────┬──────────────────────────┘
                   │ Bearer Token
┌──────────────────▼──────────────────────────┐
│            Express.js API                   │
│  - Rate Limiting (express-rate-limit)       │
│  - CORS policy (whitelist only)             │
│  - Helmet.js (security headers)             │
│  - JWT Verification Middleware              │
│  - Role-Based Route Guards                  │
│  - Input Validation (Zod/Joi)               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          MongoDB Atlas                      │
│  - Encrypted at rest                        │
│  - IP Whitelisting                          │
│  - No raw passwords stored                  │
│  - Field-level encryption for Aadhaar/docs  │
└─────────────────────────────────────────────┘
```

### Key Security Measures
- ✅ **Never store plain passwords** — Firebase handles auth
- ✅ **Document encryption** — Sensitive uploads encrypted via Firebase Storage rules
- ✅ **API rate limiting** — Prevent brute force & DDoS
- ✅ **Environment variables** — All secrets in `.env`, never committed to Git
- ✅ **RBAC** — Every API route checks user role before executing
- ✅ **Audit logs** — Track all admin actions (create, update, delete)

---

## 8. UI/UX Guidelines

### Design System
- **Framework:** Tailwind CSS + shadcn/ui components
- **Theme:** Light/Dark mode toggle
- **Color Palette:**
  - Primary: `#6366F1` (Indigo)
  - Success: `#22C55E` (Green)
  - Warning: `#F59E0B` (Amber)
  - Danger: `#EF4444` (Red)
  - Background: `#F8FAFC` / Dark: `#0F172A`

### Key UI Components
- 🎨 Glassmorphism cards for dashboard widgets
- 📊 Animated charts (Recharts)
- 🔔 Toast notifications (react-hot-toast)
- 📱 Mobile-first responsive design
- 🌙 Dark/Light mode
- 🔍 Global search with keyboard shortcut (Ctrl+K)
- 💅 Smooth page transitions (Framer Motion)
- 📄 PDF previewer in modal

---

## 9. Deployment Plan (Free Tier)

| Service | Platform | Free Limit |
|---|---|---|
| **Frontend** | Vercel | Unlimited deployments, 100GB bandwidth |
| **Backend** | Render | 750 hrs/month (always-on with spin-up delay) |
| **Database** | MongoDB Atlas | 512MB storage free |
| **Auth** | Firebase | 10K auth/month free |
| **File Storage** | Firebase Storage | 1GB free |
| **Email** | Resend.com | 3,000 emails/month free |
| **AI** | Gemini API | Free tier available |
| **CI/CD** | GitHub Actions | 2,000 min/month free |

### Deployment Architecture
```
GitHub Repo
  ├── /client  → Push to Vercel (auto-deploy)
  └── /server  → Push to Render (auto-deploy)
        └── Connects to MongoDB Atlas
        └── Uses Firebase Admin SDK
        └── Calls Gemini API
```

---

## 10. Gemini Integration Strategy

### How Gemini Powers Each Feature

| Feature | Gemini Prompt Strategy |
|---|---|
| **Chatbot** | System prompt with PG context + tenant data |
| **Complaint Tagger** | Zero-shot classification prompt |
| **Notice Generator** | Few-shot examples + structured output |
| **Expense Anomaly** | Chain-of-thought analysis |
| **Rent Reminder** | Personalization with tenant name + amount |
| **Document Summary** | RAG-lite: extract → chunk → summarize |
| **Occupancy Forecast** | Gemini + historical data analysis |

### Sample Gemini Integration (Node.js)
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Auto-tag complaint category
async function tagComplaint(description) {
  const prompt = `
    Classify this PG complaint into one category:
    [plumbing, electrical, cleaning, internet, noise, security, other]
    
    Complaint: "${description}"
    
    Return JSON: { "category": "...", "priority": "low|medium|high|urgent", "summary": "..." }
  `;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

---

## 11. Project Timeline

```
Week 1-2   │ Project setup, Auth, DB schema, Base UI layout
Week 3-4   │ Room Management + Tenant Onboarding modules
Week 5-6   │ Rent & Invoice system + Payment tracking
Week 7     │ Complaint Management module
Week 8     │ Notice Board + Expense Tracker
Week 9     │ Gemini AI features integration
Week 10    │ Reports, Analytics, PDF exports
Week 11    │ Testing, Bug fixes, Security audit
Week 12    │ Deployment + Documentation
```

---

## 12. Suggested Enhancements (Bonus)

| Feature | Difficulty | Impact |
|---|---|---|
| WhatsApp Bot (Twilio free) | Medium | ⭐⭐⭐⭐⭐ |
| QR Code for room entry | Easy | ⭐⭐⭐⭐ |
| Tenant reviews & ratings | Easy | ⭐⭐⭐ |
| Progressive Web App (PWA) | Medium | ⭐⭐⭐⭐ |
| Automated late fee calculator | Easy | ⭐⭐⭐⭐ |
| Google Maps integration | Easy | ⭐⭐⭐ |

---

> 📝 **Document prepared for student project use.** All tools and platforms selected are within free tiers suitable for academic demonstration and portfolio projects.
