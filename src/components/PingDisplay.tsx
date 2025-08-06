import React from 'react';
import './PingDisplay.css';

interface PingDisplayProps {
  signalingPing: number | null;
  inputPing: number | null;
}

const PingDisplay: React.FC<PingDisplayProps> = ({ signalingPing, inputPing }) => {
  return (
    <div className="ping-display">
      <strong>Ping Signaling:</strong> <span>{signalingPing || '--'}</span> ms |
      <strong>Ping Input:</strong> <span>{inputPing || '--'}</span> ms
    </div>
  );
};

export default PingDisplay; 