import React, { useState } from 'react';
import { Ticket, Plus, CheckCircle2, Clock, AlertTriangle, User, Send, Building2 } from 'lucide-react';

interface SapTicketManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface TicketItem {
  id: string;
  title: string;
  module: 'MM/PP' | 'FI/CO' | 'SD' | 'BASIS' | 'PI/PO';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica (SoD)';
  assignee: string;
  status: 'Aberto' | 'Em Análise' | 'Aguardando Basis' | 'Resolvido';
  date: string;
  description: string;
}

export const SapTicketManager: React.FC<SapTicketManagerProps> = ({ darkMode, addToast }) => {
  const [tickets, setTickets] = useState<TicketItem[]>([
    { id: 'TICK-9021', title: 'Divergência de PMM CKM3 vs MB51 - Planta 1000', module: 'MM/PP', priority: 'Alta', assignee: 'Carlos Basis', status: 'Em Análise', date: '2026-09-10', description: 'Desvio de R$ 1.500,00 identificado no ledger de materiais do item MAT-1024.' },
    { id: 'TICK-9022', title: 'Falha de IDOC INVOIC01 (Status 51)', module: 'PI/PO', priority: 'Crítica (SoD)', assignee: 'Ana Tax', status: 'Aberto', date: '2026-09-10', description: 'Erro na contabilização de fatura de fornecedor devido a inconsistência de imposto retido.' },
    { id: 'TICK-9023', title: 'Conflito SoD Crítico: XK01 + MIRO', module: 'FI/CO', priority: 'Crítica (SoD)', assignee: 'Compliance Team', status: 'Aguardando Basis', date: '2026-09-09', description: 'Usuário MARIO.SILVA possui permissão simultânea de cadastro de fornecedor e lançamento de fatura.' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState<'MM/PP' | 'FI/CO' | 'SD' | 'BASIS' | 'PI/PO'>('MM/PP');
  const [newPriority, setNewPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica (SoD)'>('Alta');
  const [newAssignee, setNewAssignee] = useState('Equipe Basis / SAP');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('O título do chamado é obrigatório.', 'error');
      return;
    }

    const ticket: TicketItem = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      module: newModule,
      priority: newPriority,
      assignee: newAssignee,
      status: 'Aberto',
      date: new Date().toISOString().slice(0, 10),
      description: newDesc || 'Chamado gerado automaticamente pelo sistema de auditoria SAP.'
    };

    setTickets(prev => [ticket, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setShowModal(false);
    addToast('Chamado de correção SAP criado com sucesso!', 'success');
  };

  const handleUpdateStatus = (id: string, nextStatus: TicketItem['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    addToast(`Status do chamado ${id} atualizado para "${nextStatus}".`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Ticket className="w-6 h-6 text-[#8DC63F]" /> Gestão de Chamados e Planos de Ação Corretiva SAP (Jira / ServiceNow Mock)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gerencie planos de ação e tickets de correção para divergências e não-conformidades SOX apontadas nas auditorias.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#8DC63F]/20 transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Novo Chamado SAP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chamados Abertos</span>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tickets.filter(t => t.status !== 'Resolvido').length}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riscos Críticos (SoD)</span>
          <p className="text-2xl font-black text-red-400">{tickets.filter(t => t.priority.includes('Crítica')).length}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolvidos</span>
          <p className="text-2xl font-black text-emerald-400">{tickets.filter(t => t.status === 'Resolvido').length}</p>
        </div>
      </div>

      {/* Ticket List */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b border-inherit font-bold text-xs uppercase tracking-wider text-slate-400">
          Lista de Chamados de Correção SAP
        </div>
        <div className="divide-y divide-inherit">
          {tickets.map((t) => (
            <div key={t.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{t.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.priority.includes('Crítica') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {t.priority}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.module}</span>
                </div>
                <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.title}</h4>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{t.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Responsável: {t.assignee}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Abertura: {t.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={t.status}
                  onChange={(e) => handleUpdateStatus(t.id, e.target.value as TicketItem['status'])}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Aguardando Basis">Aguardando Basis</option>
                  <option value="Resolvido">Resolvido</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <h3 className="font-bold text-base">Criar Novo Chamado de Correção SAP</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Título do Chamado</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Correção de PMM CKM3..."
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Módulo SAP</label>
                  <select
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value as any)}
                    className={`w-full px-4 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  >
                    <option value="MM/PP">MM / PP (Estoque)</option>
                    <option value="FI/CO">FI / CO (Finanças)</option>
                    <option value="SD">SD (Vendas)</option>
                    <option value="BASIS">BASIS / Segurança</option>
                    <option value="PI/PO">PI / PO (IDOCs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Prioridade / Risco</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className={`w-full px-4 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica (SoD)">Crítica (SoD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Descrição / Evidência</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalhes técnicos da divergência encontrada..."
                  className={`w-full p-3 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Salvar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SapTicketManager;
