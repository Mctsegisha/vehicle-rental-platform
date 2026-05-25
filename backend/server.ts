import dotenv from 'dotenv';
import path from "path";
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env'), override: true });

import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import apiRoutes from "./routes/index";
import pool from "./config/db";
import { startBookingAutoCancellationsJob } from "./jobs/bookingJob";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend/vite.config.ts'),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
