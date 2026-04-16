/**
 * Spinner.jsx — simple loading indicator
 */
import React from "react";

export default function Spinner({ label = "Processing transaction…" }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.ring} />
      <span style={styles.label}>{label}</span>
    </div>
  );
}

const styles = {
  wrap:  { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" },
  label: { color: "#64748b", fontSize: "0.9rem" },
  ring:  {
    width:       "20px",
    height:      "20px",
    border:      "3px solid #e2e8f0",
    borderTop:   "3px solid #3b82f6",
    borderRadius:"50%",
    animation:   "spin 0.8s linear infinite",
  },
};

// Inject keyframe once
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}
