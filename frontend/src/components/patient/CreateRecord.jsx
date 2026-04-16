/**
 * CreateRecord.jsx
 * ----------------
 * Form for a patient to create a new medical record.
 * The medical data is hashed in the browser, stored off-chain via the backend,
 * and only the hash is written to the blockchain.
 */

import React, { useState } from "react";
import { getContractWithSigner } from "../../utils/contract";
import Spinner from "../shared/Spinner";

export default function CreateRecord({ onSuccess }) {
  const [form, setForm] = useState({
    diagnosis:      "",
    prescription:   "",
    notes:          "",
    doctorName:     "",
    visitDate:      new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.diagnosis.trim()) {
      setError("Diagnosis is required.");
      return;
    }
    setLoading(true);
    try {
      // Hash the medical data via the backend (simulated IPFS)
      const res = await fetch("/record", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        // In the full-stack demo the backend uses its operator key.
        // For direct MetaMask signing see the note in backend/contractService.js
        body: JSON.stringify({
          medicalData: { ...form, createdAt: new Date().toISOString() },
          // Pass the connected wallet's private key only in a local dev demo:
          // privateKey: "<never in production>"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      onSuccess?.(`Record #${data.recordId} created! TX: ${data.txHash?.slice(0, 14)}…`);
      setForm({ diagnosis: "", prescription: "", notes: "", doctorName: "", visitDate: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      // Fallback: write directly via MetaMask
      try {
        const { contract } = await getContractWithSigner();
        const fakeHash = await browserHash(form);
        const tx      = await contract.createRecord(fakeHash);
        const receipt = await tx.wait();
        onSuccess?.(`Record created on-chain! TX: ${receipt.hash.slice(0, 14)}…`);
      } catch (metaMaskErr) {
        setError(metaMaskErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>New Medical Record</h3>
      <form onSubmit={submit} style={styles.form}>
        <Field label="Visit Date" name="visitDate" type="date" value={form.visitDate} onChange={handle} />
        <Field label="Doctor Name" name="doctorName" value={form.doctorName} onChange={handle} />
        <Field label="Diagnosis *" name="diagnosis" value={form.diagnosis} onChange={handle} required />
        <TextArea label="Prescription" name="prescription" value={form.prescription} onChange={handle} />
        <TextArea label="Notes" name="notes" value={form.notes} onChange={handle} />

        {error && <p style={styles.err}>{error}</p>}
        {loading ? <Spinner /> : (
          <button type="submit" style={styles.btn}>Submit Record</button>
        )}
      </form>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function Field({ label, name, type = "text", value, onChange, required }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <textarea
        style={{ ...styles.input, height: "72px", resize: "vertical" }}
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/** Browser-side SHA-256 using Web Crypto (fallback when backend unreachable) */
async function browserHash(data) {
  const json = JSON.stringify(data, Object.keys(data).sort());
  const buf  = new TextEncoder().encode(json);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const styles = {
  card:    { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  heading: { margin: "0 0 1rem", color: "#1e293b", fontSize: "1.1rem" },
  form:    { display: "flex", flexDirection: "column", gap: "0.75rem" },
  field:   { display: "flex", flexDirection: "column", gap: "4px" },
  label:   { fontSize: "0.8rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: ".4px" },
  input:   { border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", fontSize: "0.9rem", outline: "none" },
  btn:     { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", marginTop: "0.25rem" },
  err:     { color: "#ef4444", fontSize: "0.85rem", margin: 0 },
};
