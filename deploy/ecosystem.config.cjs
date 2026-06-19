/** PM2 ecosystem — ai-backend, ai-frontend, ai-ngrok (survives reboot with pm2 save + pm2 startup). */
const path = require("path");

const root = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "ai-backend",
      cwd: path.join(root, "backend"),
      script: path.join(root, "deploy/start-backend.sh"),
      interpreter: "bash",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
    },
    {
      name: "ai-frontend",
      cwd: path.join(root, "frontend"),
      script: "npm",
      args: "start",
      env: {
        PORT: "20380",
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
    },
    {
      name: "ai-ngrok",
      cwd: root,
      script: path.join(root, "deploy/start-ngrok.sh"),
      interpreter: "bash",
      autorestart: true,
      max_restarts: 30,
      restart_delay: 10000,
    },
  ],
};
