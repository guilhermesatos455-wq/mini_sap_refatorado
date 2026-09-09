import React, { useState, useEffect } from 'react';
import { Users, Plus, Database, Edit2, Check, X, ShieldCheck, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../server/supabaseClient';

interface TenantItem {
  id: string;
  tenant_id: string;
  email_admin: string;
  google_sheet_id: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  created_at: string;
}

interface TenantManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({ darkMode, addToast }) => {
  const [tenants, setTenants] = useState<TenantItem[]>([
    { id: '1', tenant_id: 'TENANT-CORP-SP', email_admin: 'admin@corpsp.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-01-10' },
    { id: '2', tenant_id: 'TENANT-FILIAL-RJ', email_admin: 'admin@filialrj.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-02-15' },
    { id: '3', tenant_id: 'TENANT-LOGISTICA-SUL', email_admin: 'admin@sul.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-03-01' },
    { id: '4', tenant_id: 'TENANT-GLOBAL-HOLDING', email_admin: 'admin@global.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-03-10' }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(5);
  const [totalCount, setTotalCount] = useState<number>(4);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSheetId, setEditSheetId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo' | 'suspenso'>('ativo');

  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newTenantId, setNewTenantId] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newSheetId, setNewSheetId] = useState<string>('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [newStatus, setNewStatus] = useState<'ativo' | 'inativo' | 'suspenso'>('ativo');

  // Fetch tenants from Supabase with Server-Side Pagination
  const fetchTenantsFromSupabase = async (page = 1) => {
    setIsLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // 1. Get total count
      const { count, error: countError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        setTotalCount(count);
      }

      // 2. Get paginated data
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setTenants(data);
        setSupabaseConnected(true);
        addToast(`Inquilinos (Página ${page}) carregados do Supabase com sucesso!`, 'success');
      } else if (data && data.length === 0 && count === 0) {
        setTenants([]);
        setSupabaseConnected(true);
      }
    } catch (err: any) {
      console.warn('[TenantManager] Supabase offline or table not created yet, using local pagination fallback:', err.message);
      setSupabaseConnected(false);
      const saved = localStorage.getItem('supabase_tenants_manager');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTotalCount(parsed.length);
          const sliced = parsed.slice(from, to + 1);
          setTenants(sliced);
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsFromSupabase(currentPage);
  }, [currentPage]);

  const saveTenants = async (updated: TenantItem[]) => {
    setTenants(updated);
    localStorage.setItem('supabase_tenants_manager', JSON.stringify(updated));
    setTotalCount(updated.length);
  };

  const handleStartEdit = (t: TenantItem) => {
    setEditingId(t.id);
    setEditSheetId(t.google_sheet_id);
    setEditStatus(t.status);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editSheetId.trim()) {
      addToast('O Google Sheet ID não pode estar vazio.', 'error');
      return;
    }

    const updated = tenants.map(t => {
      if (t.id === id) {
        return { ...t, google_sheet_id: editSheetId.trim(), status: editStatus };
      }
      return t;
    });

    await saveTenants(updated);
    setEditingId(null);
    addToast(`Inquilino atualizado com sucesso! Status: ${editStatus.toUpperCase()}`, 'success');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId.trim() || !newEmail.trim() || !newSheetId.trim()) {
      addToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const newItem: TenantItem = {
      id: Date.now().toString(),
      tenant_id: newTenantId.trim().toUpperCase(),
      email_admin: newEmail.trim(),
      google_sheet_id: newSheetId.trim(),
      status: newStatus,
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...tenants];
    await saveTenants(updated);

    setShowNewModal(false);
    setNewTenantId('');
    setNewEmail('');
    setNewSheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    setNewStatus('ativo');
    addToast('Novo Inquilino cadastrado com sucesso!', 'success');
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Users className="w-5 h-5 text-indigo-500" /> TenantManager - Gestão Multi-Tenant (Server-Side Pagination)
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Listagem paginada no servidor Supabase, evitando sobrecarga de dados e otimizando a performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTenantsFromSupabase(currentPage)}
            disabled={isLoading}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title="Sincronizar com Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Tenant
          </button>
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${supabaseConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
        <div className="flex items-center gap-3 text-xs font-medium">
          {supabaseConnected ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
          <span>
            {supabaseConnected 
              ? `Conectado ao PostgreSQL do Supabase. Exibindo página ${currentPage} de ${totalPages} (${totalCount} registros totais).` 
              : `Modo Local com Paginação Server-Side Simulada. Exibindo ${tenants.length} de ${totalCount} registros.`}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
          Total: {totalCount} Inquilinos
        </span>
      </div>

      {/* Tenants Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <th className="p-4">Tenant ID</th>
                <th className="p-4">E-mail Admin</th>
                <th className="p-4">Google Sheet ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Criado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-mono">
              {tenants.map(t => (
                <tr key={t.id || t.tenant_id} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-4 font-bold text-indigo-400">{t.tenant_id}</td>
                  <td className="p-4">{t.email_admin}</td>
                  <td className="p-4">
                    {editingId === t.id ? (
                      <input
                        type="text"
                        value={editSheetId}
                        onChange={(e) => setEditSheetId(e.target.value)}
                        className={`px-3 py-1.5 rounded-lg border text-xs w-full font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
                      />
                    ) : (
                      <span className="truncate max-w-xs block text-slate-400" title={t.google_sheet_id}>{t.google_sheet_id}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === t.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="suspenso">Suspenso</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        t.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        t.status === 'inativo' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{t.created_at ? t.created_at.split('T')[0] : '2026-01-01'}</td>
                  <td className="p-4 text-right">
                    {editingId === t.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(t.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                          title="Salvar alterações"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(t)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 ml-auto cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar Sheet ID
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className={`p-4 border-t flex items-center justify-between text-xs font-sans ${darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <div className="font-medium">
            Mostrando página <span className="font-bold text-indigo-400">{currentPage}</span> de <span className="font-bold">{totalPages}</span> ({totalCount} inquilinos no total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="px-3 py-1 font-mono font-bold text-indigo-500">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'}`}
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Novo Inquilino */}
      {showNewModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" /> Cadastrar Novo Inquilino (Tenant)
              </h4>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded-lg hover:bg-slate-500/10 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold mb-1">Tenant ID (Ex: TENANT-FILIAL-MG)</label>
                <input
                  type="text"
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  placeholder="TENANT-NOME"
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">E-mail do Administrador</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Google Sheet ID do Inquilino</label>
                <input
                  type="text"
                  value={newSheetId}
                  onChange={(e) => setNewSheetId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Status Inicial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  Salvar Inquilino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
