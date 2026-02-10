import  { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Title = styled.h1`
  color: #1e78ff;
  font-size: 2.5rem;
  margin-bottom: 30px;
  font-weight: 700;
  letter-spacing: -0.5px;
  animation: slideDown 500ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const GameInfo = styled.div`
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 600px) {
    gap: 15px;
  }

  > div {
    background: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    @media (max-width: 600px) {
      padding: 10px 15px;
      font-size: 0.9rem;
    }
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-weight: 500;
  margin-right: 10px;
`;

const InfoValue = styled.span`
  color: #667eea;
  font-weight: 700;
`;

const PlayerMarker = styled(InfoValue)`
  font-size: 1.5rem;
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
`;

const Status = styled.div<{ $variant?: 'waiting' | 'your-turn' | 'opponent-turn' | 'winner' }>`
  padding: 15px 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 250px;
  text-align: center;

  ${(props) => {
    switch (props.$variant) {
      case 'waiting':
        return `
          background: #fff9e6;
          color: #f57c00;
          border-left: 4px solid #f57c00;
        `;
      case 'your-turn':
        return `
          background: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #4caf50;
        `;
      case 'opponent-turn':
        return `
          background: #f3e5f5;
          color: #6a1b9a;
          border-left: 4px solid #9c27b0;
        `;
      case 'winner':
        return `
          background: #c8e6c9;
          color: #1b5e20;
          border-left: 4px solid #4caf50;
          font-size: 1.3rem;
        `;
      default:
        return '';
    }
  }}
`;

const GameBoard = styled.div<{ $dimensions: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$dimensions}, 1fr);
  gap: 8px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 30px;

  @media (max-width: 600px) {
    padding: 15px;
    gap: 6px;
  }
`;

const GameSquare = styled.button`
  aspect-ratio: 1;
  min-width: 80px;
  min-height: 80px;
  background: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #e8e8e8;
    border-color: #667eea;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    background: white;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    min-width: 60px;
    min-height: 60px;
    font-size: 1.5rem;
  }
`;

const GameFooter = styled.div`
  text-align: center;
  color: white;
  margin-top: 20px;

  p {
    font-size: 0.95rem;
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #f44336;
`;

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
    return <Container>Loading game...</Container>;
  }

  const playerNumber = room.players.findIndex((p) => p.clientId === clientId) + 1;
  const playerValue = playerNumber === 1 ? 1 : 2;
  const canMove = room.nextPlayer === playerValue && !room.winner;

  return (
    <Container>
      <Title>Tic Tac Toe</Title>
      
      <GameInfo>
        <div>
          <InfoLabel>Room:</InfoLabel>
          <InfoValue>{roomId}</InfoValue>
        </div>
        <div>
          <InfoLabel>You are:</InfoLabel>
          <PlayerMarker>{playerValue === 1 ? 'X' : 'O'}</PlayerMarker>
        </div>
        <div>
          <InfoLabel>Players:</InfoLabel>
          <InfoValue>{room.players.map((p) => p.name).join(', ')}</InfoValue>
        </div>
      </GameInfo>

      {room.players.length < 2 && (
        <Status $variant="waiting">Waiting for second player...</Status>
      )}

      {room.winner && (
        <Status $variant="winner">
          {room.winner === playerValue ? '🎉 You Won!' : '❌ You Lost!'}
        </Status>
      )}

      {!room.winner && room.players.length === 2 && (
        <Status $variant={canMove ? 'your-turn' : 'opponent-turn'}>
          {canMove ? "It's your turn" : "Opponent's turn"}
        </Status>
      )}

      <GameBoard $dimensions={room.dimensions}>
        {room.grid.map((cell, index) => (
          <GameSquare
            key={index}
            onClick={() => handleMove(index)}
            disabled={cell !== null || !canMove || loading}
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </GameSquare>
        ))}
      </GameBoard>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <GameFooter>
        <p>
          {!room.winner
            ? 'Make a move to play!'
            : 'Game over! Close browser or refresh to play again.'}
        </p>
      </GameFooter>
    </Container>
  );
}
