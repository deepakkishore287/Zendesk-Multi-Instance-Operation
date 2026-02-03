import React from "react";

export type LogEntry = {
  ts: string;
  level: "info" | "error" | "success";
  message: string;
  details?: any;
  jiraTicket?: string | null;
};

export default function ResponseLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="panel">
      <div className="header">
        <h3 style={{ margin: 0 }}>Action Log</h3>
      </div>
      <div className="log">
        {entries.length === 0 && <div className="footer-note">No actions yet.</div>}
        {entries.map((e, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>[{new Date(e.ts).toLocaleString()}]</strong>{" "}
                <span style={{ color: e.level === "error" ? "#ef4444" : "#10b981" }}>{e.level.toUpperCase()}</span> - {e.message}
                {e.jiraTicket && <span style={{ marginLeft: 8 }} className="badge">Jira: {e.jiraTicket}</span>}
              </div>
            </div>
            {e.details && <pre style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{JSON.stringify(e.details, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}