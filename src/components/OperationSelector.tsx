import React from "react";

export type Operation =
  | "List Groups"
  | "Create Group"
  | "Update Group"
  | "Delete Group"
  | "List Ticket Fields"
  | "Create Ticket Field"
  | "Update Ticket Field"
  | "Delete Ticket Field"
  | "Bulk JSON";

const OPS: Operation[] = [
  "List Groups",
  "Create Group",
  "Update Group",
  "Delete Group",
  "List Ticket Fields",
  "Create Ticket Field",
  "Update Ticket Field",
  "Delete Ticket Field",
  "Bulk JSON",
];

export default function OperationSelector({ value, onChange }: { value: Operation; onChange: (v: Operation) => void }) {
  return (
    <div>
      <label className="small">Operation</label>
      <select value={value} onChange={(e) => onChange(e.target.value as Operation)}>
        {OPS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}