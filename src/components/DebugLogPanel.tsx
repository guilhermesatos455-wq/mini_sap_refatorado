import React, { useState } from 'react';
import { useDebugLogs, LogEntry } from '../context/DebugLogContext';
import { Bug, AlertTriangle, Info, Trash2, Copy, Check, X, Terminal, BarChart2 } from 'lucide-react';

export const DebugLogPanel: React.FC = () => {
  const { logs, clearLogs } = useDebugLogs();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'powerbi'>('all');

  const errorCount = logs.filter((l) => l.type === 'error').length;
  const warnCount = logs.filter((l) => l.type === 'warn').length;
  const infoCount = logs.filter((l) => l.type === 'info').length;
  const powerBiLogsCount = logs.filter((l) => 
    l.message.toLowerCase().includes('powerbi') || 
    l.message.toLowerCase().includes('power bi') || 
    l.message.toLowerCase().includes('azure') || 
    l.message.toLowerCase().includes('pushurl')
  ).length;

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'info') return l.type === 'info';
    if (filter === 'powerbi') {
      return (
        l.message.toLowerCase().includes('powerbi') || 
        l.message.toLowerCase().includes('power bi') || 
        l.message.toLowerCase().includes('azure') || 
        l.message.toLowerCase().includes('pushurl')
      );
    }
    return l.type === filter;
  });

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp.toISOString()}] [${l.type.toUpperCase()}] ${l.message}${
            l.stack ? '\nStack:\n' + l.stack : ''
          }`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 font-medium text-sm ${
            errorCount > 0
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/30'
              : warnCount > 0
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-slate-950/40'
          }`}
          title="Painel de Diagnóstico e Logs de Erro"
        >
          <Terminal className="w-5 h-5" />
          <span className="hidden sm:inline">Logs de Sistema</span>
          {(errorCount > 0 || warnCount > 0) && (
            <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold bg-white text-slate-950 rounded-full shadow-md">
              {errorCount + warnCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal / Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-3xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Painel de Diagnóstico e Erros
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {logs.length} logs
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monitoramento em tempo real de falhas de execução e avisos (`console.error` / `console.warn`)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950/30 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Todos ({logs.length})
                </button>
                <button
                  onClick={() => setFilter('error')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                    filter === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-red-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" /> Erros ({errorCount})
                </button>
                <button
                  onClick={() => setFilter('warn')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                    filter === 'warn'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Avisos ({warnCount})
                </button>
                <button
                  onClick={() => setFilter('info')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                    filter === 'info'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" /> Infos ({infoCount})
                </button>
                <button
                  onClick={() => setFilter('powerbi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                    filter === 'powerbi'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Power BI ({powerBiLogsCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Logs'}
                </button>
                <button
                  onClick={clearLogs}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-xs">
              {filter === 'powerbi' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                      <BarChart2 className="w-4 h-4 text-emerald-400" /> Histórico de Tentativas & Diagnósticos Power BI
                    </h4>
                    <p className="text-[11px] opacity-80">
                      Tabela detalhada de conexões, status de alcançabilidade e requisições de Push efetuadas para a API do Power BI.
                    </p>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <BarChart2 className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                      <p>Nenhuma tentativa de conexão com o Power BI registrada na sessão atual.</p>
                      <p className="text-[11px] text-slate-600">
                        Execute um teste de conexão ou transmissão no Painel Power BI para gerar entradas nesta tabela.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                            <th className="p-3 font-bold">Timestamp</th>
                            <th className="p-3 font-bold">Tipo</th>
                            <th className="p-3 font-bold">Status Code / Estado</th>
                            <th className="p-3 font-bold">Mensagem & Detalhes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredLogs.map((log) => {
                            const isError = log.type === 'error';
                            const isWarn = log.type === 'warn';
                            
                            // Extract status code if present in message (e.g., [400], 401, etc.)
                            const statusMatch = log.message.match(/\b(200|201|400|401|403|404|500|502|503)\b/);
                            const statusCode = statusMatch ? statusMatch[1] : (isError ? '500' : isWarn ? 'WARN' : '200 OK');

                            return (
                              <tr key={log.id} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                                  {log.timestamp.toLocaleTimeString()}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isError ? 'bg-red-500/20 text-red-400' : isWarn ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {log.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                    statusCode.startsWith('2') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                                  }`}>
                                    {statusCode}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-200 font-sans text-xs break-words">
                                  <div>{log.message}</div>
                                  {log.stack && (
                                    <div className="mt-1 text-[10px] text-red-400 font-mono bg-black/30 p-1.5 rounded">
                                      {log.stack}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <Terminal className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                  <p>Nenhum log ou erro registrado no momento.</p>
                  <p className="text-[11px] text-slate-600">
                    Erros de processamento de planilhas, OCR ou exceções aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition ${
                      log.type === 'error'
                        ? 'bg-red-950/20 border-red-500/30 text-red-200'
                        : log.type === 'warn'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.type === 'error' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">
                            <Bug className="w-3 h-3" /> ERRO
                          </span>
                        ) : log.type === 'warn' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> AVISO
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                            <Info className="w-3 h-3" /> INFO
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {log.timestamp.toLocaleTimeString()} ({log.timestamp.toLocaleDateString()})
                        </span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words font-sans text-sm">{log.message}</p>
                    {log.stack && (
                      <div className="mt-3 p-3 bg-black/40 rounded-lg border border-red-500/20 text-[11px] text-red-300 overflow-x-auto">
                        <p className="font-bold text-[10px] text-red-400 mb-1 uppercase">Stack Trace:</p>
                        <pre className="whitespace-pre">{log.stack}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-right text-[11px] text-slate-500">
              Mini-SAP Auditor Fiscal • NatuAssist Engine v1.2
            </div>
          </div>
        </div>
      )}
    </>
  );
};
