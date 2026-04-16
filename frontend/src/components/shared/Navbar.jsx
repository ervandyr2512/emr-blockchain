/**
 * Navbar.jsx
 * ----------
 * Top navigation bar — shows wallet address, chain, connect/disconnect button,
 * and a role badge (Patient / Doctor).
 */

import React from "react";

export default function Navbar({ account, chainId, onConnect, onDisconnect, role }) {
  const shortAddr = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : null;

  const networkName = chainId === 31337 ? "Hardhat" : chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`;

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.icon}>🏥</span>
        <span style={styles.title}>EMR Blockchain</span>
      </div>

      <div style={styles.right}>
        {account && role && (
          <span style={{ ...styles.badge, background: role === "Doctor" ? "#2563eb" : "#059669" }}>
            {role}
          </span>
        )}

        {account && (
          <span style={styles.chain}>{networkName}</span>
        )}

        {account ? (
          <div style={styles.walletGroup}>
            <span style={styles.address}>{shortAddr}</span>
            <button style={styles.btnOutline} onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button style={styles.btnPrimary} onClick={onConnect}>
            Connect MetaMask
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    padding:         "0 1.5rem",
    height:          "60px",
    background:      "#1e293b",
    color:           "#f1f5f9",
    position:        "sticky",
    top:             0,
    zIndex:          100,
    boxShadow:       "0 2px 8px rgba(0,0,0,.4)",
  },
  brand: { display: "flex", alignItems: "center", gap: "0.5rem" },
  icon:  { fontSize: "1.4rem" },
  title: { fontWeight: 700, fontSize: "1.1rem", letterSpacing: ".5px" },
  right: { display: "flex", alignItems: "center", gap: "0.75rem" },
  badge: {
    padding:      "2px 10px",
    borderRadius: "999px",
    fontSize:     "0.75rem",
    fontWeight:   700,
    color:        "#fff",
  },
  chain: {
    fontSize:   "0.75rem",
    color:      "#94a3b8",
    background: "#334155",
    padding:    "3px 8px",
    borderRadius: "6px",
  },
  walletGroup: { display: "flex", alignItems: "center", gap: "0.5rem" },
  address: { fontSize: "0.85rem", color: "#cbd5e1", fontFamily: "monospace" },
  btnPrimary: {
    background:   "#3b82f6",
    color:        "#fff",
    border:       "none",
    borderRadius: "8px",
    padding:      "7px 16px",
    cursor:       "pointer",
    fontWeight:   600,
    fontSize:     "0.85rem",
  },
  btnOutline: {
    background:   "transparent",
    color:        "#94a3b8",
    border:       "1px solid #475569",
    borderRadius: "8px",
    padding:      "6px 12px",
    cursor:       "pointer",
    fontSize:     "0.8rem",
  },
};
