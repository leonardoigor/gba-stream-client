import React from 'react';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  videoConnected: boolean;
  inputConnected: boolean;
  signalingPing: number | null;
  inputPing: number | null;
  videoConnectionState?: string;
  iceConnectionState?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  videoConnected,
  inputConnected,
  signalingPing,
  inputPing,
  videoConnectionState,
  iceConnectionState
}) => {
  const getStatusColor = (connected: boolean) => {
    return connected ? '#27ae60' : '#e74c3c';
  };

  const getStatusText = (connected: boolean) => {
    return connected ? 'Conectado' : 'Desconectado';
  };

  const getConnectionStateColor = (state?: string) => {
    switch (state) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="connection-status">
      <div className="status-item">
        <div 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor(videoConnected) }}
        />
        <span className="status-label">Vídeo:</span>
        <span className="status-value">{getStatusText(videoConnected)}</span>
        {signalingPing && (
          <span className="ping-value">({signalingPing}ms)</span>
        )}
      </div>
      
      {videoConnectionState && (
        <div className="status-item">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getConnectionStateColor(videoConnectionState) }}
          />
          <span className="status-label">Estado:</span>
          <span className="status-value">{videoConnectionState}</span>
        </div>
      )}
      
      {iceConnectionState && (
        <div className="status-item">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getConnectionStateColor(iceConnectionState) }}
          />
          <span className="status-label">ICE:</span>
          <span className="status-value">{iceConnectionState}</span>
        </div>
      )}
      
      <div className="status-item">
        <div 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor(inputConnected) }}
        />
        <span className="status-label">Input:</span>
        <span className="status-value">{getStatusText(inputConnected)}</span>
        {inputPing && (
          <span className="ping-value">({inputPing}ms)</span>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus; 