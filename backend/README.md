# Zendesk Admin Backend

This backend provides REST endpoints that proxy and manage Zendesk Groups and Ticket Fields, and validates Jira tickets for PROD operations.

Quick start:
1. Copy `.env.example` -> `.env` and fill secrets.
2. Install: npm install
3. Start: npm start
4. API root: http://localhost:4000

Endpoints:
/groups
  - GET  /groups?businessArea={}&environment={}
  - POST /groups  { businessArea, environment, (jiraTicket if PROD), group: { name, description } }
  - PUT  /groups/:id { businessArea, environment, (jiraTicket if PROD), group: { name, description } }

/fields
  - GET  /fields?businessArea={}&environment={}
  - POST /fields { businessArea, environment, (jiraTicket if PROD), field: { title, type, description, required } }
  - PUT  /fields/:id { businessArea, environment, (jiraTicket if PROD), field: { title, type, description, required } }

Security:
- All Zendesk & Jira calls are made from the backend.
- Supply credentials through environment variables (see .env.example).