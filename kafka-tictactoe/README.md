# Kafka Tic-Tac-Toe

A real-time multiplayer tic-tac-toe game using Apache Kafka for event streaming and React for the frontend.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + KafkaJS
- **Message Broker**: Apache Kafka (Docker)
- **Communication**: REST API + Kafka topics

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### 1. Start Kafka

```bash
docker-compose up -d
```

Wait for Kafka to be ready (check logs with `docker-compose logs kafka`).

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for both frontend and backend workspaces.

### 3. Start Backend

```bash
npm run dev --workspace=backend
```

The backend server will start on `http://localhost:3001`.

### 4. Start Frontend (in another terminal)

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

## Kafka Topics

- **tic-tac-toe-moves**: All player moves (key: roomId)
- **tic-tac-toe-state**: Game state updates (key: roomId)

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

### Stop Kafka
```bash
docker-compose down -v
```

## Features

- ✅ Real-time move synchronization via Kafka
- ✅ Support for 3x3, 4x4, and 5x5 board sizes
- ✅ Responsive UI for mobile and desktop
- ✅ Automatic room creation and joining
- ✅ Room polling for opponent detection
- ✅ Game state persistence during session

## Future Enhancements

- [ ] Consumer group for scalable move processing
- [ ] WebSocket for real-time updates instead of polling
- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] User accounts and game history
- [ ] AI opponent
- [ ] Tournament mode with multiple rounds

## Troubleshooting

### Kafka Connection Failed
- Ensure Docker containers are running: `docker-compose ps`
- Check Kafka logs: `docker-compose logs kafka`
- Verify broker is accessible at `localhost:9092`

### Moves Not Syncing
- Check backend logs for Kafka producer errors
- Verify both players are in the same room
- Try refreshing the page to re-poll room state

### Frontend Not Running
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Vite config proxy settings

## License

MIT
