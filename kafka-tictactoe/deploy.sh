#!/bin/bash

set -e

echo "================================"
echo "Kafka Tic-Tac-Toe Deployment"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
  echo -e "${BLUE}→ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 1. Stop existing containers (if any)
print_step "Stopping existing Docker containers..."
docker-compose down -v 2>/dev/null || true
print_success "Containers stopped"

# 2. Start Kafka with KRaft
print_step "Starting Kafka with KRaft (no Zookeeper)..."
docker-compose up -d
print_success "Kafka started"

# Wait for Kafka to be ready
print_step "Waiting for Kafka to be ready..."
sleep 5
print_success "Kafka is ready"

# 3. Install dependencies
print_step "Installing project dependencies..."
npm install
print_success "Dependencies installed"

# 4. Start backend server
print_step "Starting backend server..."
npm run dev --workspace=backend &
BACKEND_PID=$!
print_success "Backend server started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# 5. Start frontend server
print_step "Starting frontend server..."
npm run dev --workspace=frontend &
FRONTEND_PID=$!
print_success "Frontend server started (PID: $FRONTEND_PID)"

# Summary
echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo -e "${GREEN}✓ Kafka broker running (localhost:9092)${NC}"
echo -e "${GREEN}✓ Backend API running (http://localhost:3001)${NC}"
echo -e "${GREEN}✓ Frontend running (http://localhost:5173)${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep the script running
wait
