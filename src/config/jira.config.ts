export const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || "";
export const JIRA_EMAIL = import.meta.env.VITE_JIRA_EMAIL || "";
export const JIRA_API_TOKEN = import.meta.env.VITE_JIRA_API_TOKEN || "";

export const APPROVED_STATUSES =
  (import.meta.env.VITE_JIRA_APPROVED_STATUSES || "Approved,Done,Ready for Prod")
    .split(",")
    .map((s: string) => s.trim());

export const ALLOWED_ISSUE_TYPES =
  (import.meta.env.VITE_JIRA_ALLOWED_TYPES || "Change,Task")
    .split(",")
    .map((s: string) => s.trim());