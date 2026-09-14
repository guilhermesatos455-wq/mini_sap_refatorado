import React, { useState, useMemo } from 'react';
import { 
  Globe2, Leaf, TrendingDown, DollarSign, AlertCircle, 
  ShieldCheck, FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  TrendingUp, Activity, CheckCircle2, Sliders, RefreshCw,
  Search, Filter, Download, X, Check, FileText, AlertTriangle,
  Scale, Zap, Factory, Truck, Layers
} from 'lucide-react';

interface GlobalEnterpriseSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface JetItem {
  id: string;
  docNum: string;
  date: string;
  time: string;
  user: string;
  account: string;
  value: number;
  type: string;
  anomalyReason: string;
  risk: 'Crítico' | 'Alto' | 'Médio';
  status: 'Pendente Investigação' | 'Regularizado c/ Documento' | 'Estornado / Revertido' | 'Apontamento de Fraude';
  evidenceDoc?: string;
  auditorNotes?: string;
}

export const GlobalEnterpriseSuite: React.FC<GlobalEnterpriseSuiteProps> = ({ darkMode, addToast }) => {
  const [activeTab, setActiveTab] = useState<'jet' | 'esg' | 'fx'>('jet');

  // ==========================================
  // 1. JET (Journal Entry Testing) State & Logic
  // ==========================================
  const [jetEntries, setJetEntries] = useState<JetItem[]>([
    { 
      id: 'JET-801', 
      docNum: '100098231', 
      date: '2026-09-12 (Sábado)', 
      time: '23:45', 
      user: 'USR_OPER_03', 
      account: '1.1.02.001 - Caixa Geral & Disponibilidades', 
      value: 250000.00, 
      type: 'Lançamento Manual (FB50)', 
      anomalyReason: 'Horário atípico (Madrugada / Final de semana) e valor redondo sem pedido vinculado',
      risk: 'Crítico', 
      status: 'Pendente Investigação' 
    },
    { 
      id: 'JET-802', 
      docNum: '100098450', 
      date: '2026-09-10 (Quinta)', 
      time: '19:10', 
      user: 'USR_FISCAL_01', 
      account: '2.1.05.004 - Provisões Fiscais Não Dedutíveis', 
      value: 184520.00, 
      type: 'Ajuste de Saldo Manual', 
      anomalyReason: 'Lançamento em conta de reconciliação restrita imediatamente antes do fechamento',
      risk: 'Alto', 
      status: 'Regularizado c/ Documento',
      evidenceDoc: 'SAP-BKP-77402',
      auditorNotes: 'Laudo pericial tributário anexado com autorização do Diretor Financeiro.'
    },
    { 
      id: 'JET-803', 
      docNum: '100098712', 
      date: '2026-09-08 (Terça)', 
      time: '14:22', 
      user: 'USR_ADMIN_09', 
      account: '3.1.01.009 - Despesas com Terceiros & Consultorias', 
      value: 99990.00, 
      type: 'Lançamento Manual Fracionado', 
      anomalyReason: 'Estruturação abaixo do limite de aprovação de alçada de R$ 100.000 (Smurfing contábil)',
      risk: 'Crítico', 
      status: 'Pendente Investigação' 
    },
    { 
      id: 'JET-804', 
      docNum: '100099015', 
      date: '2026-09-05 (Sexta)', 
      time: '18:55', 
      user: 'USR_CONTAB_04', 
      account: '1.1.08.002 - Adiantamentos a Fornecedores Transitória', 
      value: 45000.00, 
      type: 'Partida Dobrada sem Contrapartida Comercial', 
      anomalyReason: 'Conta transitória sem compensação automática por mais de 30 dias',
      risk: 'Médio', 
      status: 'Pendente Investigação' 
    }
  ]);

  const [jetSearch, setJetSearch] = useState('');
  const [jetRiskFilter, setJetRiskFilter] = useState<'Todos' | 'Crítico' | 'Alto' | 'Médio'>('Todos');
  const [investigatingEntry, setInvestigatingEntry] = useState<JetItem | null>(null);
  const [investigationDecision, setInvestigationDecision] = useState<
    'Regularizado c/ Documento' | 'Estornado / Revertido' | 'Apontamento de Fraude'
  >('Regularizado c/ Documento');
  const [investigationDocNumber, setInvestigationDocNumber] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');

  const filteredJetEntries = useMemo(() => {
    return jetEntries.filter(entry => {
      const matchSearch = entry.docNum.includes(jetSearch) || 
                          entry.user.toLowerCase().includes(jetSearch.toLowerCase()) || 
                          entry.account.toLowerCase().includes(jetSearch.toLowerCase()) ||
                          entry.anomalyReason.toLowerCase().includes(jetSearch.toLowerCase());
      const matchRisk = jetRiskFilter === 'Todos' || entry.risk === jetRiskFilter;
      return matchSearch && matchRisk;
    });
  }, [jetEntries, jetSearch, jetRiskFilter]);

  const handleOpenInvestigation = (item: JetItem) => {
    setInvestigatingEntry(item);
    setInvestigationDocNumber(item.evidenceDoc || `SAP-BKP-${Math.floor(10000 + Math.random() * 90000)}`);
    setInvestigationNotes(item.auditorNotes || 'Evidência conferida conforme regras de amostragem SOX 404. Lançamento devidamente justificado com documento suporte.');
  };

  const handleConfirmInvestigation = () => {
    if (!investigatingEntry) return;

    setJetEntries(prev => prev.map(entry => {
      if (entry.id === investigatingEntry.id) {
        return {
          ...entry,
          status: investigationDecision,
          evidenceDoc: investigationDocNumber,
          auditorNotes: investigationNotes
        };
      }
      return entry;
    }));

    addToast(`Parecer de auditoria registrado para o documento ${investigatingEntry.docNum}!`, 'success');
    setInvestigatingEntry(null);
  };

  // ==========================================
  // 2. ESG & Sustentabilidade (GHG Protocol)
  // ==========================================
  const [renewableEnergyPercent, setRenewableEnergyPercent] = useState<number>(65);
  const [fleetElectrificationPercent, setFleetElectrificationPercent] = useState<number>(30);
  const [carbonCreditPriceBrl, setCarbonCreditPriceBrl] = useState<number>(95.0); // R$ por tCO2e

  // Emissões base históricas (tCO2e/ano)
  const baseScope1 = 3400; // Combustão direta & frota
  const baseScope2 = 1850; // Energia elétrica comprada
  const baseScope3 = 5600; // Cadeia logística & fornecedores

  // Cálculos dinâmicos com base nas metas
  const calculatedScope1 = useMemo(() => {
    // Frota reduz até 40% do Escopo 1
    const reduction = baseScope1 * 0.40 * (fleetElectrificationPercent / 100);
    return Math.round(baseScope1 - reduction);
  }, [baseScope1, fleetElectrificationPercent]);

  const calculatedScope2 = useMemo(() => {
    // Energia renovável substitui proporcionalmente
    const reduction = baseScope2 * (renewableEnergyPercent / 100);
    return Math.round(baseScope2 - reduction);
  }, [baseScope2, renewableEnergyPercent]);

  const calculatedScope3 = baseScope3; // Logística de terceiros

  const totalEmissions = useMemo(() => {
    return calculatedScope1 + calculatedScope2 + calculatedScope3;
  }, [calculatedScope1, calculatedScope2, calculatedScope3]);

  const baselineTotal = baseScope1 + baseScope2 + baseScope3;
  const avoidedEmissions = baselineTotal - totalEmissions;
  const totalOffsetCostBrl = totalEmissions * carbonCreditPriceBrl;

  const handleExportEsgReport = () => {
    const csvContent = [
      'Indicador ESG / GHG;Valor Base (tCO2e);Valor Atual Projetado (tCO2e);Economia Evitada (tCO2e)',
      `Escopo 1 (Combustao Direta / Fabril);${baseScope1};${calculatedScope1};${baseScope1 - calculatedScope1}`,
      `Escopo 2 (Energia Eletrica Comprada);${baseScope2};${calculatedScope2};${baseScope2 - calculatedScope2}`,
      `Escopo 3 (Cadeia de Fornecedores / Frete);${baseScope3};${calculatedScope3};0`,
      `TOTAL EMISSOES CONSOLIDADAS;${baselineTotal};${totalEmissions};${avoidedEmissions}`,
      `Custo Estimado de Compensacao de Creditos de Carbono (R$ ${carbonCreditPriceBrl}/t);;;R$ ${totalOffsetCostBrl.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Auditoria_ESG_GHG_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Relatório de Sustentabilidade & Emissões ESG exportado com sucesso!', 'success');
  };

  // ==========================================
  // 3. Risco Cambial & Hedge (FX Risk)
  // ==========================================
  const baseUsdDebt = 4500000; // USD 4.5M em insumos farmacêuticos
  const currentSpotRate = 5.42; // R$ 5,42 / USD
  const [fxShockPercent, setFxShockPercent] = useState<number>(10); // +10% de choque no dólar
  const [hedgeCoveragePercent, setHedgeCoveragePercent] = useState<number>(75); // 75% protegido por NDF

  const simulatedUsdRate = useMemo(() => {
    return Number((currentSpotRate * (1 + fxShockPercent / 100)).toFixed(4));
  }, [currentSpotRate, fxShockPercent]);

  // Cenário Sem Hedge
  const unhedgedTotalCost = useMemo(() => {
    return baseUsdDebt * simulatedUsdRate;
  }, [baseUsdDebt, simulatedUsdRate]);

  const baseCost = useMemo(() => {
    return baseUsdDebt * currentSpotRate;
  }, [baseUsdDebt, currentSpotRate]);

  const unhedgedLoss = useMemo(() => {
    return unhedgedTotalCost - baseCost;
  }, [unhedgedTotalCost, baseCost]);

  // Cenário Com Hedge
  const protectedAmount = useMemo(() => {
    return baseUsdDebt * (hedgeCoveragePercent / 100);
  }, [baseUsdDebt, hedgeCoveragePercent]);

  const unprotectedAmount = baseUsdDebt - protectedAmount;

  const hedgedTotalCost = useMemo(() => {
    const protectedCost = protectedAmount * currentSpotRate; // Travado na taxa atual via NDF
    const unprotectedCost = unprotectedAmount * simulatedUsdRate; // Sofre a variação cambial
    return protectedCost + unprotectedCost;
  }, [protectedAmount, currentSpotRate, unprotectedAmount, simulatedUsdRate]);

  const hedgedLoss = useMemo(() => {
    return hedgedTotalCost - baseCost;
  }, [hedgedTotalCost, baseCost]);

  const hedgedSavings = useMemo(() => {
    return unhedgedTotalCost - hedgedTotalCost;
  }, [unhedgedTotalCost, hedgedTotalCost]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Globe2 className="w-6 h-6 text-emerald-400" /> Suíte Global Enterprise (JET, ESG & Risco Cambial)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Auditoria de partidas manuais SOX 404 (JET), inventário de emissões ESG GHG Protocol e simulação de hedge cambial.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('jet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'jet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> JET (Auditoria Contábil)
          </button>
          <button
            onClick={() => setActiveTab('esg')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'esg' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" /> ESG & Descarbonização
          </button>
          <button
            onClick={() => setActiveTab('fx')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fx' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Risco Cambial & Hedge
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* ABA 1: JET (Journal Entry Testing)        */}
      {/* ========================================== */}
      {activeTab === 'jet' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI JET Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Total de Partidas Auditadas</span>
              <p className="text-2xl font-black text-white mt-1">{jetEntries.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Lançamentos manuais FB50/FB01</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Anomalias Críticas / Altas</span>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {jetEntries.filter(j => j.risk === 'Crítico' || j.risk === 'Alto').length}
              </p>
              <p className="text-[11px] text-rose-500/80 mt-1">Gatilhos de fraude ou fora de hora</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Investigações Pendentes</span>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {jetEntries.filter(j => j.status === 'Pendente Investigação').length}
              </p>
              <p className="text-[11px] text-amber-500/80 mt-1">Requerem comprovação documental</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Regularizados c/ Suporte</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {jetEntries.filter(j => j.status === 'Regularizado c/ Documento').length}
              </p>
              <p className="text-[11px] text-emerald-500/80 mt-1">Conformes com a norma SOX</p>
            </div>
          </div>

          {/* Tabela de Lançamentos Manuais Auditados com Busca e Filtro */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trilha de Journal Entry Testing (Gatilhos de Risco SOX)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Identificação preditiva de lançamentos manuais atípicos, valores redondos e estruturação fracionada.
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar documento, usuário ou anomalia..."
                    value={jetSearch}
                    onChange={(e) => setJetSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                    }`}
                  />
                </div>
                <select
                  value={jetRiskFilter}
                  onChange={(e) => setJetRiskFilter(e.target.value as any)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                  }`}
                >
                  <option value="Todos">Todos os Riscos</option>
                  <option value="Crítico">Crítico</option>
                  <option value="Alto">Alto</option>
                  <option value="Médio">Médio</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">Doc. Contábil</th>
                    <th className="pb-3 font-bold">Data & Hora</th>
                    <th className="pb-3 font-bold">Usuário SAP</th>
                    <th className="pb-3 font-bold">Conta Razão Afetada</th>
                    <th className="pb-3 font-bold">Valor (R$)</th>
                    <th className="pb-3 font-bold">Anomalia Identificada</th>
                    <th className="pb-3 font-bold">Risco</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredJetEntries.map((jet) => (
                    <tr key={jet.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono font-bold text-white">{jet.docNum}</td>
                      <td className="py-3 text-slate-300">
                        <p>{jet.date}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{jet.time}</p>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{jet.user}</td>
                      <td className="py-3 text-slate-300">{jet.account}</td>
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        R$ {jet.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px] max-w-xs">{jet.anomalyReason}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          jet.risk === 'Crítico' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          jet.risk === 'Alto' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {jet.risk}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold ${
                          jet.status === 'Regularizado c/ Documento' ? 'text-emerald-400' :
                          jet.status === 'Estornado / Revertido' ? 'text-blue-400' :
                          jet.status === 'Apontamento de Fraude' ? 'text-rose-400' :
                          'text-amber-400'
                        }`}>
                          {jet.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleOpenInvestigation(jet)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-md flex items-center gap-1 mx-auto"
                        >
                          <FileText className="w-3 h-3" /> Investigar / Parecer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Investigação e Parecer JET */}
          {investigatingEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className={`max-w-lg w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm">Parecer de Investigação SOX (JET)</h3>
                  </div>
                  <button 
                    onClick={() => setInvestigatingEntry(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <p><span className="text-slate-400">Documento SAP:</span> <strong className="text-white">{investigatingEntry.docNum}</strong></p>
                    <p><span className="text-slate-400">Valor Lançado:</span> <span className="font-mono text-emerald-400 font-bold">R$ {investigatingEntry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><span className="text-slate-400">Gatilho / Anomalia:</span> <span className="text-rose-300">{investigatingEntry.anomalyReason}</span></p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Conclusão da Investigação de Auditoria:</label>
                    <select
                      value={investigationDecision}
                      onChange={(e) => setInvestigationDecision(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                      }`}
                    >
                      <option value="Regularizado c/ Documento">Regularizado c/ Documento Hábil e Justificativa</option>
                      <option value="Estornado / Revertido">Estorno Realizado no Exercício Seguinte (FB08)</option>
                      <option value="Apontamento de Fraude">Apontamento de Fraude / Encaminhar ao Comitê de Ética</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Nº do Documento Suporte / Protocolo SAP:</label>
                    <input
                      type="text"
                      value={investigationDocNumber}
                      onChange={(e) => setInvestigationDocNumber(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Parecer Formal do Auditor:</label>
                    <textarea
                      rows={3}
                      value={investigationNotes}
                      onChange={(e) => setInvestigationNotes(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setInvestigatingEntry(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmInvestigation}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Salvar Parecer no Dossiê SOX
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 2: ESG & Sustentabilidade (GHG)       */}
      {/* ========================================== */}
      {activeTab === 'esg' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Parâmetros do Simulador Net Zero */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Leaf className="w-4 h-4 text-emerald-400" /> Simulador de Descarbonização & Pegada de Carbono (GHG Protocol)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Projete reduções nos Escopos 1, 2 e 3 e calcule o passivo financeiro no mercado de créditos de carbono.
                </p>
              </div>
              <button
                onClick={handleExportEsgReport}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Laudo ESG (CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Energia Renovável (Escopo 2):
                  </span>
                  <span className="font-mono text-emerald-400 font-black">{renewableEnergyPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={renewableEnergyPercent}
                  onChange={(e) => setRenewableEnergyPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Substituição por PPA eólica/solar na matriz fabril</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" /> Eletrificação de Frotas (Escopo 1):
                  </span>
                  <span className="font-mono text-emerald-400 font-black">{fleetElectrificationPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={fleetElectrificationPercent}
                  onChange={(e) => setFleetElectrificationPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Conversão de veículos leves e caminhões de distribuição</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Custo Crédito Carbono (tCO2e):
                  </span>
                  <span className="font-mono text-emerald-400 font-black">R$ {carbonCreditPriceBrl.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={250}
                  step={5}
                  value={carbonCreditPriceBrl}
                  onChange={(e) => setCarbonCreditPriceBrl(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Preço spot de compensação voluntária padrão Verra</p>
              </div>
            </div>
          </div>

          {/* Cards de Emissões Detalhadas por Escopo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escopo 1 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Escopo 1
                </span>
                <Factory className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-bold text-xs text-white">Emissões Diretas de Fabricação</h4>
              <p className="text-2xl font-black text-white">{calculatedScope1.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">tCO2e/ano</span></p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                <span>Redução obtida:</span>
                <span className="text-emerald-400 font-bold">-{(baseScope1 - calculatedScope1).toLocaleString('pt-BR')} tCO2e</span>
              </div>
            </div>

            {/* Escopo 2 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Escopo 2
                </span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="font-bold text-xs text-white">Consumo de Energia Elétrica</h4>
              <p className="text-2xl font-black text-white">{calculatedScope2.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">tCO2e/ano</span></p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                <span>Redução obtida:</span>
                <span className="text-emerald-400 font-bold">-{(baseScope2 - calculatedScope2).toLocaleString('pt-BR')} tCO2e</span>
              </div>
            </div>

            {/* Escopo 3 */}
            <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Escopo 3
                </span>
                <Truck className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="font-bold text-xs text-white">Cadeia de Suprimentos & Frete</h4>
              <p className="text-2xl font-black text-white">{calculatedScope3.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">tCO2e/ano</span></p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                <span>Monitoramento:</span>
                <span className="text-slate-300 font-bold">14 Fornecedores Auditados</span>
              </div>
            </div>
          </div>

          {/* Resumo Consolidado de Sustentabilidade */}
          <div className={`p-6 rounded-2xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Balanço Consolidado de Emissões & Custo de Compensação
              </span>
              <p className="text-3xl font-black text-white mt-1">
                {totalEmissions.toLocaleString('pt-BR')} <span className="text-base text-slate-400 font-normal">tCO2e Líquidas</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Emissões evitadas no plano: <strong className="text-emerald-400">-{avoidedEmissions.toLocaleString('pt-BR')} tCO2e</strong> | Passivo de Compensação: <strong className="text-white">R$ {totalOffsetCostBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>

            <button
              onClick={handleExportEsgReport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar Laudo Completo
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 3: Risco Cambial & Hedge (FX Risk)    */}
      {/* ========================================== */}
      {activeTab === 'fx' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Painel de Parâmetros de Estresse Cambial */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <TrendingDown className="w-4 h-4 text-emerald-400" /> Simulador de Estresse Cambial & Cobertura NDF (FX Hedge)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Analise o impacto no caixa de oscilações do Dólar (USD/BRL) sobre contratos de insumos importados.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Spot Atual: R$ {currentSpotRate.toFixed(2)}
              </span>
            </div>

            {/* Cenários Rápidos de Choque Cambial */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Cenários de Estresse no Dólar (% de Variação):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Apreciação do Real (-5%)', shock: -5 },
                  { label: 'Choque Moderado (+5%)', shock: 5 },
                  { label: 'Estresse Severo (+15%)', shock: 15 },
                  { label: 'Crise Sistêmica (+25%)', shock: 25 },
                ].map(c => (
                  <button
                    key={c.shock}
                    onClick={() => setFxShockPercent(c.shock)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      fxShockPercent === c.shock
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-black'
                        : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-gray-200 text-slate-700')
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider de Cobertura de Hedge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400">Taxa de Cobertura por Hedge (NDF):</span>
                  <span className="font-mono text-emerald-400 font-black">{hedgeCoveragePercent}% Protegido</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={hedgeCoveragePercent}
                  onChange={(e) => setHedgeCoveragePercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Percentual da dívida travado na cotação de R$ {currentSpotRate.toFixed(2)}</p>
              </div>

              <div className="p-4 rounded-xl border bg-slate-950/50 border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Passivo Total em Moeda Estrangeira:</span>
                  <span className="font-mono text-white font-bold">USD {(baseUsdDebt / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa Cambial Simulada:</span>
                  <span className={`font-mono font-bold ${simulatedUsdRate > currentSpotRate ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {simulatedUsdRate.toFixed(4)} ({fxShockPercent >= 0 ? `+${fxShockPercent}%` : `${fxShockPercent}%`})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparativo Lado a Lado: Sem Hedge vs Com Hedge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cenário Sem Hedge */}
            <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Cenário Sem Hedge (Exposição Total)
                </span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <h4 className="font-bold text-xs text-white">Desembolso Estimado sem Proteção</h4>
              <p className="text-2xl font-black text-rose-400">
                R$ {unhedgedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="space-y-1 text-xs pt-2 border-t border-slate-800 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Custo Base Inicial:</span>
                  <span className="font-mono">R$ {baseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Impacto Cambial no EBITDA:</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {unhedgedLoss >= 0 ? `+Perda de R$ ${unhedgedLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `-Ganho de R$ ${Math.abs(unhedgedLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Cenário Com Hedge */}
            <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Cenário com Hedge NDF ({hedgeCoveragePercent}%)
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-bold text-xs text-white">Desembolso Protegido</h4>
              <p className="text-2xl font-black text-emerald-400">
                R$ {hedgedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="space-y-1 text-xs pt-2 border-t border-slate-800 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Parcela Coberta Travada:</span>
                  <span className="font-mono">USD {(protectedAmount / 1000000).toFixed(2)}M @ R$ {currentSpotRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Economia Protegida pelo Hedge:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    R$ {hedgedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalEnterpriseSuite;
