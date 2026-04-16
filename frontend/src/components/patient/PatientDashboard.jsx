/**
 * PatientDashboard.jsx
 * --------------------
 * Full patient view: create records, view records, manage doctor access.
 */

import React, { useState } from "react";
import CreateRecord  from "./CreateRecord";
import RecordList    from "./RecordList";
import AccessManager from "./AccessManager";
import Notification  from "../shared/Notification";

export default function PatientDashboard({ account }) {
  const [tab,     setTab]     = useState("records"); // "records" | "create" | "access"
  const [notify,  setNotify]  = useState({ msg: "", type: "success" });
  const [refresh, setRefresh] = useState(0);

  const showSuccess = (msg) => {
    setNotify({ msg, type: "success" });
    setRefresh((r) => r + 1);
    setTab("records");
  };
  const showError = (msg) => setNotify({ msg, type: "error" });

  return (
    <div style={styles.wrap}>
      <Notification
        message={notify.msg}
        type={notify.type}
        onClose={() => setNotify({ msg: "", type: "success" })}
      />

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Patient Dashboard</h2>
          <p style={styles.addr}>{account}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={styles.tabs}>
        {[
          { id: "records", label: "My Records" },
          { id: "create",  label: "New Record" },
          { id: "access",  label: "Doctor Access" },
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

      {/* Content */}
      <div style={styles.content}>
        {tab === "records" && (
          <>
            <h3 style={styles.sectionTitle}>Your Medical Records</h3>
            <RecordList account={account} refreshTrigger={refresh} />
          </>
        )}
        {tab === "create" && (
          <CreateRecord onSuccess={showSuccess} />
        )}
        {tab === "access" && (
          <AccessManager onSuccess={showSuccess} onError={showError} />
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap:         { maxWidth: "860px", margin: "0 auto", padding: "1.5rem 1rem" },
  header:       { marginBottom: "1.25rem" },
  title:        { margin: 0, fontSize: "1.5rem", color: "#0f172a" },
  addr:         { margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8", fontFamily: "monospace" },
  tabs:         { display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0" },
  tab:          { background: "none", border: "none", padding: "8px 16px", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  tabActive:    { color: "#3b82f6", borderBottom: "2px solid #3b82f6" },
  content:      {},
  sectionTitle: { color: "#1e293b", marginBottom: "1rem" },
};
