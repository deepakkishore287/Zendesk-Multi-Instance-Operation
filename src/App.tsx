import React, { useEffect, useMemo, useState } from "react";
import InstanceSelector from "./components/InstanceSelector";
import EnvironmentSelector from "./components/EnvironmentSelector";
import OperationSelector, { Operation } from "./components/OperationSelector";
import DynamicForm from "./components/DynamicForm";
import JiraApproval from "./components/JiraApproval";
import ResponseLog, { LogEntry } from "./components/ResponseLog";
import ConfirmModal from "./components/ConfirmModal";
import INSTANCES, { InstanceKey, EnvironmentKey } from "./config/zendesk.config";
import * as zendesk from "./services/zendesk.service";

function nowISO() {
  return new Date().toISOString();
}

export default function App() {
  const [instance, setInstance] = useState<InstanceKey>("Technology");
  const [environment, setEnvironment] = useState<EnvironmentKey>("PPE");
  const [operation, setOperation] = useState<Operation>("List Groups");
  const [jiraTicket, setJiraTicket] = useState<string | null>(null);
  const [jiraValidated, setJiraValidated] = useState(false);
  const [jiraMessage, setJiraMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm?: () => void; title?: string; message?: string }>({ open: false });

  // Dark mode based on environment
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", environment === "PROD" ? "dark" : "light");
  }, [environment]);

  // get creds
  const creds = useMemo(() => {
    const c = INSTANCES[instance][environment];
    return c;
  }, [instance, environment]);

  function pushLog(entry: Omit<LogEntry, "ts">) {
    setLogs((s) => [{ ts: nowISO(), ...entry }, ...s]);
  }

  function handleJiraValidated(ticket: string | null, ok: boolean, message?: string) {
    setJiraTicket(ticket);
    setJiraValidated(ok);
    setJiraMessage(message || null);
    pushLog({ level: ok ? "success" : "error", message: `Jira validation: ${message || (ok ? "ok" : "failed")}`, jiraTicket: ticket || null, details: undefined });
  }

  async function runOperation(payload: any) {
    // If PROD -> ensure jiraValidated
    if (environment === "PROD" && !jiraValidated) {
      pushLog({ level: "error", message: "Cannot perform PROD operation without Jira approval.", details: null, jiraTicket });
      alert("PROD operations require Jira approval. Validate a Jira ticket first.");
      return;
    }

    try {
      pushLog({ level: "info", message: `Executing ${operation} on ${instance}/${environment}`, details: payload, jiraTicket });
      switch (operation) {
        case "List Groups": {
          const res = await zendesk.listGroups(creds);
          pushLog({ level: "success", message: `Listed ${res.length} groups`, details: res, jiraTicket });
          break;
        }
        case "Create Group": {
          const res = await zendesk.createGroup(creds, payload);
          pushLog({ level: "success", message: `Created group ${res.group?.name || "unknown"}`, details: res, jiraTicket });
          break;
        }
        case "Update Group": {
          const { id, payload: p } = payload;
          const res = await zendesk.updateGroup(creds, id, p);
          pushLog({ level: "success", message: `Updated group ${id}`, details: res, jiraTicket });
          break;
        }
        case "Delete Group": {
          // show confirm modal
          setConfirmState({
            open: true,
            title: "Delete Group",
            message: `Are you sure you want to delete group id ${payload.id}?`,
            onConfirm: async () => {
              setConfirmState({ open: false });
              try {
                const res = await zendesk.deleteGroup(creds, payload.id);
                pushLog({ level: "success", message: `Deleted group ${payload.id}`, details: res, jiraTicket });
              } catch (err: any) {
                pushLog({ level: "error", message: `Error deleting group ${payload.id}: ${err.message || err}`, details: err, jiraTicket });
              }
            },
          });
          break;
        }
        case "List Ticket Fields": {
          const res = await zendesk.listTicketFields(creds);
          pushLog({ level: "success", message: `Listed ${res.length} ticket fields`, details: res, jiraTicket });
          break;
        }
        case "Create Ticket Field": {
          const res = await zendesk.createTicketField(creds, payload);
          pushLog({ level: "success", message: `Created ticket field`, details: res, jiraTicket });
          break;
        }
        case "Update Ticket Field": {
          const { id, payload: p } = payload;
          const res = await zendesk.updateTicketField(creds, id, p);
          pushLog({ level: "success", message: `Updated ticket field ${id}`, details: res, jiraTicket });
          break;
        }
        case "Delete Ticket Field": {
          setConfirmState({
            open: true,
            title: "Delete Ticket Field",
            message: `Are you sure you want to delete ticket field id ${payload.id}?`,
            onConfirm: async () => {
              setConfirmState({ open: false });
              try {
                const res = await zendesk.deleteTicketField(creds, payload.id);
                pushLog({ level: "success", message: `Deleted ticket field ${payload.id}`, details: res, jiraTicket });
              } catch (err: any) {
                pushLog({ level: "error", message: `Error deleting ticket field ${payload.id}: ${err.message || err}`, details: err, jiraTicket });
              }
            },
          });
          break;
        }
        case "Bulk JSON": {
          // Expect array of operations
          if (!Array.isArray(payload)) throw new Error("Bulk JSON must be an array of operations.");
          for (const op of payload) {
            // Minimal execution model: op.type identifies operation (create_group, update_group, create_field, etc)
            try {
              if (op.type === "create_group") {
                const r = await zendesk.createGroup(creds, op.payload);
                pushLog({ level: "success", message: `Bulk: created group ${r.group?.name}`, details: r, jiraTicket });
              } else if (op.type === "create_ticket_field") {
                const r = await zendesk.createTicketField(creds, op.payload);
                pushLog({ level: "success", message: `Bulk: created ticket field`, details: r, jiraTicket });
              } else {
                pushLog({ level: "info", message: `Bulk: unsupported op type ${op.type}`, details: op, jiraTicket });
              }
            } catch (err: any) {
              pushLog({ level: "error", message: `Bulk op ${op.type} failed: ${err.message || err}`, details: err, jiraTicket });
            }
          }
          break;
        }
        default:
          pushLog({ level: "error", message: `Unhandled operation ${operation}`, details: null, jiraTicket });
      }
    } catch (err: any) {
      pushLog({ level: "error", message: `Operation failed: ${err.message || String(err)}`, details: err, jiraTicket });
    }
  }

  return (
    <div className="app">
      <div>
        <div className="panel">
          <div className="header">
            <h2 style={{ margin: 0 }}>Zendesk Multi-Instance Admin</h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Internal Use Only</div>
          </div>

          <div className="controls">
            <div className="row">
              <div style={{ flex: 1 }}>
                <InstanceSelector value={instance} onChange={(v) => setInstance(v)} />
              </div>
              <div style={{ width: 160 }}>
                <EnvironmentSelector value={environment} onChange={(v) => { setEnvironment(v); setJiraValidated(false); setJiraTicket(null); }} />
              </div>
            </div>

            <OperationSelector value={operation} onChange={setOperation} />

            <JiraApproval environment={environment} onValidated={handleJiraValidated} existingTicket={jiraTicket || undefined} />

            <div>
              <label className="small">Selected Zendesk (read-only)</label>
              <input readOnly value={`${creds.subdomain} (${creds.email ? "configured" : "missing creds"})`} />
            </div>

            <div>
              <DynamicForm operation={operation} onSubmit={runOperation} />
            </div>

            <div className="footer-note">Note: PROD operations require Jira approval. Logs show which ticket was used.</div>
          </div>
        </div>
      </div>

      <div>
        <ResponseLog entries={logs} />
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => confirmState.onConfirm && confirmState.onConfirm()}
        onCancel={() => setConfirmState({ open: false })}
      />
    </div>
  );
}