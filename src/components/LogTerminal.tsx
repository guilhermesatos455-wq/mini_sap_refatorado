import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy, Check, Download, AlertTriangle, Info, XCircle, Play } from 'lucide-react';

export interface LogItem {
  id: string;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
}

// Global log interceptor singleton storage
let globalLogsListener: ((log: LogItem) => void) | null = null;
let isInitialized = false;

export const initGlobalConsoleInterceptor = () => {
  if (isInitialized) return;
  isInitialized = true;

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  const formatArgs = (args: any[]) => {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  };

  const addLog = (level: 'log' | 'info' | 'warn' | 'error', args: any[]) => {
    const message = formatArgs(args);
    const logItem: LogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any),
      level,
      message
    };
    if (globalLogsListener) {
      globalLogsListener(logItem);
    }
  };

  console.log = (...args: any[]) => {
    originalLog(...args);
    addLog('log', args);
  };

  console.info = (...args: any[]) => {
    originalInfo(...args);
    addLog('info', args);
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    addLog('warn', args);
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    addLog('error', args);
  };
};

interface LogTerminalProps {
  darkMode: boolean;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ darkMode }) => {
  const [logs, setLogs] = useState<LogItem[]>([
    { id: 'init-1', timestamp: new Date().toLocaleTimeString('pt-BR'), level: 'info', message: '🚀 Mini-SAP Web Auditoria - Terminal de Logs Inicializado' },
    { id: 'init-2', timestamp: new Date().toLocaleTimeString('pt-BR'), level: 'log', message: '⚡ Escutando eventos do console, worker de auditoria e requisições...' }
  ]);
  const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGlobalConsoleInterceptor();
    globalLogsListener = (newLog) => {
      setLogs(prev => [...prev.slice(-499), newLog]); // Keep last 500 logs
    };

    return () => {
      globalLogsListener = null;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => filter === 'all' || l.level === filter);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minisap_logs_${new Date().toISOString().replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#8DC63F]" />
            <h3 className="font-bold text-sm tracking-wider uppercase">Terminal em Tempo Real</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> ONLINE
          </span>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${filter === 'all' ? 'bg-[#8DC63F] text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setFilter('log')}
              className={`px-3 py-1 rounded-md transition-all ${filter === 'log' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Logs
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-3 py-1 rounded-md transition-all ${filter === 'info' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-3 py-1 rounded-md transition-all ${filter === 'warn' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Avisos
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded-md transition-all ${filter === 'error' ? 'bg-red-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Erros
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              title="Alternar Auto-scroll"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${autoScroll ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              <Play className={`w-3 h-3 ${autoScroll ? 'fill-current' : ''}`} /> Auto-scroll
            </button>
            <button
              onClick={handleCopyLogs}
              title="Copiar Logs"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownloadLogs}
              title="Baixar Arquivo de Log (.txt)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearLogs}
              title="Limpar Terminal"
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-5 font-mono text-sm h-[650px] overflow-y-auto space-y-2 select-text bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <p>Nenhum log encontrado para o filtro selecionado.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let levelColor = 'text-slate-300';
            let bgBadge = 'bg-slate-800 text-slate-300';
            let Icon = Info;

            if (log.level === 'info') {
              levelColor = 'text-emerald-400';
              bgBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              Icon = Info;
            } else if (log.level === 'warn') {
              levelColor = 'text-amber-400';
              bgBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
              Icon = AlertTriangle;
            } else if (log.level === 'error') {
              levelColor = 'text-red-400';
              bgBadge = 'bg-red-500/10 text-red-400 border border-red-500/20';
              Icon = XCircle;
            }

            return (
              <div key={log.id} className="flex items-start gap-3 py-1.5 px-2.5 rounded hover:bg-slate-900/80 transition-colors leading-relaxed font-mono">
                <span className="text-slate-400 text-xs shrink-0 pt-0.5">[{log.timestamp}]</span>
                <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold shrink-0 ${bgBadge}`}>
                  {log.level}
                </span>
                <span className={`break-all whitespace-pre-wrap ${levelColor}`}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Status */}
      <div className="px-6 py-2.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Total: <strong className="text-white">{logs.length}</strong> eventos</span>
          <span>Filtrados: <strong className="text-white">{filteredLogs.length}</strong></span>
        </div>
        <div className="text-slate-500">
          Mini-SAP Auditoria v1.2.0 • Real-time Log Interceptor Active
        </div>
      </div>
    </div>
  );
};
