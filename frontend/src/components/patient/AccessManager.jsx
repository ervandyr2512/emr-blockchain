/**
 * AccessManager.jsx
 * -----------------
 * Allows a patient to grant or revoke a doctor's access to their records.
 */

import React, { useState } from "react";
import { getContractWithSigner } from "../../utils/contract";
import Spinner from "../shared/Spinner";

export default function AccessManager({ onSuccess, onError }) {
  const [doctorAddr, setDoctorAddr] = useState("");
  const [loading,    setLoading]    = useState(false);

  const act = async (action) => {
    if (!doctorAddr.trim()) { onError?.("Doctor address is required."); return; }
    setLoading(true);
    try {
      const { contract } = await getContractWithSigner();

      let tx;
      if (action === "grant") {
        tx = await contract.grantAccess(doctorAddr.trim());
      } else {
        tx = await contract.revokeAccess(doctorAddr.trim());
      }
      const receipt = await tx.wait();
      onSuccess?.(`Access ${action === "grant" ? "granted" : "revoked"}! TX: ${receipt.hash.slice(0,14)}…`);
      setDoctorAddr("");
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Manage Doctor Access</h3>
      <p style={styles.sub}>Enter the doctor's wallet address to grant or revoke access to all your records.</p>

      <div style={styles.row}>
        <input
          style={styles.input}
          placeholder="0x… doctor wallet address"
          value={doctorAddr}
          onChange={(e) => setDoctorAddr(e.target.value)}
        />
      </div>

      {loading ? <Spinner /> : (
        <div style={styles.btnRow}>
          <button style={styles.btnGrant}  onClick={() => act("grant")}>Grant Access</button>
          <button style={styles.btnRevoke} onClick={() => act("revoke")}>Revoke Access</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card:     { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  heading:  { margin: "0 0 0.25rem", color: "#1e293b", fontSize: "1.1rem" },
  sub:      { margin: "0 0 1rem", color: "#64748b", fontSize: "0.85rem" },
  row:      { marginBottom: "0.75rem" },
  input:    { width: "100%", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "9px 10px", fontSize: "0.9rem", boxSizing: "border-box", fontFamily: "monospace" },
  btnRow:   { display: "flex", gap: "0.75rem" },
  btnGrant: { flex: 1, background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600 },
  btnRevoke:{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600 },
};
