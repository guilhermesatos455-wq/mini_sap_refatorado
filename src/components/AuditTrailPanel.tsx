import React, { useState, useMemo } from 'react';
import { History, Search, Download, ShieldCheck, Clock, User, FileText, CheckCircle2 } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  oldValue: any;
  newValue: any;
  status: 'SUCESSO' | 'PENDENTE' | 'ERRO';
}

interface AuditTrailPanelProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ logs, onClearLogs, addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'TODOS' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  const exportAuditReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Trilha_Auditoria_SOX_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Trilha de Auditoria exportada com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Trilha de Auditoria em Tempo Real (Audit Trail - Compliance SOX)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registro imutável de todas as alterações de células, sincronizações multiusuário e eventos de segurança.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditReport}
              disabled={logs.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Exportar Relatório SOX
            </button>
            <button
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              Limpar Histórico
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por célula, usuário ou ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-white"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="SUCESSO">Sucesso</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ERRO">Erro</option>
            </select>
          </div>
          <div className="flex items-center justify-end text-xs font-mono text-slate-500 dark:text-slate-400">
            Total de Registros: <strong className="text-slate-900 dark:text-white ml-1">{filteredLogs.length}</strong>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhum evento registrado na trilha de auditoria ainda.</p>
            <p className="text-xs text-slate-400">Edite células na planilha ou realize sincronizações para preencher o log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Usuário / Origem</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Alvo (Célula / Registro)</th>
                  <th className="py-3 px-4">Valor Anterior</th>
                  <th className="py-3 px-4">Novo Valor</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {log.timestamp}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-500" /> {log.user}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-bold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">{log.target}</td>
                    <td className="py-3 px-4 text-rose-500 line-through">{String(log.oldValue ?? '-')}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{String(log.newValue ?? '-')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCESSO' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : log.status === 'PENDENTE' 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
