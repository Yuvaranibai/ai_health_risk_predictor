import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import cors from "cors";

import fs from "fs";

const db = new Database("healthcare.db");

// Load hospitals from JSON
const hospitalsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "hospitals.json"), "utf-8"));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    sex TEXT,
    contact TEXT,
    email TEXT,
    village TEXT,
    town TEXT,
    district TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    symptoms TEXT,
    medical_history TEXT,
    allergies TEXT,
    social_history TEXT,
    risk_level TEXT,
    risk_score REAL,
    explanation TEXT,
    image_analysis TEXT,
    is_emergency INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, approved, edited, ignored
    doctor_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS doctor_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT, -- 'user' or 'doctor'
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS community_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_name TEXT,
    village TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/doctor/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const messages = db.prepare("SELECT * FROM doctor_messages WHERE user_id = ? ORDER BY created_at ASC").all(userId);
    res.json(messages);
  });

  app.post("/api/doctor/messages", (req, res) => {
    const { userId, role, content } = req.body;
    db.prepare("INSERT INTO doctor_messages (user_id, role, content) VALUES (?, ?, ?)").run(userId, role, content);
    res.json({ success: true });
  });

  app.get("/api/community/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM community_messages ORDER BY created_at DESC LIMIT 100").all();
    res.json(messages.reverse());
  });

  app.post("/api/community/messages", (req, res) => {
    const { userId, userName, village, content } = req.body;
    db.prepare("INSERT INTO community_messages (user_id, user_name, village, content) VALUES (?, ?, ?, ?)").run(userId, userName, village, content);
    res.json({ success: true });
  });

  app.post("/api/screenings", (req, res) => {
    const { patient, screening } = req.body;
    
    try {
      const insertPatient = db.prepare(`
        INSERT INTO patients (name, age, sex, contact, email, village, town, district, state, country, postal_code, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const patientResult = insertPatient.run(
        patient.name, patient.age, patient.sex, patient.contact, patient.email,
        patient.village, patient.town, patient.district, patient.state, patient.country, patient.postal_code,
        patient.lat, patient.lng
      );
      const patientId = patientResult.lastInsertRowid;

      const insertScreening = db.prepare(`
        INSERT INTO screenings (patient_id, symptoms, medical_history, allergies, social_history, risk_level, risk_score, explanation, image_analysis, is_emergency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertScreening.run(
        patientId, 
        JSON.stringify(screening.symptoms),
        JSON.stringify(screening.medicalHistory),
        JSON.stringify(screening.allergies),
        JSON.stringify(screening.socialHistory),
        screening.riskLevel,
        screening.riskScore,
        screening.explanation,
        screening.imageAnalysis,
        screening.isEmergency ? 1 : 0
      );

      res.json({ success: true, patientId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save screening" });
    }
  });

  app.get("/api/doctor/dashboard", (req, res) => {
    const screenings = db.prepare(`
      SELECT s.*, p.name as patient_name, p.age, p.sex, p.village, p.district
      FROM screenings s
      JOIN patients p ON s.patient_id = p.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(screenings);
  });

  app.get("/api/chw/screenings", (req, res) => {
    const screenings = db.prepare(`
      SELECT s.*, p.name as patient_name, p.age, p.sex, p.village, p.district, p.lat, p.lng, p.contact, p.email
      FROM screenings s
      JOIN patients p ON s.patient_id = p.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(screenings);
  });

  app.get("/api/chw/dashboard", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risk,
        SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low_risk
      FROM screenings
    `).get();

    const allScreenings = db.prepare(`
      SELECT village, symptoms
      FROM screenings s
      JOIN patients p ON s.patient_id = p.id
    `).all();

    const villageClusters: Record<string, { fever: number, cough: number, rash: number }> = {};

    allScreenings.forEach((s: any) => {
      let symptoms: string[] = [];
      try {
        symptoms = JSON.parse(s.symptoms || "[]");
      } catch (e) {
        symptoms = [];
      }
      
      const village = s.village || "Unknown";
      
      if (!villageClusters[village]) {
        villageClusters[village] = { fever: 0, cough: 0, rash: 0 };
      }

      symptoms.forEach((sym: string) => {
        const lowerSym = sym.toLowerCase();
        if (lowerSym.includes('fever')) villageClusters[village].fever++;
        if (lowerSym.includes('cough')) villageClusters[village].cough++;
        if (lowerSym.includes('rash')) villageClusters[village].rash++;
      });
    });

    const clusters: any[] = [];
    Object.entries(villageClusters).forEach(([village, counts]) => {
      if (counts.fever >= 3) clusters.push({ village, type: 'Fever', count: counts.fever });
      if (counts.cough >= 3) clusters.push({ village, type: 'Cough', count: counts.cough });
      if (counts.rash >= 3) clusters.push({ village, type: 'Rash', count: counts.rash });
    });

    res.json({ stats, clusters });
  });

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  app.get("/api/hospitals", (req, res) => {
    const { district, specialty, village, state, postal_code, lat, lng, risk_level } = req.query;
    
    let hospitals = [...hospitalsData];

    // 1. Filter by specialty if risk is high
    if (risk_level === 'High' && specialty) {
      const specializedHospitals = hospitals.filter(h => h.specialty === specialty);
      if (specializedHospitals.length > 0) {
        hospitals = specializedHospitals;
      }
    }

    // 2. Tiered Search Logic
    let results: any[] = [];

    // Step 1: Match Postal Code if available
    if (postal_code) {
      results = hospitals.filter(h => h.postal_code === postal_code);
    }

    // Step 2: If not found, match Village + District
    if (results.length === 0 && village && district) {
      results = hospitals.filter(h => 
        h.village?.toLowerCase() === (village as string).toLowerCase() && 
        h.district?.toLowerCase() === (district as string).toLowerCase()
      );
    }

    // Step 3: If not found, match District + State
    if (results.length === 0 && district && state) {
      results = hospitals.filter(h => 
        h.district?.toLowerCase() === (district as string).toLowerCase() && 
        h.state?.toLowerCase() === (state as string).toLowerCase()
      );
    }

    // Step 4: If multiple results, choose nearest using lat/long
    if (results.length > 1 && lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      results = results.map(h => ({
        ...h,
        distance: calculateDistance(userLat, userLng, h.lat, h.lng)
      })).sort((a, b) => a.distance - b.distance);
    } else if (results.length === 0) {
      // Final fallback: return all hospitals sorted by distance if lat/lng available
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        results = hospitals.map(h => ({
          ...h,
          distance: calculateDistance(userLat, userLng, h.lat, h.lng)
        })).sort((a, b) => a.distance - b.distance);
      } else {
        results = hospitals;
      }
    } else if (lat && lng) {
      // Add distance to single result if lat/lng available
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      results = results.map(h => ({
        ...h,
        distance: calculateDistance(userLat, userLng, h.lat, h.lng)
      }));
    }

    res.json(results);
  });

  app.patch("/api/screenings/:id", (req, res) => {
    const { id } = req.params;
    const { status, doctor_notes } = req.body;
    db.prepare("UPDATE screenings SET status = ?, doctor_notes = ? WHERE id = ?").run(status, doctor_notes, id);
    res.json({ success: true });
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
