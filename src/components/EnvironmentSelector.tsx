import React from "react";
export default function EnvironmentSelector({ value, onChange }: { value: "PPE" | "PROD"; onChange: (v: "PPE" | "PROD") => void }) {
  return (
    <div>
      <label className="small">Environment</label>
      <select value={value} onChange={(e) => onChange(e.target.value as "PPE" | "PROD")}>
        <option value="PPE">PPE</option>
        <option value="PROD">PROD</option>
      </select>
    </div>
  );
}