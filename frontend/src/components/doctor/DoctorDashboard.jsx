/**
 * DoctorDashboard.jsx
 * -------------------
 * Doctor view with three tabs:
 *  1. Accessible Records — auto-loads ALL records from patients who granted access
 *     (queries AccessGranted / AccessRevoked / RecordCreated events from blockchain)
 *  2. Add Record — create a record on behalf of a patient
 *  3. Update Record — update an existing record by ID
 */

import React, { useState, useEffect, useCallback } from "react";
import { getContractWithSigner, formatTimestamp } from "../../utils/contract";
import { apiGetRecord } from "../../utils/api";
import Notification from "../shared/Notification";
import Spinner      from "../shared/Spinner";

export default function DoctorDashboard({ account }) {
  const [notify, setNotify] = useState({ msg: "", type: "success" });
  const [tab,    setTab]    = useState("accessible");

  const showSuccess = (msg) => setNotify({ msg, type: "success" });
  const showError   = (msg) => setNotify({ msg, type: "error"   });

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
          { id: "accessible", label: "Accessible Records" },
          { id: "add",        label: "Add Record"         },
          { id: "update",     label: "Update Record"      },
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
        {tab === "accessible" && <AccessibleRecords account={account} onError={showError} />}
        {tab === "add"        && <AddRecord    onSuccess={showSuccess} onError={showError} />}
        {tab === "update"     && <UpdateRecord onSuccess={showSuccess} onError={showError} />}
      </div>
    </div>
  );
}

// ── Tab 1: Accessible Records ────────────────────────────────────────────────

