# 🏠 PG Management System (Full-Stack MERN + Gemini AI)

A modern, production-grade, full-stack web application designed to automate and streamline daily operations for PG (Paying Guest) and Hostel accommodations. Built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **Zod Validation**, and integrated with **Google Gemini AI**.

---

## 🚀 Features & Modules

- **📊 Dashboard & Real-Time Analytics**: Live overview of occupancy rates, revenue collected, pending dues, recent complaints, room type breakdowns, and real-time audit activity feed.
- **🛏️ Room & Bed Consistency**: Strict beds subdocument single source of truth, capacity limits, individual bed allocations, automatic occupancy status tracking (`available`, `occupied`, `maintenance`), amenities, and pricing.
- **👥 Tenant Lifecycle & KYC**: Tenant onboarding with transactional bed reservation, temporary password generation with `mustChangePassword` enforcement, KYC proof details, emergency contacts, and soft-delete/deactivation.
- **💳 Invoices & Billing**: Server-side rent calculation (`baseRent + electricity + maintenance + mess + lateFee - discount = totalAmount`), payment recording semantics (UPI, Bank Transfer, Cash, Card), automated monthly billing, and instant PDF invoice downloads.
- **💰 Expense Tracking**: Categorized operating expenses (Electricity, Water, Maintenance, Wi-Fi, Staff Salaries, Groceries) with P&L financial summaries powered by MongoDB aggregations.
- **🛠️ Complaint & Maintenance Hub**: Tenant issue reporting with categories (Plumbing, Electrical, Cleanliness, Internet, Security), priority tags, verified staff assignment, resolution notes, and validated state machine lifecycle (`open` ➔ `assigned` ➔ `in-progress` ➔ `waiting-for-parts` ➔ `resolved` ➔ `closed`).
- **📢 Notice Board**: Targeted announcements to tenants, staff, or all residents with priority and pinning support.
- **🍲 Mess & Meal Management**: 7-day weekly menu timetables, date-specific meal attendance tracking (`MealAttendance`), live kitchen headcount without cross-day leakage, and meal plan subscriptions (`full`, `2-meal`, `none`).
- **🚪 Visitor Logging**: Gatekeeper log for visitor check-ins with authoritative room and active host tenant verification, purpose of visit, vehicle numbers, late-night detection, and check-out logs.
- **📈 Reports & Analytics**: MongoDB aggregation-powered executive summaries (`$group`, `$sum`, `$project`), financial P&L statements, occupancy audits, and PDF downloads.
- **🤖 Gemini AI Smart Assistant**: Dynamic hostel policy database integration (`PGSettings`), role-based intent retrieval, untrusted history sanitization, auto complaint classification, and rent reminder generation.
- **🔒 Security & Resilience**: Strict CORS allowlist, centralized environment validator with fail-fast startup, rate limiters, helmet headers, and bcrypt hashing.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide Icons, Axios, React Router DOM 7, jsPDF, jspdf-autotable |
| **Backend** | Node.js (v18+), Express.js 4, Mongoose 8, JWT, bcryptjs, Helmet, Express Rate Limit, Morgan |
| **Database** | MongoDB / MongoDB Atlas (Single Source of Truth — No in-memory mock arrays) |
| **Validation** | Zod v3 (Strict request validation middleware) |
| **AI Integration** | Google Gemini API (`@google/generative-ai`) |
| **Testing** | Node.js Native Test Runner (`node:test`), `node:assert`, Supertest |

---

## 📁 Project Structure

```text
pg-management-system/
├── client/                     # React 19 Frontend (Vite + Tailwind CSS)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/         # Layout, Navbar, Sidebar, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT & user state)
│   │   ├── pages/              # 12 Functional Modules (Dashboard, Rooms, Tenants, etc.)
│   │   ├── App.jsx             # React Router configuration
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express Backend API
│   ├── src/
│   │   ├── config/             # Database connection & Centralized env validation (env.js, db.js)
│   │   ├── controllers/        # Pure MongoDB controllers (Auth, Rooms, Tenants, AI, Reports, etc.)
│   │   ├── middleware/         # JWT protect, role authorize, Zod validate
│   │   ├── models/             # Mongoose schemas (User, Room, Tenant, Invoice, Mess, PGSettings, etc.)
│   │   ├── routes/             # RESTful API routes
│   │   ├── utils/              # Database seeder (seed.js), Activity logger, Transactions (transaction.js)
│   │   ├── validators/         # Zod schemas for all request payloads
│   │   └── server.js           # Express app, CORS allowlist, rate limiting, fail-fast startup
│   ├── tests/                  # Automated unit, security, and integration tests (50 tests)
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── README.md                   # Project documentation
├── SRS.md                      # Software Requirements Specification
├── package.json                # Root package scripts
└── .gitignore
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local Community Server on `127.0.0.1:27017` or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI)
- **Google Gemini API Key** (Optional, from [Google AI Studio](https://aistudio.google.com/))

---

### 2. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KaranOdedra01/-PG-MANAGEMENT-APPLICATION.git
   cd -PG-MANAGEMENT-APPLICATION
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

---

### 3. Environment Configuration

1. In the `server/` directory, copy `.env.example` to `.env`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Fill in your environment variables:
   ```env
   PORT=5000
   NODE_ENV=development
   DEMO_MODE=true
   JWT_SECRET=your_secure_random_jwt_secret_key_at_least_32_characters
   JWT_EXPIRES_IN=7d
   MONGO_URI=mongodb://127.0.0.1:27017/pg_management
   GEMINI_API_KEY=your_google_gemini_api_key_here
   CLIENT_URL=http://localhost:5173
   ```

---

### 4. Seed the Database

Populate your MongoDB database with realistic demo rooms, tenants, invoices, expenses, notices, date-specific mess menus, attendance records, and PG policies:

```bash
cd server
npm run seed
```

---

### 5. Running the Application

1. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   *Backend runs on `http://localhost:5000`*

2. **Start Frontend Client:**
   ```bash
   cd ../client
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173`*

---

### 6. Running Automated Tests

```bash
cd server
npm test
```
*Executes all 50 unit, security, and business logic tests.*

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| 👑 **Admin** | `admin@pg.com` | `Password@123` | Full access across all rooms, tenants, billing, expenses, reports, and AI settings. |
| 🛠️ **Staff** | `staff@pg.com` | `Password@123` | Maintenance tickets, visitor logs, room views, and mess menu updates. |
| 🎓 **Tenant** | `tenant@pg.com` | `Password@123` | Personal invoices, payments, maintenance tickets, notices, and mess attendance. |
| 🎓 **Tenant 2** | `priya@gmail.com` | `Password@123` | Resident profile in Room 101. |
| 🎓 **Tenant 3** | `aman@gmail.com` | `Password@123` | Resident profile in Room 201. |

---

## 📄 License

This project is licensed under the MIT License.
