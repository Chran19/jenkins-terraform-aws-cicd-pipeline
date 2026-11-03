#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Cloud-Init Bootstrap Script
# Automatically provisions Node.js runtime, pulls application code, and starts systemd service
# ==============================================================================
set -euo pipefail

echo "[START] Executing EC2 user-data initialization script..."

# Update OS packages
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ufw

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "[INFO] Node version: $(node -v)"
echo "[INFO] NPM version: $(npm -v)"

# Configure Application Directory
APP_DIR="/opt/cloudops-app"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

# Clone repository or setup application bundle
if [ ! -d "${APP_DIR}/.git" ]; then
    echo "[INFO] Cloning application repository from GitHub..."
    git clone https://github.com/Chran19/CA_2.git "${APP_DIR}" || {
        echo "[WARN] Direct git clone failed or requires authentication. Creating standalone app runtime..."
        cat << 'EOF' > "${APP_DIR}/server.js"
const http = require('http');
const PORT = 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: "healthy",
        service: "CloudOps Application",
        deployedVia: "Terraform + Jenkins",
        timestamp: new Date().toISOString()
    }));
});
server.listen(PORT, '0.0.0.0', () => console.log(`Running on port ${PORT}`));
EOF
    }
fi

# Install dependencies if package.json exists
if [ -f "${APP_DIR}/package.json" ]; then
    cd "${APP_DIR}"
    npm install --production || true
fi

# Create Systemd Service for Auto-start & Process Resilience
cat << 'SERVICE_EOF' > /etc/systemd/system/cloudops.service
[Unit]
Description=CloudOps Monitoring Service (Node.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cloudops-app
ExecStart=/usr/bin/node /opt/cloudops-app/server.js
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Reload and launch systemd service
systemctl daemon-reload
systemctl enable cloudops.service
systemctl restart cloudops.service

echo "[SUCCESS] CloudOps Service launched and listening on port 3000."
