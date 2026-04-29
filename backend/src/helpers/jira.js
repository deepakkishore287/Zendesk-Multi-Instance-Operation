import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const JIRA_BASE = process.env.JIRA_BASE_URL || 'https://tesco.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

/**
 * Validate a Jira ticket exists and that its status is allowed.
 * Allowed statuses for PROD updates: "Change Approved"
 * Returns { ok: boolean, statusName?: string, error?: string }
 */
export async function validateJiraTicket(issueKey) {
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    return { ok: false, error: 'Jira authentication not configured on server.' };
  }

  if (!issueKey || typeof issueKey !== 'string') {
    return { ok: false, error: 'Invalid issue key' };
  }

  const url = `${JIRA_BASE.replace(/\/$/, '')}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=status`;

  const basic = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: 'application/json',
      },
      timeout: 10_000,
    });

    const statusName = res?.data?.fields?.status?.name;
    const allowed = ['Change Approved'];

    if (!statusName) {
      return { ok: false, statusName: null, error: 'Could not read issue status' };
    }

    if (allowed.includes(statusName)) {
      return { ok: true, statusName };
    }

    return { ok: false, statusName, error: `Jira issue status "${statusName}" is not allowed for PROD changes` };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { ok: false, error: 'Jira issue not found (404)' };
    }
    return { ok: false, error: err.message || 'Jira request failed' };
  }
}