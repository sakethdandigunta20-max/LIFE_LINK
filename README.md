# ❤️ LifeLink – Smart Blood & Organ Donation Matching System

A full-stack healthcare platform that connects **Donors**, **Recipients**, **Hospitals**, **Blood Banks**, and **Administrators** to simplify blood and organ donation management through secure authentication, intelligent matching, real-time request management, and analytics.

---

## 🌐 Live Demo

### Frontend
**https://life-link-uc46.vercel.app**

### Backend API
**[https://lifelink-backend-o3q0.onrender.com/api**
](https://lifelink-backend-o3q0.onrender.com/api/health)
### Health Check
**https://lifelink-backend-o3q0.onrender.com/api/health**

---

# 📖 Project Overview

LifeLink is a centralized platform that enables efficient coordination between donors, recipients, hospitals, blood banks, and administrators.

The system allows:

- Blood donation management
- Organ donation requests
- Hospital assignment
- Blood inventory tracking
- Intelligent donor matching
- Analytics & Reports
- Secure role-based authentication

---

# 🚀 Features

## 🔐 Authentication

- JWT Authentication
- Secure password hashing using bcrypt
- Role-Based Access Control
- Login & Registration
- Protected Routes

---

## 👤 Donor Module

- Register as Blood/Organ Donor
- Manage Donor Profile
- Update Availability
- Blood Group Information
- Organ Donation Preferences
- Donation History

---

## 🩸 Recipient Module

- Create Blood Requests
- Create Organ Requests
- Select Hospital
- Upload Medical Information
- Track Request Status
- View Assigned Hospital

---

## 🏥 Hospital Module

- View Patient Requests
- Approve Organ Requests
- Manage Patients
- Update Request Status
- View Matching Donors

---

## 🏦 Blood Bank Module

- Blood Inventory Management
- Add Blood Stock
- Update Inventory
- Approve Blood Requests
- View Blood Request History

---

## 👨‍💼 Admin Module

- Dashboard Analytics
- User Management
- Hospital Verification
- Blood Bank Verification
- Reports
- System Monitoring

---

## 🔍 Search Module

Search:

- Donors
- Hospitals
- Blood Banks
- Emergency Requests

---

## 📊 Analytics

Interactive charts for:

- Blood Group Distribution
- Donation Trends
- Request Statistics
- Emergency Requests
- User Registrations
- Blood Inventory
- Hospital Activities

---

## 📄 Reports

Generate:

- PDF Reports
- CSV Reports

---

# 🛠 Tech Stack

## Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide React
- React Hot Toast

---

## Backend

- Node.js
- Express.js
- PostgreSQL
- Supabase
- JWT Authentication
- bcrypt
- Multer
- Helmet
- CORS
- Express Rate Limit
- Compression

---

## Database

- Supabase PostgreSQL

---

## Deployment

### Frontend

- Vercel

### Backend

- Render

### Database

- Supabase

---

# 📂 Project Structure

```
LifeLink/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── db/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/sakethdandigunta20-max/LIFE_LINK.git
```

```
cd LIFE_LINK
```

---

## Backend Setup

```
cd backend
npm install
```

Create `.env`

```
NODE_ENV=development
PORT=5000

DB_HOST=YOUR_SUPABASE_HOST
DB_PORT=5432
DB_NAME=postgres
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

JWT_SECRET=YOUR_SECRET
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

Run

```
npm run dev
```

---

## Frontend Setup

```
cd frontend
npm install
```

Create `.env`

```
VITE_API_URL=http://localhost:5000/api
```

Run

```
npm run dev
```

---

# 🌍 Deployment

## Frontend

Hosted on **Vercel**

```
https://life-link-uc46.vercel.app
```

---

## Backend

Hosted on **Render**

```
https://lifelink-backend-o3q0.onrender.com
```

---

## Database

Hosted on **Supabase PostgreSQL**

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Helmet Security
- CORS Protection
- Rate Limiting
- SQL Parameterized Queries
- Role-Based Authorization

---
# 🧪 Demo Accounts

> **These accounts are intended only for demonstration/testing.**

| Role | Email |
|-------|-------|
| Recipient | recipient@test.com |

**Password**

```
Password123
```

> If demo accounts are unavailable, register a new account through the application.

---

# 👨‍💻 Developed By

**Saketh Dandigunta**

B.Tech Computer Science Engineering

SRM University AP

GitHub:
https://github.com/sakethdandigunta20-max

---

# ⭐ Future Enhancements

- AI-Based Donor Recommendation
- Email Notifications
- SMS Alerts
- Push Notifications
- Live Chat
- Google Maps Integration
- Multi-language Support
- Mobile Application

---

# 📄 License

This project is developed for educational and academic purposes.

---

## ⭐ If you found this project useful, don't forget to star the repository!
