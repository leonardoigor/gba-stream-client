import React, { useState, useEffect } from 'react';
import { logger, LogLevel, LogEntry } from '../Logger';
import './LogViewer.css';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [filterComponent, setFilterComponent] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Atualizar logs periodicamente
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  // Carregar logs iniciais
  useEffect(() => {
    if (isOpen) {
      setLogs(logger.getLogs());
    }
  }, [isOpen]);

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level === filterLevel;
    const componentMatch = filterComponent === 'ALL' || log.component === filterComponent;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.component && log.component.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return levelMatch && componentMatch && searchMatch;
  });

  // Obter componentes únicos
  const uniqueComponents = Array.from(new Set(logs.map(log => log.component).filter(Boolean)));

  // Obter estatísticas
  const stats = logger.getStats();

  const handleSaveLogs = () => {
    logger.saveLogsToFile('txt');
  };

  const handleDownloadJSON = () => {
    logger.downloadLogs('json');
  };

  const handleDownloadTXT = () => {
    logger.downloadLogs('txt');
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const handleRefresh = () => {
    setLogs(logger.getLogs());
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return '#6c757d';
      case LogLevel.INFO: return '#0dcaf0';
      case LogLevel.WARN: return '#ffc107';
      case LogLevel.ERROR: return '#dc3545';
      default: return '#000';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="log-viewer-overlay">
      <div className="log-viewer">
        <div className="log-viewer-header">
          <h3>Visualizador de Logs</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="log-viewer-controls">
          <div className="control-group">
            <label>Nível:</label>
            <select 
              value={filterLevel} 
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'ALL')}
            >
              <option value="ALL">Todos</option>
              <option value={LogLevel.DEBUG}>Debug</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.WARN}>Warning</option>
              <option value={LogLevel.ERROR}>Error</option>
            </select>
          </div>

          <div className="control-group">
            <label>Componente:</label>
            <select 
              value={filterComponent} 
              onChange={(e) => setFilterComponent(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {uniqueComponents.map(component => (
                <option key={component} value={component}>{component}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Buscar:</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nos logs..."
            />
          </div>

          <div className="control-group">
            <label>
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>

        <div className="log-viewer-stats">
          <span>Total: {stats.total}</span>
          <span style={{color: getLevelColor(LogLevel.DEBUG)}}>Debug: {stats.DEBUG}</span>
          <span style={{color: getLevelColor(LogLevel.INFO)}}>Info: {stats.INFO}</span>
          <span style={{color: getLevelColor(LogLevel.WARN)}}>Warn: {stats.WARN}</span>
          <span style={{color: getLevelColor(LogLevel.ERROR)}}>Error: {stats.ERROR}</span>
          <span>Filtrados: {filteredLogs.length}</span>
        </div>

        <div className="log-viewer-actions">
          <button onClick={handleRefresh}>Atualizar</button>
          <button onClick={handleSaveLogs} className="primary">Salvar Logs</button>
          <button onClick={handleDownloadJSON}>Download JSON</button>
          <button onClick={handleDownloadTXT}>Download TXT</button>
          <button onClick={handleClearLogs} className="danger">Limpar Logs</button>
        </div>

        <div className="log-viewer-content">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">Nenhum log encontrado</div>
          ) : (
            filteredLogs.slice().reverse().map((log, index) => (
              <div key={index} className={`log-entry log-${log.level.toLowerCase()}`}>
                <div className="log-header">
                  <span className="log-timestamp">{new Date(log.timestamp).toLocaleString()}</span>
                  <span 
                    className="log-level" 
                    style={{ color: getLevelColor(log.level) }}
                  >
                    {log.level}
                  </span>
                  {log.component && (
                    <span className="log-component">[{log.component}]</span>
                  )}
                </div>
                <div className="log-message">{log.message}</div>
                {log.data && (
                  <div className="log-data">
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;