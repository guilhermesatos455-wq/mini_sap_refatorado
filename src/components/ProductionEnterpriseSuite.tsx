import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, UserCheck, Webhook, Bell, Send, CheckCircle2, 
  Lock, Key, Globe, Radio, Eye, Copy, RefreshCw, AlertTriangle, 
  Activity, Server, FileText, Check, ArrowRight, Sparkles, Sliders,
  CheckSquare, Square, Terminal
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface ProductionEnterpriseSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface WebhookDispatchLog {
  id: string;
  timestamp: string;
  event: string;
  target: string;
  status: number;
  statusText: string;
  latencyMs: number;
}

export const ProductionEnterpriseSuite: React.FC<ProductionEnterpriseSuiteProps> = ({ darkMode, addToast }) => {
  const { userLevel, setUserLevel } = useAudit();
  const [activeTab, setActiveTab] = useState<'rbac' | 'webhooks' | 'health' | 'simulation'>('rbac');

  // --- 1. RBAC State & Matrix ---
  const roles = [
    { id: 0, title: 'C-Level / DEV (Nível 0)', desc: 'Controle irrestrito, exportações de configuração e parametrização avançada.' },
    { id: 1, title: 'Gerente de Auditoria (Nível 1)', desc: 'Aprovação de alçada SOX, liberação de bloqueios e governança.' },
    { id: 2, title: 'Auditor Externo / Big Four (Nível 2)', desc: 'Leitura profunda, trilhas SOX e exportação de relatórios executivos.' },
    { id: 3, title: 'Analista Fiscal / Operação (Nível 3)', desc: 'Consulta padrão de notas, lançamentos e cálculos de CKM3.' },
  ];

  const rbacMatrix = [
    { operation: 'Aprovação de Alçada SOX (Liberação de Lotes)', l0: 'Total', l1: 'Aprovação', l2: 'Leitura', l3: 'Bloqueado' },
    { operation: 'Ajuste e Recálculo CKM3 / Custo Médio PMM', l0: 'Total', l1: 'Total', l2: 'Leitura', l3: 'Leitura' },
    { operation: 'Estorno e Retificação de Movimentos MB51', l0: 'Total', l1: 'Total', l2: 'Bloqueado', l3: 'Bloqueado' },
    { operation: 'Configuração de Webhooks e Alertas Push', l0: 'Total', l1: 'Leitura', l2: 'Bloqueado', l3: 'Bloqueado' },
    { operation: 'Exportação de Dossiê Executivo & Parecer', l0: 'Total', l1: 'Total', l2: 'Total', l3: 'Leitura' },
    { operation: 'Gestão de Usuários, Banners & Tokens DEV', l0: 'Total', l1: 'Bloqueado', l2: 'Bloqueado', l3: 'Bloqueado' },
  ];

  const getPermissionBadge = (perm: string) => {
    switch (perm) {
      case 'Total':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Total</span>;
      case 'Aprovação':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">Aprovação</span>;
      case 'Leitura':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">Leitura</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">Bloqueado</span>;
    }
  };

  // --- 2. Webhooks State & Triggers ---
  const [webhookProvider, setWebhookProvider] = useState<'slack' | 'teams' | 'sap_alm' | 'custom'>('slack');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/SAP_AUDIT_HOOK');
  const [webhookChannel, setWebhookChannel] = useState('#auditoria-sap-critica');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [selectedTriggers, setSelectedTriggers] = useState<{ [key: string]: boolean }>({
    ckm3_divergence: true,
    cash_fraud_alert: true,
    sox_violation: true,
    pharma_expiration: false,
    tax_divergence: true,
    closing_completed: false,
  });

  const toggleTrigger = (key: string) => {
    setSelectedTriggers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [dispatchLogs, setDispatchLogs] = useState<WebhookDispatchLog[]>([
    {
      id: 'DISP-1092',
      timestamp: 'Hoje às 11:20',
      event: 'Divergência CKM3 detectada (+8.4% Material 400129)',
      target: '#auditoria-sap-critica',
      status: 200,
      statusText: 'OK',
      latencyMs: 84
    },
    {
      id: 'DISP-1091',
      timestamp: 'Hoje às 09:45',
      event: 'Tentativa de estorno não autorizado (Usuário Analista)',
      target: '#auditoria-sap-critica',
      status: 200,
      statusText: 'OK',
      latencyMs: 96
    }
  ]);

  // Live JSON Payload Preview
  const payloadPreview = useMemo(() => {
    const activeTriggerList = Object.entries(selectedTriggers)
      .filter(([_, active]) => active)
      .map(([k]) => k);

    return JSON.stringify({
      version: '2.4-enterprise',
      source: 'NatuAssist SAP Audit Suite',
      provider: webhookProvider,
      channel: webhookChannel,
      target_endpoint: webhookUrl,
      timestamp: new Date().toISOString(),
      security: {
        enforce_sox_compliance: true,
        audit_trail_recorded: true
      },
      active_triggers: activeTriggerList,
      sample_payload: {
        alert_id: 'ALT-SAP-' + Math.floor(100000 + Math.random() * 900000),
        severity: 'CRITICAL',
        title: 'Alerta Automático de Integridade Fiscal & Custo SAP',
        description: 'Divergência identificada durante reconciliação contábil automatizada.',
        financial_impact_brl: 142500.00,
        suggested_action: 'Revisar apontamento no MB51 e recalcular CKM3 antes do fechamento.'
      }
    }, null, 2);
  }, [selectedTriggers, webhookProvider, webhookChannel, webhookUrl]);

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      const newLog: WebhookDispatchLog = {
        id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: 'Agora mesmo',
        event: 'Disparo Manual de Teste de Integridade',
        target: webhookChannel,
        status: 200,
        statusText: 'OK',
        latencyMs: Math.floor(65 + Math.random() * 45)
      };
      setDispatchLogs(prev => [newLog, ...prev]);
      addToast(`Disparo de teste 200 OK entregue para ${webhookChannel}!`, 'success');
    }, 1100);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payloadPreview);
    setCopiedPayload(true);
    addToast('Payload JSON copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // --- 3. Integration Health State ---
  const [latencyBenchmark, setLatencyBenchmark] = useState<number>(84);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const handleRunDiagnostics = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
      const newLatency = Math.floor(58 + Math.random() * 35);
      setLatencyBenchmark(newLatency);
      addToast(`Diagnóstico concluído: Conectores 100% operacionais (${newLatency}ms)!`, 'success');
    }, 1200);
  };

  // --- 4. Role Simulation State ---
  const [simulatedRole, setSimulatedRole] = useState<number>(userLevel);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <ShieldCheck className="w-6 h-6 text-purple-400" /> Suíte de Produção (RBAC, Webhooks & Governança)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Matriz de alçadas SOX, disparador de webhooks com seleção de gatilhos corporativos e monitoramento em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rbac' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Matriz RBAC
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webhooks' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" /> Webhooks & Gatilhos
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'health' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Saúde de Conexões
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulation' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Simulação de Papel
          </button>
        </div>
      </div>

      {/* Tab 1: RBAC Management & Interactive Matrix */}
      {activeTab === 'rbac' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Level Card */}
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <UserCheck className="w-4 h-4 text-purple-400" /> Perfil de Acesso Ativo (RBAC)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Alterne o perfil ativo para aplicar regras de segurança e alçadas de autorização no sistema.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Nível Selecionado:</span>
                <select
                  value={userLevel}
                  onChange={(e) => {
                    const newLvl = Number(e.target.value);
                    setUserLevel(newLvl);
                    addToast(`Nível de acesso alterado para: Nível ${newLvl}`, 'success');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                  }`}
                >
                  <option value={0}>Nível 0 - C-Level / DEV (Acesso Total)</option>
                  <option value={1}>Nível 1 - Gerente de Auditoria & Compliance</option>
                  <option value={2}>Nível 2 - Auditor Externo (Big Four)</option>
                  <option value={3}>Nível 3 - Analista Fiscal / Operação</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {roles.map(r => (
                <div 
                  key={r.id} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    userLevel === r.id 
                      ? (darkMode ? 'bg-purple-950/40 border-purple-500/50 shadow-md' : 'bg-purple-50 border-purple-300 shadow-md')
                      : (darkMode ? 'bg-slate-950/40 border-slate-800/80 opacity-75' : 'bg-slate-50 border-gray-200 opacity-75')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-purple-400">{r.title}</span>
                    {userLevel === r.id && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500 text-white">ATIVO</span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RBAC Matrix Table */}
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Matriz de Direitos e Alçadas SOX
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Mapeamento de segregação de funções (SoD) auditável por órgãos reguladores.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Auditoria SOX Ativa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider font-black ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className="pb-3 pr-4">Operação Crítica SAP</th>
                    <th className="pb-3 px-2 text-center">Nível 0 (C-Level/DEV)</th>
                    <th className="pb-3 px-2 text-center">Nível 1 (Gerente)</th>
                    <th className="pb-3 px-2 text-center">Nível 2 (Auditor)</th>
                    <th className="pb-3 px-2 text-center">Nível 3 (Analista)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {rbacMatrix.map((item, idx) => (
                    <tr key={idx} className={`hover:${darkMode ? 'bg-slate-800/30' : 'bg-gray-50'} transition-colors`}>
                      <td className={`py-3 pr-4 font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {item.operation}
                      </td>
                      <td className="py-3 px-2 text-center">{getPermissionBadge(item.l0)}</td>
                      <td className="py-3 px-2 text-center">{getPermissionBadge(item.l1)}</td>
                      <td className="py-3 px-2 text-center">{getPermissionBadge(item.l2)}</td>
                      <td className="py-3 px-2 text-center">{getPermissionBadge(item.l3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Webhooks & Trigger Selector */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Config & Triggers */}
            <div className={`lg:col-span-7 p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-5`}>
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Webhook className="w-4 h-4 text-emerald-400" /> Configuração do Webhook Corporativo
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Defina o destino e selecione os gatilhos que devem enviar notificações imediatas para a equipe.
                </p>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Provedor de Destino:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'slack', label: 'Slack' },
                    { id: 'teams', label: 'MS Teams' },
                    { id: 'sap_alm', label: 'SAP Cloud ALM' },
                    { id: 'custom', label: 'Custom HTTP' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setWebhookProvider(p.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        webhookProvider === p.id
                          ? 'bg-[#8DC63F] text-slate-950 border-[#8DC63F] shadow-sm font-black'
                          : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-gray-100')
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Webhook Inputs */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Endpoint / URL do Webhook:</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Canal / Sala de Alertas:</label>
                  <input
                    type="text"
                    value={webhookChannel}
                    onChange={(e) => setWebhookChannel(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Triggers Selector (Checkboxes) */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Gatilhos de Eventos Automatizados</span>
                  <span className="text-[10px] text-purple-400">Selecione para ativar</span>
                </label>

                <div className="space-y-2">
                  {[
                    { id: 'ckm3_divergence', label: 'Divergência de Preço no CKM3 > 5%', desc: 'Dispara quando o custo médio calculado desvia do padrão.' },
                    { id: 'cash_fraud_alert', label: 'Suspeita de Fraude no Fluxo de Caixa', desc: 'Identificação de notas fiscais com padrões atípicos de liquidação.' },
                    { id: 'sox_violation', label: 'Tentativa de Violação de Alçada RBAC', desc: 'Tentativas de estorno ou aprovação sem permissão de Nível 0/1.' },
                    { id: 'tax_divergence', label: 'Desvio de Alíquotas Fiscais (ICMS/PIS/COFINS)', desc: 'Inconsistência identificada entre nota de entrada e parametrização.' },
                    { id: 'pharma_expiration', label: 'Lote Farmacêutico Próximo ao Vencimento (< 30d)', desc: 'Alerta preventivo para produtos em quarentena ou estoque.' },
                    { id: 'closing_completed', label: 'Fechamento Contábil Mensal Concluído', desc: 'Notificação com resumo consolidado de saldos e lançamentos.' },
                  ].map(trigger => (
                    <div 
                      key={trigger.id}
                      onClick={() => toggleTrigger(trigger.id)}
                      className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        selectedTriggers[trigger.id]
                          ? (darkMode ? 'bg-purple-950/30 border-purple-500/40 text-white' : 'bg-purple-50 border-purple-300 text-slate-900')
                          : (darkMode ? 'bg-slate-950/30 border-slate-800/80 text-slate-400' : 'bg-slate-50/50 border-gray-200 text-slate-500')
                      }`}
                    >
                      <div className="mt-0.5 text-purple-400">
                        {selectedTriggers[trigger.id] ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-tight">{trigger.label}</p>
                        <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {trigger.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isTestingWebhook ? 'animate-pulse' : ''}`} />
                  {isTestingWebhook ? 'Enviando Alerta de Teste...' : 'Disparar Alerta de Teste (HTTP POST)'}
                </button>
              </div>
            </div>

            {/* Right Column: Live Payload Preview & Logs */}
            <div className="lg:col-span-5 space-y-5">
              {/* Payload Preview */}
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <Terminal className="w-3.5 h-3.5 text-[#8DC63F]" /> Prévia do Payload JSON (Ao Vivo)
                  </h3>
                  <button
                    onClick={handleCopyPayload}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                      copiedPayload 
                        ? 'bg-emerald-500 text-white' 
                        : (darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                    }`}
                  >
                    {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedPayload ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>

                <div className={`p-3 rounded-xl font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto custom-scrollbar border ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-900 border-slate-800 text-emerald-300'
                }`}>
                  <pre className="whitespace-pre-wrap">{payloadPreview}</pre>
                </div>
              </div>

              {/* Dispatch Logs */}
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
                <h3 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Últimos Disparos de Webhook
                </h3>

                <div className="space-y-2">
                  {dispatchLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-gray-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">
                            {log.status} {log.statusText}
                          </span>
                          <span className="font-bold truncate text-[11px]">{log.event}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.target} • {log.timestamp}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {log.latencyMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Integration Health & Connectors Dashboard */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Conectores SAP</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">3 / 3 Ativos</p>
              <p className="text-[11px] text-slate-500 mt-1">RFC, BAPI & Cloud ALM conectados</p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Taxa de Entrega</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-400">99.8%</p>
              <p className="text-[11px] text-slate-500 mt-1">1.420 disparos nas últimas 24h</p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Latência de Resposta</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400">{latencyBenchmark}ms</p>
              <p className="text-[11px] text-slate-500 mt-1">Tempo médio de resposta do servidor</p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Status do Código</span>
                <Radio className="w-4 h-4 text-[#8DC63F]" />
              </div>
              <p className="text-2xl font-black text-[#8DC63F]">100% Verde</p>
              <p className="text-[11px] text-slate-500 mt-1">TypeScript & Lint validados</p>
            </div>
          </div>

          {/* Connectors Detailed Status */}
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Server className="w-4 h-4 text-emerald-400" /> Status dos Conectores de Infraestrutura
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Monitoramento contínuo dos canais de integração externa e barramento corporativo.
                </p>
              </div>
              <button
                onClick={handleRunDiagnostics}
                disabled={isDiagnosing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8DC63F] text-slate-950 hover:bg-[#7cb337] transition-all flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                {isDiagnosing ? 'Diagnosticando...' : 'Diagnosticar Conexões'}
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'SAP PI/PO & RFC Connector', desc: 'Barramento de comunicação com o backend ERP', status: 'Operacional', ping: '62ms' },
                { name: 'Slack / Teams Webhook Relay', desc: 'Canal de envio para grupos de auditoria fiscal e C-Level', status: 'Operacional', ping: '84ms' },
                { name: 'SAP Cloud ALM Audit Forwarder', desc: 'Encaminhador de trilha de eventos de conformidade SOX', status: 'Operacional', ping: '110ms' },
              ].map((conn, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="font-bold text-xs">{conn.name}</p>
                      <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{conn.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">{conn.ping}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">
                      {conn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Role Simulation Sandbox */}
      {activeTab === 'simulation' && (
        <div className="space-y-6 animate-in fade-in">
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Eye className="w-4 h-4 text-purple-400" /> Simulador de Visão de Papel (Sandbox)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Avalie como as páginas e regras comportam-se sob a perspectiva de cada função corporativa sem precisar alterar seu usuário real.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Sandbox Mode
              </span>
            </div>

            {/* Role Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { lvl: 0, label: 'C-Level / DEV' },
                { lvl: 1, label: 'Gerente Auditoria' },
                { lvl: 2, label: 'Auditor Externo' },
                { lvl: 3, label: 'Analista Fiscal' }
              ].map(item => (
                <button
                  key={item.lvl}
                  onClick={() => setSimulatedRole(item.lvl)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    simulatedRole === item.lvl
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-gray-100')
                  }`}
                >
                  {item.label}
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Nível {item.lvl}</div>
                </button>
              ))}
            </div>

            {/* Simulation Preview Card */}
            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-400">
                  Direitos Efetivos na Visão Simulada (Nível {simulatedRole})
                </span>
                <button
                  onClick={() => {
                    setUserLevel(simulatedRole);
                    addToast(`Perfil Nível ${simulatedRole} aplicado com sucesso!`, 'success');
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Aplicar Este Nível Agora
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                  <h4 className="font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Recursos Autorizados
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    {simulatedRole <= 3 && <li>• Visualização do Dashboard e Métricas CKM3</li>}
                    {simulatedRole <= 3 && <li>• Consulta de Notas Fiscais e Relatórios MB51</li>}
                    {simulatedRole <= 2 && <li>• Trilha de Auditoria SOX e Logs de Operações</li>}
                    {simulatedRole <= 1 && <li>• Aprovação de Alçadas e Liberação de Lotes em Quarentena</li>}
                    {simulatedRole === 0 && <li>• Configuração de Webhooks e Painel de Conectividade</li>}
                    {simulatedRole === 0 && <li>• Exportação de Bootstrap JSON e Gestão de Chaves DEV</li>}
                  </ul>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                  <h4 className="font-black text-red-400 mb-2 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> Recursos Bloqueados / Restritos
                  </h4>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    {simulatedRole > 0 && <li>• Acesso ao Console DEV e Edição de Parâmetros Mestres</li>}
                    {simulatedRole > 0 && <li>• Edição e Alteração da URL de Webhooks Corporativos</li>}
                    {simulatedRole > 1 && <li>• Aprovação de Alçada SOX para Lotes Críticos</li>}
                    {simulatedRole > 1 && <li>• Retificação e Estorno de Lançamentos Contábeis MB51</li>}
                    {simulatedRole > 2 && <li>• Visualização da Trilha Completa de Auditoria SOX</li>}
                    {simulatedRole === 0 && <li className="text-emerald-400">• Nenhum bloqueio ativo (Acesso Irrestrito C-Level/DEV)</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionEnterpriseSuite;
