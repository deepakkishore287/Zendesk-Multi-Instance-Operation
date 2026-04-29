import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  listGroups,
  createGroup,
  updateGroup,
  listFields,
  createField,
  updateField,
  listFieldOptions,
  getFieldOption,
  upsertFieldOption
} from './helpers/zendesk.js';

import {
  xmListGroups,
  xmCreateGroup,
  xmUpdateGroup
} from './helpers/xmatters.js';

import { validateJiraTicket } from './helpers/jira.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4000;

/**
 * Basic input validation helper
 */
function requireParams(req, res, params = []) {
  for (const p of params) {
    if (!req.body?.[p] && !req.query?.[p]) {
      return res.status(400).json({ error: `Missing parameter: ${p}` });
    }
  }
  return null;
}

/**
 * Extract businessArea & environment from either query string or body
 */
function getContext(req) {
  const businessArea = (req.query.businessArea || req.body.businessArea || '').toString().trim().toLowerCase();
  const environment = (req.query.environment || req.body.environment || '').toString().trim().toLowerCase();
  return { businessArea, environment };
}

/**
 * Middleware to enforce presence of businessArea & environment
 */
function requireContext(req, res, next) {
  const { businessArea, environment } = getContext(req);
  if (!businessArea) return res.status(400).json({ error: 'businessArea is required' });
  if (!environment) return res.status(400).json({ error: 'environment is required' });
  req.context = { businessArea, environment };
  next();
}

/**
 * PROD Jira validation helper
 */
async function ensureJiraIfProd(req, res) {
  const { environment } = req.context;
  if (environment === 'prod') {
    const jiraTicket = req.body.jiraTicket || req.query.jiraTicket;
    if (!jiraTicket) {
      res.status(400).json({ error: 'jiraTicket is required for PROD operations' });
      return false;
    }
    const result = await validateJiraTicket(jiraTicket);
    if (!result.ok) {
      res.status(403).json({ error: 'Jira validation failed', details: result.error, statusName: result.statusName });
      return false;
    }
    // attach jira info for logs
    req.jira = { key: jiraTicket, statusName: result.statusName };
  }
  return true;
}

// Express app setup
app.disable('etag'); // or: app.set('etag', false)

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');    // do not store at all
  res.set('Pragma', 'no-cache');           // for older proxies
  res.set('Expires', '0');                 // expire immediately
  next();
});

/**
 * Jira
 */
// GET /jira status
app.get('/jira', async (req, res) => {
  try {
    const jiraTicket = req.body.jiraTicket || req.query.jiraTicket;
    if (!jiraTicket) {
      res.status(400).json({ error: 'jiraTicket is required' });
      return false;
    }
    const result = await validateJiraTicket(jiraTicket);
    if (!result.ok) {
      res.json({ error: 'Jira validation failed', details: result.error, statusName: result.statusName });
      return false;
    }
    res.json({ key: jiraTicket, statusName: result.statusName });
  } catch (err) {
    console.error('GET /jira error', err.message);
    res.status(500).json({ error: err.message || 'Failed' });
  }
});


/**
 * Groups
 */
// GET /groups
app.get('/groups', requireContext, async (req, res) => {
  try {
    const { businessArea, environment } = req.context;
    const data = await listGroups(businessArea, environment);
    res.json(data);
  } catch (err) {
    console.error('GET /groups error', err.message);
    res.status(500).json({ error: err.message || 'Failed to list groups' });
  }
});

// POST /groups
app.post('/groups', requireContext, async (req, res) => {
  try {
    if (!(await ensureJiraIfProd(req, res))) return;
    const { businessArea, environment } = req.context;
    const group = req.body.group;
    if (!group || !group.name) return res.status(400).json({ error: 'group.name is required' });
    const data = await createGroup(businessArea, environment, { name: group.name, description: group.description || '' });
    res.status(201).json(data);
  } catch (err) {
    console.error('POST /groups error', err.message);
    res.status(500).json({ error: err.message || 'Failed to create group' });
  }
});

// PUT /groups/:id
app.put('/groups/:id', requireContext, async (req, res) => {
  try {
    if (!(await ensureJiraIfProd(req, res))) return;
    const { businessArea, environment } = req.context;
    const id = req.params.id;
    const group = req.body.group;
    if (!group || !group.name) return res.status(400).json({ error: 'group.name is required' });
    const data = await updateGroup(businessArea, environment, id, { name: group.name, description: group.description || '' });
    res.json(data);
  } catch (err) {
    console.error('PUT /groups/:id error', err.message);
    res.status(500).json({ error: err.message || 'Failed to update group' });
  }
});

/**
 * Fields
 */
// GET /fields
app.get('/fields', requireContext, async (req, res) => {
  try {
    const { businessArea, environment } = req.context;
    const data = await listFields(businessArea, environment);
    res.json(data);
  } catch (err) {
    console.error('GET /fields error', err.message);
    res.status(500).json({ error: err.message || 'Failed to list fields' });
  }
});

