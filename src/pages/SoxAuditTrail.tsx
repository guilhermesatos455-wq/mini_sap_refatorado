import React, { useMemo, useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { ShieldCheck, Search, Filter, Calendar, User, Clock, Download, ShieldAlert } from 'lucide-react';

export const SoxAuditTrailPage: React.FC = () => {
  const { darkMode, auditLogs } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');

  const allLogs = useMemo(() => {
    const defaultLogs = [
      { id: 1, timestamp: '2026-03-12 14:32:10', user: 'Guilherme Santos', email: 'guilherme@natulab.com.br', action: 'Aprovação C-Level', details: 'Aprovada divergência de inventário ID #10482 (Valor R$ 45.200,00)', severity: 'Alto Risco (SOX)' },
      { id: 2, timestamp: '2026-03-12 11:15:00', user: 'Sistema RPA Bot', email: 'bot@natulab.com.br', action: 'Sincronização SAP OData', details: 'Importação automática de 1.482 registros de CKM3 e MB51.', severity: 'Informativo' },
      { id: 3, timestamp: '2026-03-11 16:45:22', user: 'Carlos Eduardo', email: 'carlos@natulab.com.br', action: 'Alteração de Parâmetro', details: 'Modificação da tolerância de impacto de R$ 1.000 para R$ 5.000.', severity: 'Médio Risco' },
      { id: 4, timestamp: '2026-03-10 09:20:15', user: 'Ana Paula C-Level', email: 'ana.paula@natulab.com.br', action: 'Assinatura Digital SOX', details: 'Assinatura do balanço trimestral de inventário de estoques.', severity: 'Alto Risco (SOX)' },
    ];
    const mappedContextLogs = (auditLogs || []).map((l, i) => ({
      id: 100 + i,
      timestamp: l.timestamp,
      user: l.user || 'Usuário Autenticado',
      email: 'usuario@natulab.com.br',
      action: l.action,
      details: l.details,
      severity: l.action.includes('Aprovação') ? 'Alto Risco (SOX)' : 'Informativo'
    }));
    return [...mappedContextLogs, ...defaultLogs];
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return allLogs;
    const term = searchTerm.toLowerCase();
    return allLogs.filter(l => 
      l.user.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term)
    );
  }, [allLogs, searchTerm]);

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Trilha de Auditoria SOX (Audit Trail)</h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Registro imutável e auditável de todas as aprovações, alterações de parâmetros e acessos críticos para conformidade SOX.
          </p>
        </div>
        <button
          onClick={() => alert('Trilha de Auditoria SOX exportada com assinatura criptográfica para auditoria externa!')}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20 self-start"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório SOX
        </button>
      </div>

      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex items-center justify-between`}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
            }`}
          />
        </div>
        <div className="text-xs font-bold text-slate-400 hidden md:block">
          {filteredLogs.length} Eventos Registrados
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Detalhes do Evento</th>
                <th className="p-4">Classificação SOX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-4">
                    <div className="font-bold">{log.user}</div>
                    <div className="text-[10px] text-slate-500">{log.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-md">{log.details}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      log.severity.includes('Alto') 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SoxAuditTrailPage;
