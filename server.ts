import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lifegood.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    refer_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- Pending, Active
    profile_pic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL, -- Bkash, Nagad
    number TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Paid, Rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referee_id INTEGER NOT NULL,
    amount REAL DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referee_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, phone, password, refer_by } = req.body;
    const refer_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const stmt = db.prepare("INSERT INTO users (name, phone, password, refer_code, referred_by) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, phone, password, refer_code, refer_by || null);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message.includes('UNIQUE') ? 'Phone number already exists' : error.message });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { phone, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE phone = ? AND password = ?").get(phone, password) as any;
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // User: Get Profile
  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (user) {
      const referralsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE referred_by = ?").get(user.refer_code) as any;
      res.json({ ...user, referralsCount: referralsCount.count });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  // User: Update Profile
  app.post("/api/user/update", (req, res) => {
    const { id, name, profile_pic } = req.body;
    try {
      if (profile_pic) {
        db.prepare("UPDATE users SET name = ?, profile_pic = ? WHERE id = ?").run(name, profile_pic, id);
      } else {
        db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // User: Withdraw Request
  app.post("/api/withdraw", (req, res) => {
    const { userId, amount, method, number } = req.body;
    const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as any;
    
    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    try {
      db.prepare("INSERT INTO withdrawals (user_id, amount, method, number) VALUES (?, ?, ?, ?)").run(userId, amount, method, number);
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // User: Withdraw History
  app.get("/api/withdrawals/:userId", (req, res) => {
    const history = db.prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(history);
  });

  // --- Admin Routes ---
  const ADMIN_USER = process.env.ADMIN_USERNAME || "ayan@123";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin@123";

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Active'").get() as any;
    const totalReferrals = db.prepare("SELECT COUNT(*) as count FROM referrals").get() as any;
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM withdrawals WHERE status = 'Pending'").get() as any;
    res.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalReferrals: totalReferrals.count,
      pendingWithdrawals: pendingWithdrawals.count
    });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.*, 
      (SELECT COUNT(*) FROM users WHERE referred_by = u.refer_code) as referral_count
      FROM users u
    `).all();
    res.json(users);
  });

  app.post("/api/admin/user/status", (req, res) => {
    const { userId, status } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);

    // If activating and they were referred, give referrer 100 BDT
    if (status === 'Active' && user.referred_by) {
      const referrer = db.prepare("SELECT id FROM users WHERE refer_code = ?").get(user.referred_by) as any;
      if (referrer) {
        // Check if already rewarded to prevent double reward
        const alreadyRewarded = db.prepare("SELECT id FROM referrals WHERE referee_id = ?").get(userId);
        if (!alreadyRewarded) {
          db.prepare("UPDATE users SET balance = balance + 100 WHERE id = ?").run(referrer.id);
          db.prepare("INSERT INTO referrals (referrer_id, referee_id) VALUES (?, ?)").run(referrer.id, userId);
        }
      }
    }
    res.json({ success: true });
  });

  app.post("/api/admin/user/balance", (req, res) => {
    const { userId, amount, type } = req.body; // type: 'add' or 'deduct'
    if (type === 'add') {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, userId);
    } else {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/withdrawals", (req, res) => {
    const withdrawals = db.prepare(`
      SELECT w.*, u.name as user_name, u.phone as user_phone
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `).all();
    res.json(withdrawals);
  });

  app.post("/api/admin/withdraw/status", (req, res) => {
    const { withdrawId, status } = req.body;
    const withdrawal = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(withdrawId) as any;
    
    if (status === 'Rejected' && withdrawal.status !== 'Rejected') {
      // Refund balance if rejected
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(withdrawal.amount, withdrawal.user_id);
    }
    
    db.prepare("UPDATE withdrawals SET status = ? WHERE id = ?").run(status, withdrawId);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
