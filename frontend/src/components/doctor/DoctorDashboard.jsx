/**
 * DoctorDashboard.jsx
 * -------------------
 * Full doctor view: look up patient records (if granted access),
 * add records on behalf of a patient, update existing records.
 */

import React, { useState } from "react";
import { getContractWithSigner, formatTimestamp } from "../../utils/contract";
import Notification from "../shared/Notification";
import Spinner      from "../shared/Spinner";

export default function DoctorDashboard({ account }) {
  const [notify,  setNotify]  = useState({ msg: "", type: "success" });
  const [tab,     setTab]     = useState("view"); // "view" | "add" | "update"

  const showSuccess = (msg) => setNotify({ msg, type: "success" });
  const showError   = (msg) => setNotify({ msg, type: "error" });

  return (
    <div style={styles.wrap}>
      <Notification
        message={notify.msg}
        type={notify.type}
        onClose={() => setNotify({ msg: "", type: "success" })}
      />

      <div style={styles.header}>
        <h2 style={styles.title}>Doctor Dashboard</h2>
        <p style={styles.addr}>{account}</p>
      </div>

      <div style={styles.tabs}>
        {[
          { id: "view",   label: "View Patient Records" },
          { id: "add",    label: "Add Record for Patient" },
          { id: "update", label: "Update Record" },
        ].map((t) => (
          <button
            key={t.id}
            style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {tab === "view"   && <ViewPatient  onSuccess={showSuccess} onError={showError} />}
        {tab === "add"    && <AddRecord    onSuccess={showSuccess} onError={showError} />}
        {tab === "update" && <UpdateRecord onSuccess={showSuccess} onError={showError} />}
      </div>
    </div>
  );
}

// ── View patient records ─────────────────────────────────────────

function ViewPatient({ onSuccess, onError }) {
  const [patientAddr, setPatientAddr] = useState("");
  const [recordId,    setRecordId]    = useState("");
  const [record,      setRecord]      = useState(null);
  const [loading,     setLoading]     = useState(false);

  const fetchRecord = async () => {
    if (!recordId) { onError("Enter a record ID."); return; }
    setLoading(true);
    setRecord(null);
    try {
      const { contract } = await getContractWithSigner();
      const rec = await contract.getRecord(BigInt(recordId));
      let offChain = null;
      try {
        const res = await fetch(`/record/${recordId}`);
        if (res.ok) offChain = (await res.json()).medicalData;
      } catch {}
      setRecord({ ...rec, offChain });
      onSuccess("Record retrieved.");
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Look Up Record by ID</h3>
      <p style={styles.hint}>You must have access granted by the patient to view their records.</p>
      <div style={styles.inlineRow}>
        <input
          style={styles.input}
          placeholder="Record ID (e.g. 1)"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          type="number"
          min="1"
        />
        <button style={styles.btnBlue} onClick={fetchRecord} disabled={loading}>
          {loading ? "…" : "Fetch"}
        </button>
      </div>

      {loading && <Spinner />}
      {record && (
        <div style={styles.result}>
          <Row label="Record ID"  value={record.id.toString()} />
          <Row label="Patient"    value={record.patient} mono />
          <Row label="Timestamp"  value={formatTimestamp(record.timestamp)} />
          <Row label="Hash"       value={record.dataHash} mono />
          {record.offChain && Object.entries(record.offChain).map(([k, v]) => (
            <Row key={k} label={k} value={String(v)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add record on behalf of patient ─────────────────────────────

function AddRecord({ onSuccess, onError }) {
  const [patientAddr, setPatientAddr] = useState("");
  const [form, setForm] = useState({ diagnosis: "", prescription: "", notes: "", doctorName: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!patientAddr.trim()) { onError("Patient address required."); return; }
    if (!form.diagnosis.trim()) { onError("Diagnosis required."); return; }
    setLoading(true);
    try {
      const medicalData = { ...form, createdAt: new Date().toISOString(), addedByDoctor: true };
      const hash = await browserHash(medicalData);

      // Store off-chain
      await fetch("/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalData }),
      }).catch(() => {});

      // Write on-chain
      const { contract } = await getContractWithSigner();
      const tx = await contract.createRecordByDoctor(patientAddr.trim(), hash);
      const receipt = await tx.wait();
      onSuccess(`Record added for patient. TX: ${receipt.hash.slice(0,14)}…`);
      setForm({ diagnosis: "", prescription: "", notes: "", doctorName: "" });
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Add Record for Patient</h3>
      <form onSubmit={submit} style={styles.formCol}>
        <LabeledInput label="Patient Address" value={patientAddr} onChange={(e) => setPatientAddr(e.target.value)} mono placeholder="0x…" />
        <LabeledInput label="Diagnosis *"     name="diagnosis"    value={form.diagnosis}    onChange={handle} />
        <LabeledInput label="Prescription"    name="prescription" value={form.prescription} onChange={handle} />
        <LabeledInput label="Notes"           name="notes"        value={form.notes}        onChange={handle} />
        {loading ? <Spinner /> : <button type="submit" style={styles.btnBlue}>Add Record</button>}
      </form>
    </div>
  );
}

// ── Update an existing record ────────────────────────────────────

function UpdateRecord({ onSuccess, onError }) {
  const [recordId,   setRecordId]   = useState("");
  const [form,       setForm]       = useState({ diagnosis: "", prescription: "", notes: "" });
  const [loading,    setLoading]    = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!recordId) { onError("Record ID required."); return; }
    if (!form.diagnosis.trim()) { onError("Diagnosis required."); return; }
    setLoading(true);
    try {
      const medicalData = { ...form, updatedAt: new Date().toISOString() };
      const newHash = await browserHash(medicalData);

      const { contract } = await getContractWithSigner();
      const tx = await contract.updateRecordByDoctor(BigInt(recordId), newHash);
      const receipt = await tx.wait();
      onSuccess(`Record #${recordId} updated. TX: ${receipt.hash.slice(0,14)}…`);
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Update Existing Record</h3>
      <form onSubmit={submit} style={styles.formCol}>
        <LabeledInput label="Record ID *" value={recordId} onChange={(e) => setRecordId(e.target.value)} type="number" />
        <LabeledInput label="New Diagnosis *"    name="diagnosis"    value={form.diagnosis}    onChange={handle} />
        <LabeledInput label="New Prescription"   name="prescription" value={form.prescription} onChange={handle} />
        <LabeledInput label="Notes"              name="notes"        value={form.notes}        onChange={handle} />
        {loading ? <Spinner /> : <button type="submit" style={styles.btnBlue}>Update Record</button>}
      </form>
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────────

function Row({ label, value, mono }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
      <span style={{ fontWeight: 600, color: "#475569", width: "120px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#334155", wordBreak: "break-all", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}

function LabeledInput({ label, name, value, onChange, mono, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>{label}</label>
      <input
        style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", fontSize: "0.9rem", fontFamily: mono ? "monospace" : "inherit" }}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

async function browserHash(data) {
  const json = JSON.stringify(data, Object.keys(data).sort());
  const buf  = new TextEncoder().encode(json);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const styles = {
  wrap:      { maxWidth: "860px", margin: "0 auto", padding: "1.5rem 1rem" },
  header:    { marginBottom: "1.25rem" },
  title:     { margin: 0, fontSize: "1.5rem", color: "#0f172a" },
  addr:      { margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8", fontFamily: "monospace" },
  tabs:      { display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "2px solid #e2e8f0" },
  tab:       { background: "none", border: "none", padding: "8px 16px", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  tabActive: { color: "#2563eb", borderBottom: "2px solid #2563eb" },
  content:   {},
  card:      { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  cardTitle: { margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.05rem" },
  hint:      { margin: "0 0 1rem", color: "#64748b", fontSize: "0.82rem" },
  inlineRow: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  input:     { flex: 1, border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", fontSize: "0.9rem" },
  btnBlue:   { background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  result:    { marginTop: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px" },
  formCol:   { display: "flex", flexDirection: "column", gap: "0.75rem" },
};
