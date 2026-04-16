/**
 * api.js
 * ------
 * Central API utility — reads REACT_APP_API_URL from env so the
 * frontend works both locally (proxy → localhost:3001) and on Vercel
 * (pointing to the deployed Render backend).
 */

const BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/$/, "") // strip trailing slash
  : "";                                               // empty = use proxy

/**
 * POST /record  — create medical record via backend
 */
export async function apiCreateRecord(medicalData) {
  const res = await fetch(`${BASE}/record`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ medicalData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data; // { success, recordId, dataHash, txHash }
}

/**
 * GET /record/:id  — fetch record + off-chain data
 */
export async function apiGetRecord(id) {
  const res = await fetch(`${BASE}/record/${id}`);
  if (!res.ok) return null;
  return res.json(); // { id, patient, dataHash, timestamp, active, medicalData }
}

/**
 * PUT /record/:id  — update record
 */
export async function apiUpdateRecord(id, medicalData, isDoctor = false) {
  const res = await fetch(`${BASE}/record/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ medicalData, isDoctor }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data;
}
