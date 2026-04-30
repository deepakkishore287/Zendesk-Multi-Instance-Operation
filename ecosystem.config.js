// ecosystem.config.js
// PM2 config — supports both dev and prod environments
// Usage:
//   pm2 start ecosystem.config.js --only zendesk-prod
//   pm2 start ecosystem.config.js --only zendesk-dev

export default {
  apps: [
    // ── Production (master branch) ───────────────────────────────────────────
    {
      name: "zendesk-prod",
      script: "src/index.js",
      cwd: "/home/azureuser/app/zendesk-prod/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        NODE_EXTRA_CA_CERTS: "./TescoRootCA.pem",
      },
    },

    // ── Dev (dev branch) ─────────────────────────────────────────────────────
    {
      name: "zendesk-dev",
      script: "src/index.js",
      cwd: "/home/azureuser/app/zendesk-dev/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "development",
        PORT: 4001,
        NODE_EXTRA_CA_CERTS: "./TescoRootCA.pem",
      },
    },
  ],
};