// POST /fields
app.post('/fields', requireContext, async (req, res) => {
  try {
    if (!(await ensureJiraIfProd(req, res))) return;
    const { businessArea, environment } = req.context;
    const field = req.body.field;
    if (!field || !field.title || !field.type) return res.status(400).json({ error: 'field.title and field.type are required' });

    // Map simplified types to Zendesk ticket_field payload minimally. This is a minimal mapping; extend as needed.
    const payload = {
      title: field.title,
      type: field.type,
      description: field.description || '',
      required: !!field.required,
    };

    const data = await createField(businessArea, environment, payload);
    res.status(201).json(data);
  } catch (err) {
    console.error('POST /fields error', err.message);
    res.status(500).json({ error: err.message || 'Failed to create field' });
  }
});

// PUT /fields/:id
app.put('/fields/:id', requireContext, async (req, res) => {
  try {
    if (!(await ensureJiraIfProd(req, res))) return;
    const { businessArea, environment } = req.context;
    const id = req.params.id;
    const field = req.body.field;
    if (!field || !field.title || !field.type) return res.status(400).json({ error: 'field.title and field.type are required' });

    const payload = {
      title: field.title,
      type: field.type,
      description: field.description || '',
      required: !!field.required,
    };
    console.log(id, payload);
    const data = await updateField(businessArea, environment, id, payload);
    res.json(data);
  } catch (err) {
    console.error('PUT /fields/:id error', err.message);
    res.status(500).json({ error: err.message || 'Failed to update field' });
  }
});

// -----------------------------
// Field Options
// -----------------------------

// GET /fields/:id/options -> list options for a field
app.get('/fields/:id/options', requireContext, async (req, res) => {
  try {
    const { businessArea, environment } = req.context;
    const fieldId = req.params.id;
    const data = await listFieldOptions(businessArea, environment, fieldId);
    res.json(data); // pass-through Zendesk response
  } catch (err) {
    console.error('GET /fields/:id/options error', err.message);
    res.status(500).json({ error: err.message || 'Failed to list field options' });
  }
});

// GET /fields/:id/options/:optionId -> show one option
app.get('/fields/:id/options/:optionId', requireContext, async (req, res) => {
  try {
    const { businessArea, environment } = req.context;
    const { id: fieldId, optionId } = req.params;
    const data = await getFieldOption(businessArea, environment, fieldId, optionId);
    res.json(data);
  } catch (err) {
    console.error('GET /fields/:id/options/:optionId error', err.message);
    res.status(500).json({ error: err.message || 'Failed to get field option' });
  }
});

// POST /fields/:id/options -> upsert (create / update) a single option
app.post('/fields/:id/options', requireContext, async (req, res) => {
  try {
    if (!(await ensureJiraIfProd(req, res))) return;
    const { businessArea, environment } = req.context;
    const fieldId = req.params.id;
    const option = req.body.option;

    if (!option) return res.status(400).json({ error: 'option is required' });

    const isUpdate = !!option.id;
    if (!isUpdate && (!option.name || !option.value)) {
      return res.status(400).json({ error: 'option.name and option.value are required for create' });
    }

    const data = await upsertFieldOption(businessArea, environment, fieldId, option);
    // Zendesk returns 200 (updated) or 201 (created). Since we don't proxy status, return 200 by default.
    res.json(data);
  } catch (err) {
    console.error('POST /fields/:id/options error', err.message);
    res.status(500).json({ error: err.message || 'Failed to upsert field option' });
  }
});

/**
 * xMatters Groups
 */

// GET /xmatters/groups
app.get('/xmatters/groups', requireContext, async (req, res) => {
  try {
    const { businessArea, environment } = req.context;
    const data = await xmListGroups(businessArea, environment);
    res.json(data); // { groups: [...] }
  } catch (err) {
    console.error('GET /xmatters/groups error', err.message);
    res.status(500).json({ error: err.message || 'Failed to list xMatters groups' });
  }
});

// POST /xmatters/groups
app.post('/xmatters/groups', requireContext, async (req, res) => {
  try {
    // Jira validation only in PROD (same as your existing pattern)
    if (!(await ensureJiraIfProd(req, res))) return;

    const { businessArea, environment } = req.context;
    const group = req.body.group;
    if (!group || !group.name) {
      return res.status(400).json({ error: 'group.name is required' });
    }
    const data = await xmCreateGroup(businessArea, environment, {
      name: group.name,
      description: group.description || ''
    });
    res.status(201).json(data);
  } catch (err) {
    console.error('POST /xmatters/groups error', err.message);
    res.status(500).json({ error: err.message || 'Failed to create xMatters group' });
  }
});

// PUT /xmatters/groups/:id
app.put('/xmatters/groups/:id', requireContext, async (req, res) => {
  try {
    // Jira validation only in PROD
    if (!(await ensureJiraIfProd(req, res))) return;

    const { businessArea, environment } = req.context;
    const id = req.params.id;
    const group = req.body.group;
    if (!group || !group.name) {
      return res.status(400).json({ error: 'group.name is required' });
    }
    const data = await xmUpdateGroup(businessArea, environment, id, {
      name: group.name,
      description: group.description || ''
    });
    res.json(data);
  } catch (err) {
    console.error('PUT /xmatters/groups/:id error', err.message);
    res.status(500).json({ error: err.message || 'Failed to update xMatters group' });
  }
});

/**
 * Health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Zendesk admin backend listening on port ${PORT}`);
});