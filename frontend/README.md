
# Tesco Zendesk Admin — React Frontend

A lightweight React (Vite) UI for the Zendesk/Jira admin backend you provided.

> **No external CSS library used.** Styles are minimalist and inspired by Tesco brand colours.

## Prerequisites
- Node.js 18+
- The backend running locally at `http://localhost:4000` (or set `VITE_API_BASE`).

## Setup
```bash
npm install
npm run dev
```

## Configuration
Create a `.env` file in the project root:

```
VITE_API_BASE=http://localhost:4000
```

## Features
- Select **businessArea** (`technology`, `colleague`, `security`, `customer`, `supplier`) and **environment** (`ppe`, `prod`).
- **Jira guard**: for `prod`, the UI requires a Jira ticket to create/update.
- Manage **Groups**: list, create, edit name/description.
- Manage **Fields**: list, create basic types, edit.
- **Jira status** checker page.

## Notes
- The UI passes `businessArea`/`environment` as query params and includes `jiraTicket` for mutating requests, matching the backend contract.
- Axios is not used; the app uses the Fetch API.
