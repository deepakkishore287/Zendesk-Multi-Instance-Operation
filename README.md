# Zendesk Multi-Instance Admin (React-only)

This is a client-only React + TypeScript application that allows internal administrators to manage multiple Zendesk instances (Groups and Ticket Fields) and requires Jira approval for PROD operations.

Prerequisites
- Node 18+ recommended
- Internal network access to Zendesk subdomains and Jira instance
- Environment variables injected by your internal build system (see .env.example)

Install & run (development)
1. Copy `.env.example` to `.env` and fill in values or ensure your internal CI injects `VITE_*` vars.
2. Install dependencies:
   npm install
3. Start dev server:
   npm run dev
4. Open http://localhost:5173 (default Vite port)

Build
- npm run build
- npm run preview (serve production build for testing)

Environment variables
Use VITE_ prefix. See `.env.example`.

How it works (summary)
- Select Instance (Technology/Colleague/Security/Customer/Supplier)
- Select Environment (PPE/PROD)
- Choose an operation (list/create/update/delete groups or ticket fields, or run Bulk JSON)
- If environment == PROD, a Jira ticket input appears and must be validated before performing changes. Validation uses Jira REST API GET /rest/api/2/issue/{ticketId} and checks issue type and status against configured approved lists.
- All API calls are made directly from the client using axios with Basic auth (email/token).
- The UI logs results, including the Jira ticket used for PROD actions.

Important caveats
- Client-to-server CORS: Ensure Zendesk & Jira APIs are reachable from the browser and CORS is configured or your internal network allows it via a gateway.
- Because this is internal-only, secrets are passed as env vars; do not commit real tokens.

# Diff: PPE vs PROD

1) Environment Variables (example differences)
- VITE_TECHNOLOGY_PPE_SUBDOMAIN=technology-ppe
- VITE_TECHNOLOGY_PROD_SUBDOMAIN=technology

- Credentials point to different API tokens / emails per environment:
  - VITE_TECHNOLOGY_PPE_TOKEN vs VITE_TECHNOLOGY_PROD_TOKEN

2) Runtime behavior differences
- Dark mode:
  - environment=PPE -> UI uses light theme
  - environment=PROD -> UI switches to dark theme
  See src/App.tsx useEffect setting document.documentElement attribute data-theme.

- PROD operations:
  - When Environment === "PROD", the JiraApproval component is shown and validated Jira ticket is required.
  - If Jira validation fails or not performed, the UI prevents operations and logs an error.

3) Example of a code-level conditional (App.tsx)
- Before making an operation:
  if (environment === "PROD" && !jiraValidated) {
    // block operation
  }