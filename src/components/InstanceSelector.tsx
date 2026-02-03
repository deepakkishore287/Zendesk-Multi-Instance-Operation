import React from "react";
import type { InstanceKey } from "../config/zendesk.config";

const INSTANCES: InstanceKey[] = ["Technology", "Colleague", "Security", "Customer", "Supplier"];

export default function InstanceSelector({ value, onChange }: { value: InstanceKey; onChange: (v: InstanceKey) => void }) {
  return (
    <div>
      <label className="small">Instance</label>
      <select value={value} onChange={(e) => onChange(e.target.value as InstanceKey)}>
        {INSTANCES.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </div>
  );
}