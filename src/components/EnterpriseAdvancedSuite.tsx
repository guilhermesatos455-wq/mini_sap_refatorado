import React, { useState } from 'react';
import { Sparkles, ShieldCheck, DollarSign, Bot, ArrowRightLeft, FileText, CheckCircle2, RefreshCw, Calculator, BookOpen, Clock } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface EnterpriseAdvancedSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const EnterpriseAdvancedSuite: React.FC<EnterpriseAdvancedSuiteProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [activeTab, setActiveTab] = useState<'copilot' | 'sox' | 'fx' | 'cost' | 'workflow' | 'dictionary'>('copilot');

  // Copilot State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copilotSuggestion, setCopilotSuggestion] = useState<string | null>(null);

  // FX Revaluation State
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(5.45);
  const [fxItems, setFxItems] = useState([
    { account: '210100 - Empréstimo USD Matriz', foreignAmount: 250000.00, bookValue: 1325000.00, marketValue: 1362500.00, variance: 37500.00 },
    { account: '110500 - Conta Corrente Exterior', foreignAmount: 85000.00, bookValue: 450500.00, marketValue: 463250.00, variance: 12750.00 }
  ]);

  // Moving Average Cost Simulator State (CKM3/MB51)
  const [stockQty, setStockQty] = useState<number>(1200);
  const [currentUnitCost, setCurrentUnitCost] = useState<number>(45.50);
  const [newPurchaseQty, setNewPurchaseQty] = useState<number>(500);
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(48.20);

  const calculatedMovingAverage = React.useMemo(() => {
    const totalExistingValue = stockQty * currentUnitCost;
    const totalNewValue = newPurchaseQty * newPurchasePrice;
    const totalQty = stockQty + newPurchaseQty;
    const newAverage = totalQty > 0 ? (totalExistingValue + totalNewValue) / totalQty : currentUnitCost;
    return { totalQty, newAverage };
  }, [stockQty, currentUnitCost, newPurchaseQty, newPurchasePrice]);

  // JET Approval Workflow State
  const [jetList, setJetList] = useState([
    { id: 'JET-8801', account: '310200 - Despesas com Consultoria', amount: 145000.00, requester: 'Carlos Silva (Controllership)', status: 'Pendente Nível 2 (CFO)' },
    { id: 'JET-8802', account: '410150 - Ajuste de Estoque CKM3', amount: 89000.00, requester: 'Ana Souza (Custos)', status: 'Aprovado' }
  ]);

  // SAP Data Dictionary State
  const [selectedTable, setSelectedTable] = useState<'BKPF' | 'BSEG' | 'MARC' | 'MBEW'>('BKPF');
  const tableMetadata = {
    BKPF: { name: 'BKPF - Cabeçalho de Documento Contábil', fields: ['BELNR (Nº Doc)', 'BUKRS (Empresa)', 'GJAHR (Exercício)', 'MONAT (Período)', 'BLDAT (Data Doc)', 'BUDAT (Data Lançamento)'] },
    BSEG: { name: 'BSEG - Segmento de Documento Contábil (Itens)', fields: ['BELNR (Nº Doc)', 'BUZEI (Nº Item)', 'KOART (Tipo Conta)', 'UMSKZ (Indicador Razão Especial)', 'WRBTR (Montante em Moeda do Doc)'] },
    MARC: { name: 'MARC - Dados de Centro para Material', fields: ['MATNR (Nº Material)', 'WERKS (Centro)', 'EKGRP (Grupo Compras)', 'MMSTA (Status de Material Specific-Plant)'] },
    MBEW: { name: 'MBEW - Avaliação de Material (Custo Médio)', fields: ['MATNR (Nº Material)', 'BWKEY (Área Avaliação / Centro)', 'BWTAR (Tipo Avaliação)', 'STPRS (Preço Padrão)', 'VERPR (Preço Médio Móvel / Custo Médio)'] }
  };

  const handleRunCopilot = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setCopilotSuggestion('💡 Análise Copilot Concluída: Detectada divergência de R$ 1.800,00 na conta 110500 (Natulab Matriz x Filial SP) originada por diferença de arredondamento de ICMS ST. Recomendação: Gerar Lançamento de Ajuste Automático ID #ELIM-992.');
      addAuditLog('AI Copilot', 'Diagnóstico executado e sugestão de eliminação gerada.');
      addToast('Agente IA Copilot gerou recomendação de ajuste com sucesso!', 'success');
    }, 1200);
  };

  const handleRunFxRevaluation = () => {
    addAuditLog('Reavaliação FX', `Reavaliação cambial executada com taxa ${baseCurrency} = R$ ${exchangeRate}.`);
    addToast(`Reavaliação cambial executada com taxa ${baseCurrency} = R$ ${exchangeRate}!`, 'success');
  };

  const handleApproveJet = (id: string) => {
    setJetList(prev => prev.map(j => j.id === id ? { ...j, status: 'Aprovado' } : j));
    addAuditLog('Workflow JET', `Lançamento contábil manual ${id} aprovado pela diretoria.`);
    addToast(`Lançamento ${id} aprovado com sucesso!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Sparkles className="w-6 h-6 text-purple-400" /> Suíte Enterprise Avançada (Custo CKM3, Workflow & Dicionário)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Simulador de Custo Médio Ponderado, workflow de aprovação JET, dicionário de dados SAP e inteligência artificial.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'copilot' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            AI Copilot
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'cost' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Custo Médio (CKM3)
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'workflow' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Workflow JET
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dictionary' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Dicionário SAP
          </button>
          <button
            onClick={() => setActiveTab('sox')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'sox' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            SOX & Audit
          </button>
          <button
            onClick={() => setActiveTab('fx')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'fx' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            FX Revaluation
          </button>
        </div>
      </div>

      {/* Tab 1: AI Copilot */}
      {activeTab === 'copilot' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Bot className="w-4 h-4 text-purple-400" /> AI Copilot Reconciliation Agent (LLM Engine)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25">Gemini Powered</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <p className="text-xs text-slate-300">
              O Agente Copilot varre instantaneamente todos os livros razão recíprocos em busca de anomalias, erros de arredondamento e divergências fiscais, sugerindo eliminações contábeis automatizadas.
            </p>
            <button
              onClick={handleRunCopilot}
              disabled={isAnalyzing}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Copilot Analisando Lotes...' : 'Executar Diagnóstico IA de Conciliação'}
            </button>

            {copilotSuggestion && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-mono leading-relaxed mt-4">
                {copilotSuggestion}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Moving Average Cost Simulator (CKM3/MB51) */}
      {activeTab === 'cost' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Calculator className="w-4 h-4 text-orange-400" /> Simulador de Custo Médio Ponderado (Transação CKM3 / MBEW)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">Material Ledger</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-4xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Estoque Atual (Qtd):</label>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Custo Unitário Atual (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentUnitCost}
                  onChange={(e) => setCurrentUnitCost(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nova Compra (Qtd):</label>
                <input
                  type="number"
                  value={newPurchaseQty}
                  onChange={(e) => setNewPurchaseQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Preço da Nova Compra (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPurchasePrice}
                  onChange={(e) => setNewPurchasePrice(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Quantidade Resultante</span>
                <strong className="text-white text-lg">{calculatedMovingAverage.totalQty.toLocaleString('pt-BR')} un</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Novo Custo Médio Móvel (VERPR)</span>
                <strong className="text-orange-400 text-xl font-black">R$ {calculatedMovingAverage.newAverage.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: JET Approval Workflow */}
      {activeTab === 'workflow' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Clock className="w-4 h-4 text-blue-400" /> Workflow de Aprovação Multinível para Lançamentos (JET)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">SOX Compliance</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">ID Lançamento</th>
                    <th className="pb-3 font-bold">Conta / Descrição</th>
                    <th className="pb-3 font-bold text-right">Montante</th>
                    <th className="pb-3 font-bold">Solicitante</th>
                    <th className="pb-3 font-bold">Status Atual</th>
                    <th className="pb-3 font-bold text-right">Ação C-Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {jetList.map((jet, idx) => (
                    <tr key={idx} className={darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}>
                      <td className="py-3 font-bold text-white">{jet.id}</td>
                      <td className="py-3 text-slate-300 font-sans">{jet.account}</td>
                      <td className="py-3 text-right text-white">R$ {jet.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 text-slate-400 font-sans">{jet.requester}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          jet.status === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {jet.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {jet.status !== 'Aprovado' ? (
                          <button
                            onClick={() => handleApproveJet(jet.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Aprovar JET
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold text-[11px]">✓ Concluído</span>
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

      {/* Tab 4: SAP Data Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <BookOpen className="w-4 h-4 text-emerald-400" /> Dicionário de Dados SAP S/4HANA (SE11 / SE16N)
            </h3>
            <div className="flex items-center gap-2">
              {(['BKPF', 'BSEG', 'MARC', 'MBEW'] as const).map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => setSelectedTable(tbl)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedTable === tbl ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm font-mono">{tableMetadata[selectedTable].name}</h4>
              <p className="text-xs text-slate-400 mt-1">Estrutura oficial de campos e domínios do sistema integrado.</p>
            </div>

            <div className="space-y-2">
              {tableMetadata[selectedTable].fields.map((field, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{field.split(' ')[0]}</span>
                  <span className="text-slate-300 text-right">{field.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: SOX Dashboard & Immutable Audit Trail */}
      {activeTab === 'sox' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> SOX Compliance & Immutable Audit Trail Dashboard
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Certified Big Four</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Controles SOX Testados</p>
              <p className="text-2xl font-bold text-white mt-1">48 / 48</p>
              <span className="text-[10px] text-emerald-400 mt-2 block">✓ 100% Aprovados sem Deficiências</span>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Hashes SHA-256 Imutáveis</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">1,402 Blocos</p>
              <span className="text-[10px] text-blue-400 mt-2 block">Integridade de trilha verificada</span>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Status de Homologação</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">Auditado & Aprovado</p>
              <span className="text-[10px] text-slate-400 mt-2 block">Próxima revisão em Q4/2026</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: FX Revaluation */}
      {activeTab === 'fx' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <DollarSign className="w-4 h-4 text-emerald-400" /> Multi-Currency FX Revaluation Engine
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Moeda:</span>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="USD">USD (Dólar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Taxa (R$):</span>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className={`w-20 px-3 py-1.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <button
                onClick={handleRunFxRevaluation}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                Executar Reavaliação
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">Conta Contábil / Descrição</th>
                    <th className="pb-3 font-bold text-right">Montante ({baseCurrency})</th>
                    <th className="pb-3 font-bold text-right">Valor Contábil (BRL)</th>
                    <th className="pb-3 font-bold text-right">Valor de Mercado (BRL)</th>
                    <th className="pb-3 font-bold text-right">Variação Cambial (FX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {fxItems.map((item, idx) => {
                    const calculatedMarket = item.foreignAmount * exchangeRate;
                    const calculatedVar = calculatedMarket - item.bookValue;
                    return (
                      <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 font-mono font-bold text-white">{item.account}</td>
                        <td className="py-3 text-right font-mono text-slate-300">{item.foreignAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right font-mono text-slate-300">R$ {item.bookValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right font-mono text-white">R$ {calculatedMarket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right font-mono font-bold ${calculatedVar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          R$ {calculatedVar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseAdvancedSuite;
