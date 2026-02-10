import { useState, useEffect, useCallback } from 'react';
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
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
  animation: slideIn 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 100ms both;

  @media (max-width: 600px) {
    gap: 15px;
  }

  > div {
    background: rgba(255, 255, 255, 0.95);
    padding: 14px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(30, 120, 255, 0.1);
    border: 1px solid rgba(30, 120, 255, 0.1);
    transition: all 220ms ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(30, 120, 255, 0.15);
    }

    @media (max-width: 600px) {
      padding: 10px 15px;
      font-size: 0.9rem;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-weight: 500;
  margin-right: 8px;
  font-size: 0.9rem;
`;

const InfoValue = styled.span`
  color: #1e78ff;
  font-weight: 700;
`;

const PlayerMarker = styled(InfoValue)`
  font-size: 1.2rem;
  display: inline-block;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  background: linear-gradient(135deg, #1e78ff 0%, #5b4fb8 100%);
  color: white;
  border-radius: 50%;
`;

const Status = styled.div<{ $variant?: 'waiting' | 'your-turn' | 'opponent-turn' | 'winner' }>`
  padding: 14px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  min-width: 240px;
  text-align: center;
  animation: slideIn 400ms cubic-bezier(0.2, 0.8, 0.2, 1) 200ms both;

  ${(props) => {
    switch (props.$variant) {
      case 'waiting':
        return `
          background: rgba(255, 193, 7, 0.12);
          color: #f57c00;
          border: 1px solid rgba(255, 193, 7, 0.3);
        `;
      case 'your-turn':
        return `
          background: rgba(76, 175, 80, 0.12);
          color: #2e7d32;
          border: 1px solid rgba(76, 175, 80, 0.3);
        `;
      case 'opponent-turn':
        return `
          background: rgba(156, 39, 176, 0.12);
          color: #6a1b9a;
          border: 1px solid rgba(156, 39, 176, 0.3);
        `;
      case 'winner':
        return `
          background: rgba(76, 175, 80, 0.15);
          color: #1b5e20;
          border: 1px solid rgba(76, 175, 80, 0.4);
          font-size: 1.1rem;
        `;
      default:
        return '';
    }
  }}

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const GameBoard = styled.div<{ $dimensions: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$dimensions}, 1fr);
  gap: 10px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(30, 120, 255, 0.12);
  border: 1px solid rgba(30, 120, 255, 0.1);
  margin-bottom: 30px;
  animation: slideIn 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 300ms both;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 600px) {
    padding: 16px;
    gap: 8px;
  }
`;

const GameSquare = styled.button`
  aspect-ratio: 1;
  min-width: 80px;
  min-height: 80px;
  background: #f8fafb;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 2rem;
  font-weight: 700;
  color: #1e78ff;
  transition: all 220ms ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f0f4ff;
    border-color: #1e78ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 120, 255, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(30, 120, 255, 0.1);
  }

  &:disabled {
    background: #fafbfc;
    color: #1e78ff;
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 600px) {
    min-width: 60px;
    min-height: 60px;
    font-size: 1.5rem;
  }
`;

const GameFooter = styled.div`
  text-align: center;
  color: #666;
  margin-top: 20px;
  animation: slideIn 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 400ms both;

  p {
    font-size: 0.9rem;
    opacity: 0.85;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.08);
  color: #c62828;
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid #f44336;
  font-size: 0.9rem;
  animation: slideIn 300ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
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
