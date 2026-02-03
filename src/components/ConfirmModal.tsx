import React from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }: { open: boolean; title?: string; message?: string; onConfirm: () => void; onCancel: () => void; }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, right: 0, bottom: 0, display: "flex",
      alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.45)"
    }}>
      <div style={{ width: 480, background: "var(--panel)", padding: 20, borderRadius: 8 }}>
        <h3>{title || "Confirm"}</h3>
        <div style={{ marginBottom: 12 }}>{message || "Are you sure?"}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}