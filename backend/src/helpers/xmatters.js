// backend/src/helpers/xmatters.js
import axios from 'axios';

/**
 * xMatters instance mapping (base urls)
 * Fill these with your actual xMatters hosts per business area + environment,
 * or replace this object with lookups from environment variables if you prefer.
 */
const XMATTERS_BASES = {
  technology: {
    ppe: 'https://tesco-plc-np.eu1.xmatters.com',
    prod: 'https://tesco-plc.eu1.xmatters.com',
  },
};

function getCredentials(businessArea, environment) {
  const areaKey = "technology".toUpperCase();
  const envKey = environment ? environment.toUpperCase() : '';
  const userKey   = `XMATTERS_${areaKey}_${envKey}_USERNAME`;
  const passKey   = `XMATTERS_${areaKey}_${envKey}_PASSWORD`;

  return {
    email: process.env[userKey],
    token: process.env[passKey]
  };
}

function getBaseUrl(businessArea, environment) {
  const area = "technology".toLowerCase();
  const env  = (environment || '').toLowerCase();
  const entry = XMATTERS_BASES[area];
  if (!entry) return null;
  return entry[env] || null;
}

function getAuthHeader(creds) {
  if (creds.email && creds.token) {
    const raw = `${creds.email}:${creds.token}`;
    const b64 = Buffer.from(raw).toString('base64');
    return { Authorization: `Basic ${b64}`, 'Content-Type': 'application/json' };
  }
  return null;
}

/**
 * List xMatters groups
 * xMatters REST (v1) groups endpoint commonly at /api/xm/1/groups
 * Add query params if you need paging in xMatters; here we fetch default.
 * Fetch ALL xMatters groups (handles offset/limit pagination)
 */
export async function xmListGroups(businessArea, environment) {
  const base  = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  const headers = getAuthHeader(creds);
  if (!headers) {
    throw new Error(`xMatters credentials missing for ${businessArea} ${environment}`);
  }

  // Start with default offset/limit — xMatters defaults to limit=100
  let nextUrl = `${base.replace(/\/$/, '')}/api/xm/1/groups?offset=0&limit=100`;

  const all = [];
  let total = 0;
  let pagesFetched = 0;

  while (nextUrl && pagesFetched < 200) {
    const res = await axios.get(nextUrl, { headers, timeout: 10000 });

    const data = res.data || {};
    const chunk = Array.isArray(data.data) ? data.data : [];

    all.push(...chunk);

    // total count is returned only on first page
    if (pagesFetched === 0 && typeof data.total === 'number') {
      total = data.total;
    }

    // Move to next page if available
    nextUrl = data.links?.next
      ? `${base.replace(/\/$/, '')}${data.links.next}`
      : null;

    pagesFetched++;
  }

  return {
    total: total || all.length,
    count: all.length,
    groups: all,
    pagesFetched
  };
}

/**
 * Create xMatters group
 * Minimal payload: { name, description? }
 */
export async function xmCreateGroup(businessArea, environment, groupPayload) {
  const base  = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  const headers = getAuthHeader(creds);
  if (!headers) {
    throw new Error(`xMatters credentials missing for ${businessArea} ${environment}`);
  }

  const url  = `${base.replace(/\/$/, '')}/api/xm/1/groups`;
  const body = {
    name: groupPayload.name,
    description: groupPayload.description || ''
  };
  const res = await axios.post(url, body, { headers, timeout: 10000 });
  // Return created group structure pass-through
  return res.data;
}

/**
 * Update xMatters group
 * PUT /api/xm/1/groups/{groupId}
 */
export async function xmUpdateGroup(businessArea, environment, groupId, groupPayload) {
  const base  = getBaseUrl(businessArea, environment);
  const creds = getCredentials(businessArea, environment);
  if (!base) throw new Error('Unknown business area / environment');
  const headers = getAuthHeader(creds);
  if (!headers) {
    throw new Error(`xMatters credentials missing for ${businessArea} ${environment}`);
  }

  const url  = `${base.replace(/\/$/, '')}/api/xm/1/groups/${encodeURIComponent(groupId)}`;
  const body = {
    name: groupPayload.name,
    description: groupPayload.description || ''
  };
  const res = await axios.put(url, body, { headers, timeout: 10000 });
  return res.data;
}