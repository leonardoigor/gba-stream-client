import React from 'react';
import { useButtonState } from '../hooks/useButtonState';
import './GamePad.css';

interface GamePadProps {
  onButtonPress: (key: string, action: 'down' | 'up') => void;
}

const GamePad: React.FC<GamePadProps> = ({ onButtonPress }) => {
  const { setButtonState, isButtonActive } = useButtonState();

  const handleButtonEvent = (key: string, action: 'down' | 'up') => {
    setButtonState(key, action === 'down');
    onButtonPress(key, action);
  };

  const createButton = (key: string, label: string, className: string = '') => (
    <button 
      key={key}
      className={`btn ${className} ${isButtonActive(key) ? 'active' : ''}`}
      data-key={key}
      onMouseDown={() => handleButtonEvent(key, 'down')}
      onMouseUp={() => handleButtonEvent(key, 'up')}
      onMouseLeave={() => handleButtonEvent(key, 'up')}
      onTouchStart={(e) => {
        e.preventDefault();
        handleButtonEvent(key, 'down');
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleButtonEvent(key, 'up');
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="gamepad">
      {/* D-Pad */}
      <div className="d-pad">
        {createButton('UP', '↑', 'up')}
        {createButton('LEFT', '←', 'left')}
        {createButton('RIGHT', '→', 'right')}
        {createButton('DOWN', '↓', 'down')}
      </div>

      {/* Botões A/B */}
      <div className="action-buttons">
        {createButton('B', 'B', 'b')}
        {createButton('A', 'A', 'a')}
      </div>

      {/* Botões Start/Select */}
      <div className="menu-buttons">
        {createButton('SELECT', 'Select', 'select')}
        {createButton('START', 'Start', 'start')}
      </div>

      {/* Botões L/R */}
      <div className="shoulder-buttons">
        {createButton('L', 'L', 'l')}
        {createButton('R', 'R', 'r')}
      </div>
    </div>
  );
};

export default GamePad; 