import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Database storage file path
const DATA_DIR = path.resolve(__dirname, 'database_store');
const DB_FILE = path.join(DATA_DIR, 'online_eps_database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read database
function readDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading database file:', err);
    }
  }
  return null;
}

// Save database
function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'online_persistent_storage',
    provider: 'online_server_db',
    timestamp: new Date().toISOString(),
  });
});

// Get all database data
app.get('/api/data', (_req: Request, res: Response) => {
  const db = readDatabase();
  if (!db) {
    return res.json({ initialized: false, data: null });
  }
  res.json({ initialized: true, data: db });
});

// Save or sync collection or full database
app.post('/api/data', (req: Request, res: Response) => {
  const { key, data, fullDb } = req.body;

  if (fullDb) {
    writeDatabase(fullDb);
    return res.json({ success: true, message: 'تم حفظ وتحديث قاعدة البيانات بالكامل على السيرفر' });
  }

  const currentDb = readDatabase() || {};
  if (key) {
    currentDb[key] = data;
    writeDatabase(currentDb);
    return res.json({ success: true, key, message: `تم تحديث ${key} في قاعدة البيانات` });
  }

  res.status(400).json({ error: 'بيانات غير صالحة' });
});

// Get active registered teacher info
app.get('/api/auth/teacher-info', (_req: Request, res: Response) => {
  const db = readDatabase() || {};
  const profile = db.profile || null;
  const users = db.users || [];
  const registeredUser = users[0] || (profile ? { email: profile.email, full_name: profile.full_name, school_name: profile.school_name } : null);
  res.json({
    hasAccount: Boolean(registeredUser),
    email: registeredUser?.email || profile?.email || 'zaki@gmail.com',
    full_name: registeredUser?.full_name || profile?.full_name || 'سعيد زكريا',
    school_name: registeredUser?.school_name || profile?.school_name || 'ثانوية أول نوفمبر 1954 - جديوية',
    wilaya: profile?.wilaya || 'غليزان',
    academic_year: profile?.academic_year || '2026 / 2027',
  });
});

// User authentication endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = readDatabase() || {};
  const users = db.users || [];
  const profile = db.profile || {};

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  // Match registered user
  const matchedUser = users.find((u: any) => {
    const uEmail = String(u.email || '').trim().toLowerCase();
    const uMatricule = String(u.matricule || '').trim();
    const isEmailMatch = uEmail === cleanEmail || (uMatricule && uMatricule === cleanEmail);
    const isPassMatch = !cleanPass || String(u.password).trim() === cleanPass;
    return isEmailMatch && isPassMatch;
  });

  if (matchedUser) {
    const { password: _, ...userSafe } = matchedUser;
    return res.json({ success: true, user: { ...profile, ...userSafe } });
  }

  // If password matches the registered teacher's password (e.g. 2026)
  if (users.length > 0 && cleanPass) {
    const passMatchUser = users.find((u: any) => String(u.password).trim() === cleanPass);
    if (passMatchUser) {
      const { password: _, ...userSafe } = passMatchUser;
      return res.json({ success: true, user: { ...profile, ...userSafe } });
    }
  }

  // Fallback for default accounts
  if (
    cleanEmail === 'zaki@gmail.com' ||
    cleanEmail === 'neostoredz7@gmail.com' ||
    cleanEmail === 'prof.zakaria@education.dz' ||
    cleanEmail === ''
  ) {
    if (!cleanPass || cleanPass === '2026' || cleanPass === 'eps1954') {
      return res.json({ success: true, user: profile });
    }
  }

  res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
});

// User registration endpoint
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, password, fullName, schoolName, wilaya, municipality, academicYear } = req.body;
  const db = readDatabase() || {};
  const users = db.users || [];

  const existing = users.find((u: any) => u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'هذا الحساب مسجل مسبقاً' });
  }

  const newUser = {
    id: 'user-' + Date.now().toString(36),
    email,
    password,
    full_name: fullName,
    school_name: schoolName,
    wilaya,
    municipality: municipality || '',
    academic_year: academicYear || '2026 / 2027',
    created_at: new Date().toISOString(),
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
    specialty: 'التربية البدنية والرياضية',
  };
  writeDatabase(db);

  const { password: _, ...userSafe } = newUser;
  res.json({ success: true, user: userSafe });
});

// Update Teacher Profile and Login Credentials
app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const { id, email, password, fullName, matricule, phone, schoolName, wilaya, municipality, academicYear, specialty, directorName, inspectorName } = req.body;
  const db = readDatabase() || {};
  const currentProfile = db.profile || {};

  const updatedProfile = {
    ...currentProfile,
    id: id || currentProfile.id || 'teacher-zakaria-01',
    email: email || currentProfile.email || 'prof.zakaria@education.dz',
    full_name: fullName !== undefined ? fullName : currentProfile.full_name,
    matricule: matricule !== undefined ? matricule : currentProfile.matricule,
    phone: phone !== undefined ? phone : currentProfile.phone,
    school_name: schoolName !== undefined ? schoolName : currentProfile.school_name,
    wilaya: wilaya !== undefined ? wilaya : currentProfile.wilaya,
    municipality: municipality !== undefined ? municipality : currentProfile.municipality,
    academic_year: academicYear !== undefined ? academicYear : currentProfile.academic_year,
    specialty: specialty !== undefined ? specialty : currentProfile.specialty,
    director_name: directorName !== undefined ? directorName : currentProfile.director_name,
    inspector_name: inspectorName !== undefined ? inspectorName : currentProfile.inspector_name,
  };

  db.profile = updatedProfile;

  // Also update user in users array if exists
  if (!db.users) db.users = [];
  const userIdx = db.users.findIndex((u: any) => u.id === updatedProfile.id || u.email === updatedProfile.email);
  if (userIdx >= 0) {
    db.users[userIdx] = {
      ...db.users[userIdx],
      email: updatedProfile.email,
      full_name: updatedProfile.full_name,
      school_name: updatedProfile.school_name,
      wilaya: updatedProfile.wilaya,
      ...(password ? { password } : {}),
    };
  } else if (password) {
    db.users.push({
      id: updatedProfile.id,
      email: updatedProfile.email,
      password,
      full_name: updatedProfile.full_name,
      school_name: updatedProfile.school_name,
      wilaya: updatedProfile.wilaya,
      created_at: new Date().toISOString(),
    });
  }

  writeDatabase(db);
  res.json({ success: true, profile: updatedProfile, message: 'تم تحديث بيانات الأستاذ ومعلومات الدخول في السيرفر' });
});

// Vite middleware for SPA
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EPS DZ Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
