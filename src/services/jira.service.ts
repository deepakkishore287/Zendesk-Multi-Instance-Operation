import axios from "axios";
import { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, APPROVED_STATUSES, ALLOWED_ISSUE_TYPES } from "../config/jira.config";

/**
 * Browser-safe base64 encoder.
 */
function base64Encode(s: string): string {
  if (typeof btoa === "function") {
    return btoa(s);
  }
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer && typeof globalBuffer.from === "function") {
    return globalBuffer.from(s).toString("base64");
  }
  throw new Error("No base64 encoder available in this environment.");
}

function createClient() {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error("Jira is not configured in environment");
  }
  const auth = base64Encode(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`);
  return axios.create({
    baseURL: JIRA_BASE_URL.replace(/\/$/, ""),
    timeout: 20000,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });
}

export interface JiraValidationResult {
  ok: boolean;
  message: string;
  ticket?: any;
}

export async function validateJiraTicket(ticketId: string, extraAllowedStatuses?: string[], extraAllowedTypes?: string[]): Promise<JiraValidationResult> {
  const client = createClient();
  try {
    const res = await client.get(`/rest/api/2/issue/${encodeURIComponent(ticketId)}`);
    const issue = res.data;
    const status = issue.fields?.status?.name || "";
    const issuetype = issue.fields?.issuetype?.name || "";

    // Explicitly type the map parameter to avoid implicit 'any'
    const allowedStatuses = (extraAllowedStatuses || APPROVED_STATUSES).map((s: string) => s.trim());
    const allowedTypes = (extraAllowedTypes || ALLOWED_ISSUE_TYPES).map((s: string) => s.trim());

    if (!allowedTypes.includes(issuetype)) {
      return { ok: false, message: `Issue type "${issuetype}" is not allowed. Allowed types: ${allowedTypes.join(", ")}`, ticket: issue };
    }
    if (!allowedStatuses.includes(status)) {
      return { ok: false, message: `Issue status "${status}" is not in approved statuses: ${allowedStatuses.join(", ")}`, ticket: issue };
    }
    return { ok: true, message: "Jira ticket is valid and approved.", ticket: issue };
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 404) return { ok: false, message: "Jira ticket not found (404)" };
      return { ok: false, message: `Jira API error: ${err.response.status} ${err.response.statusText}` };
    }
    return { ok: false, message: `Jira validation failed: ${err.message}` };
  }
}