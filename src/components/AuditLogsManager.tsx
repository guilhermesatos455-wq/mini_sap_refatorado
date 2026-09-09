import React, { useState, useEffect } from 'react';
import { Shield, FileText, Download, Search, RefreshCw, Database, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../server/supabaseClient';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface AuditLogItem {
  id: string;
  tenant_id: string;
  user_email: string;
  action_type: string;
  details: any;
  status: string;
  created_at: string;
}

interface AuditLogsManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const AuditLogsManager: React.FC<AuditLogsManagerProps> = ({ darkMode, addToast }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([
    { id: '1', tenant_id: 'TENANT-CORP-SP', user_email: 'admin@corpsp.com', action_type: 'SYNC_SHEETS', details: { sheetId: '1BxiM...' }, status: 'SUCCESS', created_at: '2026-03-09T10:00:00Z' },
    { id: '2', tenant_id: 'TENANT-FILIAL-RJ', user_email: 'auditor@rj.com', action_type: 'STOCK_RECONCILIATION', details: { items: 450, variances: 3 }, status: 'SUCCESS', created_at: '2026-03-09T11:15:00Z' },
    { id: '3', tenant_id: 'TENANT-LOGISTICA-SUL', user_email: 'manager@sul.com', action_type: 'IDOC_GENERATE', details: { type: 'MATMAS05' }, status: 'WARNING', created_at: '2026-03-09T12:30:00Z' }
  ]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data && data.length > 0) {
        setLogs(data);
        addToast('Logs de auditoria sincronizados do Supabase!', 'success');
      }
    } catch (err: any) {
      console.warn('[AuditLogs] Supabase offline, using local logs fallback:', err.message);
      const saved = localStorage.getItem('supabase_audit_logs_fallback');
      if (saved) {
        try { setLogs(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || l.action_type === filterAction;
    return matchesSearch && matchesAction;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredLogs.map(l => ({
      ID: l.id,
      Tenant: l.tenant_id,
      Usuario: l.user_email || 'N/A',
      Acao: l.action_type,
      Status: l.status,
      Data: l.created_at
    }));
    exportToExcel(dataToExport, 'relatorio_audit_logs.xlsx');
    addToast('Relatório Excel exportado com sucesso!', 'success');
  };

  const handleExportPdf = () => {
    const headers = ['Tenant', 'Usuário', 'Ação', 'Status', 'Data'];
    const data = filteredLogs.map(l => [l.tenant_id, l.user_email || 'N/A', l.action_type, l.status, new Date(l.created_at).toLocaleString()]);
    exportToPdf('Relatório de Trilhas de Auditoria SOX', headers, data, 'relatorio_audit_logs.pdf');
    addToast('Relatório PDF exportado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Shield className="w-5 h-5 text-indigo-500" /> Painel de Logs de Auditoria & Compliance SOX
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Histórico imutável de ações, filtros avançados e exportação profissional em Excel e PDF.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar tenant, usuário ou ação..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-sans ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          >
            <option value="ALL">Todas as Ações</option>
            <option value="SYNC_SHEETS">SYNC_SHEETS</option>
            <option value="STOCK_RECONCILIATION">STOCK_RECONCILIATION</option>
            <option value="IDOC_GENERATE">IDOC_GENERATE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <th className="p-4">Tenant ID</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Tipo de Ação</th>
                <th className="p-4">Detalhes (JSON)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-mono">
              {filteredLogs.map(l => (
                <tr key={l.id} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-4 font-bold text-indigo-400">{l.tenant_id}</td>
                  <td className="p-4">{l.user_email || 'system@minisap.local'}</td>
                  <td className="p-4 font-bold text-emerald-400">{l.action_type}</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate" title={JSON.stringify(l.details)}>
                    {JSON.stringify(l.details)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 w-max ${
                      l.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {l.status === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
