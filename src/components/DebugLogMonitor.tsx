import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useDebugLogs } from '../context/DebugLogContext';

interface DebugLogMonitorProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const DebugLogMonitor: React.FC<DebugLogMonitorProps> = ({ darkMode, addToast }) => {
  const { logs, clearLogs } = useDebugLogs();
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  const filteredLogs = logs.filter(log => filterType === 'all' || log.type === filterType);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Terminal className="w-6 h-6 text-[#8DC63F]" /> Painel de Monitoramento de Erros e Falhas SAP
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Monitoramento em tempo real capturado via DebugLogContext para auditoria de falhas em integrações e runtime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearLogs();
              addToast('Logs de erro limpos com sucesso.', 'success');
            }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar Logs
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 border-b pb-4 border-inherit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${filterType === 'all' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
        >
          Todos ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('error')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${filterType === 'error' ? 'bg-red-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
        >
          Erros ({logs.filter(l => l.type === 'error').length})
        </button>
        <button
          onClick={() => setFilterType('warn')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${filterType === 'warn' ? 'bg-amber-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
        >
          Avisos ({logs.filter(l => l.type === 'warn').length})
        </button>
        <button
          onClick={() => setFilterType('info')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${filterType === 'info' ? 'bg-indigo-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
        >
          Info ({logs.filter(l => l.type === 'info').length})
        </button>
      </div>

      {/* Log Entries */}
      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nenhum erro ou falha registrada no momento.</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>O sistema está operando sem anomalias nas integrações SAP.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border flex flex-col gap-1.5 font-mono text-xs ${
                  log.type === 'error'
                    ? darkMode ? 'bg-red-950/20 border-red-900/50 text-red-300' : 'bg-red-50 border-red-200 text-red-900'
                    : log.type === 'warn'
                    ? darkMode ? 'bg-amber-950/20 border-amber-900/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                    : darkMode ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.type === 'error' ? 'bg-red-500/20 text-red-400' : log.type === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[10px] opacity-75">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="break-all font-sans text-xs">{log.message}</p>
                {log.stack && (
                  <pre className="mt-2 p-2 rounded bg-black/40 text-[10px] overflow-x-auto text-red-400 font-mono">
                    {log.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DebugLogMonitor;
