import { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { logger } from '../Logger';

interface Match {
  videoUrl: string;
  inputUrl: string;
}

export const useMatch = () => {
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  const initializeMatch = async () => {
    if (isInitializedRef.current) {
      logger.warn("Match já foi inicializada, ignorando chamada duplicada", undefined, 'useMatch');
      return;
    }
    
    logger.info("Iniciando criação de match...", undefined, 'useMatch');
    isInitializedRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const url = CONFIG.SERVER_URL;
      const res = await fetch(url + CONFIG.MATCH_ENDPOINT, { method: "POST" });
      
      if (!res.ok) {
        throw new Error(`Erro ao criar match: ${res.status}`);
      }
      
      const matchData = await res.json();
      logger.info("Match criado com sucesso", { matchData }, 'useMatch');
      
      // Aguarda o tempo configurado antes de iniciar as conexões
      setTimeout(() => {
        setMatch(matchData);
        setIsLoading(false);
      }, 1000 * CONFIG.INITIALIZATION_DELAY);
      
    } catch (err) {
      logger.error("Erro ao inicializar match", { error: err }, 'useMatch');
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setIsLoading(false);
      isInitializedRef.current = false; // Permite tentar novamente em caso de erro
    }
  };

  useEffect(() => {
    initializeMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { match, isLoading, error, initializeMatch };
};