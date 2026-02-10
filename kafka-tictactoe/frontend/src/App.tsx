import  { useState, useCallback } from 'react';
import axios from 'axios';
import { Game } from './Game';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [playerName, setPlayerName] = useState('');
  const [dimensions, setDimensions] = useState(3);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = useCallback(async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/rooms', {
        playerName,
        dimensions,
      });
      setRoomId(response.data.roomId);
      setClientId(response.data.clientId);
      setScreen('game');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }, [playerName, dimensions]);

  const handleJoinRoom = useCallback(async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/rooms/${joinCode.toUpperCase()}/join`, {
        playerName,
      });
      setRoomId(joinCode.toUpperCase());
      setClientId(response.data.clientId);
      setScreen('game');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }, [playerName, joinCode]);

  if (screen === 'game' && roomId && clientId) {
    return <Game roomId={roomId} clientId={clientId} playerName={playerName} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚡ Tic Tac Toe</h1>
        <p>Real-time multiplayer game with instant move synchronization</p>
      </header>

      <div className="app-content">
        <div className="setup-card">
          <h2>Welcome to the Game</h2>

          <div className="form-group">
            <label htmlFor="playerName">Your Name:</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
          </div>

          <div className="form-section">
            <h3>Create a New Game</h3>
            <div className="form-group">
              <label htmlFor="dimensions">Board Size:</label>
              <select
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(parseInt(e.target.value))}
              >
                <option value={3}>3x3</option>
                <option value={4}>4x4</option>
                <option value={5}>5x5</option>
              </select>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="form-section">
            <h3>Join Existing Game</h3>
            <div className="form-group">
              <label htmlFor="joinCode">Room Code:</label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="info-card">
          <h3>How it Works</h3>
          <ul>
            <li>🎮 Create or join a game room</li>
            <li>📡 Moves sync in real-time via WebSocket</li>
            <li>⚡ See opponent's moves instantly</li>
            <li>👑 First to three in a row wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
