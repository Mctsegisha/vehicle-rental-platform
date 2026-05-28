# 🚗 Vehicle Rental Platform

A full-stack vehicle rental platform built with React, Node.js, and PostgreSQL — enabling customers to browse and book vehicles, owners to list and manage their fleet, and admins to oversee the entire platform.

🌐 **Live Demo:** [https://vehicle-rental-platform-frontend.vercel.app](https://vehicle-rental-platform-frontend.vercel.app)

---

## ✨ Features

- **Customer** — Browse vehicles, submit bookings, upload payment references, and get verified
- **Owner** — List vehicles with documents, manage bookings, verify customers
- **Admin** — Full platform oversight: manage users, approve vehicles, verify payments, view commissions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🚀 Run Locally

**Prerequisites:** Node.js, PostgreSQL

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Set up the database schema:
   ```bash
   psql -U postgres -d your_db_name -f schema.sql
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (backend).
