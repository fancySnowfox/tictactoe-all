# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

This will install all dependencies for both the frontend and backend workspaces.

## Step 2: Start Backend Server

In a terminal:

```bash
npm run dev --workspace=backend
```

You should see: `✓ Server running on http://localhost:3001`

## Step 3: Start Frontend Server

In another terminal:

```bash
npm run dev --workspace=frontend
```

You should see: `Local: http://localhost:5173/`

## Step 4: Open the App

Open your browser and navigate to: **http://localhost:5173**

## Step 5: Play!

1. Enter your name
2. **Create a Room** to host a game
3. Share the room code with another player
4. That player clicks **Join Room** and enters the code
5. Take turns making moves (X goes first)
6. First to three in a row wins!

## Testing with Multiple Browsers

### Option 1: Two Separate Browsers
- Open `http://localhost:5173` in Chrome (Player 1)
- Open `http://localhost:5173` in Firefox (Player 2)

### Option 2: Two Browser Windows
- Open `http://localhost:5173` in one window
- Open `http://localhost:5173` in another window of the same browser

## Troubleshooting

### Backend Won't Start
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Kill the process using port 3001 (if needed)
kill -9 <PID>

# Run on a different port
PORT=3002 npm run dev --workspace=backend
```

### NPM Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### WebSocket Connection Failed
- Check browser console (F12) for error messages
- Verify backend is running on port 3001
- Try refreshing the page or hard-refresh (Ctrl+Shift+R)

### Port Already in Use
- Backend (3001): Use `PORT=3002 npm run dev --workspace=backend`
- Frontend (5173): Vite will automatically try the next available port

## Key Files

- **Backend**: [backend/src/server.ts](backend/src/server.ts) - Express server with Socket.IO
- **Frontend**: [frontend/src/App.tsx](frontend/src/App.tsx) - Home screen and game setup
- **Game Component**: [frontend/src/Game.tsx](frontend/src/Game.tsx) - Game board and move logic

## Next Steps

- Modify board sizes in the game (currently supports 3x3, 4x4, 5x5)
- Implement WebSocket for real-time updates instead of polling
- Add Kafka consumer to process moves asynchronously
- Add persistent game history with a database

## Additional Commands

```bash
# Build production versions
npm run build

# View Kafka logs
docker-compose logs -f kafka

# Stop Kafka (keeping volumes)
docker-compose stop

# Stop Kafka (removing all data)
docker-compose down -v
```
