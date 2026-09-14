import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, FileText, Calculator, Users, AlertTriangle, 
  CheckCircle2, Download, Search, RefreshCw, Briefcase, FileCheck, 
  X, Check, Clock, ShieldCheck, Scale, DollarSign, ArrowRight,
  Filter, Sparkles, Sliders, Layers, ChevronDown
} from 'lucide-react';

interface AdvancedComplianceSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface SodConflict {
  id: string;
  user: string;
  role: string;
  tcode1: string;
  tcode2: string;
  conflict: string;
  risk: 'Crítico' | 'Alto' | 'Médio';
  status: string;
  protocol?: string;
  mitigationDetails?: string;
}

interface ContractItem {
  id: string;
  vendor: string;
  category: string;
  value: string;
  numericValue: number;
  expiry: string;
  daysToExpiry: number;
  slaTarget: number;
  slaCompliance: number;
  status: 'Regular' | 'Atenção SLA' | 'Vencimento Próximo';
  riskIndex: 'IPCA' | 'IGP-M';
  hasLgpdClause: boolean;
  autoRenewal: boolean;
}

export const AdvancedComplianceSuite: React.FC<AdvancedComplianceSuiteProps> = ({ darkMode, addToast }) => {
  const [activeTab, setActiveTab] = useState<'sod' | 'tax' | 'contracts'>('sod');

  // ==========================================
  // 1. SoD (Segregação de Funções) State & Logic
  // ==========================================
  const [sodConflicts, setSodConflicts] = useState<SodConflict[]>([
    { 
      id: 'SOD-01', 
      user: 'carlos.financeiro@holding.com', 
      role: 'Gerente de Contas & Tesouraria', 
      tcode1: 'XK01', 
      tcode2: 'F110', 
      conflict: 'Criação de Fornecedor (XK01) + Liberação de Pagamento (F110)', 
      risk: 'Crítico', 
      status: 'Não Mitigado' 
    },
    { 
      id: 'SOD-02', 
      user: 'ana.compras@filialsp.com', 
      role: 'Comprador Sênior', 
      tcode1: 'ME21N', 
      tcode2: 'MIRO', 
      conflict: 'Emissão de Pedido de Compra (ME21N) + Entrada de Fatura (MIRO)', 
      risk: 'Alto', 
      status: 'Mitigado via Compensação',
      protocol: 'SOX-COMP-9012',
      mitigationDetails: 'Dupla alçada com aprovação obrigatória do Diretor de Suprimentos.'
    },
    { 
      id: 'SOD-03', 
      user: 'roberto.fiscal@holding.com', 
      role: 'Analista Fiscal Sênior', 
      tcode1: 'FV11', 
      tcode2: 'FB50', 
      conflict: 'Cadastro de Alíquotas (FV11) + Lançamento Contábil Manual (FB50)', 
      risk: 'Médio', 
      status: 'Não Mitigado' 
    },
    { 
      id: 'SOD-04', 
      user: 'marcos.estoque@fabrica.com', 
      role: 'Supervisor de Almoxarifado', 
      tcode1: 'MIGO', 
      tcode2: 'MB1A', 
      conflict: 'Entrada de Mercadorias (MIGO) + Baixa de Inventário Manual (MB1A)', 
      risk: 'Alto', 
      status: 'Não Mitigado' 
    }
  ]);

  const [sodSearch, setSodSearch] = useState('');
  const [sodRiskFilter, setSodRiskFilter] = useState<'Todos' | 'Crítico' | 'Alto' | 'Médio'>('Todos');

  // Modal de Mitigação Compensatória SOX
  const [mitigatingConflict, setMitigatingConflict] = useState<SodConflict | null>(null);
  const [mitigationType, setMitigationType] = useState('Dupla Alçada de Aprovação Digital (Workflow SAP)');
  const [mitigationJustification, setMitigationJustification] = useState('');

  // Simulador de Conflitos Cruzados de T-Codes
  const [simTcode1, setSimTcode1] = useState('ME21N');
  const [simTcode2, setSimTcode2] = useState('MIRO');

  const knownSodMatrix: { [pair: string]: { risk: 'Crítico' | 'Alto' | 'Médio'; name: string; impact: string } } = {
    'ME21N-MIRO': { risk: 'Crítico', name: 'Ciclo P2P: Compra & Faturamento Desassistido', impact: 'Permite emissão de pedido e aprovação da própria fatura sem conferência independente.' },
    'MIRO-ME21N': { risk: 'Crítico', name: 'Ciclo P2P: Compra & Faturamento Desassistido', impact: 'Permite emissão de pedido e aprovação da própria fatura sem conferência independente.' },
    'XK01-F110': { risk: 'Crítico', name: 'Risco de Fornecedor Fantasma & Pagamento Indevido', impact: 'Possibilidade de cadastrar conta bancária arbitrária e executar liquidação em lote.' },
    'F110-XK01': { risk: 'Crítico', name: 'Risco de Fornecedor Fantasma & Pagamento Indevido', impact: 'Possibilidade de cadastrar conta bancária arbitrária e executar liquidação em lote.' },
    'FB01-FB08': { risk: 'Alto', name: 'Lançamento & Estorno Contábil sem Rastro de Alçada', impact: 'Manipulação de saldos contábeis e reversão sem validação de auditoria.' },
    'FB08-FB01': { risk: 'Alto', name: 'Lançamento & Estorno Contábil sem Rastro de Alçada', impact: 'Manipulação de saldos contábeis e reversão sem validação de auditoria.' },
    'MIGO-MB1A': { risk: 'Alto', name: 'Ciclo Físico: Entrada e Baixa de Estoque', impact: 'Ocultação de perdas físicas de inventário através de entradas e baixas simultâneas.' },
    'MB1A-MIGO': { risk: 'Alto', name: 'Ciclo Físico: Entrada e Baixa de Estoque', impact: 'Ocultação de perdas físicas de inventário através de entradas e baixas simultâneas.' },
    'VA01-VFX3': { risk: 'Médio', name: 'Ciclo O2C: Venda e Desbloqueio de Faturamento', impact: 'Concessão de descontos e emissão de fatura sem autorização da diretoria comercial.' },
    'VFX3-VA01': { risk: 'Médio', name: 'Ciclo O2C: Venda e Desbloqueio de Faturamento', impact: 'Concessão de descontos e emissão de fatura sem autorização da diretoria comercial.' },
  };

  const simulationResult = useMemo(() => {
    if (simTcode1 === simTcode2) {
      return { hasConflict: false, message: 'Mesma transação selecionada.', risk: null, impact: '' };
    }
    const pair = `${simTcode1}-${simTcode2}`;
    const found = knownSodMatrix[pair];
    if (found) {
      return { hasConflict: true, message: found.name, risk: found.risk, impact: found.impact };
    }
    return { hasConflict: false, message: 'Transações sem conflito direto mapeado na matriz padrão SOX.', risk: null, impact: 'Funções operam em camadas distintas com segregação razoável.' };
  }, [simTcode1, simTcode2]);

  const filteredConflicts = useMemo(() => {
    return sodConflicts.filter(c => {
      const matchSearch = c.user.toLowerCase().includes(sodSearch.toLowerCase()) || 
                          c.role.toLowerCase().includes(sodSearch.toLowerCase()) || 
                          c.conflict.toLowerCase().includes(sodSearch.toLowerCase());
      const matchRisk = sodRiskFilter === 'Todos' || c.risk === sodRiskFilter;
      return matchSearch && matchRisk;
    });
  }, [sodConflicts, sodSearch, sodRiskFilter]);

  const handleOpenMitigation = (conflict: SodConflict) => {
    setMitigatingConflict(conflict);
    setMitigationJustification(`Mitigação formal aplicada para a conta ${conflict.user}. Implementação de controle compensatório com auditoria periódica.`);
  };

  const handleConfirmMitigation = () => {
    if (!mitigatingConflict) return;
    const protocolNumber = `SOX-COMP-${Math.floor(1000 + Math.random() * 9000)}`;
    setSodConflicts(prev => prev.map(c => {
      if (c.id === mitigatingConflict.id) {
        return {
          ...c,
          status: 'Mitigado via Compensação',
          protocol: protocolNumber,
          mitigationDetails: `${mitigationType} - Justificativa: ${mitigationJustification}`
        };
      }
      return c;
    }));
    addToast(`Controle Compensatório ${protocolNumber} registrado com sucesso para a Trilha SOX!`, 'success');
    setMitigatingConflict(null);
  };

  // ==========================================
  // 2. Recuperação Tributária State & Logic
  // ==========================================
  const [taxBranch, setTaxBranch] = useState('Matriz SP - Indústria');
  const [taxPeriod, setTaxPeriod] = useState('Quinquenal (2021 a 2026 - 5 Anos Prescricionais)');
  const [selicRate, setSelicRate] = useState<number>(31.8);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);
  const [taxCalculated, setTaxCalculated] = useState(false);

  const taxTheses = [
    {
      id: 'TESE-01',
      title: 'Exclusão do ICMS da Base do PIS/COFINS (Tema 69 STF - Tese do Século)',
      cfops: '5.101, 5.102, 6.101, 6.102',
      basePrincipal: 685400,
      description: 'Retirada do ICMS destacado nas notas fiscais de saída da apuração de PIS e COFINS cumulativo e não-cumulativo.'
    },
    {
      id: 'TESE-02',
      title: 'Ressarcimento de ICMS-ST (Venda em Valor Inferior à Base Presumida)',
      cfops: '5.405, 6.403 (Medicamentos & Cosméticos)',
      basePrincipal: 412300,
      description: 'Direito à restituição da diferença do ICMS retido por substituição tributária quando a saída efetiva for a menor.'
    },
    {
      id: 'TESE-03',
      title: 'Créditos sobre Insumos Essenciais e Energia Elétrica na Fabricação',
      cfops: '1.101, 1.252, 2.101',
      basePrincipal: 289100,
      description: 'Apropriação de créditos de PIS/COFINS sobre matérias-primas farmacêuticas, embalagens e eletricidade de produção.'
    }
  ];

  const totalPrincipal = useMemo(() => taxTheses.reduce((acc, t) => acc + t.basePrincipal, 0), [taxTheses]);
  const totalSelicCorrection = useMemo(() => (totalPrincipal * (selicRate / 100)), [totalPrincipal, selicRate]);
  const grandTotalTax = useMemo(() => totalPrincipal + totalSelicCorrection, [totalPrincipal, totalSelicCorrection]);

  const handleRunTaxRecovery = () => {
    setIsCalculatingTax(true);
    setTimeout(() => {
      setIsCalculatingTax(false);
      setTaxCalculated(true);
      addToast('Varredura tributária concluída com sucesso! Créditos apurados.', 'success');
    }, 1300);
  };

  const handleExportTaxDossier = () => {
    const csvContent = [
      'ID Tese;Descricao;CFOPs;Valor Principal (R$);Correcao Selic %;Correcao Selic (R$);Total Atualizado (R$)',
      ...taxTheses.map(t => {
        const selicVal = t.basePrincipal * (selicRate / 100);
        const total = t.basePrincipal + selicVal;
        return `${t.id};"${t.title}";"${t.cfops}";${t.basePrincipal.toFixed(2)};${selicRate}%;${selicVal.toFixed(2)};${total.toFixed(2)}`;
      }),
      `TOTAL GERAL;;;${totalPrincipal.toFixed(2)};${selicRate}%;${totalSelicCorrection.toFixed(2)};${grandTotalTax.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dossie_Tributario_Recuperacao_${taxBranch.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Dossiê fiscal exportado em formato compatível com SPED EFD!', 'success');
  };

  // ==========================================
  // 3. Conformidade de Contratos & SLAs
  // ==========================================
  const [contracts, setContracts] = useState<ContractItem[]>([
    { 
      id: 'CTR-889', 
      vendor: 'Logística Express & Distribuição S.A.', 
      category: 'Transporte & Malha Fria',
      value: 'R$ 1.200.000 / ano', 
      numericValue: 1200000,
      expiry: '15/11/2026', 
      daysToExpiry: 420,
      slaTarget: 98.0, 
      slaCompliance: 98.4, 
      status: 'Regular',
      riskIndex: 'IPCA',
      hasLgpdClause: true,
      autoRenewal: false
    },
    { 
      id: 'CTR-902', 
      vendor: 'Cloud Services Global Tech Ltd.', 
      category: 'Infraestrutura Cloud & TI',
      value: 'R$ 850.000 / ano', 
      numericValue: 850000,
      expiry: '30/04/2027', 
      daysToExpiry: 580,
      slaTarget: 99.5, 
      slaCompliance: 99.9, 
      status: 'Regular',
      riskIndex: 'IPCA',
      hasLgpdClause: true,
      autoRenewal: false
    },
    { 
      id: 'CTR-945', 
      vendor: 'Consultoria Tributária & Advogados Ass.', 
      category: 'Assessoria Jurídica Fiscal',
      value: 'R$ 450.000 / ano', 
      numericValue: 450000,
      expiry: '10/06/2026', 
      daysToExpiry: 268,
      slaTarget: 98.0, 
      slaCompliance: 91.2, 
      status: 'Atenção SLA',
      riskIndex: 'IGP-M',
      hasLgpdClause: false,
      autoRenewal: true
    },
    { 
      id: 'CTR-978', 
      vendor: 'Biomedical Embalagens Farmacêuticas', 
      category: 'Insumos Diretos',
      value: 'R$ 2.300.000 / ano', 
      numericValue: 2300000,
      expiry: '20/10/2026', 
      daysToExpiry: 36,
      slaTarget: 95.0, 
      slaCompliance: 95.8, 
      status: 'Vencimento Próximo',
      riskIndex: 'IPCA',
      hasLgpdClause: true,
      autoRenewal: true
    }
  ]);

  const [selectedContractForAudit, setSelectedContractForAudit] = useState<ContractItem | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <ShieldAlert className="w-6 h-6 text-indigo-400" /> Suíte Avançada de Compliance (SoD, Créditos & Contratos)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Matriz de segregação de funções SOX 404, auditoria analítica tributária com atualização Selic e governança contratual.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('sod')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sod' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> SoD & Conflitos SAP
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tax' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Créditos Tributários (Selic)
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'contracts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Conformidade de Contratos & SLAs
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* ABA 1: SoD (Segregação de Funções & Conflitos) */}
      {/* ========================================== */}
      {activeTab === 'sod' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Cards for SoD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Total de Conflitos Detectados</span>
              <p className="text-2xl font-black text-white mt-1">{sodConflicts.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Varredura contínua de perfis SAP</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Conflitos Críticos / Altos</span>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {sodConflicts.filter(c => c.risk === 'Crítico' || c.risk === 'Alto').length}
              </p>
              <p className="text-[11px] text-rose-500/80 mt-1">Exigem alçadas ou mitigação formal</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Mitigações Homologadas SOX</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {sodConflicts.filter(c => c.status.includes('Mitigado')).length}
              </p>
              <p className="text-[11px] text-emerald-500/80 mt-1">Protocolos registrados e auditáveis</p>
            </div>
          </div>

          {/* Simulador Interativo de Conflito de Transações SAP (T-Codes) */}
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Scale className="w-4 h-4 text-indigo-400" /> Simulador de Matriz SoD: Conflito Cruzado de Transações SAP
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Selecione dois códigos de transação para verificar se a coexistência no mesmo perfil gera violação de compliance.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                Simulador Dinâmico
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* TCode 1 */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Transação SAP A:</label>
                <select
                  value={simTcode1}
                  onChange={(e) => setSimTcode1(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                  }`}
                >
                  <option value="ME21N">ME21N - Criar Pedido de Compra</option>
                  <option value="XK01">XK01 - Criar / Alterar Fornecedor</option>
                  <option value="FB01">FB01 - Lançamento Contábil Manual</option>
                  <option value="MIGO">MIGO - Entrada de Mercadorias</option>
                  <option value="VA01">VA01 - Criar Ordem de Venda</option>
                  <option value="FV11">FV11 - Criar Condições Fiscais</option>
                </select>
              </div>

              {/* Cruzamento Icon */}
              <div className="md:col-span-2 flex justify-center text-indigo-400">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black">
                  VS
                </span>
              </div>

              {/* TCode 2 */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Transação SAP B:</label>
                <select
                  value={simTcode2}
                  onChange={(e) => setSimTcode2(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                  }`}
                >
                  <option value="MIRO">MIRO - Registrar Fatura de Fornecedor</option>
                  <option value="F110">F110 - Execução de Pagamento Automático</option>
                  <option value="FB08">FB08 - Estorno de Documento Contábil</option>
                  <option value="MB1A">MB1A - Baixa de Mercadorias / Estoque</option>
                  <option value="VFX3">VFX3 - Liberação de Fatura de Venda</option>
                  <option value="FB50">FB50 - Lançamento em Contas do Razão</option>
                </select>
              </div>
            </div>

            {/* Resultado da Simulação */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              simulationResult.hasConflict
                ? (darkMode ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900')
                : (darkMode ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
            }`}>
              {simulationResult.hasConflict ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm">
                    {simulationResult.hasConflict ? 'Conflito SoD Detectado!' : 'Combinação Conforme'}
                  </span>
                  {simulationResult.risk && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500 text-white">
                      Risco {simulationResult.risk}
                    </span>
                  )}
                </div>
                <p className="font-semibold mb-0.5">{simulationResult.message}</p>
                <p className={`text-[11px] opacity-80`}>{simulationResult.impact}</p>
              </div>
            </div>
          </div>

          {/* Tabela de Conflitos SoD com Busca e Filtros */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Users className="w-4 h-4 text-indigo-400" /> Registro de Violações e Conflitos Ativos (Matriz SOX 404)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Mapeamento de colaboradores com acessos conflitantes e controles de compensação.
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuário, papel ou transação..."
                    value={sodSearch}
                    onChange={(e) => setSodSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                    }`}
                  />
                </div>
                <select
                  value={sodRiskFilter}
                  onChange={(e) => setSodRiskFilter(e.target.value as any)}
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
                    <th className="pb-3 font-bold">ID</th>
                    <th className="pb-3 font-bold">Usuário / E-mail</th>
                    <th className="pb-3 font-bold">Papel Atribuído</th>
                    <th className="pb-3 font-bold">Conflito de Transações</th>
                    <th className="pb-3 font-bold">Risco</th>
                    <th className="pb-3 font-bold">Status / Protocolo</th>
                    <th className="pb-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredConflicts.map((c) => (
                    <tr key={c.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono font-bold text-white">{c.id}</td>
                      <td className="py-3 font-medium text-slate-200">{c.user}</td>
                      <td className="py-3 text-slate-400">{c.role}</td>
                      <td className="py-3 text-slate-300 font-mono text-[11px]">{c.conflict}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.risk === 'Crítico' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          c.risk === 'Alto' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {c.risk}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <span className={`font-bold text-[10px] ${c.status.includes('Mitigado') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {c.status}
                          </span>
                          {c.protocol && (
                            <p className="font-mono text-[9px] text-slate-400 mt-0.5">{c.protocol}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {!c.status.includes('Mitigado') ? (
                          <button
                            onClick={() => handleOpenMitigation(c)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-md flex items-center gap-1 mx-auto"
                          >
                            <ShieldCheck className="w-3 h-3" /> Mitigar (SOX)
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-black px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                            ✓ Homologado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Mitigação Compensatória SOX */}
          {mitigatingConflict && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className={`max-w-lg w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm">Registro de Controle Compensatório SOX</h3>
                  </div>
                  <button 
                    onClick={() => setMitigatingConflict(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <p><span className="text-slate-400">Usuário Auditado:</span> <strong className="text-white">{mitigatingConflict.user}</strong></p>
                    <p><span className="text-slate-400">Conflito Mapeado:</span> <span className="font-mono text-rose-300">{mitigatingConflict.conflict}</span></p>
                    <p><span className="text-slate-400">Classificação de Risco:</span> <span className="font-black text-rose-400">{mitigatingConflict.risk}</span></p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Tipo de Controle Compensatório:</label>
                    <select
                      value={mitigationType}
                      onChange={(e) => setMitigationType(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                      }`}
                    >
                      <option value="Dupla Alçada de Aprovação Digital (Workflow SAP)">Dupla Alçada de Aprovação Digital (Workflow SAP)</option>
                      <option value="Revisão Trimestral por Amostragem por Auditoria Externa">Revisão Trimestral por Amostragem por Auditoria Externa</option>
                      <option value="Monitoramento Automático Contínuo via Logs de Auditoria SOX">Monitoramento Automático Contínuo via Logs de Auditoria SOX</option>
                      <option value="Aprovação Excepcional por Comitê de Auditoria / C-Level">Aprovação Excepcional por Comitê de Auditoria / C-Level</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Justificativa & Detalhamento do Controle:</label>
                    <textarea
                      rows={3}
                      value={mitigationJustification}
                      onChange={(e) => setMitigationJustification(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setMitigatingConflict(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmMitigation}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Registrar Protocolo & Mitigar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 2: Recuperação de Créditos Tributários */}
      {/* ========================================== */}
      {activeTab === 'tax' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Parâmetros de Apuração e Selic */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Calculator className="w-4 h-4 text-emerald-400" /> Motor de Recuperação de Créditos Tributários & Atualização Selic
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Revisão fiscal de períodos não prescritos (Direito Quinquenal) com atualização monetária oficial pela taxa Selic.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Audit Fiscal SAP EFD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Filial / Unidade Fabril:</label>
                <select
                  value={taxBranch}
                  onChange={(e) => setTaxBranch(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                  }`}
                >
                  <option value="Matriz SP - Indústria Farmacêutica">Matriz SP - Indústria Farmacêutica</option>
                  <option value="Filial RJ - Distribuição & Cosméticos">Filial RJ - Distribuição & Cosméticos</option>
                  <option value="Filial BA - Logística & Centro de Distribuição">Filial BA - Logística & CD</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Janela de Apuração Fiscal:</label>
                <select
                  value={taxPeriod}
                  onChange={(e) => setTaxPeriod(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'
                  }`}
                >
                  <option value="Quinquenal (2021 a 2026 - 5 Anos Prescricionais)">Quinquenal (2021 a 2026 - 5 Anos Prescricionais)</option>
                  <option value="Trienal (2023 a 2026)">Trienal (2023 a 2026)</option>
                  <option value="Último Exercício (2025/2026)">Último Exercício (2025/2026)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400">Taxa Selic Acumulada (%):</label>
                  <span className="font-mono text-xs text-emerald-400 font-black">{selicRate}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={55}
                  step={0.5}
                  value={selicRate}
                  onChange={(e) => setSelicRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleRunTaxRecovery}
              disabled={isCalculatingTax}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculatingTax ? 'animate-spin' : ''}`} />
              {isCalculatingTax ? 'Varrendo Notas Fiscais e Aplicando Correção Selic...' : 'Executar Varredura e Atualização Monetária'}
            </button>
          </div>

          {/* Resultados Consolidados por Tese */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'} flex items-center gap-2`}>
                <DollarSign className="w-4 h-4 text-emerald-400" /> Teses Tributárias Elegíveis & Memória de Cálculo
              </h4>
              <button
                onClick={handleExportTaxDossier}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Dossiê SPED (CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {taxTheses.map(t => {
                const selicVal = t.basePrincipal * (selicRate / 100);
                const total = t.basePrincipal + selicVal;
                return (
                  <div 
                    key={t.id}
                    className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">CFOPs: {t.cfops}</span>
                      </div>
                      <h5 className="font-bold text-xs leading-snug mb-2 text-white">{t.title}</h5>
                      <p className={`text-[11px] leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        {t.description}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Principal Histórico:</span>
                        <span className="font-mono text-slate-300">R$ {t.basePrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Correção Selic (+{selicRate}%):</span>
                        <span className="font-mono text-emerald-400 font-bold">+R$ {selicVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-black">
                        <span className="text-white">Total Atualizado:</span>
                        <span className="font-mono text-emerald-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totalizador Geral */}
            <div className={`p-5 rounded-2xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${
              darkMode ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Potencial Total de Monetização Tributária
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  R$ {grandTotalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Principal: R$ {totalPrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Acréscimo Selic: R$ {totalSelicCorrection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTaxDossier}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Baixar Memória de Cálculo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 3: Conformidade de Contratos & SLAs    */}
      {/* ========================================== */}
      {activeTab === 'contracts' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Cards de Alertas de Vencimento e Risco */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Contratos Monitorados</span>
              <p className="text-2xl font-black text-white mt-1">{contracts.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Volume total sob auditoria contínua</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Alerta de Renovação / Vencimento (&lt; 90d)</span>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {contracts.filter(c => c.daysToExpiry <= 90).length}
              </p>
              <p className="text-[11px] text-amber-500/80 mt-1">Exigem denúncia ou renegociação</p>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <span className="text-xs font-bold text-slate-400">Desvios de SLA / Glosa Passível</span>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {contracts.filter(c => c.slaCompliance < c.slaTarget).length}
              </p>
              <p className="text-[11px] text-rose-500/80 mt-1">Glosas calculadas para retenção</p>
            </div>
          </div>

          {/* Tabela de Contratos & Análise de Risco de Cláusulas */}
          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Briefcase className="w-4 h-4 text-indigo-400" /> Gestão Inteligente de Fornecedores, SLAs e Cláusulas Críticas
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Avaliação automatizada de quebra de SLA, índice de reajuste contratual e cláusula LGPD.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                AI Contract Auditor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">ID</th>
                    <th className="pb-3 font-bold">Fornecedor / Categoria</th>
                    <th className="pb-3 font-bold">Valor Anual</th>
                    <th className="pb-3 font-bold">Vencimento</th>
                    <th className="pb-3 font-bold">SLA (Meta vs Real)</th>
                    <th className="pb-3 font-bold">Índice & Riscos</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-center">Glosa Estimada</th>
                    <th className="pb-3 font-bold text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {contracts.map((ct) => {
                    const hasSlaBreak = ct.slaCompliance < ct.slaTarget;
                    const penaltyRate = hasSlaBreak ? ((ct.slaTarget - ct.slaCompliance) * 0.5) : 0;
                    const estimatedPenalty = (ct.numericValue / 12) * (penaltyRate / 100);

                    return (
                      <tr key={ct.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 font-mono font-bold text-white">{ct.id}</td>
                        <td className="py-3">
                          <p className="font-medium text-slate-200">{ct.vendor}</p>
                          <p className="text-[10px] text-slate-400">{ct.category}</p>
                        </td>
                        <td className="py-3 text-slate-300 font-mono">{ct.value}</td>
                        <td className="py-3">
                          <p className="text-slate-300">{ct.expiry}</p>
                          {ct.daysToExpiry <= 90 && (
                            <span className="text-[9px] font-black text-amber-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Faltam {ct.daysToExpiry} dias
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${hasSlaBreak ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {ct.slaCompliance}%
                            </span>
                            <span className="text-[10px] text-slate-500">(Meta: {ct.slaTarget}%)</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              ct.riskIndex === 'IGP-M' 
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {ct.riskIndex}
                            </span>
                            {!ct.hasLgpdClause && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Sem LGPD
                              </span>
                            )}
                            {ct.autoRenewal && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Renov. Automática
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ct.status === 'Regular' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            ct.status === 'Vencimento Próximo' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {ct.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {hasSlaBreak ? (
                            <span className="font-mono text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              -R$ {estimatedPenalty.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">-</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedContractForAudit(ct)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
                          >
                            Auditar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Drawer de Análise Detalhada de Contrato */}
          {selectedContractForAudit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm">Auditoria Jurídica & Financeira</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedContractForAudit(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <p className="font-bold text-sm text-white">{selectedContractForAudit.vendor}</p>
                    <p className="text-slate-400">Contrato: <span className="font-mono text-indigo-300">{selectedContractForAudit.id}</span></p>
                    <p className="text-slate-400">Valor Anual: <span className="font-mono text-emerald-400">{selectedContractForAudit.value}</span></p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-300">Diagnóstico de Cláusulas Contratuais:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span>Índice de Reajuste:</span>
                        <strong className={selectedContractForAudit.riskIndex === 'IGP-M' ? 'text-rose-400' : 'text-emerald-400'}>
                          {selectedContractForAudit.riskIndex} {selectedContractForAudit.riskIndex === 'IGP-M' ? '(Risco de inflação volátil)' : '(Estável)'}
                        </strong>
                      </li>
                      <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span>Conformidade LGPD:</span>
                        <strong className={selectedContractForAudit.hasLgpdClause ? 'text-emerald-400' : 'text-rose-400'}>
                          {selectedContractForAudit.hasLgpdClause ? '✓ Cláusula Presente' : '✗ Cláusula Ausente (Risco de Multa)'}
                        </strong>
                      </li>
                      <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span>Renovação Automática:</span>
                        <strong className={selectedContractForAudit.autoRenewal ? 'text-amber-400' : 'text-slate-400'}>
                          {selectedContractForAudit.autoRenewal ? 'Ativa (Notificar com 60d)' : 'Não'}
                        </strong>
                      </li>
                    </ul>
                  </div>

                  {selectedContractForAudit.slaCompliance < selectedContractForAudit.slaTarget && (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1">
                      <p className="font-bold">Penalidade por Quebra de SLA:</p>
                      <p className="text-[11px]">
                        O SLA atual ({selectedContractForAudit.slaCompliance}%) ficou abaixo da meta contratual de {selectedContractForAudit.slaTarget}%. 
                        Recomenda-se aplicar glosa financeira de retenção na fatura corrente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedContractForAudit(null)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer text-center"
                  >
                    Fechar Auditoria
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedComplianceSuite;
