/**
 * api.js
 * ------
 * Central API utility. Reads REACT_APP_API_URL from env so the
 * frontend works on Vercel (Render backend) and locally (proxy).
 */

const BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/$/, "")
  : "";

/**
 * Save medical data to backend (returns { dataHash }).
 * Backend stores JSON in MongoDB and returns the SHA-256 hash.
 * @param {object} medicalData
 */
export async function apiSaveOffChain(medicalData) {
  const res = await fetch(`${BASE}/record`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ medicalData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Backend error");
  return data; // { success, recordId, dataHash, txHash }
}

/**
 * Fetch full medical data by SHA-256 hash.
 * No blockchain call — just looks up the off-chain store.
 * @param {string} hash  SHA-256 hex string
 * @returns {object|null}  medicalData or null if not found
 */
export async function apiGetByHash(hash) {
  if (!hash) return null;
  try {
    const res = await fetch(`${BASE}/record/offchain/${hash}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.medicalData || null;
  } catch {
    return null;
  }
}

/**
 * Store off-chain data only (no blockchain write).
 * Used when the patient signs the blockchain tx themselves via MetaMask,
 * but we still need to persist the medical data.
 * @param {string} hash
 * @param {object} medicalData
 */
export async function apiStoreData(hash, medicalData) {
  try {
    await fetch(`${BASE}/record`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ medicalData, hashOnly: true }),
    });
  } catch {
    // non-critical — data stored on-chain hash remains valid
  }
}
