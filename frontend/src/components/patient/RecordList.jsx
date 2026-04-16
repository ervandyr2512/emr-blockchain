/**
 * RecordList.jsx
 * --------------
 * Fetches and displays all active records belonging to the connected patient.
 */

import React, { useState, useEffect, useCallback } from "react";
import { getContractWithSigner, formatTimestamp } from "../../utils/contract";
import Spinner from "../shared/Spinner";

export default function RecordList({ account, refreshTrigger }) {
  const [recordIds, setRecordIds] = useState([]);
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError("");
    try {
      const { contract } = await getContractWithSigner();

      // Get active record IDs for this patient
      const ids = await contract.getMyRecords();
      setRecordIds(ids.map(String));

      // Fetch each record's on-chain metadata
      const recs = await Promise.all(
        ids.map(async (id) => {
          const rec = await contract.getRecord(id);
          // Try to fetch off-chain data from the backend
          let offChain = null;
          try {
            const res = await fetch(`/record/${id}`);
            if (res.ok) offChain = (await res.json()).medicalData;
          } catch { /* offline / backend not running */ }
          return {
            id:          rec.id.toString(),
            dataHash:    rec.dataHash,
            timestamp:   rec.timestamp.toString(),
            offChain,
          };
        })
      );
      setRecords(recs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  if (loading) return <Spinner label="Loading your records…" />;
  if (error)   return <p style={{ color: "#ef4444" }}>{error}</p>;
  if (records.length === 0) return <p style={{ color: "#94a3b8" }}>No records yet.</p>;

  return (
    <div style={styles.list}>
      {records.map((rec) => (
        <RecordCard key={rec.id} rec={rec} onRefresh={load} />
      ))}
    </div>
  );
}

function RecordCard({ rec, onRefresh }) {
  const [expanded,  setExpanded]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const softDelete = async () => {
    if (!window.confirm(`Soft-delete record #${rec.id}? This cannot be undone on-chain.`)) return;
    setDeleting(true);
    try {
      const { contract } = await getContractWithSigner();
      const tx = await contract.deleteRecord(BigInt(rec.id));
      await tx.wait();
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.idBadge}>#{rec.id}</span>
          <span style={styles.date}>{formatTimestamp(rec.timestamp)}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={styles.btnSm} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "View"}
          </button>
          <button style={{ ...styles.btnSm, background: "#fee2e2", color: "#dc2626" }} onClick={softDelete} disabled={deleting}>
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={styles.detail}>
          <p style={styles.hashLabel}>Hash (on-chain):</p>
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
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              Off-chain data unavailable (backend not connected).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  list:       { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card:       { background: "#fff", borderRadius: "10px", padding: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  idBadge:    { background: "#eff6ff", color: "#2563eb", borderRadius: "6px", padding: "2px 8px", fontWeight: 700, fontSize: "0.8rem", marginRight: "0.5rem" },
  date:       { color: "#64748b", fontSize: "0.82rem" },
  btnSm:      { background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  detail:     { marginTop: "0.75rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" },
  hashLabel:  { fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase" },
  hash:       { display: "block", wordBreak: "break-all", background: "#f8fafc", borderRadius: "6px", padding: "6px 8px", fontSize: "0.75rem", color: "#334155" },
  table:      { width: "100%", borderCollapse: "collapse", marginTop: "0.75rem", fontSize: "0.85rem" },
  tdKey:      { fontWeight: 600, color: "#475569", padding: "4px 8px 4px 0", width: "140px", verticalAlign: "top" },
  tdVal:      { color: "#334155", padding: "4px 0", wordBreak: "break-word" },
};
