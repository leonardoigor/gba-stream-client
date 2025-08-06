import React from 'react';
import './ConnectionDebug.css';

interface ConnectionDebugProps {
  videoConnected: boolean;
  inputConnected: boolean;
  videoConnectionState: string;
  iceConnectionState: string;
  signalingPing: number | null;
  inputPing: number | null;
}

const ConnectionDebug: React.FC<ConnectionDebugProps> = ({
  videoConnected,
  inputConnected,
  videoConnectionState,
  iceConnectionState,
  signalingPing,
  inputPing
}) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="connection-debug">
      <h3>🔧 Debug Info</h3>
      <div className="debug-content">
        <div className="debug-item">
          <strong>Vídeo:</strong> 
          <span className={videoConnected ? 'connected' : 'disconnected'}>
            {videoConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="debug-item">
          <strong>Estado Vídeo:</strong> 
          <span style={{ color: getStateColor(videoConnectionState) }}>
            {videoConnectionState || 'N/A'}
          </span>
        </div>
        
        <div className="debug-item">
          <strong>ICE State:</strong> 
          <span style={{ color: getStateColor(iceConnectionState) }}>
            {iceConnectionState || 'N/A'}
          </span>
        </div>
        
        <div className="debug-item">
          <strong>Input:</strong> 
          <span className={inputConnected ? 'connected' : 'disconnected'}>
            {inputConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="debug-item">
          <strong>Ping Vídeo:</strong> 
          <span className="ping-value">
            {signalingPing ? `${signalingPing}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="debug-item">
          <strong>Ping Input:</strong> 
          <span className="ping-value">
            {inputPing ? `${inputPing}ms` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDebug; 