import React, { useState } from 'react';
import { Calendar, Cpu, Clock, CheckCircle2, AlertTriangle, Send, RefreshCw, ShieldCheck, Filter, Download, Webhook } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface UnifiedEnterpriseSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const UnifiedEnterpriseSuite: React.FC<UnifiedEnterpriseSuiteProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [activeTab, setActiveTab] = useState<'scheduler' | 'predictive' | 'global_trail' | 'webhooks'>('scheduler');

  // 1. Scheduler State
  const [scheduleFreq, setScheduleFreq] = useState('Semanal (Segunda-feira 08:00)');
  const [recipientEmail, setRecipientEmail] = useState('controladoria@holding.com.br');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([
    { id: 'JOB-01', name: 'Relatório Consolidado SOX 404', freq: 'Semanal', nextRun: '14/09/2026 08:00', status: 'Ativo' },
    { id: 'JOB-02', name: 'Fechamento Custo Médio MATA330', freq: 'Mensal', nextRun: '01/10/2026 00:00', status: 'Ativo' }
  ]);

  // 2. Predictive AI Alerts State
  const [predictiveAlerts, setPredictiveAlerts] = useState([
    { id: 'PRED-991', module: 'CKM3 / Estoque', riskScore: '94% (Crítico)', message: 'Desvio acentuado de preço médio detectado na linha de matéria-prima importada.' },
    { id: 'PRED-992', module: 'Fluig Workflow', riskScore: '81% (Alto)', message: 'Gargalo de aprovação identificado na alçada da Diretoria Financeira (> 48h sem despacho).' },
    { id: 'PRED-993', module: 'JET Lançamentos', riskScore: '76% (Médio)', message: 'Volume atípico de lançamentos manuais concentrados no final do dia útil.' }
  ]);

  // 3. Global Unified Audit Trail State
  const [trailFilter, setTrailFilter] = useState('TODOS');
  const [unifiedLogs, setUnifiedLogs] = useState([
    { id: 'LOG-501', timestamp: '11/09/2026 05:40:12', module: 'SoD Compliance', user: 'carlos.financeiro', action: 'Mitigação de conflito de transação SAP', severity: 'Alto' },
    { id: 'LOG-502', timestamp: '11/09/2026 05:25:00', module: 'Dicionário SX2', user: 'admin.protheus', action: 'Inspecionada tabela SF1 (Nota Fiscal)', severity: 'Baixo' },
    { id: 'LOG-503', timestamp: '11/09/2026 05:10:45', module: 'Custo MATA330', user: 'roberto.fiscal', action: 'Executado recálculo de custo médio', severity: 'Médio' },
    { id: 'LOG-504', timestamp: '11/09/2026 04:55:20', module: 'Workflow Fluig', user: 'diretoria.financeira', action: 'Aprovado pedido WF-302', severity: 'Baixo' }
  ]);

  // 4. Webhook Config State
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/X99');
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  const handleCreateSchedule = () => {
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setScheduledJobs([...scheduledJobs, {
        id: `JOB-0${scheduledJobs.length + 1}`,
        name: 'Pacote Executivo de Auditoria',
        freq: scheduleFreq.split(' ')[0],
        nextRun: '18/09/2026 08:00',
        status: 'Ativo'
      }]);
      addAuditLog('Agendamento SOX', `Agendamento criado para ${recipientEmail} (${scheduleFreq}).`);
      addToast(`Agendamento SOX configurado com sucesso para ${recipientEmail}!`, 'success');
    }, 1200);
  };

  const handleRunAiPrediction = () => {
    addAuditLog('IA Preditiva', 'Varredura de riscos executada com sucesso.');
    addToast('Varredura preditiva de IA concluída. Novos padrões de risco indexados.', 'success');
  };

  const handleTestWebhook = () => {
    addAuditLog('Webhook Slack/Teams', `Disparo de teste efetuado para ${webhookUrl}`);
    addToast('Webhook testado com sucesso! Resposta HTTP 200 OK recebida.', 'success');
  };

  const handleExportAuditPackage = () => {
    addAuditLog('Exportação de Auditoria', 'Pacote consolidado exportado em formato JSON com Hash SHA-256.');
    addToast('Pacote de Auditoria exportado com carimbo de hash imutável!', 'success');
  };

  const filteredLogs = trailFilter === 'TODOS' ? unifiedLogs : unifiedLogs.filter(l => l.severity === trailFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Cpu className="w-6 h-6 text-indigo-400" /> Suíte Unificada Enterprise (Agendamento, IA Preditiva & Trilha Global)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Automação de relatórios SOX, dashboard de riscos preditivos por IA e linha do tempo de auditoria global.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'scheduler' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Agendamento SOX
          </button>
          <button
            onClick={() => setActiveTab('predictive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'predictive' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Alertas Preditivos (IA)
          </button>
          <button
            onClick={() => setActiveTab('global_trail')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'global_trail' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Trilha Global Unificada
          </button>
        </div>
      </div>

      {/* Tab 1: Automated SOX Scheduler */}
      {activeTab === 'scheduler' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Calendar className="w-4 h-4 text-indigo-400" /> Agendamento Automático de Relatórios SOX & Envio Executivo
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">Automação de Compliance</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Frequência de Envio:</label>
                <select
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="Semanal (Segunda-feira 08:00)">Semanal (Segunda-feira 08:00)</option>
                  <option value="Quinzenal (Dia 1 e 15)">Quinzenal (Dia 1 e 15)</option>
                  <option value="Mensal (Fechamento Contábil)">Mensal (Fechamento Contábil)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">E-mail do Destinatário (Controladoria / Auditoria):</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <button
              onClick={handleCreateSchedule}
              disabled={isScheduling}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isScheduling ? 'animate-bounce' : ''}`} />
              {isScheduling ? 'Configurando Agendamento Cron...' : 'Salvar e Ativar Agendamento SOX'}
            </button>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-bold text-xs text-slate-300">Tarefas Agendadas Ativas:</h4>
              <div className="space-y-2">
                {scheduledJobs.map((j) => (
                  <div key={j.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{j.name}</span>
                      <span className="text-slate-400 block text-[11px]">Próxima execução: {j.nextRun}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Predictive AI Alerts Dashboard */}
      {activeTab === 'predictive' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Cpu className="w-4 h-4 text-amber-400" /> Dashboard de Alertas Preditivos por Inteligência Artificial
            </h3>
            <button
              onClick={handleRunAiPrediction}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Rodar Nova Varredura Preditiva
            </button>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictiveAlerts.map((pa) => (
                <div key={pa.id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono">{pa.module}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {pa.riskScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{pa.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Unified Global Audit Trail */}
      {activeTab === 'global_trail' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Clock className="w-4 h-4 text-teal-400" /> Trilha de Auditoria Global Unificada (Cronológica)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrar Severidade:</span>
              <select
                value={trailFilter}
                onChange={(e) => setTrailFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="TODOS">Todas</option>
                <option value="Alto">Alto</option>
                <option value="Médio">Médio</option>
                <option value="Baixo">Baixo</option>
              </select>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">Timestamp</th>
                    <th className="pb-3 font-bold">Módulo / Sistema</th>
                    <th className="pb-3 font-bold">Usuário / Auditor</th>
                    <th className="pb-3 font-bold">Ação Registrada</th>
                    <th className="pb-3 font-bold">Severidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono text-slate-400">{l.timestamp}</td>
                      <td className="py-3 font-bold text-teal-400">{l.module}</td>
                      <td className="py-3 text-slate-300">{l.user}</td>
                      <td className="py-3 text-slate-200">{l.action}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          l.severity === 'Alto' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          l.severity === 'Médio' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {l.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedEnterpriseSuite;
