import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Aguarde enquanto criamos sua sessão de jogo." 
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-icon">
          <div className="gameboy">
            <div className="screen">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
        <h2>🎮 Inicializando GBA Stream...</h2>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 