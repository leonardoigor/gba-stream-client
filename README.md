# 🎮 GBA WebRTC Stream Client

Um cliente React moderno e elegante para streaming de jogos GBA via WebRTC, com interface de usuário aprimorada e funcionalidades robustas.

## ✨ Características

### 🎨 Interface Moderna
- **Design Responsivo**: Adapta-se perfeitamente a diferentes tamanhos de tela
- **Animações Suaves**: Transições e efeitos visuais elegantes
- **Tema Escuro**: Interface com gradientes modernos e efeitos de vidro
- **Feedback Visual**: Botões com estados visuais claros e animações

### 🎮 Controles Intuitivos
- **GamePad Virtual**: Layout otimizado similar ao Game Boy Advance
- **Suporte Touch**: Funciona perfeitamente em dispositivos móveis
- **Controles de Teclado**: Mapeamento completo de teclas
- **Feedback Tátil**: Estados visuais para botões pressionados

### 📊 Monitoramento em Tempo Real
- **Status de Conexão**: Indicadores visuais para vídeo e input
- **Medição de Latência**: Ping em tempo real para ambas as conexões
- **Indicadores de Estado**: Cores e animações para status de conexão

### 🔧 Arquitetura Modular
- **Componentes Reutilizáveis**: Estrutura limpa e organizada
- **Hooks Personalizados**: Lógica de negócio separada da UI
- **TypeScript**: Tipagem forte para melhor desenvolvimento
- **Clean Code**: Código limpo e bem documentado

## 🚀 Como Usar

### Pré-requisitos
- Node.js 16+ 
- Servidor GBA Stream rodando em `http://localhost:5172`

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm start
```

### Build de Produção
```bash
npm run build
```

## 🎯 Funcionalidades

### Controles Suportados
- **D-Pad**: ↑ ↓ ← → (setas ou WASD)
- **Botões A/B**: A, B (teclas A, B)
- **Start/Select**: Enter, Espaço, Backspace, Shift
- **Shoulder Buttons**: L, R (teclas L, R)

### Estados de Conexão
- **Conectado**: Verde com animação pulsante
- **Desconectado**: Vermelho com animação pulsante
- **Latência**: Exibida em tempo real

### Responsividade
- **Desktop**: Layout otimizado para telas grandes
- **Tablet**: Ajustes para telas médias
- **Mobile**: Interface adaptada para touch

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── VideoPlayer.tsx  # Player de vídeo WebRTC
│   ├── GamePad.tsx      # Controles virtuais
│   ├── PingDisplay.tsx  # Exibição de latência
│   ├── LoadingScreen.tsx # Tela de carregamento
│   ├── ErrorScreen.tsx  # Tela de erro
│   └── ConnectionStatus.tsx # Status de conexão
├── hooks/               # Hooks personalizados
│   ├── useMatchRobust.ts # Gerenciamento de match
│   ├── useInputHandler.ts # Controle de input
│   └── useButtonState.ts # Estado dos botões
└── config.ts           # Configurações globais
```

## 🎨 Componentes Principais

### VideoPlayer
- Conexão WebRTC robusta
- Tratamento de erros
- Medição de latência
- Notificação de estado de conexão

### GamePad
- Layout responsivo
- Estados visuais dos botões
- Suporte touch e mouse
- Animações suaves

### ConnectionStatus
- Indicadores visuais de conexão
- Medição de ping em tempo real
- Posicionamento inteligente
- Animações de status

## 🔧 Configuração

O arquivo `config.ts` contém todas as configurações do cliente:

```typescript
export const CONFIG = {
  SERVER_URL: 'http://localhost:5172',
  MATCH_ENDPOINT: '/matches/match',
  INITIALIZATION_DELAY: 10,
  PING_INTERVAL: 5000,
  // ... mais configurações
}
```

## 🎯 Melhorias Implementadas

### UI/UX
- ✅ Design moderno com gradientes e efeitos de vidro
- ✅ Animações suaves e feedback visual
- ✅ Layout responsivo para todos os dispositivos
- ✅ Componentes modulares e reutilizáveis

### Funcionalidade
- ✅ Status de conexão em tempo real
- ✅ Medição de latência para vídeo e input
- ✅ Feedback visual dos botões
- ✅ Tratamento robusto de erros

### Arquitetura
- ✅ Hooks personalizados para lógica de negócio
- ✅ Componentes com responsabilidades bem definidas
- ✅ TypeScript para tipagem forte
- ✅ Clean code e boas práticas

## 🚀 Próximos Passos

- [ ] Suporte a múltiplos jogadores
- [ ] Configurações de qualidade de vídeo
- [ ] Salvamento de preferências
- [ ] Modo offline com cache
- [ ] Integração com mais emuladores

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
