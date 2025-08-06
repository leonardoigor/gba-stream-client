// Configurações do cliente GBA Stream
export const CONFIG = {
  // URL do servidor da API C#
  SERVER_URL: 'http://localhost:5172',

  // URL do servidor WebRTC
  WEBRTC_SERVER_URL: 'ws://localhost:3000',

  // Endpoint para criar match
  MATCH_ENDPOINT: '/matches/match',

  // Tempo de espera antes de iniciar conexões (em segundos)
  INITIALIZATION_DELAY: 10,

  // Intervalo de ping (em milissegundos)
  PING_INTERVAL: 5000,

  // Configurações do WebRTC
  WEBRTC: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },

  // Mapeamento de teclas
  KEY_MAP: {
    'A': 'A',
    'B': 'B',
    'ENTER': 'START',
    ' ': 'START',
    'BACKSPACE': 'SELECT',
    'SHIFT': 'SELECT',
    'ARROWUP': 'UP',
    'ARROWDOWN': 'DOWN',
    'ARROWLEFT': 'LEFT',
    'ARROWRIGHT': 'RIGHT',
    'L': 'L',
    'R': 'R'
  } as const,

  // Configurações de UI
  UI: {
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    BUTTON_SIZE: 60,
    BUTTON_SIZE_MOBILE: 70,
    SHOULDER_BUTTON_WIDTH: 80,
    SHOULDER_BUTTON_WIDTH_MOBILE: 100
  }
} as const;

// Tipos derivados da configuração
export type GameKey = typeof CONFIG.KEY_MAP[keyof typeof CONFIG.KEY_MAP];