import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../Logger';

interface UseInputHandlerProps {
  inputUrl: string;
  onPingUpdate: (ping: number) => void;
  onButtonPress: (key: string, action: 'down' | 'up') => void;
  onConnectionChange?: (connected: boolean) => void;
}

const KEY_MAP = {
  'A': 'A', 'B': 'B',
  'ENTER': 'START', ' ': 'START',
  'BACKSPACE': 'SELECT', 'SHIFT': 'SELECT',
  'ARROWUP': 'UP', 'ARROWDOWN': 'DOWN',
  'ARROWLEFT': 'LEFT', 'ARROWRIGHT': 'RIGHT',
  'L': 'L', 'R': 'R'
} as const;

export const useInputHandler = ({ inputUrl, onPingUpdate, onButtonPress, onConnectionChange }: UseInputHandlerProps) => {
  const inputSocketRef = useRef<WebSocket | null>(null);
  const lastInputPingSentAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inputUrl) {
      logger.warn('URL de input não fornecida', { inputUrl }, 'useInputHandler');
      return;
    }

    logger.info('Iniciando conexão WebSocket de input', { inputUrl }, 'useInputHandler');
    const inputSocket = new WebSocket(inputUrl);
    inputSocketRef.current = inputSocket;

    // Ping para medir latência
    const pingInterval = setInterval(() => {
      if (inputSocket.readyState === WebSocket.OPEN) {
        lastInputPingSentAtRef.current = performance.now();
        logger.debug('Enviando ping de input', undefined, 'useInputHandler');
        // inputSocket.send(JSON.stringify({ type: "ping" }));
      }
    }, 5000);

    inputSocket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        logger.debug('Mensagem recebida do input WebSocket', { data }, 'useInputHandler');
        
        if (data.type === "pong" && lastInputPingSentAtRef.current !== null) {
          const latency = Math.round(performance.now() - lastInputPingSentAtRef.current);
          logger.debug('Pong recebido do input', { latency }, 'useInputHandler');
          onPingUpdate(latency);
          lastInputPingSentAtRef.current = null;
        }
      } catch (error) {
        logger.error('Erro ao processar mensagem do input WebSocket', {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          rawData: event.data
        }, 'useInputHandler');
      }
    });

    inputSocket.onopen = () => {
      logger.info('Conectado ao WebSocket de input', { inputUrl }, 'useInputHandler');
      onConnectionChange?.(true);
    };

    inputSocket.onerror = (error) => {
      logger.error('Erro no WebSocket de input', { error, inputUrl }, 'useInputHandler');
      onConnectionChange?.(false);
    };

    inputSocket.onclose = (event) => {
      logger.warn('Conexão WebSocket de input fechada', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        inputUrl
      }, 'useInputHandler');
      onConnectionChange?.(false);
    };

    return () => {
      clearInterval(pingInterval);
      if (inputSocket.readyState === WebSocket.OPEN) {
        inputSocket.close();
      }
    };
  }, [inputUrl, onPingUpdate, onConnectionChange]);

  const sendKey = useCallback((key: string, action: 'down' | 'up') => {
    if (inputSocketRef.current?.readyState === WebSocket.OPEN) {
      const message = { key, action };
      logger.debug('Enviando tecla via WebSocket', message, 'useInputHandler');
      inputSocketRef.current.send(JSON.stringify(message));
    } else {
      logger.warn('Tentativa de enviar tecla com WebSocket não conectado', {
        key,
        action,
        readyState: inputSocketRef.current?.readyState
      }, 'useInputHandler');
    }
    onButtonPress(key, action);
  }, [onButtonPress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const originalKey = e.key.toUpperCase();
      const mappedKey = (KEY_MAP as any)[originalKey] || originalKey;
      
      if (mappedKey) {
        logger.debug('Tecla pressionada (keydown)', {
          originalKey,
          mappedKey,
          code: e.code
        }, 'useInputHandler');
        sendKey(mappedKey, 'down');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const originalKey = e.key.toUpperCase();
      const mappedKey = (KEY_MAP as any)[originalKey] || originalKey;
      
      if (mappedKey) {
        logger.debug('Tecla liberada (keyup)', {
          originalKey,
          mappedKey,
          code: e.code
        }, 'useInputHandler');
        sendKey(mappedKey, 'up');
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendKey]);

  return { sendKey };
};