#!/bin/bash

# ScaleUp Blitz Week Backend Deployment Script
# This script helps deploy the backend to AWS EC2

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install git first.${NC}"
    exit 1
fi

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Pull latest changes
echo -e "${YELLOW}Step 1: Pulling latest changes from repository...${NC}"
git pull origin main
check_status "Git pull"

# Step 2: Install/Update dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm ci --production
check_status "NPM install"

# Step 3: Check environment variables
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}Warning: .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}Please update the .env file with your configuration${NC}"
    exit 1
fi
check_status "Environment check"

# Step 4: Test MongoDB connection
echo -e "${YELLOW}Step 4: Testing MongoDB connection...${NC}"
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blitzweek')
  .then(() => {
    console.log('MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
"
check_status "MongoDB connection"

# Step 5: Restart application with PM2
echo -e "${YELLOW}Step 5: Restarting application with PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop blitzweek-api 2>/dev/null || true
    pm2 start app.js --name "blitzweek-api" --env production
    pm2 save
    check_status "PM2 restart"
else
    echo -e "${YELLOW}PM2 not found. Starting with node...${NC}"
    npm start &
    check_status "Node start"
fi

# Step 6: Health check
echo -e "${YELLOW}Step 6: Performing health check...${NC}"
sleep 3
curl -f http://localhost:5000/health || {
    echo -e "${RED}Health check failed!${NC}"
    exit 1
}
check_status "Health check"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}API is running at http://localhost:5000${NC}"

# Display status
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Application status:${NC}"
    pm2 status
fi
