#!/bin/bash

# Kafka Tic-Tac-Toe Deployment Script for Apache
# Usage: bash deploy-apache.sh
# This script deploys the application to production using Apache as the web server

set -e  # Exit on error

echo "=========================================="
echo "Kafka Tic-Tac-Toe - Apache Production Deploy"
echo "=========================================="
echo ""

# Configuration
DEPLOY_DIR="/var/www/kafka-tictactoe"
WEB_ROOT="/var/www/html"
APACHE_CONFIG_PATH="/etc/apache2/sites-available/tictactoe.conf"
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
check_command "apache2"

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

# Step 7: Enable Apache modules
log_info "Step 7: Enabling required Apache modules..."
REQUIRED_MODULES=("proxy" "proxy_http" "proxy_wstunnel" "rewrite" "headers")
for module in "${REQUIRED_MODULES[@]}"; do
    log_info "Enabling mod_$module..."
    sudo a2enmod "$module" || log_warn "Could not enable mod_$module"
done

# Step 8: Configure Apache
log_info "Step 8: Configuring Apache..."
if [ -f "$DEPLOY_DIR/apache.conf.example" ]; then
    log_info "Copying Apache configuration..."
    sudo cp "$DEPLOY_DIR/apache.conf.example" "$APACHE_CONFIG_PATH"
    
    # Replace domain in config
    log_info "Updating domain in Apache config to: $DOMAIN"
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" "$APACHE_CONFIG_PATH"
    
    # Test Apache configuration
    log_info "Testing Apache configuration..."
    if sudo apache2ctl configtest; then
        log_info "Apache configuration is valid"
    else
        log_error "Apache configuration test failed!"
        exit 1
    fi
    
    # Enable site
    log_info "Enabling Apache site..."
    sudo a2ensite tictactoe || log_warn "Could not enable site (may already be enabled)"
    
    # Disable default site
    log_info "Disabling default Apache site..."
    sudo a2dissite 000-default 2>/dev/null || log_warn "Could not disable default site"
    
    # Reload Apache
    log_info "Reloading Apache..."
    sudo systemctl reload apache2
else
    log_error "apache.conf.example not found!"
    exit 1
fi

# Step 9: Setup backend service with PM2
log_info "Step 9: Setting up backend service with PM2..."
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

# Step 10: Start Kafka (if docker-compose.yml exists)
log_info "Step 10: Starting Kafka (if Docker is available)..."
if [ -f "$DEPLOY_DIR/docker-compose.yml" ] && command -v docker-compose &> /dev/null; then
    log_info "Starting Docker Compose services..."
    cd "$DEPLOY_DIR"
    docker-compose up -d
    docker-compose ps
else
    log_warn "docker-compose.yml not found or Docker not installed"
fi

# Step 11: Verification
log_info "Step 11: Verifying deployment..."
echo ""
echo "Verification Checks:"
echo "==================="

# Check Apache
if sudo systemctl is-active --quiet apache2; then
    log_info "Apache is running ✓"
else
    log_error "Apache is not running ✗"
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
echo "2. Run SSL setup: sudo certbot --apache -d $DOMAIN"
echo "3. Monitor logs: pm2 logs tictactoe-backend"
echo "4. Monitor stats: pm2 monit"
echo ""
echo "Useful Commands:"
echo "  pm2 restart tictactoe-backend"
echo "  pm2 logs tictactoe-backend"
echo "  sudo systemctl reload apache2"
echo "  sudo systemctl restart apache2"
echo "  docker-compose logs -f kafka"
echo ""
log_info "✓ Deployment complete!"
