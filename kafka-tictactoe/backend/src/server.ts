import express from 'express';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Kafka setup
const kafkaConfig: any = {
  clientId: `tictactoe-server-${uuidv4()}`,
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000,
};

// Add SSL/SASL only if credentials are provided
if (process.env.KAFKA_USERNAME) {
  kafkaConfig.ssl = true;
  kafkaConfig.sasl = {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

const kafka = new Kafka(kafkaConfig);

const producer = kafka.producer();
const admin = kafka.admin();

// Topics
const GAME_MOVES_TOPIC = 'tic-tac-toe-moves';
const GAME_STATE_TOPIC = 'tic-tac-toe-state';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://tictactoe.snowfox.club',
    'https://tictactoe.snowfox.club',
  ],
  credentials: true,
}));
app.use(express.json());

// Game store
interface GameRoom {
  id: string;
  players: { clientId: string; name: string }[];
  grid: (number | null)[];
  dimensions: number;
  nextPlayer: number;
  started: boolean;
  winner: number | null;
}

const gameRooms: Map<string, GameRoom> = new Map();

// Check for winner
function checkWinner(grid: (number | null)[], dimensions: number): number | null {
  // Check rows
  for (let row = 0; row < dimensions; row++) {
    for (let col = 0; col < dimensions - 2; col++) {
      const idx = row * dimensions + col;
      if (
        grid[idx] !== null &&
        grid[idx] === grid[idx + 1] &&
        grid[idx] === grid[idx + 2]
      ) {
        return grid[idx];
      }
    }
  }

  // Check columns
  for (let col = 0; col < dimensions; col++) {
    for (let row = 0; row < dimensions - 2; row++) {
      const idx = row * dimensions + col;
      if (
        grid[idx] !== null &&
        grid[idx] === grid[idx + dimensions] &&
        grid[idx] === grid[idx + dimensions * 2]
      ) {
        return grid[idx];
      }
    }
  }

  // Check diagonals (top-left to bottom-right)
  for (let row = 0; row < dimensions - 2; row++) {
    for (let col = 0; col < dimensions - 2; col++) {
      const idx = row * dimensions + col;
      if (
        grid[idx] !== null &&
        grid[idx] === grid[idx + dimensions + 1] &&
        grid[idx] === grid[idx + (dimensions + 1) * 2]
      ) {
        return grid[idx];
      }
    }
  }

  // Check diagonals (top-right to bottom-left)
  for (let row = 0; row < dimensions - 2; row++) {
    for (let col = 2; col < dimensions; col++) {
      const idx = row * dimensions + col;
      if (
        grid[idx] !== null &&
        grid[idx] === grid[idx + dimensions - 1] &&
        grid[idx] === grid[idx + (dimensions - 1) * 2]
      ) {
        return grid[idx];
      }
    }
  }

  return null;
}

// Check if board is full
function isBoardFull(grid: (number | null)[]): boolean {
  return grid.every((cell) => cell !== null);
}

// Initialize Kafka topics
async function initializeTopics() {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    
    if (!topics.includes(GAME_MOVES_TOPIC)) {
      await admin.createTopics({
        topics: [
          { topic: GAME_MOVES_TOPIC, numPartitions: 1, replicationFactor: 1 },
          { topic: GAME_STATE_TOPIC, numPartitions: 1, replicationFactor: 1 },
        ],
      });
      console.log('Topics created successfully');
    }
    
    await admin.disconnect();
  } catch (error) {
    console.error('Error initializing Kafka topics:', error);
  }
}

// API Endpoints

// Create a new game room
app.post('/api/rooms', (req, res) => {
  const { playerName, dimensions = 3 } = req.body;
  const roomId = uuidv4().substring(0, 8).toUpperCase();
  const clientId = uuidv4();

  const room: GameRoom = {
    id: roomId,
    players: [{ clientId, name: playerName || 'Player 1' }],
    grid: new Array(dimensions * dimensions).fill(null),
    dimensions,
    nextPlayer: 1, // Player X
    started: false,
    winner: null,
  };

  gameRooms.set(roomId, room);

  res.json({
    roomId,
    clientId,
    room,
  });
});

// Join a game room
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;
  const room = gameRooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.players.length >= 2) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const clientId = uuidv4();
  room.players.push({ clientId, name: playerName || 'Player 2' });

  res.json({
    clientId,
    room,
  });
});

// Get room status
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = gameRooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json(room);
});

// Make a move (publishes to Kafka)
app.post('/api/rooms/:roomId/move', async (req, res) => {
  const { roomId } = req.params;
  const { clientId, index } = req.body;
  const room = gameRooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const player = room.players.find((p) => p.clientId === clientId);
  if (!player) {
    return res.status(400).json({ error: 'Player not found in room' });
  }

  if (room.grid[index] !== null) {
    return res.status(400).json({ error: 'Square already occupied' });
  }

  // Apply move
  const playerValue = room.nextPlayer;
  room.grid[index] = playerValue;
  
  // Check for winner
  const winner = checkWinner(room.grid, room.dimensions);
  if (winner) {
    room.winner = winner;
  }
  
  // Check if board is full (draw)
  const boardFull = isBoardFull(room.grid);
  
  room.nextPlayer = playerValue === 1 ? 2 : 1;

  // Publish move to Kafka
  try {
    await producer.send({
      topic: GAME_MOVES_TOPIC,
      messages: [
        {
          key: roomId,
          value: JSON.stringify({
            roomId,
            clientId,
            playerName: player.name,
            index,
            playerValue,
            timestamp: Date.now(),
          }),
        },
      ],
    });

    // Publish state update to Kafka
    await producer.send({
      topic: GAME_STATE_TOPIC,
      messages: [
        {
          key: roomId,
          value: JSON.stringify({
            roomId,
            grid: room.grid,
            nextPlayer: room.nextPlayer,
            winner: room.winner,
            boardFull,
            isDraw: boardFull && !room.winner,
            timestamp: Date.now(),
          }),
        },
      ],
    });

    res.json({ success: true, room });
  } catch (error) {
    console.error('Error publishing move to Kafka:', error);
    res.status(500).json({ error: 'Failed to publish move' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await initializeTopics();
    await producer.connect();
    console.log('✓ Kafka producer connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Kafka broker: ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await producer.disconnect();
  process.exit(0);
});

startServer();
