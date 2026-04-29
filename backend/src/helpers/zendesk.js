import axios from 'axios';

/**
 * Zendesk instance mapping (base urls)
 */
const ZENDESK_BASES = {
  technology: {
    ppe: 'https://ocset.zendesk.com',
    prod: 'https://tescosupportcentre.zendesk.com',
  },
  colleague: {
    ppe: 'https://ppecolleaguehelp.zendesk.com',
    prod: 'https://tescocolleaguehelp.zendesk.com',
  },
  security: {
    ppe: 'https://ppesecurityoperations.zendesk.com',
    prod: 'https://tescosecurityoperations.zendesk.com',
  },
  customer: {
    ppe: 'https://ppecustomerengagementcentre.zendesk.com',
    prod: 'https://tescocustomerengagementcentre.zendesk.com',
  },
  supplier: {
    ppe: 'https://ppesuppliersupport.zendesk.com',
    prod: 'https://tescosuppliersupport.zendesk.com',
  },
};

/**
 * Build env variable names and read credentials.
 * Expecting env vars like:
 * ZENDESK_TECHNOLOGY_PPE_EMAIL
 * ZENDESK_TECHNOLOGY_PPE_TOKEN
 */
function getCredentials(businessArea, environment) {
  const areaKey = businessArea ? businessArea.toUpperCase() : '';
  const envKey = environment ? environment.toUpperCase() : '';
  const emailKey = `ZENDESK_${areaKey}_${envKey}_EMAIL`;
  const tokenKey = `ZENDESK_${areaKey}_${envKey}_TOKEN`;
  const email = process.env[emailKey];
  const token = process.env[tokenKey];
  return { email, token, emailKey, tokenKey };
}

function getBaseUrl(businessArea, environment) {
  const area = (businessArea || '').toLowerCase();
  const env = (environment || '').toLowerCase();
  const entry = ZENDESK_BASES[area];
  if (!entry) return null;
  return entry[env] || null;
}

function getAuthHeader(email, token) {
  // Zendesk basic auth with user "/token" suffix
  // username = `${email}/token` and password = token
  const raw = `${email}/token:${token}`;
  const b64 = Buffer.from(raw).toString('base64');
  return { Authorization: `Basic ${b64}`, 'Content-Type': 'application/json' };
}

/**
 * List groups
 */
export async function listGroups(businessArea, environment, { initialPage = 1, maxPages = 100 } = {}) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) {
    throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  }

  const headers = getAuthHeader(creds.email, creds.token);

  // Build the first URL (allows starting from a non-1 page, though typical is 1)
  let nextUrl = `${base.replace(/\/$/, '')}/api/v2/groups.json?page=${encodeURIComponent(initialPage)}`;
  const all = [];
  let pagesFetched = 0;
  let totalCount = undefined;

  while (nextUrl && pagesFetched < maxPages) {
    const res = await axios.get(nextUrl, { headers, timeout: 10_000 });
    const data = res.data || {};

    // Zendesk typically returns { groups: [...], next_page: "...", count: number, previous_page: ... }
    const list = Array.isArray(data.groups) ? data.groups : [];
    all.push(...list);

    // Set count on first page if present
    if (totalCount == null && typeof data.count === 'number') {
      totalCount = data.count;
    }

    nextUrl = data.next_page || null;
    pagesFetched += 1;
  }

  return {
    count: totalCount ?? all.length,
    groups: all,
    pagesFetched,
  };
}


export async function createGroup(businessArea, environment, groupPayload) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  const url = `${base.replace(/\/$/, '')}/api/v2/groups.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const body = { group: groupPayload };
  const res = await axios.post(url, body, { headers, timeout: 10000 });
  return res.data;
}

export async function updateGroup(businessArea, environment, groupId, groupPayload) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  const url = `${base.replace(/\/$/, '')}/api/v2/groups/${encodeURIComponent(groupId)}.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const body = { group: groupPayload };
  const res = await axios.put(url, body, { headers, timeout: 10000 });
  return res.data;
}

/**
 * Ticket fields
 */
export async function listFields(businessArea, environment) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const res = await axios.get(url, { headers, timeout: 10000 });
  return res.data;
}

export async function createField(businessArea, environment, fieldPayload) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const body = { ticket_field: fieldPayload };
  const res = await axios.post(url, body, { headers, timeout: 10000 });
  return res.data;
}

export async function updateField(businessArea, environment, fieldId, fieldPayload) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);
  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields/${encodeURIComponent(fieldId)}.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const body = { ticket_field: fieldPayload };
  const res = await axios.put(url, body, { headers, timeout: 10000 });
  return res.data;
}


// -----------------------------
// Ticket field options helpers
// -----------------------------

export async function listFieldOptions(businessArea, environment, fieldId) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);

  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields/${encodeURIComponent(fieldId)}/options.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const res = await axios.get(url, { headers, timeout: 10000 });
  return res.data; // Zendesk returns a JSON payload with the options list
}

export async function getFieldOption(businessArea, environment, fieldId, optionId) {
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);

  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields/${encodeURIComponent(fieldId)}/options/${encodeURIComponent(optionId)}.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const res = await axios.get(url, { headers, timeout: 10000 });
  return res.data; // { custom_field_option: {...} }
}

export async function upsertFieldOption(businessArea, environment, fieldId, option) {
  // option: { id?, name, value, default?, position? }
  const base = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  if (!creds.email || !creds.token) throw new Error(`Zendesk credentials missing for ${businessArea} ${environment}`);

  const url = `${base.replace(/\/$/, '')}/api/v2/ticket_fields/${encodeURIComponent(fieldId)}/options.json`;
  const headers = getAuthHeader(creds.email, creds.token);
  const body = { custom_field_option: option }; // Zendesk expects this wrapper
  const res = await axios.post(url, body, { headers, timeout: 10000 });
  return res.data; // { custom_field_option: {...} }
}
