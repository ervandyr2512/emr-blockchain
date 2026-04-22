/**
 * create-demo-accounts.js
 * -----------------------
 * Creates 5 demo user accounts in Firebase Authentication + writes
 * their profiles to Firebase Realtime Database.
 *
 * Run: node scripts/create-demo-accounts.js
 *
 * Requires: NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL
 * in .env.local (loaded automatically).
 */

const fs   = require("fs");
const path = require("path");

// ── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv(file) {
  try {
    const content = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let   val = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val) process.env[key] = val;
    }
  } catch {
    // file not found — skip
  }
}

loadEnv(".env.local");
loadEnv(".env.production.local");

const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const DB_URL     = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!API_KEY || !DB_URL) {
  console.error("❌  Missing env vars. Check .env.local has NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL");
  process.exit(1);
}

// ── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { email: "admin@emr.id",     password: "admin123",    name: "Administrator",      role: "admin"       },
  { email: "dokter@emr.id",    password: "dokter123",   name: "Dr. Ahmad Fauzi",    role: "doctor"      },
  { email: "perawat@emr.id",   password: "perawat123",  name: "Perawat Sari",       role: "nurse"       },
  { email: "pasien@emr.id",    password: "pasien123",   name: "Pasien Demo",        role: "patient"     },
  { email: "apoteker@emr.id",  password: "apoteker123", name: "Apoteker Budi",      role: "pharmacist"  },
];

// ── HTTP helpers (no external deps) ─────────────────────────────────────────
async function post(url, body) {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

async function put(url, body) {
  const res = await fetch(url, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ── Create a single user ─────────────────────────────────────────────────────
async function createUser(user) {
  const SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

  // 1. Create Firebase Auth account
  const authResult = await post(SIGN_UP_URL, {
    email:             user.email,
    password:          user.password,
    returnSecureToken: true,
  });

  if (authResult.error) {
    if (authResult.error.message === "EMAIL_EXISTS") {
      console.log(`  ⚠️  ${user.email} already exists — skipping Auth, updating DB profile...`);
      // Try signing in to get the UID
      const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
      const signIn = await post(SIGN_IN_URL, {
        email:             user.email,
        password:          user.password,
        returnSecureToken: true,
      });
      if (signIn.error) {
        console.error(`  ❌  Could not sign in as ${user.email}: ${signIn.error.message}`);
        return;
      }
      await writeProfile(signIn.localId, signIn.idToken, user);
      return;
    }
    console.error(`  ❌  Auth error for ${user.email}: ${authResult.error.message}`);
    return;
  }

  const { localId: uid, idToken } = authResult;
  console.log(`  ✅  Auth account created: ${user.email}  (uid: ${uid})`);

  // 2. Write profile to RTDB
  await writeProfile(uid, idToken, user);
}

async function writeProfile(uid, idToken, user) {
  const profile = {
    uid,
    email:     user.email,
    name:      user.name,
    role:      user.role,
    createdAt: new Date().toISOString(),
  };

  const dbResult = await put(
    `${DB_URL}/users/${uid}.json?auth=${idToken}`,
    profile
  );

  if (dbResult.error) {
    console.error(`  ❌  DB write error for ${user.email}: ${dbResult.error}`);
    return;
  }
  console.log(`  ✅  DB profile written: ${user.email} → role=${user.role}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n🔥  Creating Firebase demo accounts...\n");
  console.log(`   API_KEY  : ${API_KEY.slice(0, 10)}...`);
  console.log(`   DB URL   : ${DB_URL}\n`);

  for (const user of DEMO_USERS) {
    console.log(`→ Processing ${user.email} (${user.role})...`);
    await createUser(user);
  }

  console.log("\n✨  Done! Demo accounts ready.\n");
  console.log("   admin@emr.id       / admin123     → Admin");
  console.log("   dokter@emr.id      / dokter123    → Dokter");
  console.log("   perawat@emr.id     / perawat123   → Perawat");
  console.log("   pasien@emr.id      / pasien123    → Pasien");
  console.log("   apoteker@emr.id    / apoteker123  → Apoteker\n");
})();
