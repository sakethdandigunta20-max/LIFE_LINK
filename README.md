# ❤️ LifeLink — Smart Blood & Organ Donation Management System

LifeLink is a full-stack healthcare platform that connects **Donors**, **Recipients**, **Hospitals**, **Blood Banks**, and **Administrators** to streamline blood and organ donation, request management, inventory tracking, and intelligent donor matching.

---

# 🚀 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router DOM |
| Backend | Node.js, Express.js |
| Database | Supabase PostgreSQL |
| Authentication | JWT, bcrypt |
| API Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| File Uploads | Multer |
| Reports | PDFKit, json2csv |
| Deployment | Vercel (Frontend), Render (Backend), Supabase (Database) |

---

# 📂 Project Structure

```
blood-organ-donation-system/
│
├── backend/
│   ├── config/
│   │     └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── db/
│   │     ├── schema.sql
│   │     └── seed.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │     ├── components/
│   │     ├── context/
│   │     ├── lib/
│   │     ├── pages/
│   │     ├── App.jsx
│   │     └── main.jsx
│   └── package.json
│
└── README.md
```

---

# ✨ Features

## 🔐 Authentication

- JWT Authentication
- Secure Password Hashing (bcrypt)
- Role Based Authorization
- Protected Routes
- Login & Registration
- Session Management

---

## ❤️ Donor Module

- Donor Registration
- Donor Profile
- Blood Group Management
- Organ Donation Preferences
- Availability Toggle
- Donation History
- Smart Request Recommendations

---

## 🩸 Recipient Module

- Blood Requests
- Organ Requests
- Hospital Assignment
- Request Tracking
- Cancel Requests
- Request History

---

## 🏥 Hospital Module

- Hospital Verification
- View Assigned Patients
- Manage Blood Requests
- Manage Organ Requests
- Approve / Reject Requests
- Patient Dashboard

---

## 🩸 Blood Bank Module

- Blood Inventory
- Stock Management
- Blood Request Approval
- Inventory Updates
- Request Fulfillment

---

## 👨‍💼 Admin Module

- User Management
- Hospital Verification
- Blood Bank Verification
- Emergency Monitoring
- Analytics Dashboard
- Reports
- Notifications

---

## 🔔 Notifications

- Database-backed Notifications
- Read / Unread Status
- Mark All Read
- Emergency Alerts

---

## 🔍 Search

Search for

- Donors
- Hospitals
- Blood Banks
- Emergency Requests

using advanced filters.

---

## 📊 Analytics

Dashboard includes

- Total Users
- Active Donors
- Blood Requests
- Organ Requests
- Blood Stock
- Emergency Requests
- Hospitals
- Blood Banks

---

## 📄 Reports

Generate

- PDF Reports
- CSV Reports

for

- Users
- Donations
- Requests
- Blood Inventory
- Hospitals
- Blood Banks

---

# 🔑 User Roles

- Admin
- Donor
- Recipient
- Hospital
- Blood Bank

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/sakethdandigunta20-max/LIFE_LINK.git

cd LIFE_LINK
```

---

## Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

Configure

```
DATABASE_URL=

JWT_SECRET=

PORT=5000

NODE_ENV=development
```

Run

```bash
npm run seed

npm run dev
```

Backend runs on

```
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env
```

```
VITE_API_URL=http://localhost:5000/api
```

Run

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 👤 Demo Accounts

| Role | Email | Password |
|-------|-------|----------|
| Admin | admin@example.com | Password123! |
| Hospital | hospital@example.com | Password123! |
| Blood Bank | bloodbank@example.com | Password123! |
| Donor | donor1@example.com | Password123! |
| Recipient | recipient@example.com | Password123! |

---

# 🔒 Security

- JWT Authentication
- bcrypt Password Hashing
- Role-Based Authorization
- Helmet Security
- Rate Limiting
- Parameterized SQL Queries
- File Upload Validation
- Centralized Error Handling
- Secure Password Storage

---

# 🌐 Deployment

## Frontend

Deploy on **Vercel**

Environment Variable

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Backend

Deploy on **Render**

Environment Variables

```
DATABASE_URL=

JWT_SECRET=

NODE_ENV=production

PORT=10000
```

---

## Database

Hosted on

**Supabase PostgreSQL**

---

# 📌 Future Enhancements

- AI-based Donor Recommendation
- Real-time Notifications (Socket.IO)
- Google Maps Integration
- SMS & Email Notifications
- Mobile Application
- Multi-language Support
- Machine Learning Donor Prediction
- Appointment Scheduling

---

# 👨‍💻 Developer

**Saketh Dandigunta**

SRM University AP

B.Tech Computer Science & Engineering

Cloud Computing Specialization

---

## ⭐ If you like this project

Give this repository a ⭐ on GitHub!
