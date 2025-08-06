import { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { MatchData } from '../models/MatchData';
import { logger } from '../Logger';

export const useMatchRobust = () => {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Evitar inicialização dupla
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    const initializeMatch = async () => {
      try {
        logger.info('Iniciando criação de match', {
          serverUrl: CONFIG.SERVER_URL,
          endpoint: CONFIG.MATCH_ENDPOINT
        }, 'useMatchRobust');
        
        setIsLoading(true);
        setError(null);

        const url = CONFIG.SERVER_URL;
        const res = await fetch(url + CONFIG.MATCH_ENDPOINT, {
          method: "POST"
        });

        if (!res.ok) {
          const errorMsg = `Erro ao criar match: ${res.status}`;
          logger.error(errorMsg, { status: res.status, url }, 'useMatchRobust');
          throw new Error(errorMsg);
        }

        const matchData = await res.json();
        logger.info('Match criado com sucesso', {
          matchId: matchData.id,
          videoUrl: matchData.videoUrl,
          inputUrl: matchData.inputUrl,
          initializationDelay: CONFIG.INITIALIZATION_DELAY
        }, 'useMatchRobust');

        // Aguarda o tempo configurado antes de iniciar as conexões
        setTimeout(() => {
          logger.info('Inicializando conexões do match', {
            delayCompleted: true,
            matchId: matchData.id
          }, 'useMatchRobust');
          setMatch(new MatchData(matchData));
          setIsLoading(false);
        }, 1000 * CONFIG.INITIALIZATION_DELAY);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        logger.error('Erro ao inicializar match', {
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
        }, 'useMatchRobust');
        
        setError(errorMessage);
        setIsLoading(false);
        isInitializedRef.current = false; // Permite tentar novamente em caso de erro
      }
    };

    initializeMatch();
  }, []);

  return { match, isLoading, error };
};