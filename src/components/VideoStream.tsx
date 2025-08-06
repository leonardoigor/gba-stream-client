import React, { useEffect, useRef, useState } from "react";
import { logger } from '../Logger';

type VideoStreamProps = {
  signalingUrl: string;
};

const VideoStream: React.FC<VideoStreamProps> = ({ signalingUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pingRef = useRef<HTMLSpanElement>(null);
  // Fixar signalingUrl na primeira montagem
  const signalingUrlRef = useRef<string>(signalingUrl);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    let lastPingSentAt: number | null = null;
    // Criar MediaStream e PeerConnection logo no início, igual ao HTML puro
    const remoteStream = new MediaStream();
    // Testar sem ICE servers primeiro, igual ao index.html que funciona
    const pc = new RTCPeerConnection();
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.onpause = () => setPaused(true);
      videoRef.current.onplay = () => setPaused(false);
      videoRef.current.onerror = () => {
        logger.error('Erro no elemento de vídeo', { error: videoRef.current?.error }, 'VideoStream');
      };
      
      // Eventos para diagnosticar problemas de renderização
      videoRef.current.onloadedmetadata = () => {
        logger.debug('Metadados do vídeo carregados', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          duration: videoRef.current?.duration
        }, 'VideoStream');
      };
      
      videoRef.current.onresize = () => {
        console.log('[VideoStream] Vídeo redimensionado:');
        console.log('  - videoWidth:', videoRef.current?.videoWidth);
        console.log('  - videoHeight:', videoRef.current?.videoHeight);
      };
      
      videoRef.current.oncanplay = () => {
        console.log('[VideoStream] Vídeo pode ser reproduzido');
      };
      
      videoRef.current.onplaying = () => {
        console.log('[VideoStream] Vídeo está reproduzindo');
      };
    }

    const ws = new WebSocket(signalingUrlRef.current);
    let pingInterval: NodeJS.Timeout;

    ws.onopen = () => {
      logger.info('WebSocket conectado ao servidor de sinalização', { url: signalingUrlRef.current }, 'VideoStream');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
      };

      pc.ontrack = (event) => {
        logger.debug('Track WebRTC recebido', {
          kind: event.track.kind,
          id: event.track.id,
          readyState: event.track.readyState,
          enabled: event.track.enabled,
          muted: event.track.muted
        }, 'VideoStream');
        
        remoteStream.addTrack(event.track);
        
        logger.debug('MediaStream atualizado após addTrack', {
          streamId: remoteStream.id,
          active: remoteStream.active,
          tracksCount: remoteStream.getTracks().length
        }, 'VideoStream');
        
        if (event.track.kind === 'video') {
          // Verificar elemento de vídeo
          if (videoRef.current) {
            console.log('[VideoStream] Elemento de vídeo:');
            console.log('  - srcObject definido:', !!videoRef.current.srcObject);
            console.log('  - videoWidth:', videoRef.current.videoWidth);
            console.log('  - videoHeight:', videoRef.current.videoHeight);
            console.log('  - readyState:', videoRef.current.readyState);
            console.log('  - paused:', videoRef.current.paused);
          }
          
          event.track.onunmute = () => {
            console.log('[WebRTC] Track de vídeo unmuted (começou a receber dados)');
            
            // Verificar novamente após unmute
            if (videoRef.current) {
              console.log('[VideoStream] Após unmute:');
              console.log('  - videoWidth:', videoRef.current.videoWidth);
              console.log('  - videoHeight:', videoRef.current.videoHeight);
              console.log('  - readyState:', videoRef.current.readyState);
              
              videoRef.current.play().then(() => {
                 console.log('[VideoStream] Autoplay funcionou!');
                 setPaused(false);
               }).catch(err => {
                 console.log('[VideoStream] Autoplay bloqueado (normal no Chrome):', err.name, err.message);
                 console.log('[VideoStream] Usuário precisa clicar no vídeo para ativar');
                 setPaused(true);
               });
            }
          };
          
          event.track.onended = () => {
            console.log('[WebRTC] Track de vídeo ended');
          };
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Conexão:', pc?.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc?.iceConnectionState);
      };
      pc.onsignalingstatechange = () => {
        console.log('[WebRTC] Signaling state:', pc?.signalingState);
      };
      pc.onicegatheringstatechange = () => {
        console.log('[WebRTC] ICE gathering state:', pc?.iceGatheringState);
      };

      // ping
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingSentAt = performance.now();
          ws.send(JSON.stringify({ type: "ping" }));
        }
        
        // Debug periódico do estado do vídeo
        if (videoRef.current && remoteStream.getTracks().length > 0) {
          const videoTracks = remoteStream.getVideoTracks();
          if (videoTracks.length > 0) {
            console.log('[Debug] Estado do vídeo:');
            console.log('  - Track muted:', videoTracks[0].muted);
            console.log('  - Track enabled:', videoTracks[0].enabled);
            console.log('  - Track readyState:', videoTracks[0].readyState);
            console.log('  - Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            console.log('  - Video readyState:', videoRef.current.readyState);
            console.log('  - Video paused:', videoRef.current.paused);
          }
        }
      }, 5000);
    };

    ws.onmessage = async ({ data }) => {
      const message = JSON.parse(data);
      if (message.type === "pong" && lastPingSentAt !== null) {
        const latency = Math.round(performance.now() - lastPingSentAt);
        if (pingRef.current) pingRef.current.textContent = String(latency);
        lastPingSentAt = null;
      }
      if (message.type === "offer") {
        console.log('[WebRTC] Recebido offer:', message);
        await pc.setRemoteDescription(new RTCSessionDescription(message));
        console.log('[WebRTC] setRemoteDescription OK. SDP:', pc.remoteDescription?.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] setLocalDescription OK. SDP:', pc.localDescription?.sdp);
        ws.send(JSON.stringify(pc.localDescription));
      } else if (message.type === "candidate") {
        await pc.addIceCandidate(message.candidate);
        console.log('[WebRTC] addIceCandidate OK:', message.candidate);
      }
    };

    return () => {
      ws.close();
      if (pingInterval) clearInterval(pingInterval);
      pc.close();
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        background: "#181c24",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        position: "relative",
        padding: 24,
        maxWidth: 720,
        margin: "0 auto"
      }}
    >
      {/* Player de vídeo */}
      <div style={{ position: "relative", width: "100%", maxWidth: 640 }}>
        <video
          ref={videoRef}
          id="gbaVideo"
          autoPlay
          playsInline
          muted
          onClick={() => {
            if (videoRef.current) {
              console.log("[VideoStream] Clique no vídeo - tentando reproduzir");
              videoRef.current.play().then(() => {
                console.log("[VideoStream] Vídeo reproduzindo após clique");
                setPaused(false);
                // Tentar ativar áudio se estiver mudo
                if (videoRef.current?.muted) {
                  videoRef.current.muted = false;
                  console.log("[VideoStream] Áudio ativado");
                }
              }).catch(err => {
                console.error("[VideoStream] Erro ao reproduzir vídeo:", err);
              });
            }
          }}
          style={{
            width: "100%",
            borderRadius: 12,
            background: "#000",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
            cursor: "pointer"
          }}
        />
        {paused && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 8,
              fontSize: 14,
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            🎮 Clique no vídeo para ativar
          </div>
        )}
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 12,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            borderRadius: 8,
            padding: "2px 10px",
            fontSize: 14,
            fontWeight: 500,
            zIndex: 1,
            pointerEvents: "none"
          }}
        >
          Ping: <span ref={pingRef} id="pingSignaling">-</span> ms
        </div>
      </div>
      {/* Botão flutuante no canto inferior direito da tela */}
      {paused && (
        <button
          onClick={() => {
            const video = videoRef.current;
            console.log("[UI] Botão Reproduzir clicado");
            if (video) {
              console.log('[UI] video.readyState:', video.readyState);
              if (video.srcObject instanceof MediaStream) {
                const tracks = video.srcObject.getTracks();
                console.log('[UI] srcObject MediaStream tracks:', tracks.length, tracks.map(t => t.kind));
              } else {
                console.log('[UI] srcObject não é MediaStream:', video.srcObject);
              }
            } else {
              console.log('[UI] videoRef.current está null');
            }
            videoRef.current?.play().then(() => {
              console.log("[UI] play() chamado com sucesso");
            }).catch((err) => {
              console.log("[UI] Erro ao chamar play():", err);
            });
          }}
          style={{
            position: "fixed",
            right: 32,
            bottom: 32,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff9800 0%, #ff3d00 100%)",
            color: "#fff",
            border: "none",
            boxShadow: "0 6px 32px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 900,
            cursor: "pointer",
            zIndex: 1000,
            transition: "transform 0.18s, box-shadow 0.18s",
            outline: "none"
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.45)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,0,0,0.35)";
          }}
          aria-label="Reproduzir vídeo"
        >
          ▶
        </button>
      )}
    </div>
  );
};

export default VideoStream;