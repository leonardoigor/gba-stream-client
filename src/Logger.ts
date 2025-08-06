export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isEnabled: boolean = true;

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component
    };
  }

  private addLog(entry: LogEntry): void {
    if (!this.isEnabled) return;

    this.logs.push(entry);
    
    // Manter apenas os últimos maxLogs registros
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console também
    const consoleMessage = `[${entry.timestamp}] ${entry.level} ${entry.component ? `[${entry.component}]` : ''}: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage, entry.data || '');
        break;
    }
  }

  debug(message: string, data?: any, component?: string): void {
    this.addLog(this.createLogEntry(LogLevel.DEBUG, message, data, component));
  }

  info(message: string, data?: any, component?: string): void {
    this.addLog(this.createLogEntry(LogLevel.INFO, message, data, component));
  }

  warn(message: string, data?: any, component?: string): void {
    this.addLog(this.createLogEntry(LogLevel.WARN, message, data, component));
  }

  error(message: string, data?: any, component?: string): void {
    this.addLog(this.createLogEntry(LogLevel.ERROR, message, data, component));
  }

  // Capturar erros não tratados
  captureError(error: Error, component?: string): void {
    this.error(`Erro não tratado: ${error.message}`, {
      stack: error.stack,
      name: error.name
    }, component);
  }

  // Capturar eventos de WebRTC
  logWebRTC(event: string, data?: any): void {
    this.info(`WebRTC: ${event}`, data, 'WebRTC');
  }

  // Capturar eventos de conexão
  logConnection(event: string, data?: any): void {
    this.info(`Conexão: ${event}`, data, 'Connection');
  }

  // Capturar eventos de input
  logInput(event: string, data?: any): void {
    this.debug(`Input: ${event}`, data, 'Input');
  }

  // Capturar eventos de vídeo
  logVideo(event: string, data?: any): void {
    this.debug(`Vídeo: ${event}`, data, 'Video');
  }

  // Obter todos os logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Obter logs por nível
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Obter logs por componente
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  // Limpar logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs limpos', undefined, 'Logger');
  }

  // Exportar logs como JSON
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Exportar logs como texto
  exportLogsAsText(): string {
    return this.logs.map(log => {
      const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
      const componentStr = log.component ? ` [${log.component}]` : '';
      return `${log.timestamp} | ${log.level}${componentStr} | ${log.message}${dataStr}`;
    }).join('\n');
  }

  // Salvar logs em arquivo na pasta logs
  async saveLogsToFile(format: 'json' | 'txt' = 'txt'): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gba-stream-logs-${timestamp}.${format}`;
      
      let content: string;
      
      if (format === 'json') {
        content = this.exportLogsAsJSON();
      } else {
        content = this.exportLogsAsText();
      }

      // Tentar usar File System Access API se disponível
      if ('showDirectoryPicker' in window) {
        try {
          // @ts-ignore - File System Access API ainda não tem tipos completos
          const dirHandle = await window.showDirectoryPicker({
            suggestedName: 'logs'
          });
          
          // @ts-ignore
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          // @ts-ignore
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          
          this.info(`Logs salvos na pasta logs como ${filename}`, { format, logsCount: this.logs.length }, 'Logger');
          return;
        } catch (fsError) {
          this.warn('Usuário cancelou seleção de pasta ou erro na File System API, usando download', { error: fsError }, 'Logger');
        }
      }
      
      // Fallback: usar download tradicional com nome sugerindo pasta logs
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs/${filename}`; // Sugerir pasta logs no download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.info(`Logs baixados como logs/${filename}`, { format, logsCount: this.logs.length }, 'Logger');
    } catch (error) {
      this.error('Erro ao salvar logs', { error }, 'Logger');
    }
  }

  // Método para compatibilidade (download)
  downloadLogs(format: 'json' | 'txt' = 'txt'): void {
    this.saveLogsToFile(format);
  }

  // Habilitar/desabilitar logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.info(`Logger ${enabled ? 'habilitado' : 'desabilitado'}`, undefined, 'Logger');
  }

  // Obter estatísticas dos logs
  getStats(): { [key in LogLevel]: number } & { total: number } {
    const stats = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      total: this.logs.length
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

// Instância singleton do logger
export const logger = new Logger();

// Configurar captura de erros globais
window.addEventListener('error', (event) => {
  logger.error('Erro global capturado', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Promise rejeitada não tratada', {
    reason: event.reason
  }, 'Global');
});

export default Logger;