#!/bin/bash

# Navigate to frontend directory
cd web

# Install dependencies
npm install

# Build the application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'freedurov-frontend',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
EOF

# Start the application with PM2
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup script
pm2 startup 