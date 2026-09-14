import React, { useState } from 'react';
import { GitPullRequest, Database, Calculator, CheckCircle2, AlertTriangle, Layers, FileCode, Search, RefreshCw } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface AdvancedEnterpriseSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const AdvancedEnterpriseSuite: React.FC<AdvancedEnterpriseSuiteProps> = ({ darkMode, addToast }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'dictionary' | 'cost'>('workflow');

  // Workflow / Approval State
  const [workflows, setWorkflows] = useState([
    { id: 'WF-301', title: 'Aprovação de Pedido de Compra Extra-Orçamento', requester: 'compras.sp@holding.com', step: 'Diretoria Financeira', status: 'Pendente' },
    { id: 'WF-302', title: 'Liberação de Crédito Título Vencido (> 60 dias)', requester: 'faturamento@filialrj.com', step: 'Controladoria', status: 'Aprovado' },
    { id: 'WF-303', title: 'Inclusão de Fornecedor sem Homologação Completa', requester: 'suprimentos@pr.com', step: 'Compliance & Risco', status: 'Rejeitado' }
  ]);

  // Dictionary SX2 / SX3 Explorer State
  const [tableCode, setTableCode] = useState('SF1'); // Cabeçalho da Nota Fiscal de Entrada
  const [tableFields, setTableFields] = useState([
    { field: 'F1_FILIAL', type: 'C', size: 2, desc: 'Filial do Sistema' },
    { field: 'F1_DOC', type: 'C', size: 9, desc: 'Número da Nota Fiscal' },
    { field: 'F1_SERIE', type: 'C', size: 3, desc: 'Série da Nota Fiscal' },
    { field: 'F1_FORNECE', type: 'C', size: 6, desc: 'Código do Fornecedor' },
    { field: 'F1_LOJA', type: 'C', size: 2, desc: 'Loja do Fornecedor' },
    { field: 'F1_EMISSAO', type: 'D', size: 8, desc: 'Data de Emissão' }
  ]);

  // Cost Calculation State
  const [costBranch, setCostBranch] = useState('01 - Matriz SP');
  const [costMonth, setCostMonth] = useState('2026/08');
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [costResult, setCostResult] = useState<string | null>(null);

  const handleApproveWorkflow = (id: string, decision: 'Aprovado' | 'Rejeitado') => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, status: decision, step: decision === 'Aprovado' ? 'Concluído' : 'Cancelado' } : w));
    addToast(`Workflow ${id} ${decision.toLowerCase()} com sucesso.`, decision === 'Aprovado' ? 'success' : 'error');
  };

  const handleRunCostRecalc = () => {
    setIsCalculatingCost(true);
    setTimeout(() => {
      setIsCalculatingCost(false);
      setCostResult('Recálculo do Custo Médio finalizado. 1.420 itens recalculados. Saldo de estoque conciliado com a contabilidade.');
      addToast('Custo Médio recalculado e conciliado com sucesso!', 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <GitPullRequest className="w-6 h-6 text-orange-400" /> Suíte Avançada Enterprise (Workflow, Dicionário & Custo Médio)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Portal de aprovação integrado, inspetor de dicionário de dados e recálculo de custo médio empresarial.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'workflow' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Workflow de Aprovações
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dictionary' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Inspetor de Dicionário
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'cost' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Custo Médio Enterprise
          </button>
        </div>
      </div>

      {/* Tab 1: Workflow Approval Portal */}
      {activeTab === 'workflow' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <GitPullRequest className="w-4 h-4 text-orange-400" /> Portal de Aprovação Integrado (Workflow Engine)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">Alçadas Dinâmicas</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">ID Solicitação</th>
                    <th className="pb-3 font-bold">Título / Objeto</th>
                    <th className="pb-3 font-bold">Solicitante</th>
                    <th className="pb-3 font-bold">Etapa Atual</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-center">Ações de Alçada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {workflows.map((wf) => (
                    <tr key={wf.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono font-bold text-white">{wf.id}</td>
                      <td className="py-3 font-medium text-slate-200">{wf.title}</td>
                      <td className="py-3 text-slate-400">{wf.requester}</td>
                      <td className="py-3 text-slate-300 font-mono text-[11px]">{wf.step}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          wf.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          wf.status === 'Rejeitado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {wf.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {wf.status === 'Pendente' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveWorkflow(wf.id, 'Aprovado')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleApproveWorkflow(wf.id, 'Rejeitado')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Encerrado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Data Dictionary Explorer */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Database className="w-4 h-4 text-orange-400" /> Inspetor de Dicionário de Dados Enterprise (Schema)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">Database Schema</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Tabela do Sistema:</label>
              <select
                value={tableCode}
                onChange={(e) => {
                  setTableCode(e.target.value);
                  if (e.target.value === 'SE1') {
                    setTableFields([
                      { field: 'E1_FILIAL', type: 'C', size: 2, desc: 'Filial' },
                      { field: 'E1_PREFIXO', type: 'C', size: 3, desc: 'Prefixo do Título' },
                      { field: 'E1_NUM', type: 'C', size: 9, desc: 'Número do Título' },
                      { field: 'E1_CLIENTE', type: 'C', size: 6, desc: 'Cliente' },
                      { field: 'E1_VALOR', type: 'N', size: 14, desc: 'Valor do Título' }
                    ]);
                  } else {
                    setTableFields([
                      { field: 'F1_FILIAL', type: 'C', size: 2, desc: 'Filial do Sistema' },
                      { field: 'F1_DOC', type: 'C', size: 9, desc: 'Número da Nota Fiscal' },
                      { field: 'F1_SERIE', type: 'C', size: 3, desc: 'Série da Nota Fiscal' },
                      { field: 'F1_FORNECE', type: 'C', size: 6, desc: 'Código do Fornecedor' },
                      { field: 'F1_LOJA', type: 'C', size: 2, desc: 'Loja do Fornecedor' },
                      { field: 'F1_EMISSAO', type: 'D', size: 8, desc: 'Data de Emissão' }
                    ]);
                  }
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="SF1">SF1 - Cabeçalho de Nota Fiscal de Entrada</option>
                <option value="SE1">SE1 - Contas a Receber (Títulos)</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">Campo</th>
                    <th className="pb-3 font-bold">Tipo</th>
                    <th className="pb-3 font-bold">Tamanho</th>
                    <th className="pb-3 font-bold">Descrição do Campo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {tableFields.map((f, i) => (
                    <tr key={i} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono font-bold text-orange-400">{f.field}</td>
                      <td className="py-3 font-mono text-slate-300">{f.type}</td>
                      <td className="py-3 font-mono text-slate-400">{f.size}</td>
                      <td className="py-3 text-slate-200">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cost Recalculation */}
      {activeTab === 'cost' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Calculator className="w-4 h-4 text-orange-400" /> Recálculo do Custo Médio Enterprise
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">Fechamento de Estoque</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Filial / Unidade:</label>
                <select
                  value={costBranch}
                  onChange={(e) => setCostBranch(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="01 - Matriz SP">01 - Matriz SP</option>
                  <option value="02 - Filial RJ">02 - Filial RJ</option>
                  <option value="03 - Filial PR">03 - Filial PR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Competência de Fechamento:</label>
                <select
                  value={costMonth}
                  onChange={(e) => setCostMonth(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="2026/08">Agosto / 2026</option>
                  <option value="2026/07">Julho / 2026</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunCostRecalc}
              disabled={isCalculatingCost}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculatingCost ? 'animate-spin' : ''}`} />
              {isCalculatingCost ? 'Execurando Recálculo e Conciliando Razão...' : 'Executar Recálculo de Custo Médio'}
            </button>

            {costResult && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span>{costResult}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedEnterpriseSuite;
