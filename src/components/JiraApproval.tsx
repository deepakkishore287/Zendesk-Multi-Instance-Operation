import React, { useState } from "react";
import { validateJiraTicket } from "../services/jira.service";
import { isValidJiraId } from "../utils/validators";

export default function JiraApproval({
  environment,
  onValidated,
  existingTicket,
}: {
  environment: "PPE" | "PROD";
  onValidated: (ticketId: string | null, ok: boolean, message?: string) => void;
  existingTicket?: string | null;
}) {
  const [ticket, setTicket] = useState<string>(existingTicket || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runValidation() {
    setMessage(null);
    if (!ticket) {
      setMessage("Please enter a Jira ticket id.");
      onValidated(null, false, "No ticket supplied");
      return;
    }
    if (!isValidJiraId(ticket)) {
      setMessage("Ticket id format looks invalid.");
      onValidated(ticket, false, "Format invalid");
      return;
    }
    setLoading(true);
    try {
      const res = await validateJiraTicket(ticket);
      setMessage(res.message);
      onValidated(ticket, res.ok, res.message);
    } catch (err: any) {
      setMessage(err?.message || String(err));
      onValidated(ticket, false, err?.message);
    } finally {
      setLoading(false);
    }
  }

  // Only visible/used when environment=PROD; for PPE it will render nothing.
  if (environment !== "PROD") return null;

  return (
    <div>
      <label className="small">Jira Ticket (required for PROD)</label>
      <div className="row">
        <input value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="ZD-CHG-1234" />
        <button className="small primary" onClick={runValidation} disabled={loading}>
          {loading ? "Validating..." : "Validate"}
        </button>
      </div>
      {message && <div className="footer-note">{message}</div>}
    </div>
  );
}