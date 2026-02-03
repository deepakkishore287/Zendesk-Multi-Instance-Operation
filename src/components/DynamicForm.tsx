import React, { useState } from "react";
import type { Operation } from "./OperationSelector";

type Props = {
  operation: Operation;
  onSubmit: (payload: any) => void;
};

export default function DynamicForm({ operation, onSubmit }: Props) {
  const [jsonBulk, setJsonBulk] = useState<string>("");
  const [name, setName] = useState("");
  const [id, setId] = useState<string>("");
  const [fieldType, setFieldType] = useState("text");
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [defaultFlag, setDefaultFlag] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    switch (operation) {
      case "Create Group":
        onSubmit({ name, default: defaultFlag });
        break;
      case "Update Group":
        onSubmit({ id: Number(id), payload: { name, default: defaultFlag } });
        break;
      case "Delete Group":
        onSubmit({ id: Number(id) });
        break;
      case "Create Ticket Field":
        onSubmit({ type: fieldType, title, key, required: false });
        break;
      case "Update Ticket Field":
        onSubmit({ id: Number(id), payload: { title, key } });
        break;
      case "Delete Ticket Field":
        onSubmit({ id: Number(id) });
        break;
      case "Bulk JSON":
        try {
          const parsed = JSON.parse(jsonBulk);
          onSubmit(parsed);
        } catch (err) {
          alert("Invalid JSON provided for Bulk JSON.");
        }
        break;
      default:
        onSubmit({});
    }
  }

  // Simple per-operation forms
  return (
    <form onSubmit={handleSubmit}>
      {operation === "Bulk JSON" && (
        <>
          <label className="small">Bulk JSON</label>
          <textarea rows={10} value={jsonBulk} onChange={(e) => setJsonBulk(e.target.value)} placeholder='[{ "op":"create_group", "payload": {...}}]'></textarea>
        </>
      )}

      {operation.includes("Group") && operation !== "Bulk JSON" && (
        <>
          <label className="small">Group ID (for update / delete)</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="12345" />
          {operation !== "Delete Group" && (
            <>
              <label className="small">Group Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Support - Level 1" />
              <div className="row">
                <label className="small">Default?</label>
                <input type="checkbox" checked={defaultFlag} onChange={(e) => setDefaultFlag(e.target.checked)} />
              </div>
            </>
          )}
        </>
      )}

      {operation.includes("Ticket Field") && operation !== "Bulk JSON" && (
        <>
          <label className="small">Ticket Field ID (for update / delete)</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="360000000000" />
          {operation !== "Delete Ticket Field" && (
            <>
              <label className="small">Field Type</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="decimal">decimal</option>
                <option value="checkbox">checkbox</option>
              </select>
              <label className="small">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Customer Priority" />
              <label className="small">Key (internal)</label>
              <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="customer_priority" />
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="primary" type="submit">
          Run
        </button>
      </div>
    </form>
  );
}