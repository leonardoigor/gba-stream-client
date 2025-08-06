import React from 'react';
import './ErrorScreen.css';

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon">
          <div className="error-symbol">⚠️</div>
        </div>
        <h2>❌ Erro ao conectar</h2>
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            🔄 Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorScreen; 