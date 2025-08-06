import React, { useState, useEffect } from 'react';
import './VideoDebug.css';

interface VideoDebugProps {
  signalingUrl: string;
  onConnectionChange?: (connected: boolean) => void;
}

interface DebugInfo {
  wsConnected?: boolean;
  connectionState?: string;
  iceConnectionState?: string;
  signalingState?: string;
  trackKind?: string;
  trackId?: string;
  trackEnabled?: boolean;
}

const VideoDebug: React.FC<VideoDebugProps> = ({ signalingUrl, onConnectionChange }) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signalingUrl) return;

    const ws = new WebSocket(signalingUrl);
    let pc: RTCPeerConnection | null = null;

    ws.onopen = () => {
      console.log("[Debug] WebSocket conectado");
      setDebugInfo((prev: DebugInfo) => ({ ...prev, wsConnected: true }));
      
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[Debug] Connection state:", pc?.connectionState);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, connectionState: pc?.connectionState }));
        
        if (pc?.connectionState === 'connected') {
          setIsConnected(true);
          onConnectionChange?.(true);
        } else {
          setIsConnected(false);
          onConnectionChange?.(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[Debug] ICE connection state:", pc?.iceConnectionState);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, iceConnectionState: pc?.iceConnectionState }));
      };

      pc.onsignalingstatechange = () => {
        console.log("[Debug] Signaling state:", pc?.signalingState);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, signalingState: pc?.signalingState }));
      };

      pc.ontrack = (event) => {
        console.log("[Debug] Track received:", event.track);
        setDebugInfo((prev: DebugInfo) => ({
          ...prev,
          trackKind: event.track.kind,
          trackId: event.track.id,
          trackEnabled: event.track.enabled
        }));
      };
    };

    ws.onmessage = async ({ data }) => {
      const message = JSON.parse(data);
      console.log("[Debug] Message received:", message.type);
      
      if (message.type === "offer" && pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(message));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify(pc.localDescription));
        } catch (error) {
          console.error("[Debug] Error processing offer:", error);
          setError(error instanceof Error ? error.message : "Unknown error");
        }
      } else if (message.type === "candidate" && pc) {
        try {
          await pc.addIceCandidate(message.candidate);
        } catch (error) {
          console.error("[Debug] Error adding ICE candidate:", error);
          setError(error instanceof Error ? error.message : "Unknown error");
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[Debug] WebSocket error:", error);
      setError("WebSocket error");
    };

    ws.onclose = () => {
      console.log("[Debug] WebSocket closed");
      setDebugInfo((prev: DebugInfo) => ({ ...prev, wsConnected: false }));
    };

    return () => {
      ws.close();
      if (pc) {
        pc.close();
      }
    };
  }, [signalingUrl, onConnectionChange]);

  return (
    <div className="video-debug">
      <h3>🔧 Debug Info</h3>
      <div className="debug-content">
        <div className="debug-item">
          <strong>Status:</strong> 
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        {error && (
          <div className="debug-item error">
            <strong>Erro:</strong> {error}
          </div>
        )}
        
        <div className="debug-item">
          <strong>WebSocket:</strong> {debugInfo.wsConnected ? 'Conectado' : 'Desconectado'}
        </div>
        
        <div className="debug-item">
          <strong>Connection State:</strong> {debugInfo.connectionState || 'N/A'}
        </div>
        
        <div className="debug-item">
          <strong>ICE State:</strong> {debugInfo.iceConnectionState || 'N/A'}
        </div>
        
        <div className="debug-item">
          <strong>Signaling State:</strong> {debugInfo.signalingState || 'N/A'}
        </div>
        
        <div className="debug-item">
          <strong>Track:</strong> {debugInfo.trackKind || 'N/A'} 
          {debugInfo.trackId && ` (ID: ${debugInfo.trackId})`}
        </div>
        
        <div className="debug-item">
          <strong>Track Enabled:</strong> {debugInfo.trackEnabled ? 'Sim' : 'Não'}
        </div>
      </div>
    </div>
  );
};

export default VideoDebug; 