import axios, { AxiosInstance } from "axios";
import { ZendeskCreds } from "../config/zendesk.config";

/**
 * Browser-safe base64 encoder.
 * Uses btoa when available (browser), otherwise falls back to Buffer if present (Node).
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

function createClient(creds: ZendeskCreds): AxiosInstance {
  if (!creds.subdomain || !creds.email || !creds.token) {
    throw new Error("Zendesk credentials are not configured for this selection.");
  }
  const baseURL = `https://${creds.subdomain}.zendesk.com/api/v2`;
  const auth = base64Encode(`${creds.email}/token:${creds.token}`);
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 20000,
  });
}

/**
 * Pagination helper for Zendesk endpoints that use next_page
 */
async function paginate<T>(client: AxiosInstance, path: string): Promise<T[]> {
  const results: T[] = [];
  let next = path;
  while (next) {
    const res = await client.get(next);
    const data = res.data;
    // merge items - attempt common keys
    if (data.groups) results.push(...data.groups);
    else if (data.ticket_fields) results.push(...data.ticket_fields);
    else if (data.results) results.push(...data.results);
    // next_page is full url; axios baseURL used so use absolute
    next = data.next_page ? data.next_page.replace(client.defaults.baseURL!, "") : "";
  }
  return results;
}

export async function listGroups(creds: ZendeskCreds) {
  const client = createClient(creds);
  // GET /api/v2/groups.json
  return paginate<any>(client, "/groups.json");
}

export async function createGroup(creds: ZendeskCreds, payload: { name: string; default?: boolean }) {
  const client = createClient(creds);
  const res = await client.post("/groups.json", { group: payload });
  return res.data;
}

export async function updateGroup(creds: ZendeskCreds, id: number, payload: { name?: string; default?: boolean }) {
  const client = createClient(creds);
  const res = await client.put(`/groups/${id}.json`, { group: payload });
  return res.data;
}

export async function deleteGroup(creds: ZendeskCreds, id: number) {
  const client = createClient(creds);
  const res = await client.delete(`/groups/${id}.json`);
  return res.data;
}

export async function listTicketFields(creds: ZendeskCreds) {
  const client = createClient(creds);
  return paginate<any>(client, "/ticket_fields.json");
}

export async function createTicketField(creds: ZendeskCreds, payload: any) {
  const client = createClient(creds);
  const res = await client.post("/ticket_fields.json", { ticket_field: payload });
  return res.data;
}

export async function updateTicketField(creds: ZendeskCreds, id: number, payload: any) {
  const client = createClient(creds);
  const res = await client.put(`/ticket_fields/${id}.json`, { ticket_field: payload });
  return res.data;
}

export async function deleteTicketField(creds: ZendeskCreds, id: number) {
  const client = createClient(creds);
  const res = await client.delete(`/ticket_fields/${id}.json`);
  return res.data;
}