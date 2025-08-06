import React, { useEffect, useRef } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  signalingUrl: string;
  onPingUpdate?: (ping: number) => void;
  onConnectionChange?: (connected: boolean, connectionState?: string, iceState?: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ signalingUrl, onPingUpdate, onConnectionChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lastPingSentAtRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!signalingUrl) return;
    const video = videoRef.current;
    if (!video) return;

    // Limpeza antes de criar nova conexão
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Configurar elemento de vídeo
    const remoteStream = new MediaStream();
    video.srcObject = remoteStream;
    video.onloadedmetadata = () => {
      console.log('[WebRTC] Metadados do vídeo carregados, iniciando reprodução');
      video.play().catch(error => {
        console.error('[WebRTC] Erro ao iniciar reprodução do vídeo:', error);
      });
    };

    video.onerror = (event) => {
      console.error('[WebRTC] Erro no elemento de vídeo:', video.error);
    };

    // Criar WebSocket
    console.log('[WebRTC] Conectando ao servidor:', signalingUrl);
    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log('[WebRTC] WebSocket conectado, criando RTCPeerConnection');
      const peerConnection = new RTCPeerConnection();
      const pc = peerConnection;
      pcRef.current = pc;

      // Configurar transceptores para receber vídeo
      pc.addTransceiver('video', { direction: 'recvonly' });
      console.log('[WebRTC] Transceiver de vídeo configurado como recvonly');

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          console.log('[WebRTC] Candidato ICE gerado:', {
            type: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            port: event.candidate.port
          });
          ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      pc.ontrack = (event) => {
        console.log('[WebRTC] Track recebido:', event.track.kind);
        remoteStream.addTrack(event.track);
        console.log('[WebRTC] Tracks ativos no remoteStream:', remoteStream.getTracks().length);

        if (event.track.kind === 'video') {
          video.width = 640;
          video.height = 480;
          console.log('[WebRTC] Stream de vídeo configurado');

          event.track.onunmute = () => {
            console.log('[WebRTC] Track de vídeo unmuted, deve começar a exibir');
          };

          event.track.onended = () => {
            console.log('[WebRTC] Track de vídeo terminado');
          };
        }
      };

      pc.onnegotiationneeded = () => {
        console.log('[WebRTC] Negociação necessária');
      };

      pc.onicegatheringstatechange = () => {
        console.log('[WebRTC] Estado de coleta ICE:', pc.iceGatheringState);
        if (pc.iceGatheringState === 'gathering') {
          console.log('[WebRTC] Iniciando coleta de candidatos ICE');
        } else if (pc.iceGatheringState === 'complete') {
          console.log('[WebRTC] Coleta de candidatos ICE concluída');
        }
      };

      pc.onsignalingstatechange = () => {
        console.log('[WebRTC] Estado de sinalização:', pc.signalingState);
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Estado da conexão mudou:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('[WebRTC] Conexão estabelecida com sucesso na rede local');
        } else if (pc.connectionState === 'failed') {
          console.log('[WebRTC] Conexão falhou. Estado ICE:', pc.iceConnectionState);
          console.log('[WebRTC] Candidatos locais disponíveis:', pc.localDescription?.sdp);
          console.log('[WebRTC] Candidatos remotos disponíveis:', pc.remoteDescription?.sdp);
        }
        onConnectionChange?.(pc.connectionState === 'connected', pc.connectionState, pc.iceConnectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] Estado do ICE mudou:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.log('[WebRTC] Falha na conexão ICE. Possíveis causas:');
          console.log('- Dispositivos não estão na mesma rede local');
          console.log('- Bloqueio de portas no firewall');
          console.log('- Configuração de rede incompatível');
        }
        onConnectionChange?.(pc.connectionState === 'connected', pc.connectionState, pc.iceConnectionState);
      };

      // Ping para medir latência
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingSentAtRef.current = performance.now();
          // ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 5000);
    };

    ws.onmessage = async ({ data }) => {
      let message;
      try {
        message = JSON.parse(data);
        console.log('[WebRTC] Mensagem recebida:', message.type, message);
      } catch (error) {
        console.error('[WebRTC] Erro ao parsear mensagem:', error, data);
        return;
      }

      if (message.type === "pong" && lastPingSentAtRef.current !== null) {
        const latency = Math.round(performance.now() - lastPingSentAtRef.current);
        onPingUpdate?.(latency);
        lastPingSentAtRef.current = null;
      }

      if (message.type === "offer" && pcRef.current) {
        try {
          console.log('[WebRTC] Processando offer:', message);
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(message));
          console.log('[WebRTC] Descrição remota definida');

          // Criar e enviar resposta
          const answer = await pcRef.current.createAnswer();
          console.log('[WebRTC] Resposta criada:', answer);
          await pcRef.current.setLocalDescription(answer);
          console.log('[WebRTC] Descrição local definida, enviando resposta');
          ws.send(JSON.stringify(answer));

          // Adicionar candidatos pendentes após definir a descrição remota
          console.log('[WebRTC] Adicionando candidatos pendentes:', pendingCandidatesRef.current.length);
          for (const candidate of pendingCandidatesRef.current) {
            try {
              await pcRef.current.addIceCandidate(candidate);
              console.log('[WebRTC] Candidato pendente adicionado com sucesso');
            } catch (error) {
              console.error('[WebRTC] Erro ao adicionar candidato pendente:', error);
            }
          }
          pendingCandidatesRef.current = [];
        } catch (error) {
          console.error("[WebRTC] Erro ao processar offer:", error);
        }
      } else if (message.type === "candidate" && pcRef.current) {
        const candidate = message.candidate;
        console.log('[WebRTC] Recebido ICE candidate:', candidate);

        if (pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(candidate);
            console.log('[WebRTC] ICE candidate adicionado com sucesso');
          } catch (error) {
            console.error("[WebRTC] Erro ao adicionar ICE candidate:", error);
          }
        } else {
          console.log('[WebRTC] Armazenando ICE candidate para adição posterior');
          pendingCandidatesRef.current.push(candidate);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('[WebRTC] Erro no WebSocket:', error);
      onConnectionChange?.(false, 'failed', 'failed');
    };

    ws.onclose = () => {
      console.log('[WebRTC] WebSocket fechado');
      onConnectionChange?.(false, 'disconnected', 'disconnected');
    };

    // Limpeza ao desmontar ou mudar signalingUrl
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [signalingUrl, onPingUpdate, onConnectionChange]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="gba-video"
      width={640}
      height={480}
    />
  );
};

export default VideoPlayer;