// ecosystem.config.js
// PM2 process manager config — runs both backend and frontend (served as static)
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: "zendesk-app",         // matches PM2_APP_NAME in workflow
      script: "backend/server.js", // adjust to your backend entry point
      cwd: "/home/azureuser/app/Zendesk-Multi-Instance-Operation",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,                // must match NSG Allow-App-VNet rule (port 3000)
      },
    },
  ],
};
