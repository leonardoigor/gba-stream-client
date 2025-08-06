import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  signalingUrl: string;
  onPingUpdate?: (ping: number) => void;
  onConnectionChange?: (connected: boolean, connectionState?: string, iceState?: string) => void;
}

const VideoPlayerRobust: React.FC<VideoPlayerProps> = ({ signalingUrl, onPingUpdate, onConnectionChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lastPingSentAtRef = useRef<number | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 3;
  const isConnectingRef = useRef(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSignalingUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    console.log("[VideoPlayerRobust] Limpando conexões...");

    // Limpar ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Fechar WebSocket
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Fechar PeerConnection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    isConnectingRef.current = false;
  }, []);

  useEffect(() => {
    // Evitar múltiplas conexões para o mesmo signalingUrl
    if (!signalingUrl) return;
    if (lastSignalingUrlRef.current === signalingUrl && wsRef.current) {
      // Já existe uma conexão ativa para este signalingUrl
      return;
    }
    lastSignalingUrlRef.current = signalingUrl;

    const video = videoRef.current;
    if (!video) return;

    // Limpar conexões anteriores
    cleanup();

    isConnectingRef.current = true;
    console.log("[VideoPlayerRobust] Iniciando nova conexão...");

    const remoteStream = new MediaStream();
    video.srcObject = remoteStream;

    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Signaling] Conectado a", signalingUrl);
      onConnectionChange?.(true, 'connecting', 'checking');

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      pc.ontrack = (event) => {
        console.log("[WebRTC] Track recebida:", event.track.kind);
        remoteStream.addTrack(event.track);

        if (event.track.kind === 'video') {
          video.width = 640;
          video.height = 480;
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Conexão:", pc.connectionState);
        const isConnected = pc.connectionState === 'connected';
        onConnectionChange?.(isConnected, pc.connectionState, pc.iceConnectionState);

        // Reset connection attempts on successful connection
        if (isConnected) {
          setConnectionAttempts(0);
          isConnectingRef.current = false;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
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
      const message = JSON.parse(data);

      if (message.type === "pong" && lastPingSentAtRef.current !== null) {
        const latency = Math.round(performance.now() - lastPingSentAtRef.current);
        onPingUpdate?.(latency);
        lastPingSentAtRef.current = null;
      }

      if (message.type === "offer") {
        const pc = pcRef.current;
        if (!pc) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(message));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify(pc.localDescription));
        } catch (error) {
          console.error("[WebRTC] Erro ao processar offer:", error);
        }
      } else if (message.type === "candidate") {
        const pc = pcRef.current;
        if (!pc) return;

        try {
          await pc.addIceCandidate(message.candidate);
        } catch (error) {
          console.error("[WebRTC] Erro ao adicionar ICE candidate:", error);
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[Signaling] Erro:", error);
      onConnectionChange?.(false, 'failed', 'failed');
      isConnectingRef.current = false;
    };

    ws.onclose = () => {
      console.log("[Signaling] Conexão fechada");
      onConnectionChange?.(false, 'disconnected', 'disconnected');
      isConnectingRef.current = false;

      // Tentar reconectar apenas se não excedeu o limite
      if (connectionAttempts < maxReconnectAttempts) {
        console.log(`[Signaling] Tentativa de reconexão ${connectionAttempts + 1}/${maxReconnectAttempts}`);
        setConnectionAttempts(prev => prev + 1);

        // Aguardar antes de tentar reconectar
        setTimeout(() => {
          if (connectionAttempts < maxReconnectAttempts) {
            console.log("[Signaling] Tentando reconectar...");
            // Forçar re-render para tentar nova conexão
            setConnectionAttempts(prev => prev);
          }
        }, 3000);
      } else {
        console.log("[Signaling] Máximo de tentativas de reconexão atingido");
      }
    };

    return () => {
      cleanup();
    };
  }, [signalingUrl, cleanup, connectionAttempts, maxReconnectAttempts, onConnectionChange, onPingUpdate]);

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

export default VideoPlayerRobust; 