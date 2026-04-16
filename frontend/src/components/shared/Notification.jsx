/**
 * Notification.jsx
 * ----------------
 * Simple toast-style banner for success / error messages.
 * Props: { message, type ("success"|"error"), onClose }
 */

import React, { useEffect } from "react";

export default function Notification({ message, type = "success", onClose }) {
  // Auto-dismiss after 5 s
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const bg = type === "error" ? "#ef4444" : "#10b981";

  return (
    <div style={{ ...styles.wrap, background: bg }}>
      <span>{message}</span>
      <button style={styles.close} onClick={onClose}>✕</button>
    </div>
  );
}

const styles = {
  wrap: {
    position:     "fixed",
    top:          "72px",
    right:        "1.5rem",
    zIndex:       200,
    color:        "#fff",
    padding:      "0.75rem 1.25rem",
    borderRadius: "8px",
    display:      "flex",
    alignItems:   "center",
    gap:          "1rem",
    boxShadow:    "0 4px 12px rgba(0,0,0,.3)",
    maxWidth:     "420px",
    fontSize:     "0.9rem",
  },
  close: {
    background:  "transparent",
    border:      "none",
    color:       "#fff",
    cursor:      "pointer",
    fontSize:    "1rem",
    lineHeight:  1,
    flexShrink:  0,
  },
};
