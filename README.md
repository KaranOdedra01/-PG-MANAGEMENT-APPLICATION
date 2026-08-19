# 🏠 PG Management System (Full-Stack MERN + Gemini AI)

A modern, full-stack web application designed to automate and streamline daily operations for PG (Paying Guest) and Hostel accommodations. Built with React, Tailwind CSS, Express.js, MongoDB, and integrated with Google Gemini AI for smart management.

---

## 🚀 Features

- **📊 Dashboard & Real-Time Analytics**: Visual overview of occupancy rates, revenue, pending dues, recent complaints, and active notices.
- **🛏️ Room & Bed Management**: Manage rooms, floor plans, bed capacity, occupancy status, and room pricing.
- **👥 Tenant Management**: Tenant onboarding, KYC details, room/bed assignment, check-in/check-out dates, and emergency contacts.
- **💳 Invoices & Billing**: Automated rent invoice generation, payment status tracking (Paid/Pending/Overdue), and receipt management.
- **🍲 Mess & Meal Management**: Weekly meal schedules (Breakfast, Lunch, Dinner), meal attendance tracking, and special meal requests.
- **🛠️ Complaint Ticketing**: Tenant issue reporting with categories (Plumbing, Electrical, Cleanliness), priority levels, and resolution workflow.
- **💰 Expense Tracking**: Categorized operating expenses (Electricity, Water, Maintenance, Wi-Fi, Staff) with monthly summaries.
- **🚪 Visitor Logging**: Record visitor entries, purpose of visit, host tenant association, and check-out logs.
- **📢 Notice Board**: Broadcast important announcements, rules, and maintenance schedules to tenants.
- **🤖 Gemini AI Smart Assistant**: Natural language database queries, automated complaint categorization/drafting, and intelligent insights.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM
- **Backend**: Node.js, Express.js, Mongoose, JWT Authentication, bcryptjs, CORS
- **Database**: MongoDB / MongoDB Atlas
- **AI Integration**: Google Gemini API (@google/genai)

---


---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- [Google Gemini API Key](https://aistudio.google.com/) (Optional, for AI features)

### 2. Installation

Clone the repository:
`ash
git clone https://github.com/KaranOdedra01/PG-MANAGEMENT-APPLICATION.git
cd PG-MANAGEMENT-APPLICATION
`

Install backend dependencies:
`ash
cd server
npm install
`

Install frontend dependencies:
`ash
cd ../client
npm install
`

### 3. Environment Configuration

In the server directory, create a .env file from .env.example:
`ash
cp .env.example .env
`

Configure your .env:
`env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
MONGO_URI=mongodb://localhost:27017/pg_management
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
`

### 4. Running the Application

**Start the Backend Server:**
`ash
cd server
npm start
# Server runs on http://localhost:5000
`

**Start the Frontend Client:**
`ash
cd client
npm run dev
# Client runs on http://localhost:5173
`

---

## 🔒 Security Best Practices
- Passwords are encrypted using cryptjs
- Protected API routes via JWT authentication middleware
- Sensitive keys managed via environment variables (.env ignored in Git)

---

## 👤 Author
- **Karan Odedra** ([@KaranOdedra01](https://github.com/KaranOdedra01))