function AccessibleRecords({ account, onError }) {
  const [records,  setRecords]  = useState([]);  // { patient, id, dataHash, timestamp, offChain }
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState("");   // progress message while loading

  const load = useCallback(async () => {
    setLoading(true);
    setRecords([]);
    setStatus("Querying blockchain events…");
    try {
      const { contract } = await getContractWithSigner();

      // ── Step 1: Find all patients who ever granted access to this doctor ──
      const grantFilter  = contract.filters.AccessGranted(null, account);
      const revokeFilter = contract.filters.AccessRevoked(null, account);

      const [grantEvents, revokeEvents] = await Promise.all([
        contract.queryFilter(grantFilter,  0, "latest"),
        contract.queryFilter(revokeFilter, 0, "latest"),
      ]);

      if (grantEvents.length === 0) {
        setStatus("No patients have granted you access yet.");
        setLoading(false);
        return;
      }

      // ── Step 2: Build set of patients whose access is still active ──
      // A revoke that happened AFTER the grant cancels it out.
      // We keep only patients where the latest event is a Grant.
      const timeline = [
        ...grantEvents .map((e) => ({ block: e.blockNumber, type: "grant",  patient: e.args.patient.toLowerCase() })),
        ...revokeEvents.map((e) => ({ block: e.blockNumber, type: "revoke", patient: e.args.patient.toLowerCase() })),
      ].sort((a, b) => a.block - b.block);

      const latestPerPatient = {};
      for (const ev of timeline) {
        latestPerPatient[ev.patient] = ev.type;
      }

      const activePatients = Object.entries(latestPerPatient)
        .filter(([, type]) => type === "grant")
        .map(([addr]) => addr);

      if (activePatients.length === 0) {
        setStatus("All patient access has been revoked.");
        setLoading(false);
        return;
      }

      // ── Step 3: For each active patient, get their record IDs from events ──
      setStatus(`Loading records from ${activePatients.length} patient(s)…`);

      const allRecords = [];

      for (const patient of activePatients) {
        // Find the original-case address from events
        const originalAddr = grantEvents.find(
          (e) => e.args.patient.toLowerCase() === patient
        )?.args.patient;

        // Query RecordCreated events for this patient
        const recFilter = contract.filters.RecordCreated(null, originalAddr);
        const recEvents = await contract.queryFilter(recFilter, 0, "latest");

        for (const ev of recEvents) {
          const id = ev.args.id;
          try {
            // getRecord will revert if record is inactive or access was revoked
            const rec = await contract.getRecord(id);

            // Try fetch off-chain data from backend
            let offChain = null;
            try {
              const data = await apiGetRecord(id.toString());
              if (data) offChain = data.medicalData;
            } catch { /* backend offline */ }

            allRecords.push({
              id:        rec.id.toString(),
              patient:   rec.patient,
              dataHash:  rec.dataHash,
              timestamp: rec.timestamp.toString(),
              offChain,
            });
          } catch {
            // Record inactive or access revoked — skip silently
          }
        }
      }

      setRecords(allRecords);
      setStatus(allRecords.length === 0 ? "No active records found." : "");
    } catch (err) {
      onError(err.message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  }, [account, onError]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={styles.listHeader}>
        <h3 style={styles.cardTitle}>Records Accessible to You</h3>
        <button style={styles.btnRefresh} onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading && <Spinner label={status || "Loading…"} />}
      {!loading && status && <p style={styles.hint}>{status}</p>}

      {records.length > 0 && (
        <div style={styles.list}>
          {records.map((rec) => (
            <RecordCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ rec }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={styles.idBadge}>#{rec.id}</span>
          <span style={styles.patientAddr}>
            Patient: {rec.patient.slice(0, 8)}…{rec.patient.slice(-6)}
          </span>
          <span style={styles.dateText}>{formatTimestamp(rec.timestamp)}</span>
        </div>
        <button style={styles.btnSm} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "View"}
        </button>
      </div>

      {expanded && (
        <div style={styles.detail}>
          <p style={styles.hashLabel}>Patient Address</p>
          <code style={styles.hash}>{rec.patient}</code>

          <p style={{ ...styles.hashLabel, marginTop: "0.5rem" }}>Hash (on-chain)</p>
          <code style={styles.hash}>{rec.dataHash}</code>

          {rec.offChain ? (
            <table style={styles.table}>
              <tbody>
                {Object.entries(rec.offChain).map(([k, v]) => (
                  <tr key={k}>
                    <td style={styles.tdKey}>{k}</td>
                    <td style={styles.tdVal}>{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={styles.offChainNote}>
              Off-chain data unavailable (backend not connected). Hash verified on-chain.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Add Record on behalf of patient ───────────────────────────────────

function AddRecord({ onSuccess, onError }) {
  const [patientAddr, setPatientAddr] = useState("");
  const [form,        setForm]        = useState({ diagnosis: "", prescription: "", notes: "", doctorName: "" });
  const [loading,     setLoading]     = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!patientAddr.trim()) { onError("Patient address required."); return; }
    if (!form.diagnosis.trim()) { onError("Diagnosis required."); return; }
    setLoading(true);
    try {
      const medicalData = { ...form, createdAt: new Date().toISOString(), addedByDoctor: true };
      const hash = await browserHash(medicalData);

      const { contract } = await getContractWithSigner();
      const tx = await contract.createRecordByDoctor(patientAddr.trim(), hash);
      const receipt = await tx.wait();
      onSuccess(`Record added for patient. TX: ${receipt.hash.slice(0, 14)}…`);
      setForm({ diagnosis: "", prescription: "", notes: "", doctorName: "" });
    } catch (err) {
      onError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Add Record for Patient</h3>
      <p style={styles.hint}>You must have access granted by the patient first.</p>
      <form onSubmit={submit} style={styles.formCol}>
        <LabeledInput label="Patient Address *" value={patientAddr} onChange={(e) => setPatientAddr(e.target.value)} mono placeholder="0x…" />
        <LabeledInput label="Diagnosis *"    name="diagnosis"    value={form.diagnosis}    onChange={handle} />
        <LabeledInput label="Prescription"   name="prescription" value={form.prescription} onChange={handle} />
        <LabeledInput label="Notes"          name="notes"        value={form.notes}        onChange={handle} />
        <LabeledInput label="Doctor Name"    name="doctorName"   value={form.doctorName}   onChange={handle} />
        {loading ? <Spinner /> : <button type="submit" style={styles.btnBlue}>Add Record</button>}
      </form>
    </div>
  );
}

// ── Tab 3: Update existing record ────────────────────────────────────────────

function UpdateRecord({ onSuccess, onError }) {
  const [recordId, setRecordId] = useState("");
  const [form,     setForm]     = useState({ diagnosis: "", prescription: "", notes: "" });
  const [loading,  setLoading]  = useState(false);
  const [current,  setCurrent]  = useState(null); // current record info

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Load current record data when ID is entered
  const fetchCurrent = async () => {
    if (!recordId) return;
    try {
      const { contract } = await getContractWithSigner();
      const rec = await contract.getRecord(BigInt(recordId));
      setCurrent(rec);
    } catch (err) {
      onError(err.reason || err.message);
      setCurrent(null);
    }
  };

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
      onSuccess(`Record #${recordId} updated. TX: ${receipt.hash.slice(0, 14)}…`);
    } catch (err) {
      onError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Update Existing Record</h3>
      <p style={styles.hint}>You can only update records where the patient has granted you access.</p>

      <div style={styles.inlineRow}>
        <input
          style={styles.input}
          placeholder="Record ID (e.g. 1)"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          type="number"
          min="1"
        />
        <button style={styles.btnGray} onClick={fetchCurrent} type="button">
          Load
        </button>
      </div>

      {current && (
        <div style={styles.currentInfo}>
          <p style={styles.hashLabel}>Current hash</p>
          <code style={styles.hash}>{current.dataHash}</code>
          <p style={{ ...styles.hashLabel, marginTop: "0.4rem" }}>Patient</p>
          <code style={{ ...styles.hash, fontSize: "0.75rem" }}>{current.patient}</code>
        </div>
      )}

      <form onSubmit={submit} style={{ ...styles.formCol, marginTop: "1rem" }}>
        <LabeledInput label="New Diagnosis *"  name="diagnosis"    value={form.diagnosis}    onChange={handle} />
        <LabeledInput label="New Prescription" name="prescription" value={form.prescription} onChange={handle} />
        <LabeledInput label="Notes"            name="notes"        value={form.notes}        onChange={handle} />
        {loading ? <Spinner /> : <button type="submit" style={styles.btnBlue}>Update Record</button>}
      </form>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function LabeledInput({ label, name, value, onChange, mono, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        style={{
          border: "1px solid #cbd5e1", borderRadius: "6px",
          padding: "8px 10px", fontSize: "0.9rem",
          fontFamily: mono ? "monospace" : "inherit",
        }}
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
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  wrap:        { maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1rem" },
  header:      { marginBottom: "1.25rem" },
  title:       { margin: 0, fontSize: "1.5rem", color: "#0f172a" },
  addr:        { margin: "4px 0 0", fontSize: "0.78rem", color: "#94a3b8", fontFamily: "monospace" },
  tabs:        { display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "2px solid #e2e8f0" },
  tab:         { background: "none", border: "none", padding: "8px 16px", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  tabActive:   { color: "#2563eb", borderBottom: "2px solid #2563eb" },
  content:     {},
  listHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
  cardTitle:   { margin: 0, color: "#1e293b", fontSize: "1.05rem" },
  hint:        { color: "#64748b", fontSize: "0.82rem", marginBottom: "0.75rem" },
  list:        { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card:        { background: "#fff", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.07)" },
  cardHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" },
  idBadge:     { background: "#eff6ff", color: "#2563eb", borderRadius: "6px", padding: "2px 8px", fontWeight: 700, fontSize: "0.8rem" },
  patientAddr: { fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" },
  dateText:    { fontSize: "0.78rem", color: "#94a3b8" },
  btnSm:       { background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" },
  btnRefresh:  { background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" },
  detail:      { marginTop: "0.75rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" },
  hashLabel:   { fontSize: "0.72rem", color: "#94a3b8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".4px" },
  hash:        { display: "block", wordBreak: "break-all", background: "#f8fafc", borderRadius: "6px", padding: "6px 8px", fontSize: "0.73rem", color: "#334155" },
  offChainNote:{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "0.5rem" },
  table:       { width: "100%", borderCollapse: "collapse", marginTop: "0.75rem", fontSize: "0.85rem" },
  tdKey:       { fontWeight: 600, color: "#475569", padding: "4px 8px 4px 0", width: "140px", verticalAlign: "top" },
  tdVal:       { color: "#334155", padding: "4px 0", wordBreak: "break-word" },
  formCol:     { display: "flex", flexDirection: "column", gap: "0.75rem" },
  inlineRow:   { display: "flex", gap: "0.5rem", marginBottom: "0.75rem" },
  input:       { flex: 1, border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", fontSize: "0.9rem" },
  currentInfo: { background: "#f8fafc", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.25rem" },
  btnBlue:     { background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnGray:     { background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
};
