import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, ShieldCheck, Filter, ArrowRight, 
  Layers, Plus, RefreshCw, CheckCircle2, ChevronRight, Info, Scale, 
  ExternalLink, BarChart3, Sliders, Activity
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface RiskItem {
  id: string;
  code: string;
  title: string;
  category: 'Financeiro' | 'Operacional' | 'Compliance & Regulatório' | 'Cibernético & TI' | 'Estratégico';
  description: string;
  inherentProbability: number; // 1 to 5
  inherentImpact: number; // 1 to 5
  residualProbability: number; // 1 to 5
  residualImpact: number; // 1 to 5
  keyControls: string;
  treatment: 'Mitigar' | 'Transferir' | 'Evitar' | 'Aceitar';
  owner: string;
  deadline: string;
}

interface EnterpriseRiskMatrixProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const EnterpriseRiskMatrix: React.FC<EnterpriseRiskMatrixProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTreatment, setSelectedTreatment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'residual' | 'inherent'>('residual');
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);

  const [risks, setRisks] = useState<RiskItem[]>([
    {
      id: 'RSK-001',
      code: 'RSK-FIN-01',
      title: 'Volatilidade Cambial em Insumos Farmacêuticos (Dólar/Real)',
      category: 'Financeiro',
      description: 'Oscilação superior a 15% na cotação do USD/BRL impactando custos de aquisição de matérias-primas ativas.',
      inherentProbability: 5,
      inherentImpact: 4, // Score 20 (Crítico)
      residualProbability: 2,
      residualImpact: 2, // Score 4 (Baixo)
      keyControls: 'Contratos derivativos de NDF (Non-Deliverable Forward) com 80% de hedge cambial contratado na tesouraria.',
      treatment: 'Transferir',
      owner: 'Tesouraria & Finanças',
      deadline: '2026-12-31'
    },
    {
      id: 'RSK-002',
      code: 'RSK-CMP-02',
      title: 'Fraude ou Desvio por Conflito de Segregação de Funções (SoD)',
      category: 'Compliance & Regulatório',
      description: 'Criação de fornecedor fantasma e liquidação bancária pelo mesmo colaborador no SAP.',
      inherentProbability: 4,
      inherentImpact: 5, // Score 20 (Crítico)
      residualProbability: 1,
      residualImpact: 2, // Score 2 (Baixo)
      keyControls: 'Matriz SoD no GRC, bloqueio de transações conflitantes e aprovação dual no Internet Banking.',
      treatment: 'Mitigar',
      owner: 'Controladoria & Auditoria Interna',
      deadline: '2026-10-30'
    },
    {
      id: 'RSK-003',
      code: 'RSK-OPS-03',
      title: 'Parada Crítica Não Programada na Linha de Blister',
      category: 'Operacional',
      description: 'Falha eletromecânica catastrófica na blisterizadora rotativa causando ruptura de fornecimento ao mercado.',
      inherentProbability: 4,
      inherentImpact: 4, // Score 16 (Crítico)
      residualProbability: 2,
      residualImpact: 2, // Score 4 (Baixo)
      keyControls: 'Plano de Manutenção Preventiva TPM, telemetria IoT de vibração e estoque de peças sobressalentes.',
      treatment: 'Mitigar',
      owner: 'Gerência de Engenharia & Manutenção',
      deadline: '2026-11-15'
    },
    {
      id: 'RSK-004',
      code: 'RSK-CYB-04',
      title: 'Ataque de Ransomware ou Vazamento em Servidores SAP S/4HANA',
      category: 'Cibernético & TI',
      description: 'Comprometimento de credenciais privilegiadas e sequestro do banco de dados operacional.',
      inherentProbability: 4,
      inherentImpact: 5, // Score 20 (Crítico)
      residualProbability: 1,
      residualImpact: 3, // Score 3 (Moderado)
      keyControls: 'Autenticação Multifator (MFA/OAuth2), backup imutável em nuvem fria e SOC 24/7.',
      treatment: 'Mitigar',
      owner: 'Diretoria de Segurança da Informação (CISO)',
      deadline: '2026-09-30'
    },
    {
      id: 'RSK-005',
      code: 'RSK-STR-05',
      title: 'Atraso em Registro Sanitário de Nova Fórmula na ANVISA',
      category: 'Estratégico',
      description: 'Exigência técnica regulatória estendendo o prazo de lançamento comercial do novo analgésico.',
      inherentProbability: 3,
      inherentImpact: 4, // Score 12 (Alto)
      residualProbability: 2,
      residualImpact: 3, // Score 6 (Moderado)
      keyControls: 'Comitê Regulatório de Boas Práticas Clínicas e auditorias prévias de validação analítica.',
      treatment: 'Mitigar',
      owner: 'Assuntos Regulatórios & P&D',
      deadline: '2026-12-15'
    }
  ]);

  // Probability and Impact Scales (1 to 5)
  const probabilities = [
    { level: 5, label: '5 - Quase Certo (>80%)' },
    { level: 4, label: '4 - Provável (50-80%)' },
    { level: 3, label: '3 - Possível (20-50%)' },
    { level: 2, label: '2 - Improvável (5-20%)' },
    { level: 1, label: '1 - Raro (<5%)' }
  ];

  const impacts = [
    { level: 1, label: '1 - Insignificante' },
    { level: 2, label: '2 - Menor' },
    { level: 3, label: '3 - Moderado' },
    { level: 4, label: '4 - Maior' },
    { level: 5, label: '5 - Catastrófico' }
  ];

  const getSeverity = (score: number) => {
    if (score >= 15) return { label: 'Crítico', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', color: '#f43f5e' };
    if (score >= 10) return { label: 'Alto', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', color: '#f59e0b' };
    if (score >= 5) return { label: 'Médio', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', color: '#eab308' };
    return { label: 'Baixo', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', color: '#10b981' };
  };

  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchTreat = selectedTreatment === 'all' || r.treatment === selectedTreatment;
      if (!matchCat || !matchTreat) return false;

      if (selectedCell) {
        const prob = viewMode === 'residual' ? r.residualProbability : r.inherentProbability;
        const imp = viewMode === 'residual' ? r.residualImpact : r.inherentImpact;
        return prob === selectedCell.prob && imp === selectedCell.imp;
      }
      return true;
    });
  }, [risks, selectedCategory, selectedTreatment, selectedCell, viewMode]);

  // Overall Statistics
  const inherentScoreSum = useMemo(() => risks.reduce((acc, r) => acc + (r.inherentProbability * r.inherentImpact), 0), [risks]);
  const residualScoreSum = useMemo(() => risks.reduce((acc, r) => acc + (r.residualProbability * r.residualImpact), 0), [risks]);
  const mitigationRate = Math.round(((inherentScoreSum - residualScoreSum) / inherentScoreSum) * 100);

  const handleUpdateTreatment = (riskId: string, newTreatment: RiskItem['treatment']) => {
    setRisks(prev => prev.map(r => {
      if (r.id === riskId) {
        addAuditLog('Matriz de Riscos ERM (COSO)', `Tratativa do risco ${r.code} atualizada para ${newTreatment}.`);
        return { ...r, treatment: newTreatment };
      }
      return r;
    }));
    addToast(`Tratativa do risco atualizada para: ${newTreatment}!`, 'success');
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Gestão de Riscos Corporativos (ERM)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
              Framework COSO / ISO 31000
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <ShieldAlert className="w-6 h-6 text-rose-400" /> Matriz de Risco 5×5 & Governança de Controles
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Mapeamento dinâmico de Risco Inerente vs. Risco Residual, eficácia dos controles mitigatórios e planos de resposta.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => { setViewMode('residual'); setSelectedCell(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'residual' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risco Residual (Pós-Controles)
          </button>
          <button
            onClick={() => { setViewMode('inherent'); setSelectedCell(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'inherent' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risco Inerente (Sem Controles)
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Taxa de Mitigação Global</span>
          <div className="flex items-center justify-between">
            <strong className="text-2xl font-black font-mono text-emerald-400">{mitigationRate}%</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Alta Eficácia
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Neutralização obtida via controles SOX e compliance.</p>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Severidade Inerente Total</span>
          <div className="flex items-center justify-between">
            <strong className="text-2xl font-black font-mono text-rose-400">{inherentScoreSum} pts</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
              Exposição Bruta
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Calculado para a carteira de 5 riscos estratégicos.</p>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Severidade Residual Atual</span>
          <div className="flex items-center justify-between">
            <strong className="text-2xl font-black font-mono text-purple-400">{residualScoreSum} pts</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
              Controlado
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Dentro do apetite a risco do Conselho de Administração.</p>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Riscos em Zona Crítica</span>
          <div className="flex items-center justify-between">
            <strong className="text-2xl font-black font-mono text-emerald-400">
              {risks.filter(r => (viewMode === 'residual' ? r.residualProbability * r.residualImpact : r.inherentProbability * r.inherentImpact) >= 15).length}
            </strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300">
              Residual = 0 Crítico
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Todos os riscos inerentes críticos foram rebaixados.</p>
        </div>
      </div>

      {/* 5x5 Heatmap Grid & Legend */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Matriz Heatmap 5×5 ({viewMode === 'residual' ? 'Risco Residual Atual' : 'Risco Inerente Prévio'})
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer célula para filtrar instantaneamente os riscos daquela coordenada.
            </p>
          </div>

          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              Limpar filtro da célula ({selectedCell.prob}×{selectedCell.imp}) ✕
            </button>
          )}
        </div>

        {/* The 5x5 Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-6 gap-1.5 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
            {/* Top Header Row (Impact Levels) */}
            <div className="font-bold text-slate-500 p-2 flex items-center justify-center text-[11px] uppercase">
              Prob. \ Imp.
            </div>
            {impacts.map(imp => (
              <div key={imp.level} className="text-center font-bold text-slate-400 p-2 text-[11px]">
                {imp.label}
              </div>
            ))}

            {/* Matrix Rows (5 down to 1) */}
            {probabilities.map(prob => (
              <React.Fragment key={prob.level}>
                <div className="font-bold text-slate-400 p-2 flex items-center text-[11px]">
                  {prob.label}
                </div>

                {impacts.map(imp => {
                  const score = prob.level * imp.level;
                  const sev = getSeverity(score);
                  const matchingRisks = risks.filter(r => {
                    const rProb = viewMode === 'residual' ? r.residualProbability : r.inherentProbability;
                    const rImp = viewMode === 'residual' ? r.residualImpact : r.inherentImpact;
                    return rProb === prob.level && rImp === imp.level;
                  });
                  const isSelected = selectedCell?.prob === prob.level && selectedCell?.imp === imp.level;

                  return (
                    <button
                      key={`${prob.level}-${imp.level}`}
                      onClick={() => setSelectedCell({ prob: prob.level, imp: imp.level })}
                      className={`h-16 rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                        isSelected ? 'ring-2 ring-white scale-95 shadow-lg' : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        backgroundColor: score >= 15 ? 'rgba(244, 63, 94, 0.22)' : score >= 10 ? 'rgba(245, 158, 11, 0.20)' : score >= 5 ? 'rgba(234, 179, 8, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                        borderColor: score >= 15 ? 'rgba(244, 63, 94, 0.4)' : score >= 10 ? 'rgba(245, 158, 11, 0.4)' : score >= 5 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-slate-300">{score} pts</span>
                        <span className={`px-1 rounded text-[9px] font-bold ${sev.bg}`}>{sev.label}</span>
                      </div>

                      {matchingRisks.length > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-[11px] shadow-sm">
                            {matchingRisks.length} {matchingRisks.length === 1 ? 'risco' : 'riscos'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar & Risk List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar Categoria:
            </span>
            {['all', 'Financeiro', 'Operacional', 'Compliance & Regulatório', 'Cibernético & TI', 'Estratégico'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Tratativa:</span>
            {['all', 'Mitigar', 'Transferir', 'Evitar', 'Aceitar'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTreatment(t)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  selectedTreatment === t ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Detail Cards */}
        <div className="grid grid-cols-1 gap-3">
          {filteredRisks.map((risk) => {
            const inhScore = risk.inherentProbability * risk.inherentImpact;
            const resScore = risk.residualProbability * risk.residualImpact;
            const inhSev = getSeverity(inhScore);
            const resSev = getSeverity(resScore);

            return (
              <div
                key={risk.id}
                className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-3 shadow-sm`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400">{risk.code}</span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {risk.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">📅 Prazo: {risk.deadline}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-400">Inerente:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inhSev.bg}`}>
                        {inhScore} pts ({inhSev.label})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">Residual:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${resSev.bg}`}>
                        {resScore} pts ({resSev.label})
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{risk.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{risk.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Controles Internos Mitigatórios em Operação:
                  </span>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{risk.keyControls}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Responsável: <strong className="text-white">{risk.owner}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-[11px]">Estratégia de Resposta:</span>
                    {(['Mitigar', 'Transferir', 'Evitar', 'Aceitar'] as const).map(treat => (
                      <button
                        key={treat}
                        onClick={() => handleUpdateTreatment(risk.id, treat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          risk.treatment === treat
                            ? 'bg-purple-600 text-white shadow font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {treat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseRiskMatrix;
