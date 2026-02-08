import  { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Game.css';

interface GameRoom {
  id: string;
  players: { clientId: string; name: string }[];
  grid: (number | null)[];
  dimensions: number;
  nextPlayer: number;
  started: boolean;
  winner: number | null;
}

interface GameProps {
  roomId: string;
  clientId: string;
  playerName: string;
}

export function Game({ roomId, clientId }: GameProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll room state
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomId}`);
        setRoom(response.data);
      } catch (err) {
        console.error('Failed to fetch room:', err);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(interval);
  }, [roomId]);

  const handleMove = useCallback(
    async (index: number) => {
      if (!room || room.grid[index] !== null || loading) return;

      setLoading(true);
      try {
        const response = await axios.post(`/api/rooms/${roomId}/move`, {
          clientId,
          index,
        });
        setRoom(response.data.room);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to make move');
      } finally {
        setLoading(false);
      }
    },
    [room, roomId, clientId, loading]
  );

  if (!room) {
    return <div className="game-container">Loading game...</div>;
  }

  const playerNumber = room.players.findIndex((p) => p.clientId === clientId) + 1;
  const playerValue = playerNumber === 1 ? 1 : 2;
  const canMove = room.nextPlayer === playerValue && !room.winner;

  return (
    <div className="game-container">
      <h1 className="game-title">Tic Tac Toe</h1>
      
      <div className="game-info">
        <div>
          <span className="label">Room:</span>
          <span className="value">{roomId}</span>
        </div>
        <div>
          <span className="label">You are:</span>
          <span className="value player-marker">{playerValue === 1 ? 'X' : 'O'}</span>
        </div>
        <div>
          <span className="label">Players:</span>
          <span className="value">{room.players.map((p) => p.name).join(', ')}</span>
        </div>
      </div>

      {room.players.length < 2 && (
        <div className="status waiting">Waiting for second player...</div>
      )}

      {room.winner && (
        <div className="status winner">
          {room.winner === playerValue ? '🎉 You Won!' : '❌ You Lost!'}
        </div>
      )}

      {!room.winner && room.players.length === 2 && (
        <div className={`status ${canMove ? 'your-turn' : 'opponent-turn'}`}>
          {canMove ? "It's your turn" : "Opponent's turn"}
        </div>
      )}

      <div
        className="game-board"
        style={{
          gridTemplateColumns: `repeat(${room.dimensions}, 1fr)`,
        }}
      >
        {room.grid.map((cell, index) => (
          <button
            key={index}
            className="game-square"
            onClick={() => handleMove(index)}
            disabled={cell !== null || !canMove || loading}
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="game-footer">
        <p className="hints">
          {!room.winner
            ? 'Make a move to play!'
            : 'Game over! Close browser or refresh to play again.'}
        </p>
      </div>
    </div>
  );
}
