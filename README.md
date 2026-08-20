# 🏠 PG Management System (Full-Stack MERN + Gemini AI)

A modern, production-grade, full-stack web application designed to automate and streamline daily operations for PG (Paying Guest) and Hostel accommodations. Built with **React 18**, **Tailwind CSS**, **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **Zod Validation**, and integrated with **Google Gemini AI**.

---

## 🚀 Features & Modules

- **📊 Dashboard & Real-Time Analytics**: Live overview of occupancy rates, revenue collected, pending dues, recent complaints, room type breakdowns, and real-time audit activity feed.
- **🛏️ Room & Bed Management**: Floor plans, bed capacity, individual bed allocations, occupancy status tracking, amenities, and room pricing.
- **👥 Tenant Lifecycle & KYC**: Tenant onboarding with room & bed assignment, Aadhaar/Passport KYC details, emergency contacts, status management, and automated checkout bed release.
- **💳 Invoices & Billing**: Server-side rent calculation (`baseRent + electricity + maintenance + mess + lateFee - discount = totalAmount`), payment recording (UPI, Bank Transfer, Cash, Card), automated monthly billing, and instant PDF invoice downloads.
- **💰 Expense Tracking**: Categorized operating expenses (Electricity, Water, Maintenance, Wi-Fi, Staff Salaries, Groceries) with P&L financial summaries.
- **🛠️ Complaint & Maintenance Hub**: Tenant issue reporting with categories (Plumbing, Electrical, Cleanliness, Internet, Security), priority tags, staff assignment, resolution notes, and status lifecycle (`open` ➔ `assigned` ➔ `in-progress` ➔ `waiting-for-parts` ➔ `resolved` ➔ `closed`).
- **📢 Notice Board**: Target announcements to tenants, staff, or all residents with priority and pinning support.
- **🍲 Mess & Meal Management**: 7-day weekly menu timetables, 1-click meal attendance toggle (Breakfast, Lunch, Dinner), live kitchen headcount, and meal plan subscriptions (`full`, `2-meal`, `none`).
- **🚪 Visitor Logging**: Gatekeeper log for visitor check-ins, host tenant association, purpose of visit, vehicle numbers, late-night visitor detection, and check-out logs.
- **📈 Reports & Analytics**: MongoDB aggregation-powered executive summaries, financial P&L statements, occupancy audits, and CSV data export.
- **🤖 Gemini AI Smart Assistant**: Database-aware resident AI assistant powered by Google Gemini, auto complaint classifier & priority tagger, and smart rent reminder composer.
- **🔔 Notifications & Audit Logs**: In-app notifications for invoices, payments, complaints, and notices, with comprehensive database-driven activity audit trails.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM, jsPDF |
| **Backend** | Node.js (v18+), Express.js 4, Mongoose 8, JWT, bcryptjs, Helmet, Express Rate Limit, Morgan |
| **Database** | MongoDB / MongoDB Atlas (Single Source of Truth — No in-memory arrays) |
| **Validation** | Zod v3 (Strict request validation middleware) |
| **AI Integration** | Google Gemini API (`@google/generative-ai`) |
| **Testing** | Node.js Test Runner (`node:test`), `node:assert`, Supertest |

---

## 📁 Project Structure

```text
PG-Management-System/
├── client/                     # React Frontend (Vite + Tailwind CSS)
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
│   │   ├── config/             # Database connection (MongoDB)
│   │   ├── controllers/        # Pure MongoDB controllers (Auth, Rooms, Tenants, etc.)
│   │   ├── middleware/         # JWT protect, role authorize, Zod validate
│   │   ├── models/             # Mongoose schemas (User, Room, Tenant, Invoice, etc.)
│   │   ├── routes/             # RESTful API routes
│   │   ├── utils/              # Database seeder (seed.js), Activity logger
│   │   ├── validators/         # Zod schemas for all request payloads
│   │   └── server.js           # Express app, security headers, rate limiting
│   ├── tests/                  # Automated unit and security tests
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
- **MongoDB** (Local Community Server on `localhost:27017` or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI)
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

In the `server/` directory, create a `.env` file from `.env.example`:
```bash
cp server/.env.example server/.env
```

Configure your `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secure_random_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
MONGO_URI=mongodb://localhost:27017/pg_management
# Or MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pg_management?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

---

### 4. Database Seeding

Populate your MongoDB with realistic default rooms, users, tenants, invoices, expenses, complaints, notices, and mess menus:
```bash
cd server
npm run seed
```

**Default Test Credentials:**
| Role | Email | Password | Permissions |
|---|---|---|---|
| 👑 **Admin** | `admin@pg.com` | `Password@123` | Full system control & financials |
| 🛠️ **Staff** | `staff@pg.com` | `Password@123` | Operations, maintenance, visitor logs |
| 🎓 **Tenant** | `tenant@pg.com` | `Password@123` | Resident portal, invoices, complaints |
| 🎓 **Tenant** | `priya@gmail.com` | `Password@123` | Resident portal (Room 101) |
| 🎓 **Tenant** | `aman@gmail.com` | `Password@123` | Resident portal (Room 102) |

---

### 5. Running the Application

**Start the Backend Server:**
```bash
cd server
npm start
# API runs on http://localhost:5000
```

**Start the Frontend Client:**
```bash
cd client
npm run dev
# Web app runs on http://localhost:5173
```

---

## 🧪 Automated Testing

Run the automated test suite covering authentication, authorization, Zod validation schemas, business logic, calculations, and security:
```bash
cd server
npm test
```

---

## 🔒 Security & Architecture Standards

1. **Single Source of Truth**: All data is persisted to MongoDB. Zero in-memory storage.
2. **Role-Based Authorization & IDOR Protection**: Tenants can only view and manage their own invoices, complaints, and personal data.
3. **Public Registration Role Lockdown**: Public registration (`POST /api/auth/register`) strictly creates `tenant` accounts. Staff and Admin accounts can only be created by an authenticated Admin.
4. **Password Security**: Passwords are encrypted using `bcryptjs` with salt rounds. Passwords are never returned in responses (`select: false`).
5. **JWT Protection**: Environment-based `JWT_SECRET` with expiration and verification.
6. **Input Validation**: Strict Zod schemas for every endpoint returning structured error responses.
7. **Rate Limiting**: Brute-force protection on authentication and AI endpoints.
8. **Security Headers**: Configured with `helmet` and environment-based `cors`.

---

## 👤 Author
- **Karan Odedra** ([@KaranOdedra01](https://github.com/KaranOdedra01))
