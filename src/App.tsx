import React, { useCallback, useRef, useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import VideoPlayer from './components/VideoPlayer';
import GamePad from './components/GamePad';
import ConnectionStatus from './components/ConnectionStatus';
import { useMatchRobust } from './hooks/useMatchRobust';
import { MatchData } from './models/MatchData';
import { useInputHandler } from './hooks/useInputHandler';
import './App.css';
import ConnectionDebug from './components/ConnectionDebug';
import VideoStream from './components/VideoStream';
import LogViewer from './components/LogViewer';
import { logger } from './Logger';

const App: React.FC = () => {
  const { match, isLoading, error } = useMatchRobust();

  // Estados para status de conexão e ping
  const [videoConnected, setVideoConnected] = useState(false);
  const [inputConnected, setInputConnected] = useState(false);
  const [signalingPing, setSignalingPing] = useState<number | null>(null);
  const [inputPing, setInputPing] = useState<number | null>(null);
  const [videoConnectionState, setVideoConnectionState] = useState<string | undefined>(undefined);
  const [iceConnectionState, setIceConnectionState] = useState<string | undefined>(undefined);
  
  // Estado para o LogViewer
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

  // Log inicial da aplicação
  useEffect(() => {
    logger.info('Aplicação GBA Stream Client iniciada', { timestamp: new Date().toISOString() }, 'App');
  }, []);

  // Log quando match é carregado
  useEffect(() => {
    if (match) {
      logger.info('Match carregado com sucesso', {
        videoUrl: match.videoUrl,
        inputUrl: match.inputUrl,
        matchId: match.id
      }, 'App');
    }
  }, [match]);

  // Log quando há erro
  useEffect(() => {
    if (error) {
      logger.error('Erro na aplicação', { error }, 'App');
    }
  }, [error]);

  // Handler para eventos do GamePad
  const handleGamePadButton = useCallback((key: string, action: 'down' | 'up') => {
    logger.logInput(`Botão ${key} ${action}`, { key, action, component: 'GamePad' });
    sendKey(key, action);
  }, []);

  // Handler para VideoPlayer
  const handleVideoPing = useCallback((ping: number) => {
    logger.logConnection(`Ping do vídeo: ${ping}ms`, { ping, component: 'Video' });
    setSignalingPing(ping);
  }, []);
  const handleVideoConnectionChange = useCallback((connected: boolean, connectionState?: string, iceState?: string) => {
    logger.logConnection(`Conexão de vídeo alterada`, {
      connected,
      connectionState,
      iceState,
      component: 'Video'
    });
    setVideoConnected(connected);
    setVideoConnectionState(connectionState);
    setIceConnectionState(iceState);
  }, []);

  // Handler para Input WS
  const handleInputPing = useCallback((ping: number) => {
    logger.logConnection(`Ping do input: ${ping}ms`, { ping, component: 'Input' });
    setInputPing(ping);
  }, []);
  const handleInputConnectionChange = useCallback((connected: boolean) => {
    logger.logConnection(`Conexão de input alterada`, { connected, component: 'Input' });
    setInputConnected(connected);
  }, []);

  // useInputHandler só é chamado se houver match
  const { sendKey } = useInputHandler(
    match
      ? {
          inputUrl: match.inputUrl,
          onPingUpdate: handleInputPing,
          onButtonPress: () => {},
          onConnectionChange: handleInputConnectionChange,
        }
      : {
          inputUrl: '',
          onPingUpdate: () => {},
          onButtonPress: () => {},
        }
  );

  const handleRetry = useCallback(() => {
    logger.info('Tentativa de reload da aplicação', undefined, 'App');
    window.location.reload();
  }, []);

  // Handler para abrir/fechar LogViewer
  const handleToggleLogViewer = useCallback(() => {
    setIsLogViewerOpen(prev => {
      const newState = !prev;
      logger.info(`LogViewer ${newState ? 'aberto' : 'fechado'}`, undefined, 'App');
      return newState;
    });
  }, []);

  // Atalho de teclado para abrir LogViewer (Ctrl+L)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        handleToggleLogViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleLogViewer]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="app">
      <div className="video-container">
        {match && (
          <VideoStream signalingUrl={match.videoUrl} />
        )}
      </div>
      <ConnectionStatus
        videoConnected={videoConnected}
        inputConnected={inputConnected}
        signalingPing={signalingPing}
        inputPing={inputPing}
        videoConnectionState={videoConnectionState}
        iceConnectionState={iceConnectionState}
      />
      <ConnectionDebug
        videoConnected={videoConnected}
        inputConnected={inputConnected}
        videoConnectionState={videoConnectionState || ''}
        iceConnectionState={iceConnectionState || ''}
        signalingPing={signalingPing}
        inputPing={inputPing}
      />
      <GamePad onButtonPress={handleGamePadButton} />
      
      {/* Botão para abrir LogViewer */}
      <button 
        className="log-viewer-toggle"
        onClick={handleToggleLogViewer}
        title="Abrir Logs (Ctrl+L)"
      >
        📋 Logs
      </button>
      
      {/* LogViewer */}
      <LogViewer 
        isOpen={isLogViewerOpen} 
        onClose={() => setIsLogViewerOpen(false)} 
      />
    </div>
  );
};

export default App;
