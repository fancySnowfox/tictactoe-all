#!/bin/bash

# Kafka Tic-Tac-Toe - Ubuntu Deployment Script
# Compatible with: Ubuntu 20.04 LTS, 22.04 LTS, 24.04 LTS
# This script sets up the app as a systemd service on Ubuntu

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
  echo -e "${BLUE}→ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
  print_error "This script must run as root (use: sudo bash deploy-linux.sh)"
  exit 1
fi

echo "================================"
echo "Kafka Tic-Tac-Toe - Ubuntu Setup"
echo "================================"
echo

# Detect Ubuntu version
. /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
  print_error "This script is designed for Ubuntu. Detected: $PRETTY_NAME"
  exit 1
fi

if [[ ! "$VERSION_ID" =~ ^(20.04|22.04|24.04) ]]; then
  print_warn "This script was tested on Ubuntu 20.04, 22.04, 24.04. You have: $PRETTY_NAME"
fi

print_success "Detected: $PRETTY_NAME"
echo

# Determine app directory
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_USER="appuser"

print_step "Step 1/7: Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
print_success "System updated"
echo

print_step "Step 2/7: Installing required packages..."
apt-get install -y -qq curl wget git build-essential python3
print_success "Required packages installed"
echo

print_step "Step 3/7: Installing Node.js (if not present)..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_success "Node.js already installed: $NODE_VERSION"
else
  print_warn "Node.js not found. Installing..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - 2>/dev/null
  apt-get install -y nodejs
  print_success "Node.js installed: $(node -v)"
fi
echo

print_step "Step 4/7: Creating app user..."
if id "$NODE_USER" &>/dev/null; then
  print_success "User '$NODE_USER' already exists"
else
  useradd -r -m -s /bin/bash "$NODE_USER"
  print_success "User '$NODE_USER' created"
fi
echo

print_step "Step 5/7: Installing project dependencies..."
cd "$APP_DIR"
npm install --production --legacy-peer-deps 2>/dev/null
npm run build --workspace=frontend 2>/dev/null || true
print_success "Dependencies installed"
echo

print_step "Step 6/7: Setting permissions and creating directories..."
chown -R "$NODE_USER:$NODE_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"
mkdir -p "$APP_DIR/logs"
chown -R "$NODE_USER:$NODE_USER" "$APP_DIR/logs"
chmod 755 "$APP_DIR/logs"
print_success "Permissions configured"
echo

print_step "Step 7/7: Creating systemd service..."
cat > /etc/systemd/system/tictactoe.service << 'EOF'
[Unit]
Description=Kafka Tic-Tac-Toe Game Service
After=network-online.target docker.service
Wants=docker.service

[Service]
Type=simple
User=appuser
WorkingDirectory=APP_DIR_PLACEHOLDER
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="KAFKA_BROKER=localhost:9092"
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=append:APP_DIR_PLACEHOLDER/logs/tictactoe.log
StandardError=append:APP_DIR_PLACEHOLDER/logs/tictactoe-error.log
SyslogIdentifier=tictactoe

[Install]
WantedBy=multi-user.target
EOF

# Replace placeholders
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/systemd/system/tictactoe.service

chmod 644 /etc/systemd/system/tictactoe.service
systemctl daemon-reload
print_success "Systemd service created"
echo

print_step "Enabling service on startup..."
systemctl enable tictactoe.service
print_success "Service enabled for startup"
echo

print_step "Starting service..."
systemctl start tictactoe.service
sleep 3

# Check service status
if systemctl is-active --quiet tictactoe.service; then
  print_success "Service started successfully"
  echo
  systemctl status tictactoe.service --no-pager
else
  print_error "Service failed to start. Checking logs..."
  journalctl -u tictactoe -n 20 --no-pager
  exit 1
fi
echo

echo "================================"
echo "✓ Ubuntu Setup Complete!"
echo "================================"
echo
echo "Service Information:"
echo "  - Name: tictactoe"
echo "  - User: $NODE_USER"
echo "  - Directory: $APP_DIR"
echo "  - Service file: /etc/systemd/system/tictactoe.service"
echo "  - Logs: $APP_DIR/logs/"
echo
echo "API Access:"
echo "  - Health check: curl http://localhost:3001/health"
echo "  - Backend: http://localhost:3001"
echo "  - Frontend: http://localhost:5173 (dev)"
echo
echo "Management Commands:"
echo "  sudo systemctl status tictactoe          - Check status"
echo "  sudo systemctl restart tictactoe         - Restart service"
echo "  sudo systemctl stop tictactoe            - Stop service"
echo "  sudo systemctl start tictactoe           - Start service"
echo "  sudo journalctl -u tictactoe -f -n 50   - View live logs"
echo "  sudo tail -f $APP_DIR/logs/tictactoe.log"
echo
echo "Service Features:"
echo "  ✓ Auto-starts on system reboot"
echo "  ✓ Auto-restarts on crash (10 sec delay)"
echo "  ✓ Runs as non-root user (appuser)"
echo "  ✓ Logs to file: $APP_DIR/logs/"
echo "  ✓ Integrated with systemd journal"
echo
echo "Next Steps:"
echo "  1. Verify Kafka is running: docker-compose ps"
echo "  2. Test health endpoint: curl http://localhost:3001/health"
echo "  3. Check logs: sudo journalctl -u tictactoe -f"
echo "  4. Configure Cloudflare DNS to point to this server"
echo "  5. Set API URL environment variable if using remote domain"
echo

