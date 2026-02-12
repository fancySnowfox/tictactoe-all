#!/bin/bash

# Kafka Tic-Tac-Toe Deployment Script for Nginx
# Usage: bash deploy-nginx.sh
# This script deploys the application to production using Nginx as the web server

set -e  # Exit on error

echo "=========================================="
echo "Kafka Tic-Tac-Toe - Nginx Production Deploy"
echo "=========================================="
echo ""

# Configuration
DEPLOY_DIR="/var/www/kafka-tictactoe"
WEB_ROOT="/var/www/html"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/tictactoe"
DOMAIN="${1:-yourdomain.com}"
BACKUP_DIR="/var/backups/kafka-tictactoe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed"
        exit 1
    fi
}

check_node_version() {
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node -v)"
        log_info "To upgrade Node.js on Ubuntu:"
        log_info "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        log_info "  sudo apt install -y nodejs"
        exit 1
    fi
    log_info "Node.js version check passed: $(node -v)"
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

check_command "git"
check_command "node"
check_node_version
check_command "npm"
check_command "nginx"

if ! command -v pm2 &> /dev/null; then
    log_warn "PM2 not installed. Installing globally..."
    sudo npm install -g pm2
fi

# Get current user
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" != "root" ]; then
    log_warn "This script should be run as root or with sudo for proper permissions"
    log_warn "Some operations may fail without sudo"
fi

# Step 1: Backup current deployment
log_info "Step 1: Creating backup..."
if [ -d "$DEPLOY_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    log_info "Backing up current deployment to $BACKUP_FILE"
    tar -czf "$BACKUP_FILE" "$DEPLOY_DIR" 2>/dev/null || log_warn "Could not backup deployment directory"
else
    log_info "Not a re-deployment (no existing directory)"
fi

# Step 2: Clone/Update repository
log_info "Step 2: Setting up application directory..."
if [ ! -d "$DEPLOY_DIR" ]; then
    log_warn "Deploy directory doesn't exist. Please clone the repository first:"
    echo "  git clone <your-repo-url> $DEPLOY_DIR"
    exit 1
fi

cd "$DEPLOY_DIR"
log_info "Current directory: $(pwd)"

# Step 3: Update code
log_info "Step 3: Pulling latest code..."
git pull origin main || log_warn "Could not pull from git (may be first deployment)"

# Step 4: Install dependencies
log_info "Step 4: Installing dependencies..."
npm install

# Step 5: Build application
log_info "Step 5: Building application for production..."
npm run build:prod

# Step 6: Deploy frontend
log_info "Step 6: Deploying frontend static files..."
sudo mkdir -p "$WEB_ROOT"
sudo cp -r "$DEPLOY_DIR/frontend/dist"/* "$WEB_ROOT/" || log_error "Failed to copy frontend files"
log_info "Frontend deployed to $WEB_ROOT"

# Step 7: Configure Nginx
log_info "Step 7: Configuring Nginx..."
if [ -f "$DEPLOY_DIR/nginx.conf.example" ]; then
    log_info "Copying Nginx configuration..."
    sudo cp "$DEPLOY_DIR/nginx.conf.example" "$NGINX_CONFIG_PATH"
    
    # Replace domain in config
    log_info "Updating domain in Nginx config to: $DOMAIN"
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" "$NGINX_CONFIG_PATH"
    
    # Test Nginx configuration
    log_info "Testing Nginx configuration..."
    if sudo nginx -t; then
        log_info "Nginx configuration is valid"
    else
        log_error "Nginx configuration test failed!"
        exit 1
    fi
    
    # Enable site (if using symlink method)
    if [ ! -L /etc/nginx/sites-enabled/tictactoe ]; then
        log_info "Enabling Nginx site..."
        sudo ln -s "$NGINX_CONFIG_PATH" /etc/nginx/sites-enabled/tictactoe
    fi
    
    # Disable default site
    if [ -L /etc/nginx/sites-enabled/default ]; then
        log_info "Disabling default Nginx site..."
        sudo rm /etc/nginx/sites-enabled/default
    fi
    
    # Reload Nginx
    log_info "Reloading Nginx..."
    sudo systemctl reload nginx
else
    log_error "nginx.conf.example not found!"
    exit 1
fi

# Step 8: Setup backend service with PM2
log_info "Step 8: Setting up backend service with PM2..."
if [ -f "$DEPLOY_DIR/ecosystem.config.example.cjs" ]; then
    log_info "Copying PM2 ecosystem config..."
    cp "$DEPLOY_DIR/ecosystem.config.example.cjs" "$DEPLOY_DIR/ecosystem.config.cjs"
    
    # Update paths in config if needed
    log_info "Starting backend with PM2..."
    pm2 delete tictactoe-backend 2>/dev/null || true
    pm2 start "$DEPLOY_DIR/ecosystem.config.cjs" --env production
    
    log_info "Saving PM2 configuration..."
    pm2 save
    
    log_info "Setting up PM2 startup..."
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp /home/$CURRENT_USER
else
    log_warn "ecosystem.config.example.cjs not found. Skipping PM2 setup."
fi

# Step 9: Start Kafka (if docker-compose.yml exists)
log_info "Step 9: Starting Kafka (if Docker is available)..."
if [ -f "$DEPLOY_DIR/docker-compose.yml" ] && command -v docker-compose &> /dev/null; then
    log_info "Starting Docker Compose services..."
    cd "$DEPLOY_DIR"
    docker-compose up -d
    docker-compose ps
else
    log_warn "docker-compose.yml not found or Docker not installed"
fi

# Step 10: Verification
log_info "Step 10: Verifying deployment..."
echo ""
echo "Verification Checks:"
echo "==================="

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    log_info "Nginx is running ✓"
else
    log_error "Nginx is not running ✗"
fi

# Check PM2
if pm2 list | grep -q "tictactoe-backend"; then
    log_info "Backend is running via PM2 ✓"
else
    log_error "Backend is not running ✗"
fi

# Check frontend files
if [ -f "$WEB_ROOT/index.html" ]; then
    log_info "Frontend files deployed ✓"
else
    log_error "Frontend files not found ✗"
fi

# Test backend
if timeout 5 curl -s http://localhost:3001/health > /dev/null 2>&1; then
    log_info "Backend responding on :3001 ✓"
else
    log_warn "Backend health check failed (may need time to start)"
fi

echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "Domain: $DOMAIN"
echo "Frontend: $WEB_ROOT"
echo "Backend: http://localhost:3001"
echo "Deploy Directory: $DEPLOY_DIR"
echo ""
echo "Next Steps:"
echo "1. Update your domain DNS to point to this server"
echo "2. Run SSL setup: sudo certbot --nginx -d $DOMAIN"
echo "3. Monitor logs: pm2 logs tictactoe-backend"
echo "4. Monitor stats: pm2 monit"
echo ""
echo "Useful Commands:"
echo "  pm2 restart tictactoe-backend"
echo "  pm2 logs tictactoe-backend"
echo "  sudo systemctl reload nginx"
echo "  sudo systemctl restart nginx"
echo "  docker-compose logs -f kafka"
echo ""
log_info "✓ Deployment complete!"
