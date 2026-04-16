/**
 * CreateRecord.jsx
 * ----------------
 * Patient creates a new medical record:
 *  1. Hash the medical data in the browser (Web Crypto SHA-256)
 *  2. Save full JSON to backend (MongoDB via Render)
 *  3. Patient signs the blockchain transaction via MetaMask with the hash
 *
 * Off-chain data is always saved BEFORE the blockchain write,
 * so it is always retrievable by hash.
 */

import React, { useState } from "react";
import { getContractWithSigner } from "../../utils/contract";
import { apiStoreData }          from "../../utils/api";
import Spinner from "../shared/Spinner";

export default function CreateRecord({ onSuccess }) {
  const [form, setForm] = useState({
    diagnosis:    "",
    prescription: "",
    notes:        "",
    doctorName:   "",
    visitDate:    new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.diagnosis.trim()) { setError("Diagnosis is required."); return; }

    setLoading(true);
    try {
      const medicalData = { ...form, createdAt: new Date().toISOString() };

      // Step 1 — Hash in browser
      const dataHash = await browserHash(medicalData);

      // Step 2 — Save full JSON to backend (MongoDB) BEFORE blockchain write
      await apiStoreData(dataHash, medicalData);

      // Step 3 — Patient signs blockchain tx via MetaMask
      const { contract } = await getContractWithSigner();
      const tx      = await contract.createRecord(dataHash);
      const receipt = await tx.wait();

      // Parse RecordCreated event to get the new ID
      const event = receipt.logs
        .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e) => e && e.name === "RecordCreated");
      const recordId = event ? event.args.id.toString() : "?";

      onSuccess?.(`Record #${recordId} created! TX: ${receipt.hash.slice(0, 14)}…`);
      setForm({
        diagnosis: "", prescription: "", notes: "", doctorName: "",
        visitDate: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>New Medical Record</h3>
      <p style={styles.sub}>
        Your medical data is hashed and stored securely. Only the hash is written to the blockchain.
      </p>
      <form onSubmit={submit} style={styles.form}>
        <Field label="Visit Date"   name="visitDate"    type="date" value={form.visitDate}    onChange={handle} />
        <Field label="Doctor Name"  name="doctorName"               value={form.doctorName}   onChange={handle} />
        <Field label="Diagnosis *"  name="diagnosis"                value={form.diagnosis}    onChange={handle} required />
        <TextArea label="Prescription" name="prescription"          value={form.prescription} onChange={handle} />
        <TextArea label="Notes"        name="notes"                 value={form.notes}        onChange={handle} />

        {error && <p style={styles.err}>{error}</p>}
        {loading
          ? <Spinner label="Saving data & waiting for transaction…" />
          : <button type="submit" style={styles.btn}>Submit Record</button>
        }
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, required }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} name={name} value={value} onChange={onChange} required={required} />
    </div>
  );
}

function TextArea({ label, name, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <textarea
        style={{ ...styles.input, height: "72px", resize: "vertical" }}
        name={name} value={value} onChange={onChange}
      />
    </div>
  );
}

async function browserHash(data) {
  const sorted = Object.keys(data).sort().reduce((o, k) => { o[k] = data[k]; return o; }, {});
  const json = JSON.stringify(sorted);
  const buf  = new TextEncoder().encode(json);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const styles = {
  card:    { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  heading: { margin: "0 0 0.25rem", color: "#1e293b", fontSize: "1.1rem" },
  sub:     { margin: "0 0 1rem", color: "#64748b", fontSize: "0.82rem" },
  form:    { display: "flex", flexDirection: "column", gap: "0.75rem" },
  field:   { display: "flex", flexDirection: "column", gap: "4px" },
  label:   { fontSize: "0.78rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: ".4px" },
  input:   { border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", fontSize: "0.9rem", outline: "none" },
  btn:     { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem" },
  err:     { color: "#ef4444", fontSize: "0.85rem", margin: 0 },
};
