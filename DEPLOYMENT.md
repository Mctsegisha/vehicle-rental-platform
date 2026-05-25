# Deployment Guide - Frontend on Vercel & Backend on Render

This guide explains how to deploy your frontend to **Vercel** and your backend to **Render** separately from your newly configured workspaces repository.

---

## 🚀 Part 1: Deploying the Backend on Render

Render will host your Express/Node.js API, cron jobs, and database interactions.

### Step-by-Step Instructions:

1. **Create a Web Service on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository.

2. **Configure Service Settings**:
   - **Name**: `vehicle-rental-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Root Directory**: `backend` *(⚠️ Critical: This tells Render to compile and run using the backend subdirectory)*
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

3. **Add Environment Variables**:
   Click **Advanced** and add your production environment variables:
   - `DATABASE_URL`: Your PostgreSQL database URL connection string.
   - `JWT_SECRET`: A secure secret string for signing JWT tokens.
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will map this automatically)

4. **Deploy**:
   - Click **Create Web Service**.
   - Render will build and deploy your backend.
   - Once completed, copy the service URL (e.g. `https://vehicle-rental-backend.onrender.com`). You will need this for Vercel!

---

## 🎨 Part 2: Deploying the Frontend on Vercel

Vercel will build and serve your static React + Vite frontend globally with edge performance.

### Step-by-Step Instructions:

1. **Create a Project on Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** -> **Project**.
   - Import your GitHub repository.

2. **Configure Project Settings**:
   - **Project Name**: `vehicle-rental-frontend` (or any name you prefer)
   - **Framework Preset**: `Vite` *(Vercel will detect this automatically)*
   - **Root Directory**: Click **Edit** next to Root Directory and select the `frontend` folder. Click **Continue**. *(⚠️ Critical: This tells Vercel to look inside the frontend directory)*

3. **Configure Build Settings**:
   - Ensure the build command and output directory are standard:
     - Build Command: `npm run build` (or `vite build`)
     - Output Directory: `dist`

4. **Add Environment Variables**:
   Under the **Environment Variables** section, add:
   - `VITE_API_URL`: Paste your Render backend URL *without* a trailing slash (e.g. `https://vehicle-rental-backend.onrender.com`).

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will install the frontend dependencies, compile your Vite asset bundle, and deploy it to a production-ready edge domain.

---

## 🛠️ Part 3: Local Development Usage

Your local development flow remains as simple as before! 

To run both frontend and backend concurrently in local development on port `5000`:
```bash
# In the root directory, simply run:
npm run dev
```

If you ever need to build your workspaces locally to test compiled output:
```bash
# Build both frontend and backend
npm run build

# Or build individually
npm run build:frontend
npm run build:backend
```
