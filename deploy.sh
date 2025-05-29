#!/bin/bash

# Update system and install dependencies
apt update && apt upgrade -y
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create directories
mkdir -p /var/www/freedurov.lol
mkdir -p /var/www/freedurov.lol/frontend
mkdir -p /var/www/freedurov.lol/backend

# Create Nginx configuration
cat > /etc/nginx/sites-available/freedurov.lol << 'EOF'
server {
    listen 80;
    server_name freedurov.lol www.freedurov.lol;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/freedurov.lol /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

# Set up SSL
certbot --nginx -d freedurov.lol -d www.freedurov.lol --non-interactive --agree-tos --email admin@freedurov.lol 