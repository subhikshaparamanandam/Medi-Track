import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = new Database("meditrack.db");

  // Initialize Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      blood_type TEXT,
      allergies TEXT,
      member_since TEXT,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      value TEXT,
      unit TEXT,
      trend TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      specialty TEXT,
      rating REAL,
      reviews_count INTEGER,
      avatar_url TEXT,
      available_today BOOLEAN
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      doctor_id INTEGER,
      date TEXT,
      time TEXT,
      type TEXT,
      status TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      timestamp TEXT,
      type TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Seed Data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    db.prepare("INSERT INTO users (name, email, blood_type, allergies, member_since, avatar_url) VALUES (?, ?, ?, ?, ?, ?)").run(
      "Sarah Jenkins",
      "sarah.j@example.com",
      "O+",
      "Penicillin",
      "June 2021",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    );

    const doctors = [
      ["Dr. Sarah Mitchell", "Cardiologist", 4.9, 124, "https://images.unsplash.com/photo-1559839734-2b71f1e3c770?w=400&h=400&fit=crop", 1],
      ["Dr. James Wilson", "Neurologist", 4.8, 89, "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop", 1],
      ["Dr. Emily Chen", "Pediatrician", 4.7, 210, "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop", 0]
    ];
    const insertDoctor = db.prepare("INSERT INTO doctors (name, specialty, rating, reviews_count, avatar_url, available_today) VALUES (?, ?, ?, ?, ?, ?)");
    doctors.forEach(doc => insertDoctor.run(...doc));

    const initialMetrics = [
      [1, "steps", "8,432", "", "+12%", "2026-03-12"],
      [1, "heart", "72", "bpm", "-5%", "2026-03-12"],
      [1, "sleep", "7h 20m", "", "Steady", "2026-03-12"],
      [1, "water", "2.1", "L", "+0.4L", "2026-03-12"]
    ];

    // Add historical data for charts
    const historicalData = [
      [1, "steps", "7,200", "", "", "2026-03-06"],
      [1, "steps", "8,100", "", "", "2026-03-07"],
      [1, "steps", "6,500", "", "", "2026-03-08"],
      [1, "steps", "9,200", "", "", "2026-03-09"],
      [1, "steps", "7,800", "", "", "2026-03-10"],
      [1, "steps", "8,900", "", "", "2026-03-11"],
      [1, "heart", "70", "bpm", "", "2026-03-06"],
      [1, "heart", "75", "bpm", "", "2026-03-07"],
      [1, "heart", "72", "bpm", "", "2026-03-08"],
      [1, "heart", "68", "bpm", "", "2026-03-09"],
      [1, "heart", "74", "bpm", "", "2026-03-10"],
      [1, "heart", "71", "bpm", "", "2026-03-11"]
    ];

    const insertMetric = db.prepare("INSERT INTO metrics (user_id, type, value, unit, trend, date) VALUES (?, ?, ?, ?, ?, ?)");
    initialMetrics.forEach(m => insertMetric.run(...m));
    historicalData.forEach(m => insertMetric.run(...m));

    const initialActivity = [
      [1, "Lab Results Ready", "Blood analysis from Oct 12", "2h ago", "check"],
      [1, "Prescription Renewed", "Lipitor 20mg • 30 Days", "Yesterday", "meds"],
      [1, "Invoice Paid", "Consultation Fee • $45.00", "Oct 14", "payment"]
    ];
    const insertActivity = db.prepare("INSERT INTO activity (user_id, title, description, timestamp, type) VALUES (?, ?, ?, ?, ?)");
    initialActivity.forEach(a => insertActivity.run(...a));
  }

  app.use(express.json());

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = 1").get();
    res.json(user);
  });

  app.get("/api/metrics", (req, res) => {
    const metrics = db.prepare("SELECT * FROM metrics WHERE user_id = 1 ORDER BY date ASC").all();
    res.json(metrics);
  });

  app.get("/api/doctors", (req, res) => {
    const doctors = db.prepare("SELECT * FROM doctors").all();
    res.json(doctors);
  });

  app.get("/api/activity", (req, res) => {
    const activity = db.prepare("SELECT * FROM activity WHERE user_id = 1 ORDER BY id DESC").all();
    res.json(activity);
  });

  app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty, d.avatar_url as doctor_avatar
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.user_id = 1
    `).all();
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { doctor_id, date, time, type } = req.body;
    const result = db.prepare("INSERT INTO appointments (user_id, doctor_id, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?)").run(
      1, doctor_id, date, time, type, "upcoming"
    );
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
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
