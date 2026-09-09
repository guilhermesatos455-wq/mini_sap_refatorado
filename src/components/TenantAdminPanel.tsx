import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Database, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface TenantItem {
  id: string;
  tenant_id: string;
  email_admin: string;
  google_sheet_id: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

interface TenantAdminPanelProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const TenantAdminPanel: React.FC<TenantAdminPanelProps> = ({ darkMode, addToast }) => {
  const [tenants, setTenants] = useState<TenantItem[]>([
    { id: '1', tenant_id: 'TENANT-CORP-SP', email_admin: 'admin@corpsp.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-01-10' },
    { id: '2', tenant_id: 'TENANT-FILIAL-RJ', email_admin: 'admin@filialrj.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-02-15' },
    { id: '3', tenant_id: 'TENANT-LOGISTICA-SUL', email_admin: 'admin@sul.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-03-01' },
    { id: '4', tenant_id: 'TENANT-GLOBAL-HOLDING', email_admin: 'admin@global.com', google_sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', status: 'ativo', created_at: '2026-03-10' }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSheetId, setEditSheetId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo'>('ativo');
  
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newTenantId, setNewTenantId] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newSheetId, setNewSheetId] = useState<string>('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

  useEffect(() => {
    const saved = localStorage.getItem('supabase_tenants_admin');
    if (saved) {
      try {
        setTenants(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToStorage = (updated: TenantItem[]) => {
    setTenants(updated);
    localStorage.setItem('supabase_tenants_admin', JSON.stringify(updated));
  };

  const handleStartEdit = (t: TenantItem) => {
    setEditingId(t.id);
    setEditSheetId(t.google_sheet_id);
    setEditStatus(t.status);
  };

  const handleSaveEdit = (id: string) => {
    const updated = tenants.map(t => {
      if (t.id === id) {
        return { ...t, google_sheet_id: editSheetId, status: editStatus };
      }
      return t;
    });
    saveToStorage(updated);
    setEditingId(null);
    addToast('Inquilino (Tenant) atualizado com sucesso!', 'success');
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId.trim() || !newEmail.trim()) {
      addToast('Preencha o Tenant ID e o E-mail do Administrador.', 'error');
      return;
    }

    const newItem: TenantItem = {
      id: Date.now().toString(),
      tenant_id: newTenantId.trim().toUpperCase(),
      email_admin: newEmail.trim(),
      google_sheet_id: newSheetId.trim(),
      status: 'ativo',
      created_at: new Date().toISOString().split('T')[0]
    };

    saveToStorage([...tenants, newItem]);
    setShowNewModal(false);
    setNewTenantId('');
    setNewEmail('');
    addToast('Novo Inquilino cadastrado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Users className="w-5 h-5 text-indigo-500" /> Gerenciamento Multi-Tenant (Supabase / PostgreSQL)
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gerencie os inquilinos ativos, seus e-mails de administração e o vínculo dinâmico com o Google Sheet ID.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Inquilino (Tenant)
        </button>
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
                <tr key={t.id} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-4 font-bold text-indigo-400">{t.tenant_id}</td>
                  <td className="p-4">{t.email_admin}</td>
                  <td className="p-4">
                    {editingId === t.id ? (
                      <input
                        type="text"
                        value={editSheetId}
                        onChange={(e) => setEditSheetId(e.target.value)}
                        className={`px-2 py-1 rounded border text-xs w-full ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
                      />
                    ) : (
                      <span className="truncate max-w-xs block text-slate-400" title={t.google_sheet_id}>{t.google_sheet_id}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === t.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'ativo' | 'inativo')}
                        className={`px-2 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${t.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                        {t.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{t.created_at}</td>
                  <td className="p-4 text-right">
                    {editingId === t.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(t.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                          title="Salvar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(t)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 ml-auto cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Tenant Modal */}
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
