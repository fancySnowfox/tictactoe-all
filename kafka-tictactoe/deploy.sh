#!/bin/bash

set -e

echo "================================"
echo "Tic-Tac-Toe Deployment"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
  echo -e "${BLUE}→ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check Node.js version
print_step "Checking Node.js version..."
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed"
  exit 1
fi

NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  print_error "Node.js version 18+ is required. Current version: $(node -v)"
  print_step "To upgrade Node.js:"
  echo "  macOS: brew install node@18"
  echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
  exit 1
fi
print_success "Node.js version $(node -v) is OK"

# 1. Install dependencies
print_step "Installing project dependencies..."
npm install
print_success "Dependencies installed"

# 2. Start backend server
print_step "Starting backend server..."
npm run dev --workspace=backend &
BACKEND_PID=$!
print_success "Backend server started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# 3. Start frontend server
print_step "Starting frontend server..."
npm run dev --workspace=frontend &
FRONTEND_PID=$!
print_success "Frontend server started (PID: $FRONTEND_PID)"

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo -e "${GREEN}✓ Backend API running (http://localhost:3001)${NC}"
echo -e "${GREEN}✓ Frontend running (http://localhost:5173)${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep the script running
wait
