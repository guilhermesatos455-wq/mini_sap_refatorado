import React, { useState } from 'react';
import { Building2, ArrowRightLeft, AlertTriangle, CheckCircle2, FileText, Download, ShieldCheck, RefreshCw, Upload, FileCode, MessageSquareWarning, Calculator, BarChart3, Eye, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface IntercompanyPageProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface IntercompanyRecord {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  account: string;
  sourceAmount: number;
  targetAmount: number;
  difference: number;
  status: 'Reconciliado' | 'Divergência Crítica' | 'Pendente Ajuste';
  taxVariance?: number;
  disputeNote?: string;
  eliminationGenerated?: boolean;
  priority?: 'Alta' | 'Média' | 'Baixa';
}

export const IntercompanyConsolidation: React.FC<IntercompanyPageProps> = ({ darkMode, addToast }) => {
  const [entities, setEntities] = useState<string[]>([
    'Natulab Matriz - Indústria (1000)',
    'Natulab Filial SP - Logística (2000)',
    'Natulab Nordeste - Distribuição (3000)',
    'Pharma Holding Participações (4000)'
  ]);

  const [records, setRecords] = useState<IntercompanyRecord[]>([
    { id: 'IC-8821', sourceEntity: 'Natulab Matriz - Indústria (1000)', targetEntity: 'Natulab Filial SP - Logística (2000)', account: '110500 - Conta Corrente Intercompany', sourceAmount: 1450000.00, targetAmount: 1448200.00, difference: 1800.00, status: 'Divergência Crítica', taxVariance: 240.50, disputeNote: 'Divergência de ICMS Substituição Tributária entre SP e BA.', eliminationGenerated: false, priority: 'Alta' },
    { id: 'IC-8822', sourceEntity: 'Natulab Matriz - Indústria (1000)', targetEntity: 'Natulab Nordeste - Distribuição (3000)', account: '210100 - Empréstimos Intercompany', sourceAmount: 3200000.00, targetAmount: 3200000.00, difference: 0.00, status: 'Reconciliado', taxVariance: 0.00, disputeNote: '', eliminationGenerated: true, priority: 'Baixa' },
    { id: 'IC-8823', sourceEntity: 'Natulab Filial SP - Logística (2000)', targetEntity: 'Natulab Nordeste - Distribuição (3000)', account: '110900 - Repasses Operacionais', sourceAmount: 410500.50, targetAmount: 399000.00, difference: 11500.50, status: 'Pendente Ajuste', taxVariance: 1250.00, disputeNote: 'Falta de baixa em nota de frete recíproco.', eliminationGenerated: false, priority: 'Alta' },
    { id: 'IC-8824', sourceEntity: 'Natulab Matriz - Indústria (1000)', targetEntity: 'Pharma Holding Participações (4000)', account: '330200 - Royalties & Marcas', sourceAmount: 850000.00, targetAmount: 850000.00, difference: 0.00, status: 'Reconciliado', taxVariance: 0.00, disputeNote: '', eliminationGenerated: true, priority: 'Média' }
  ]);

  const [isReconciling, setIsReconciling] = useState(false);
  const [newSource, setNewSource] = useState(entities[0]);
  const [newTarget, setNewTarget] = useState(entities[1]);
  const [newAccount, setNewAccount] = useState('110500 - Conta Corrente Intercompany');
  const [newSourceAmt, setNewSourceAmt] = useState('500000');
  const [newTargetAmt, setNewTargetAmt] = useState('495000');

  // Dispute modal state
  const [selectedRecord, setSelectedRecord] = useState<IntercompanyRecord | null>(null);
  const [disputeText, setDisputeText] = useState('');

  // Expand details modal state
  const [expandedRecord, setExpandedRecord] = useState<IntercompanyRecord | null>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [prioritySort, setPrioritySort] = useState<'Todos' | 'Alta' | 'Média' | 'Baixa'>('Todos');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPriority, setBulkPriority] = useState<'Alta' | 'Média' | 'Baixa'>('Alta');

  const toggleSelectAll = (filteredRecords: IntercompanyRecord[]) => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApplyPriority = () => {
    if (selectedIds.length === 0) {
      addToast('Nenhum item selecionado para a ação em massa.', 'error');
      return;
    }
    setRecords(records.map(r => selectedIds.includes(r.id) ? { ...r, priority: bulkPriority } : r));
    addToast(`Prioridade '${bulkPriority}' aplicada com sucesso a ${selectedIds.length} itens selecionados!`, 'success');
    setSelectedIds([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(Boolean);
        if (lines.length > 1) {
          const imported: IntercompanyRecord[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(/[,;]/);
            if (cols.length >= 5) {
              const srcAmt = Number(cols[3].replace(/[R$\s.]/g, '').replace(',', '.')) || 100000;
              const tgtAmt = Number(cols[4].replace(/[R$\s.]/g, '').replace(',', '.')) || 98000;
              const diff = Math.abs(srcAmt - tgtAmt);
              imported.push({
                id: `IC-IMP-${Math.floor(100 + Math.random() * 900)}`,
                sourceEntity: cols[0]?.trim() || entities[0],
                targetEntity: cols[1]?.trim() || entities[1],
                account: cols[2]?.trim() || '110500 - Conta Corrente',
                sourceAmount: srcAmt,
                targetAmount: tgtAmt,
                difference: diff,
                status: diff === 0 ? 'Reconciliado' : diff > 5000 ? 'Divergência Crítica' : 'Pendente Ajuste',
                taxVariance: Number((diff * 0.18).toFixed(2)),
                disputeNote: '',
                eliminationGenerated: false
              });
            }
          }
          if (imported.length > 0) {
            setRecords([...imported, ...records]);
            addToast(`Importados e comparados ${imported.length} registros de Notas Fiscais Intercompany com sucesso!`, 'success');
          } else {
            addToast('Nenhum registro válido encontrado no arquivo.', 'error');
          }
        } else {
          addToast('Arquivo vazio ou com formato inválido.', 'error');
        }
      } catch (err: any) {
        addToast(`Erro ao processar arquivo: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      const updated = records.map(r => {
        const diff = Math.abs(r.sourceAmount - r.targetAmount);
        return {
          ...r,
          difference: diff,
          status: diff === 0 ? ('Reconciliado' as const) : diff > 5000 ? ('Divergência Crítica' as const) : ('Pendente Ajuste' as const),
          taxVariance: Number((diff * 0.18).toFixed(2))
        };
      });
      setRecords(updated);
      setIsReconciling(false);
      addToast('Varredura com SuiteTax e SuiteFlow concluída com sucesso!', 'success');
    }, 1200);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const srcAmt = Number(newSourceAmt) || 0;
    const tgtAmt = Number(newTargetAmt) || 0;
    const diff = Math.abs(srcAmt - tgtAmt);

    const newRec: IntercompanyRecord = {
      id: `IC-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceEntity: newSource,
      targetEntity: newTarget,
      account: newAccount,
      sourceAmount: srcAmt,
      targetAmount: tgtAmt,
      difference: diff,
      status: diff === 0 ? 'Reconciliado' : diff > 5000 ? 'Divergência Crítica' : 'Pendente Ajuste',
      taxVariance: Number((diff * 0.18).toFixed(2)),
      disputeNote: '',
      eliminationGenerated: false
    };

    setRecords([newRec, ...records]);
    addToast('Par de transação Intercompany cadastrado e analisado pelo SuiteTax!', 'success');
  };

  const togglePriority = (id: string) => {
    setRecords(records.map(r => {
      if (r.id !== id) return r;
      const nextPrio: 'Alta' | 'Média' | 'Baixa' = r.priority === 'Alta' ? 'Média' : r.priority === 'Média' ? 'Baixa' : 'Alta';
      return { ...r, priority: nextPrio };
    }));
    addToast('Prioridade atualizada com sucesso!', 'success');
  };

  const handleGenerateElimination = (id: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, eliminationGenerated: true, status: 'Reconciliado', difference: 0 } : r));
    addToast('Lançamento de Eliminação contábil gerado com sucesso!', 'success');
  };

  const handleSaveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setRecords(records.map(r => r.id === selectedRecord.id ? { ...r, disputeNote: disputeText } : r));
    addToast('Nota de Contestação SOX salva com sucesso!', 'success');
    setSelectedRecord(null);
    setDisputeText('');
  };

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Conta,Origem,Destino,ValorOrigem,ValorDestino,Diferenca,SuiteTax,Status,NotaSOX,Eliminacao"].join(",") + "\n"
      + records.map(r => `"${r.id}","${r.account}","${r.sourceEntity}","${r.targetEntity}",${r.sourceAmount},${r.targetAmount},${r.difference},${r.taxVariance || 0},"${r.status}","${r.disputeNote || ''}",${r.eliminationGenerated ? 'Sim' : 'Nao'}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Consolidacao_Intercompany_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Relatório executivo exportado com sucesso (CSV/Excel)!', 'success');
  };

  const totalDivergence = records.reduce((acc, curr) => acc + curr.difference, 0);
  const totalTaxVariance = records.reduce((acc, curr) => acc + (curr.taxVariance || 0), 0);

  // Prepare chart data
  const chartData = records.map(r => ({
    name: r.id,
    Origem: r.sourceAmount,
    Destino: r.targetAmount,
    Diferenca: r.difference
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Building2 className="w-6 h-6 text-[#8DC63F]" /> Consolidação Intercompany Avançada (SuiteTax & SuiteFlow)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gerencie saldos recíprocos, simule alíquotas fiscais multi-jurisdicionais, gere lançamentos de eliminação e abra contestações SOX.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" /> Exportar Relatório Executivo
          </button>
          <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer border border-slate-700 transition-colors">
            <Upload className="w-4 h-4 text-[#8DC63F]" /> Importar NFs
            <input type="file" accept=".csv,.txt,.xlsx" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="px-5 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Processando...' : 'Varredura SuiteTax'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <p className="text-xs text-slate-400 font-medium">Pares Recíprocos</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{records.length} Relações</p>
          <span className="text-[10px] text-emerald-400 mt-2 block">✓ Cobertura 100% Coligadas</span>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <p className="text-xs text-slate-400 font-medium">Divergência Total</p>
          <p className={`text-2xl font-bold mt-1 text-amber-400`}>R$ {totalDivergence.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <span className="text-[10px] text-slate-400 mt-2 block">Limite SOX: &lt; R$ 1.000</span>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <p className="text-xs text-slate-400 font-medium">SuiteTax Variance (ICMS/PIS)</p>
          <p className={`text-2xl font-bold mt-1 text-blue-400`}>R$ {totalTaxVariance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <span className="text-[10px] text-blue-400 mt-2 block">Análise multi-jurisdicional ativa</span>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <p className="text-xs text-slate-400 font-medium">Eliminações Geradas</p>
          <p className={`text-2xl font-bold mt-1 text-emerald-400`}>
            {records.filter(r => r.eliminationGenerated).length} / {records.length}
          </p>
          <span className="text-[10px] text-emerald-400 mt-2 block">Pronto para balanço consolidado</span>
        </div>
      </div>

      {/* Analytics Chart Section */}
      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <BarChart3 className="w-4 h-4 text-[#8DC63F]" /> Comparativo Visual de Saldos Origem vs Destino (R$)
          </h4>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">NetSuite Analytics</span>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} fontSize={11} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e5e7eb', borderRadius: 8, fontSize: 12 }} 
                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Origem" fill="#8DC63F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Destino" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Pair */}
        <div className={`lg:col-span-1 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit flex items-center gap-2`}>
            <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Cadastrar Par Intercompany
          </h4>
          <form onSubmit={handleAddRecord} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Entidade Origem</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                {entities.map(ent => <option key={ent} value={ent}>{ent}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Entidade Destino</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                {entities.map(ent => <option key={ent} value={ent}>{ent}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Conta Contábil / Descrição</label>
              <input
                type="text"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Valor Origem (R$)</label>
                <input
                  type="number"
                  value={newSourceAmt}
                  onChange={(e) => setNewSourceAmt(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Valor Destino (R$)</label>
                <input
                  type="number"
                  value={newTargetAmt}
                  onChange={(e) => setNewTargetAmt(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors mt-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Registrar & Analisar SuiteTax
            </button>
          </form>
        </div>

        {/* Right: Table */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-inherit flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <FileText className="w-4 h-4 text-emerald-500" /> Relatório de Consolidado & Eliminações (NetSuite)
              </h4>
              <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-300 font-bold">Prioridade:</span>
                <select
                  value={prioritySort}
                  onChange={(e) => setPrioritySort(e.target.value as any)}
                  className="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Todos" className="bg-slate-900 text-white">Todas (Padrão)</option>
                  <option value="Alta" className="bg-slate-900 text-rose-400">Alta Urgência</option>
                  <option value="Média" className="bg-slate-900 text-amber-400">Média Urgência</option>
                  <option value="Baixa" className="bg-slate-900 text-emerald-400">Baixa Urgência</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  placeholder="Filtrar por ID, conta ou fornecedor..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#8DC63F]`}
                />
              </div>
              <button
                onClick={() => {
                  const csv = records.map(r => `${r.id};${r.account};${r.sourceEntity};${r.targetEntity};${r.difference}`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'intercompany_table.csv';
                  a.click();
                  addToast('Tabela exportada para CSV com sucesso!', 'success');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Exportar dados da tabela para CSV"
              >
                <Download className="w-3 h-3 text-[#8DC63F]" /> Exportar CSV
              </button>
              <button
                onClick={() => {
                  const text = records.map(r => `${r.id} | ${r.sourceEntity} -> ${r.targetEntity} | Dif: R$ ${r.difference.toFixed(2)} | Status: ${r.status}`).join('\n');
                  navigator.clipboard.writeText(text);
                  addToast('Conteúdo da tabela copiado para o clipboard com sucesso!', 'success');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copiar dados para a área de transferência"
              >
                <FileCode className="w-3 h-3 text-blue-400" /> Copiar Tabela
              </button>
              <button
                onClick={() => {
                  addToast('E-mail de alerta SMTP padrão disparado para auditoria@natulab.com.br com sucesso!', 'success');
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Disparar e-mail de alerta padrão via SMTP"
              >
                <RefreshCw className="w-3 h-3" /> Disparar E-mail SMTP
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* Bulk Selection Action Bar */}
            <div className="flex items-center justify-between bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700 mb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-bold">
                  {selectedIds.length} de {records.filter(rec => {
                    const matchesSearch = tableSearchQuery === '' || 
                      rec.id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.account.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.sourceEntity.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.targetEntity.toLowerCase().includes(tableSearchQuery.toLowerCase());
                    const matchesPriority = prioritySort === 'Todos' || rec.priority === prioritySort;
                    return matchesSearch && matchesPriority;
                  }).length} itens selecionados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Atribuir Prioridade em Massa:</span>
                <select
                  value={bulkPriority}
                  onChange={(e) => setBulkPriority(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none"
                >
                  <option value="Alta">Alta Urgência</option>
                  <option value="Média">Média Urgência</option>
                  <option value="Baixa">Baixa Urgência</option>
                </select>
                <button
                  onClick={handleBulkApplyPriority}
                  disabled={selectedIds.length === 0}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-lg transition-colors cursor-pointer shadow"
                >
                  Aplicar aos Selecionados
                </button>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                <tr>
                  <th className="pb-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={(() => {
                        const filtered = records.filter(rec => {
                          const matchesSearch = tableSearchQuery === '' || 
                            rec.id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.account.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.sourceEntity.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.targetEntity.toLowerCase().includes(tableSearchQuery.toLowerCase());
                          const matchesPriority = prioritySort === 'Todos' || rec.priority === prioritySort;
                          return matchesSearch && matchesPriority;
                        });
                        return filtered.length > 0 && selectedIds.length === filtered.length;
                      })()}
                      onChange={() => {
                        const filtered = records.filter(rec => {
                          const matchesSearch = tableSearchQuery === '' || 
                            rec.id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.account.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.sourceEntity.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                            rec.targetEntity.toLowerCase().includes(tableSearchQuery.toLowerCase());
                          const matchesPriority = prioritySort === 'Todos' || rec.priority === prioritySort;
                          return matchesSearch && matchesPriority;
                        });
                        toggleSelectAll(filtered);
                      }}
                      className="rounded accent-purple-600 cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 font-bold">ID / Conta</th>
                  <th className="pb-3 font-bold">Entidades (Origem ➔ Destino)</th>
                  <th className="pb-3 font-bold text-right">Diferença</th>
                  <th className="pb-3 font-bold text-right">SuiteTax (Impostos)</th>
                  <th className="pb-3 font-bold text-center">Status</th>
                  <th className="pb-3 font-bold text-center">Ações NetSuite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {records
                  .filter(rec => {
                    const matchesSearch = tableSearchQuery === '' || 
                      rec.id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.account.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.sourceEntity.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                      rec.targetEntity.toLowerCase().includes(tableSearchQuery.toLowerCase());
                    const matchesPriority = prioritySort === 'Todos' || rec.priority === prioritySort;
                    return matchesSearch && matchesPriority;
                  })
                  .sort((a, b) => {
                    const weight = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
                    return (weight[a.priority || 'Média'] || 2) - (weight[b.priority || 'Média'] || 2);
                  })
                  .map((rec) => (
                  <tr key={rec.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'} ${selectedIds.includes(rec.id) ? 'bg-purple-900/15' : ''}`}>
                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rec.id)}
                        onChange={() => toggleSelectOne(rec.id)}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rec.id}</span>
                        <button
                          onClick={() => togglePriority(rec.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            rec.priority === 'Alta' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                              : rec.priority === 'Média'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          }`}
                          title="Clique para alternar prioridade (Alta/Média/Baixa)"
                        >
                          {rec.priority || 'Média'}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400">{rec.account}</span>
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-xs truncate max-w-[180px]" title={rec.sourceEntity}>{rec.sourceEntity}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[180px]" title={rec.targetEntity}>↳ {rec.targetEntity}</p>
                      {rec.disputeNote && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                          <MessageSquareWarning className="w-3 h-3" /> SOX Note: {rec.disputeNote}
                        </p>
                      )}
                    </td>
                    <td className={`py-3 text-right font-mono font-bold ${rec.difference > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      R$ {rec.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-mono text-blue-400 font-medium">
                      R$ {(rec.taxVariance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.status === 'Reconciliado'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : rec.status === 'Divergência Crítica'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 text-center space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setExpandedRecord(rec)}
                        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Expandir Detalhes de Auditoria"
                      >
                        <Eye className="w-3 h-3" /> Detalhes
                      </button>
                      {!rec.eliminationGenerated ? (
                        <button
                          onClick={() => handleGenerateElimination(rec.id)}
                          className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          title="Gerar Lançamento de Eliminação Contábil"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold px-1">✓</span>
                      )}
                      <button
                        onClick={() => { setSelectedRecord(rec); setDisputeText(rec.disputeNote || ''); }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        title="Abrir Contestação & Nota SOX"
                      >
                        Contestar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Expandir Detalhes de Auditoria */}
      {expandedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'} space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Detalhes de Auditoria & Histórico: {expandedRecord.id}
              </h3>
              <button
                onClick={() => setExpandedRecord(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                <p className="text-slate-400 font-bold mb-1">Entidade Origem</p>
                <p className="text-white font-medium">{expandedRecord.sourceEntity}</p>
                <p className="text-emerald-400 font-mono mt-1">R$ {expandedRecord.sourceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                <p className="text-slate-400 font-bold mb-1">Entidade Destino</p>
                <p className="text-white font-medium">{expandedRecord.targetEntity}</p>
                <p className="text-blue-400 font-mono mt-1">R$ {expandedRecord.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-slate-300">Histórico de Alterações & Trace de Auditoria:</h4>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 font-mono text-[11px] space-y-1 text-slate-300">
                <p>• [2026-09-11 08:30] Registro criado automaticamente via importação de NFs (Lote #492).</p>
                <p>• [2026-09-11 08:32] Varredura SuiteTax executada: Variação de imposto calculada em R$ {(expandedRecord.taxVariance || 0).toFixed(2)}.</p>
                <p>• [2026-09-11 08:35] Status atualizado para: <strong className="text-amber-400">{expandedRecord.status}</strong>.</p>
                {expandedRecord.disputeNote && <p className="text-rose-400">• Nota SOX registrada: "{expandedRecord.disputeNote}"</p>}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setExpandedRecord(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contestação SOX */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <h3 className="font-bold text-base flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Nota de Contestação & Workflow SOX
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Par: <strong className="text-white">{selectedRecord.id}</strong> ({selectedRecord.sourceEntity} x {selectedRecord.targetEntity})
            </p>
            <form onSubmit={handleSaveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Justificativa e Evidência de Divergência</label>
                <textarea
                  rows={4}
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  placeholder="Descreva o motivo da divergência intercompany e as providências de ajuste contábil exigidas..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  Salvar Nota SOX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntercompanyConsolidation;
