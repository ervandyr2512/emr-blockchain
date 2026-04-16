/**
 * RoleSelector.jsx
 * ----------------
 * Shown after wallet connection. Lets the user pick Patient or Doctor mode,
 * and also offers doctor self-registration.
 */

import React, { useState } from "react";
import { getContractWithSigner } from "../../utils/contract";
import Spinner from "./Spinner";

export default function RoleSelector({ account, onSelectRole }) {
  const [checking,    setChecking]    = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message,     setMessage]     = useState("");

  const pickPatient = () => onSelectRole("Patient");

  const pickDoctor = async () => {
    setChecking(true);
    setMessage("");
    try {
      const { contract } = await getContractWithSigner();
      const isDoc = await contract.checkDoctor(account);
      if (isDoc) {
        onSelectRole("Doctor");
      } else {
        setMessage("Your address is not registered as a doctor. Register first.");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setChecking(false);
    }
  };

  const registerDoctor = async () => {
    setRegistering(true);
    setMessage("");
    try {
      const { contract } = await getContractWithSigner();
      const tx = await contract.registerDoctor(account);
      await tx.wait();
      setMessage("Registered as doctor! You can now enter the Doctor Dashboard.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div style={styles.outer}>
      <div style={styles.card}>
        <h2 style={styles.title}>Select Your Role</h2>
        <p style={styles.sub}>
          Connected as <code style={styles.addr}>{account?.slice(0, 10)}…</code>
        </p>

        {(checking || registering) && <Spinner />}

        <div style={styles.btnRow}>
          <RoleCard
            icon="🧑‍⚕️"
            title="I'm a Patient"
            desc="Create, view and manage your own medical records. Control who can access them."
            btnLabel="Enter as Patient"
            btnStyle={styles.btnGreen}
            onClick={pickPatient}
          />
          <RoleCard
            icon="👨‍⚕️"
            title="I'm a Doctor"
            desc="View and update patient records you have been granted access to."
            btnLabel="Enter as Doctor"
            btnStyle={styles.btnBlue}
            onClick={pickDoctor}
          />
        </div>

        {message && <p style={styles.msg}>{message}</p>}

        <div style={styles.register}>
          <p style={styles.regHint}>First time as a doctor?</p>
          <button style={styles.btnOutline} onClick={registerDoctor} disabled={registering}>
            {registering ? "Registering…" : "Register My Address as Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, btnLabel, btnStyle, onClick }) {
  return (
    <div style={styles.roleCard}>
      <div style={styles.roleIcon}>{icon}</div>
      <h3 style={styles.roleTitle}>{title}</h3>
      <p style={styles.roleDesc}>{desc}</p>
      <button style={{ ...styles.roleBtn, ...btnStyle }} onClick={onClick}>
        {btnLabel}
      </button>
    </div>
  );
}

const styles = {
  outer:     { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)", background: "#f1f5f9" },
  card:      { background: "#fff", borderRadius: "16px", padding: "2.5rem 2rem", maxWidth: "680px", width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.1)", textAlign: "center" },
  title:     { margin: "0 0 0.25rem", fontSize: "1.6rem", color: "#0f172a" },
  sub:       { margin: "0 0 2rem", color: "#64748b" },
  addr:      { fontFamily: "monospace", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px" },
  btnRow:    { display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  roleCard:  { flex: 1, minWidth: "220px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" },
  roleIcon:  { fontSize: "2.5rem" },
  roleTitle: { margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" },
  roleDesc:  { margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 },
  roleBtn:   { marginTop: "0.75rem", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "#fff" },
  btnGreen:  { background: "#10b981" },
  btnBlue:   { background: "#2563eb" },
  msg:       { color: "#f59e0b", fontSize: "0.85rem", background: "#fefce8", padding: "8px 12px", borderRadius: "6px", margin: "0 0 1rem" },
  register:  { borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" },
  regHint:   { margin: "0 0 0.5rem", color: "#94a3b8", fontSize: "0.8rem" },
  btnOutline:{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", color: "#475569", fontSize: "0.85rem" },
};
