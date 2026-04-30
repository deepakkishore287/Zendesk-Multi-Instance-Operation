// src/api/client.js
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://20.207.206.142:4000'

// Build a querystring from an object (kept same as your original)
function qs(params = {}) {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, String(v))
  })
  return p.toString()
}

// Single HTTP wrapper using axios
async function http(method, path, { query, body } = {}) {
  const url = `${API_BASE}${path}${query ? `?${qs(query)}` : ''}`

  try {
    const res = await axios.request({
      url,
      method,
      data: body ?? undefined,
      headers: { 'Content-Type': 'application/json' },
      // You can set a timeout if you want:
      // timeout: 10000,
      // withCredentials: true, // if you later need cookies
      validateStatus: () => true // we will normalize errors manually
    })

    // Axios already parsed JSON into res.data if Content-Type is application/json
    const { status, data } = res

    if (status >= 200 && status < 300) {
      return data ?? {}
    }

    // Shape an error similar to your fetch version
    const err = new Error((data && data.error) ? data.error : `HTTP ${status}`)
    err.details = data
    err.status = status
    throw err
  } catch (e) {
    // If axios failed before we get a response (network, CORS, timeout, etc.)
    if (!e.response) {
      const err = new Error(e.message || 'Network error')
      err.details = { error: e.message }
      throw err
    }
    // If we got a response but threw in the try section, just rethrow
    throw e
  }
}

export const api = {
  health: () => http('GET', '/health'),
  jiraStatus: (jiraTicket) => http('GET', '/jira', { query: { jiraTicket } }),

  listGroups: (businessArea, environment) =>
    http('GET', '/groups', { query: { businessArea, environment } }),
  createGroup: (businessArea, environment, jiraTicket, group) =>
    http('POST', '/groups', {
      query: { businessArea, environment, jiraTicket },
      body: { group }
    }),
  updateGroup: (businessArea, environment, jiraTicket, id, group) =>
    http('PUT', `/groups/${encodeURIComponent(id)}`, {
      query: { businessArea, environment, jiraTicket },
      body: { group }
    }),

  listFields: (businessArea, environment) =>
    http('GET', '/fields', { query: { businessArea, environment } }),
  createField: (businessArea, environment, jiraTicket, field) =>
    http('POST', '/fields', {
      query: { businessArea, environment, jiraTicket },
      body: { field }
    }),
  updateField: (businessArea, environment, jiraTicket, id, field) =>
    http('PUT', `/fields/${encodeURIComponent(id)}`, {
      query: { businessArea, environment, jiraTicket },
      body: { field }
    }),
    
  // Field Options
  // Add/replace these in the exported api object:
  listFieldOptions: (businessArea, environment, fieldId) => {
    if (!fieldId) throw new Error("fieldId is required to list options")
    return http("GET", `/fields/${encodeURIComponent(fieldId)}/options`, {
      query: { businessArea, environment },
    })
  },

  getFieldOption: (businessArea, environment, fieldId, optionId) => {
    if (!fieldId) throw new Error("fieldId is required to get an option")
    if (!optionId) throw new Error("optionId is required to get an option")
    return http("GET", `/fields/${encodeURIComponent(fieldId)}/options/${encodeURIComponent(optionId)}`, {
      query: { businessArea, environment },
    })
  },

  upsertFieldOption: (businessArea, environment, jiraTicket, fieldId, option) => {
    if (!fieldId) throw new Error("fieldId is required to upsert an option")
    return http("POST", `/fields/${encodeURIComponent(fieldId)}/options`, {
      query: { businessArea, environment, jiraTicket },
      body: { option }, // { id?, name, value, default?, position? }
    })
  },


  // xMatters Groups
  xmListGroups: (businessArea, environment) =>
    http('GET', '/xmatters/groups', { query: { businessArea, environment } }),

  xmCreateGroup: (businessArea, environment, jiraTicket, group) =>
    http('POST', '/xmatters/groups', {
      query: { businessArea, environment, jiraTicket },
      body: { group }          // { name, description? }
    }),

  xmUpdateGroup: (businessArea, environment, jiraTicket, id, group) =>
    http('PUT', `/xmatters/groups/${encodeURIComponent(id)}`, {
      query: { businessArea, environment, jiraTicket },
      body: { group }          // { name, description? }
    }),
}
