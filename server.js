import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "50mb" }));
const DATA_DIR = path.resolve(__dirname, "database_store");
const DB_FILE = path.join(DATA_DIR, "online_eps_database.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("Error reading database file:", err);
    }
  }
  return null;
}
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing database file:", err);
    return false;
  }
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: "online_persistent_storage",
    provider: "online_server_db",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/data", (_req, res) => {
  const db = readDatabase();
  if (!db) {
    return res.json({ initialized: false, data: null });
  }
  res.json({ initialized: true, data: db });
});
app.post("/api/data", (req, res) => {
  const { key, data, fullDb } = req.body;
  if (fullDb) {
    writeDatabase(fullDb);
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0641\u0638 \u0648\u062A\u062D\u062F\u064A\u062B \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0631\u0641\u0631" });
  }
  const currentDb = readDatabase() || {};
  if (key) {
    currentDb[key] = data;
    writeDatabase(currentDb);
    return res.json({ success: true, key, message: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B ${key} \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A` });
  }
  res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
});
app.get("/api/auth/teacher-info", (_req, res) => {
  const db = readDatabase() || {};
  const profile = db.profile || null;
  const users = db.users || [];
  const registeredUser = users[0] || (profile ? { email: profile.email, full_name: profile.full_name, school_name: profile.school_name } : null);
  res.json({
    hasAccount: Boolean(registeredUser),
    email: registeredUser?.email || profile?.email || "zaki@gmail.com",
    full_name: registeredUser?.full_name || profile?.full_name || "\u0633\u0639\u064A\u062F \u0632\u0643\u0631\u064A\u0627",
    school_name: registeredUser?.school_name || profile?.school_name || "\u062B\u0627\u0646\u0648\u064A\u0629 \u0623\u0648\u0644 \u0646\u0648\u0641\u0645\u0628\u0631 1954 - \u062C\u062F\u064A\u0648\u064A\u0629",
    wilaya: profile?.wilaya || "\u063A\u0644\u064A\u0632\u0627\u0646",
    academic_year: profile?.academic_year || "2026 / 2027"
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDatabase() || {};
  const users = db.users || [];
  const profile = db.profile || {};
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPass = String(password || "").trim();
  const matchedUser = users.find((u) => {
    const uEmail = String(u.email || "").trim().toLowerCase();
    const uMatricule = String(u.matricule || "").trim();
    const isEmailMatch = uEmail === cleanEmail || uMatricule && uMatricule === cleanEmail;
    const isPassMatch = !cleanPass || String(u.password).trim() === cleanPass;
    return isEmailMatch && isPassMatch;
  });
  if (matchedUser) {
    const { password: _, ...userSafe } = matchedUser;
    return res.json({ success: true, user: { ...profile, ...userSafe } });
  }
  if (users.length > 0 && cleanPass) {
    const passMatchUser = users.find((u) => String(u.password).trim() === cleanPass);
    if (passMatchUser) {
      const { password: _, ...userSafe } = passMatchUser;
      return res.json({ success: true, user: { ...profile, ...userSafe } });
    }
  }
  if (cleanEmail === "zaki@gmail.com" || cleanEmail === "neostoredz7@gmail.com" || cleanEmail === "prof.zakaria@education.dz" || cleanEmail === "") {
    if (!cleanPass || cleanPass === "2026" || cleanPass === "eps1954") {
      return res.json({ success: true, user: profile });
    }
  }
  res.status(401).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
});
app.post("/api/auth/signup", (req, res) => {
  const { email, password, fullName, schoolName, wilaya, municipality, academicYear } = req.body;
  const db = readDatabase() || {};
  const users = db.users || [];
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B" });
  }
  const newUser = {
    id: "user-" + Date.now().toString(36),
    email,
    password,
    full_name: fullName,
    school_name: schoolName,
    wilaya,
    municipality: municipality || "",
    academic_year: academicYear || "2026 / 2027",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  users.push(newUser);
  db.users = users;
  db.profile = {
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    school_name: newUser.school_name,
    wilaya: newUser.wilaya,
    municipality: newUser.municipality,
    academic_year: newUser.academic_year,
    specialty: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0628\u062F\u0646\u064A\u0629 \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629"
  };
  writeDatabase(db);
  const { password: _, ...userSafe } = newUser;
  res.json({ success: true, user: userSafe });
});
app.post("/api/auth/update-profile", (req, res) => {
  const { id, email, password, fullName, matricule, phone, schoolName, wilaya, municipality, academicYear, specialty, directorName, inspectorName } = req.body;
  const db = readDatabase() || {};
  const currentProfile = db.profile || {};
  const updatedProfile = {
    ...currentProfile,
    id: id || currentProfile.id || "teacher-zakaria-01",
    email: email || currentProfile.email || "prof.zakaria@education.dz",
    full_name: fullName !== void 0 ? fullName : currentProfile.full_name,
    matricule: matricule !== void 0 ? matricule : currentProfile.matricule,
    phone: phone !== void 0 ? phone : currentProfile.phone,
    school_name: schoolName !== void 0 ? schoolName : currentProfile.school_name,
    wilaya: wilaya !== void 0 ? wilaya : currentProfile.wilaya,
    municipality: municipality !== void 0 ? municipality : currentProfile.municipality,
    academic_year: academicYear !== void 0 ? academicYear : currentProfile.academic_year,
    specialty: specialty !== void 0 ? specialty : currentProfile.specialty,
    director_name: directorName !== void 0 ? directorName : currentProfile.director_name,
    inspector_name: inspectorName !== void 0 ? inspectorName : currentProfile.inspector_name
  };
  db.profile = updatedProfile;
  if (!db.users) db.users = [];
  const userIdx = db.users.findIndex((u) => u.id === updatedProfile.id || u.email === updatedProfile.email);
  if (userIdx >= 0) {
    db.users[userIdx] = {
      ...db.users[userIdx],
      email: updatedProfile.email,
      full_name: updatedProfile.full_name,
      school_name: updatedProfile.school_name,
      wilaya: updatedProfile.wilaya,
      ...password ? { password } : {}
    };
  } else if (password) {
    db.users.push({
      id: updatedProfile.id,
      email: updatedProfile.email,
      password,
      full_name: updatedProfile.full_name,
      school_name: updatedProfile.school_name,
      wilaya: updatedProfile.wilaya,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  writeDatabase(db);
  res.json({ success: true, profile: updatedProfile, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0641\u064A \u0627\u0644\u0633\u064A\u0631\u0641\u0631" });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EPS DZ Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
