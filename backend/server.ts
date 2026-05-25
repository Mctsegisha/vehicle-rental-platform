import dotenv from 'dotenv';
import path from "path";
import fs from 'fs';

// Try to locate the .env file in potential locations relative to CWD or current file
const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../backend/.env')
];
const foundEnvPath = possibleEnvPaths.find(p => fs.existsSync(p));
if (foundEnvPath) {
  dotenv.config({ path: foundEnvPath, override: true });
} else {
  dotenv.config();
}

import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import apiRoutes from "./routes/index";
import pool from "./config/db";
import { startBookingAutoCancellationsJob } from "./jobs/bookingJob";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  // Check DB Connection & Initialize schemas
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected:', res.rows[0]);

    // Create Notifications table if not existing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Notifications database validation successful (table validated).');

    // Start background auto-cancellations worker
    startBookingAutoCancellationsJob();
  } catch (err) {
    console.error('Database pre-flight check / initialization error:', err);
  }

  // API Routes
  app.use("/api", apiRoutes);

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), 'uploads')));

  // Global Error Handler for API
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // Resolve frontend vite config relative to server.ts directory
    const configPath = path.resolve(__dirname, '../frontend/vite.config.ts');
    if (fs.existsSync(configPath)) {
      const vite = await createViteServer({
        configFile: configPath,
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.warn(`[Server] Dev Warning: Frontend Vite config not found at ${configPath}. Running API-only server.`);
      app.get("/", (req, res) => {
        res.json({ message: "Vehicle Rental Platform API is running (Development API-only mode)" });
      });
    }
  } else {
    // In production, serve the frontend dist folder if it exists.
    // If we deployed separately (Render API only), it won't exist, which is fine!
    const possibleDistPaths = [
      path.join(process.cwd(), "dist"),
      path.join(process.cwd(), "backend", "dist"),
      path.resolve(__dirname, "../dist"),
      path.resolve(__dirname, "dist")
    ];
    const distPath = possibleDistPaths.find(p => fs.existsSync(p)) || path.join(process.cwd(), "dist");

    if (fs.existsSync(distPath)) {
      console.log(`[Server] Production: Serving static frontend files from ${distPath}`);
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.log("[Server] Production: Frontend static files not found. API-only mode active.");
      app.get("/", (req, res) => {
        res.json({ 
          message: "Vehicle Rental Platform API is running",
          status: "healthy",
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
