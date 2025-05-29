#!/bin/bash

# Navigate to backend directory
cd server

# Build and start Docker containers
docker-compose down
docker-compose build
docker-compose up -d

# Create backup directory
mkdir -p /var/backups/wirebit

# Setup database backup cron job
(crontab -l 2>/dev/null; echo "0 */6 * * * cp /path/to/wirebit.db /var/backups/wirebit/wirebit-\$(date +\%Y\%m\%d-\%H\%M).db") | crontab - 