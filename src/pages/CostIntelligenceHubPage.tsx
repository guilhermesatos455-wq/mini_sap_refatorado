import React, { useState } from 'react';
import { 
  TrendingUp, ShieldCheck, ShieldAlert, FileSearch, 
  Database, GitPullRequest, Cpu, LayoutGrid, Layers, Sparkles,
  Lock, AlertTriangle, ArrowLeft, KeyRound, Terminal, FlaskConical,
  Bot, FileSpreadsheet, Scale, QrCode, Globe2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';
import StrategicHubPage from './StrategicHubPage';
import ProductionSuitePage from './ProductionSuitePage';
import AdvancedCompliancePage from './AdvancedCompliancePage';
import GlobalEnterprisePage from './GlobalEnterprisePage';
import EnterpriseControlPage from './EnterpriseControlPage';
import EnterpriseCompliancePage from './EnterpriseCompliancePage';
import AdvancedEnterprisePage from './AdvancedEnterprisePage';
import UnifiedEnterprisePage from './UnifiedEnterprisePage';
import CloudErpPage from './CloudErpPage';
import AuditCfoCopilotPage from './AuditCfoCopilotPage';
import ExecutiveDossierPage from './ExecutiveDossierPage';
import EnterpriseRiskMatrixPage from './EnterpriseRiskMatrixPage';
import TaxReformPage from './TaxReformPage';
import PharmaTraceabilityPage from './PharmaTraceabilityPage';
import TransferPricingPage from './TransferPricingPage';

export const CostIntelligenceHubPage: React.FC = () => {
  const { darkMode, userLevel, setUserLevel, addToast } = useAudit();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<
    'strategic' | 'copilot' | 'dossier' | 'erm' | 'tax_reform' | 'traceability' | 'transfer_pricing' | 'production' | 'compliance' | 'global' | 'control' | 'latam' | 'advanced' | 'unified' | 'cloud'
  >('strategic');

  const isDevAuthorized = userLevel === 0 || user?.email?.toLowerCase() === 'guilhermesatos455@gmail.com';

  const subTabs = [
    { id: 'strategic', label: 'Hub Estratégico (Caixa & Fraudes)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'copilot', label: 'Copilot CFO & Parecer Big Four', icon: <Bot className="w-4 h-4 text-purple-400" /> },
    { id: 'dossier', label: 'Dossiê Executivo & SPED', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> },
    { id: 'erm', label: 'Matriz de Risco ERM (COSO)', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
    { id: 'tax_reform', label: 'Reforma Tributária (IBS/CBS)', icon: <Scale className="w-4 h-4 text-blue-400" /> },
    { id: 'traceability', label: 'Rastreabilidade Serial (SNCM)', icon: <QrCode className="w-4 h-4 text-emerald-400" /> },
    { id: 'transfer_pricing', label: 'Preços de Transferência (OCDE)', icon: <Globe2 className="w-4 h-4 text-indigo-400" /> },
    { id: 'production', label: 'Suíte de Produção (RBAC & Webhooks)', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'compliance', label: 'SoD, Créditos & Contratos', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'global', label: 'JET, ESG & Risco Cambial', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'control', label: 'Governança & Controle Executivo', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'latam', label: 'Enterprise & Compliance LATAM', icon: <Database className="w-4 h-4" /> },
    { id: 'advanced', label: 'Suíte Avançada & Custo Médio', icon: <GitPullRequest className="w-4 h-4" /> },
    { id: 'unified', label: 'Suíte Unificada Enterprise', icon: <Cpu className="w-4 h-4" /> },
    { id: 'cloud', label: 'Cloud ERP & Manufatura Suite', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  // Access Control Guard for non-dev users
  if (!isDevAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className={`max-w-lg w-full p-8 rounded-3xl border text-center shadow-2xl relative overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'
        }`}>
          {/* Top Beta Ribbon */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-widest mb-4">
            <FlaskConical className="w-3.5 h-3.5" /> Função Beta (Exclusiva DEV)
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2">
            Acesso Restrito ao Hub de Custos
          </h2>

          <p className={`text-xs md:text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            O <strong>Hub de Inteligência de Custos</strong> é um recurso classificado em fase <strong>BETA Experimental</strong>. Atualmente, ele está liberado e visível estritamente para usuários com <strong>Autorização de Desenvolvedor (Nível 0 DEV)</strong>.
          </p>

          <div className={`p-4 rounded-2xl border text-xs mb-6 text-left space-y-2 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">Status do Usuário:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[11px]">
                Nível {userLevel} (Não Autorizado)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">Nível Requerido:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[11px]">
                Nível 0 (Developer / Superuser)
              </span>
            </div>
            {user?.email && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                <span className="text-slate-400 font-bold">E-mail Conectado:</span>
                <span className="font-mono text-[10px] text-slate-300">{user.email}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
            </button>
            <button
              onClick={() => {
                const pass = window.prompt('Digite a chave mestra ou credencial DEV para autorização temporária:');
                if (pass === 'dev' || pass === 'natuassist' || pass === 'admin' || user?.email?.toLowerCase() === 'guilhermesatos455@gmail.com') {
                  setUserLevel(0);
                  addToast('Autorização DEV concedida com sucesso! Nível 0 ativado.', 'success');
                } else if (pass !== null) {
                  addToast('Chave de autorização DEV inválida.', 'error');
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-600 hover:to-yellow-600 shadow-md cursor-pointer transition-all"
            >
              <KeyRound className="w-4 h-4" /> Autenticar como DEV
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Beta Warning Bar */}
      <div className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
        darkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold">
            Ambiente Beta Experimental:
          </span>
          <span className="opacity-90 hidden sm:inline">
            Acesso liberado exclusivamente para desenvolvedores autorizados (Nível 0 DEV).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
            DEV ATIVO (NÍVEL {userLevel})
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${darkMode ? 'bg-gradient-to-r from-slate-900 to-slate-900/80 border-slate-800 text-white' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-slate-900'}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="w-3 h-3" /> BETA EXPERIMENTAL
            </span>
            <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Central Consolidada Enterprise
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Layers className="w-7 h-7 text-[#8DC63F]" /> Hub Inteligência de Custos & Governança SAP
          </h1>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Todas as suítes de custos, auditoria de caixa, compliance LATAM, SoD e controle de manufatura unificadas em uma única interface organizada.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className={`p-2 rounded-2xl border flex items-center gap-2 overflow-x-auto custom-scrollbar shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === tab.id
                ? (darkMode ? 'bg-[#8DC63F] text-slate-950 shadow-md font-black' : 'bg-[#8DC63F] text-white shadow-md font-black')
                : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900')
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Sub-Tab Content */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-gray-200'}`}>
        {activeSubTab === 'strategic' && <StrategicHubPage />}
        {activeSubTab === 'copilot' && <AuditCfoCopilotPage />}
        {activeSubTab === 'dossier' && <ExecutiveDossierPage />}
        {activeSubTab === 'erm' && <EnterpriseRiskMatrixPage />}
        {activeSubTab === 'tax_reform' && <TaxReformPage />}
        {activeSubTab === 'traceability' && <PharmaTraceabilityPage />}
        {activeSubTab === 'transfer_pricing' && <TransferPricingPage />}
        {activeSubTab === 'production' && <ProductionSuitePage />}
        {activeSubTab === 'compliance' && <AdvancedCompliancePage />}
        {activeSubTab === 'global' && <GlobalEnterprisePage />}
        {activeSubTab === 'control' && <EnterpriseControlPage />}
        {activeSubTab === 'latam' && <EnterpriseCompliancePage />}
        {activeSubTab === 'advanced' && <AdvancedEnterprisePage />}
        {activeSubTab === 'unified' && <UnifiedEnterprisePage />}
        {activeSubTab === 'cloud' && <CloudErpPage />}
      </div>
    </div>
  );
};

export default CostIntelligenceHubPage;

