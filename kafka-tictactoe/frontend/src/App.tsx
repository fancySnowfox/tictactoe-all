import { useState, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Game } from './Game';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 40px 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 50px;
  animation: slideDown 500ms cubic-bezier(0.2, 0.8, 0.2, 1);

  h1 {
    font-size: 2.8rem;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #1e78ff 0%, #5b4fb8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 1rem;
    color: #666;
    opacity: 0.85;
    font-weight: 400;
  }

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

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 920px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(30, 120, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(30, 120, 255, 0.1);
  animation: slideIn 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;

  &:nth-child(2) {
    animation-delay: 100ms;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SetupCard = styled(Card)`
  h2 {
    color: #1e78ff;
    margin-bottom: 28px;
    font-size: 1.5rem;
    font-weight: 600;
  }

  h3 {
    color: #2a2a2a;
    margin-bottom: 18px;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
  }
`;

const InfoCard = styled(Card)`
  h3 {
    color: #2a2a2a;
    margin-bottom: 20px;
    font-size: 1.1rem;
    font-weight: 600;
  }

  ul {
    list-style: none;

    li {
      padding: 10px 0;
      color: #555;
      font-size: 0.95rem;
      line-height: 1.7;
      opacity: 0.85;

      &:before {
        content: '▸';
        color: #1e78ff;
        margin-right: 10px;
        font-weight: bold;
      }
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 18px;

  label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-weight: 500;
    font-size: 0.9rem;
  }

  input,
  select {
    width: 100%;
    padding: 10px 12px;
    font-size: 0.95rem;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    outline: none;
    transition: box-shadow 220ms ease, transform 180ms ease, border-color 220ms ease;
    background: rgba(255, 255, 255, 0.9);
    font-family: inherit;
    animation: slideIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;

    &:focus {
      box-shadow: 0 6px 18px rgba(30, 120, 255, 0.12), 0 0 8px rgba(30, 120, 255, 0.18);
      transform: translateY(-2px) scale(1.02);
      border-color: #1e78ff;
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.38);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FormSection = styled.div`
  margin: 28px 0;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-of-type {
    border-bottom: none;
  }
`;

const Divider = styled.div`
  text-align: center;
  color: #999;
  margin: 24px 0;
  font-weight: 500;
  font-size: 0.85rem;
  position: relative;

  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    width: 35%;
    height: 1px;
    background: rgba(0, 0, 0, 0.06);
  }

  &:before {
    left: 0;
  }

  &:after {
    right: 0;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 220ms ease;
  font-family: inherit;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #1e78ff 0%, #5b4fb8 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(30, 120, 255, 0.25);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(30, 120, 255, 0.1);
  color: #1e78ff;
  border: 1.5px solid #1e78ff;

  &:hover:not(:disabled) {
    background: #1e78ff;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(30, 120, 255, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 18px;
  padding: 12px 14px;
  background: rgba(244, 67, 54, 0.08);
  border-left: 3px solid #f44336;
  color: #c62828;
  border-radius: 6px;
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
    <Container>
      <Header>
        <h1>⚡ Tic Tac Toe</h1>
        <p>Real-time multiplayer game with instant move synchronization</p>
      </Header>

      <Content>
        <SetupCard>
          <h2>Welcome to the Game</h2>

          <FormSection>
            <h3>Create a New Game</h3>
            <FormGroup>
              <label htmlFor="createName">Your Name:</label>
              <input
                id="createName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
            </FormGroup>
            <FormGroup>
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
            </FormGroup>
            <PrimaryButton
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </PrimaryButton>
          </FormSection>

          <Divider>OR</Divider>

          <FormSection>
            <h3>Join Existing Game</h3>
            <FormGroup>
              <label htmlFor="joinName">Your Name:</label>
              <input
                id="joinName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="joinCode">Room Code:</label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </FormGroup>
            <SecondaryButton
              onClick={handleJoinRoom}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </SecondaryButton>
          </FormSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </SetupCard>

        <InfoCard>
          <h3>How it Works</h3>
          <ul>
            <li>🎮 Create or join a game room</li>
            <li>📡 Moves sync in real-time via WebSocket</li>
            <li>⚡ See opponent's moves instantly</li>
            <li>👑 First to three in a row wins!</li>
          </ul>
        </InfoCard>
      </Content>
    </Container>
  );
}
