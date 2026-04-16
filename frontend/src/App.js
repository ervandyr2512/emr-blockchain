/**
 * App.js
 * ------
 * Root component — manages wallet connection state and routes between
 * the landing page, role selector, patient dashboard, and doctor dashboard.
 */

import React, { useState } from "react";
import { useWallet }         from "./hooks/useWallet";
import Navbar                from "./components/shared/Navbar";
import RoleSelector          from "./components/shared/RoleSelector";
import PatientDashboard      from "./components/patient/PatientDashboard";
import DoctorDashboard       from "./components/doctor/DoctorDashboard";

export default function App() {
  const { account, chainId, connect, disconnect, isConnecting, error } = useWallet();
  const [role, setRole] = useState(null); // null | "Patient" | "Doctor"

  const handleDisconnect = () => {
    disconnect();
    setRole(null);
  };

  return (
    <div style={styles.root}>
      <Navbar
        account={account}
        chainId={chainId}
        onConnect={connect}
        onDisconnect={handleDisconnect}
        role={role}
      />

      <main style={styles.main}>
        {/* ── Not connected ── */}
        {!account && (
          <Landing onConnect={connect} isConnecting={isConnecting} error={error} />
        )}

        {/* ── Connected but no role selected ── */}
        {account && !role && (
          <RoleSelector account={account} onSelectRole={setRole} />
        )}

        {/* ── Patient view ── */}
        {account && role === "Patient" && (
          <PatientDashboard account={account} />
        )}

        {/* ── Doctor view ── */}
        {account && role === "Doctor" && (
          <DoctorDashboard account={account} />
        )}
      </main>
    </div>
  );
}

// ── Landing page ─────────────────────────────────────────────────

function Landing({ onConnect, isConnecting, error }) {
  return (
    <div style={styles.landing}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>🏥</div>
        <h1 style={styles.heroTitle}>Blockchain EMR System</h1>
        <p style={styles.heroSub}>
          A decentralised Electronic Medical Record platform where patients own
          their data and doctors access it only with explicit permission.
        </p>

        <div style={styles.features}>
          {[
            { icon: "🔐", text: "Patient-controlled access" },
            { icon: "⛓️",  text: "Immutable audit trail on Ethereum" },
            { icon: "📦", text: "Off-chain data, on-chain hash" },
            { icon: "👨‍⚕️", text: "Role-based doctor / patient UI" },
          ].map((f) => (
            <div key={f.text} style={styles.feature}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        {error && <p style={styles.err}>{error}</p>}

        <button style={styles.connectBtn} onClick={onConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting…" : "Connect MetaMask to Continue"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  root:        { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif" },
  main:        { minHeight: "calc(100vh - 60px)" },

  // Landing
  landing:     { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)" },
  hero:        { textAlign: "center", maxWidth: "560px", padding: "2rem 1.5rem" },
  heroIcon:    { fontSize: "3.5rem", marginBottom: "0.5rem" },
  heroTitle:   { fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.75rem" },
  heroSub:     { color: "#64748b", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 2rem" },
  features:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" },
  feature:     { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fff", borderRadius: "10px", padding: "0.75rem 1rem", boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  featureIcon: { fontSize: "1.3rem" },
  featureText: { fontSize: "0.85rem", color: "#334155", fontWeight: 500 },
  connectBtn:  { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "12px", padding: "14px 32px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(59,130,246,.4)" },
  err:         { color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" },
};
