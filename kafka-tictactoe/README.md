# Tic-Tac-Toe - Real-Time Multiplayer Game

A real-time multiplayer tic-tac-toe game using Socket.IO for instant updates and React for the frontend.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Communication**: REST API + WebSockets
- **Real-Time Updates**: Instant move synchronization via Socket.IO

## Quick Start

### Prerequisites

- **Node.js 18+** ⚠️ (Ubuntu default: Node.js 12 - see upgrade instructions below)
- npm or yarn

#### Check Your Node.js Version

```bash
node -v
```

If you have Node.js 12 or older, upgrade to Node.js 18+:

**macOS (using Homebrew):**
```bash
brew install node@18
brew unlink node
brew link node@18
```

**Ubuntu/Debian (⚠️ fixes the Node.js 12 issue on Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

Verify after upgrade:
```bash
node -v  # Should show v18.x.x or higher
```

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for both frontend and backend workspaces.

### 2. Start Backend

```bash
npm run dev --workspace=backend
```

The backend server will start on `http://localhost:3001`.

### 3. Start Frontend (in another terminal)

```bash
npm run dev --workspace=frontend
```

The frontend will be available at `http://localhost:5173`.

## How to Play

1. Open the app in your browser
2. Enter your name
3. **Create Room**: Choose board size and start waiting for opponent
   - Copy the room code and share with another player
4. **Join Room**: Enter the room code from another player
5. Player who creates room is **X**, joining player is **O**
6. Take turns placing marks, first to three in a row wins!

## API Endpoints

### Create Room
```bash
POST /api/rooms
Body: { playerName: string, dimensions?: number }
Response: { roomId, clientId, room }
```

### Join Room
```bash
POST /api/rooms/:roomId/join
Body: { playerName: string }
Response: { clientId, room }
```

### Get Room Status
```bash
GET /api/rooms/:roomId
Response: room object
```

### Make a Move
```bash
POST /api/rooms/:roomId/move
Body: { clientId: string, index: number }
Response: { success: boolean, room }
```

## WebSocket Events

**Client → Server**: Real-time game communication
- `room:join` - Join a game room via WebSocket
- `game:move` - Send a move to all players in room

**Server → Client**: Game updates broadcast to all players
- `room:state` - Complete room state (players, grid, winner)
- `game:state-updated` - Updated board state after each move
- `room:player-disconnected` - Notification when a player leaves
- `error` - Error messages from server

## Project Structure

```
kafka-tictactoe/
├── docker-compose.yml
├── package.json
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── server.ts
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── App.css
        ├── Game.tsx
        ├── Game.css
        └── index.css
```

## Development

### Build Frontend
```bash
npm run build --workspace=frontend
```

### Build Backend
```bash
npm run build --workspace=backend
```

### Stop Backend
```bash
# Press Ctrl+C in the terminal running the backend
```

## Features

- ✅ Real-time move synchronization via WebSockets
- ✅ Support for 3x3, 4x4, and 5x5 board sizes
- ✅ Responsive UI for mobile and desktop
- ✅ Automatic room creation and joining
- ✅ Instant player communication with Socket.IO
- ✅ Draw detection (board full with no winner)
- ✅ Lightweight (~50MB RAM) - runs on affordable cloud servers

## Future Enhancements

- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] User accounts and game history
- [ ] AI opponent
- [ ] Tournament mode with multiple rounds
- [ ] Spectator mode
- [ ] Chat during gameplay

## Troubleshooting

### Backend Connection Failed
- Ensure backend is running: `npm run dev --workspace=backend`
- Check if port 3001 is available: `lsof -i :3001`
- Verify no firewall blocking localhost connections

### WebSocket Connection Issues
- Check browser console for Socket.IO errors
- Verify CORS origins in [backend/src/server.ts](backend/src/server.ts)
- Try hard-refreshing the page (Ctrl+Shift+R)

### Moves Not Syncing
- Check backend logs for any error messages
- Verify both players are in the same room
- Try refreshing the page to reconnect WebSocket

### Frontend Not Running
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Vite config proxy settings
- Ensure port 5173 is available

## License

MIT
