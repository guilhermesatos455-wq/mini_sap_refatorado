import React, { useState } from 'react';
import { Send, Copy, Check, ExternalLink, Zap, BellRing, Sparkles, MessageSquare } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { buildTeamsAdaptiveCard, AuditReportData } from '../../utils/officeTemplates';

interface TeamsAdaptiveCardModalProps {
  onClose?: () => void;
  reportData?: AuditReportData;
}

export const TeamsAdaptiveCardModal: React.FC<TeamsAdaptiveCardModalProps> = ({ onClose, reportData }) => {
  const { darkMode, addToast, resultado, aiUser } = useAudit();
  
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('miniSap_teamsWebhook') || 'https://outlook.office.com/webhook/v2/incoming-webhook-flow';
  });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoTriggerOnApproval, setAutoTriggerOnApproval] = useState(true);
  const [thresholdAlert, setThresholdAlert] = useState(10000);

  // Compile data from context or fallback
  const auditData: AuditReportData = reportData || {
    codigoParecer: 'PAR-AUD-2026/08-0042',
    auditorNome: aiUser?.nome || 'Guilherme Santos de Souza',
    auditorMatricula: aiUser?.matricula || '89201',
    dataAuditoria: new Date().toLocaleDateString('pt-BR'),
    planta: '1001 - Farmacêutica Natulab',
    totalAuditado: resultado?.totais?.totalItens || 148,
    totalDivergencias: resultado?.divergencias?.length || 4,
    impactoFinanceiro: resultado?.totais?.impactoTotal || 71600.00,
    maiorVariacaoPerc: 34.80,
    parecerConclusivo: 'Identificadas flutuações de custos em matérias-primas farmacêuticas ativas e fretes não provisionados no Standard Cost SAP. Requer validação e aprovação do Gestor da Controladoria.'
  };

  const cardPayload = buildTeamsAdaptiveCard(auditData);

  const handleSaveWebhook = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('miniSap_teamsWebhook', url);
  };

  const handleSendToTeams = async () => {
    setIsSending(true);
    setSendSuccess(false);

    try {
      const res = await fetch('/api/office/teams-adaptive-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          card: cardPayload
        })
      });

      const json = await res.json();
      if (res.ok) {
        setSendSuccess(true);
        addToast(json.message || 'Adaptive Card disparado com sucesso para o Teams!', 'success');
        setTimeout(() => setSendSuccess(false), 4000);
      } else {
        addToast(json.error || 'Erro ao enviar para o Teams', 'error');
      }
    } catch (err) {
      addToast('Erro na comunicação com o servidor', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cardPayload, null, 2));
    setCopied(true);
    addToast('Payload JSON do Adaptive Card copiado!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Power Automate & Microsoft Teams (Adaptive Cards v1.4)</h2>
            <p className="text-xs text-slate-400">Disparo automático de cartões interativos de conciliação de custos no canal corporativo do Teams.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar JSON do Card'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Automation Rules & Webhook Settings */}
        <div className="lg:col-span-6 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-bold block text-slate-300">
              Webhook URL (Microsoft Teams Incoming Webhook ou Power Automate Flow)
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => handleSaveWebhook(e.target.value)}
              placeholder="https://outlook.office.com/webhook/..."
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
            <p className="text-[11px] text-slate-400">
              Dica: O fluxo no Power Automate pode receber o JSON e processar as ações de aprovação diretamente no SAP ERP via RFC / OData.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Gatilho Automático pós-Aprovação
              </span>
              <input
                type="checkbox"
                checked={autoTriggerOnApproval}
                onChange={(e) => setAutoTriggerOnApproval(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Disparar o Adaptive Card para o canal da Controladoria no Teams automaticamente sempre que um lote de conciliação for concluído ou assinado.
            </p>

            <div className="pt-2">
              <label className="text-[11px] font-bold block text-slate-400 mb-1">
                Threshold de Alerta Crítico (R$)
              </label>
              <input
                type="number"
                value={thresholdAlert}
                onChange={(e) => setThresholdAlert(Number(e.target.value))}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSendToTeams}
              disabled={isSending}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
              {isSending ? 'Disparando para o Teams...' : sendSuccess ? 'Enviado com Sucesso!' : 'Testar Disparo de Adaptive Card no Teams'}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Teams Adaptive Card Preview */}
        <div className="lg:col-span-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <BellRing className="w-3.5 h-3.5 text-indigo-400" />
            Visualização Prévia no Microsoft Teams
          </div>

          {/* Microsoft Teams Card Shell */}
          <div className="rounded-2xl border bg-[#201F1F] text-white p-5 shadow-2xl space-y-4 border-slate-700 font-sans">
            {/* Header / Brand */}
            <div className="flex items-center gap-3 border-b border-slate-700/80 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                SAP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-100">Meu Mini SAP • Alerta de Auditoria CKM3</h4>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">SOX Alert</span>
                </div>
                <p className="text-[11px] text-slate-400">Parecer: {auditData.codigoParecer} • Planta {auditData.planta}</p>
              </div>
            </div>

            {/* FactSet Table */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Auditor:</span>
                <span className="font-semibold text-slate-200">{auditData.auditorNome}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Data:</span>
                <span className="font-semibold text-slate-200">{auditData.dataAuditoria}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Divergências:</span>
                <span className="font-bold text-amber-400">{auditData.totalDivergencias} apontamentos</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Impacto Total:</span>
                <span className="font-black text-red-400">
                  {(auditData.impactoFinanceiro || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <p className="font-bold text-slate-200 mb-1">Resumo Executivo do Parecer:</p>
              <p>{auditData.parecerConclusivo}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button 
                onClick={() => addToast('Simulação: Aprovado no SAP via Teams Adaptive Action!', 'success')}
                className="py-2 px-3 bg-[#5B5FC7] hover:bg-[#4F52B2] text-white rounded-lg text-xs font-bold transition-all shadow text-center cursor-pointer"
              >
                ✓ Aprovar no SAP
              </button>
              <button 
                onClick={() => addToast('Simulação: Solicitação enviada ao comprador no Outlook!', 'info')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-600 text-center cursor-pointer"
              >
                ⚠️ Justificativa
              </button>
              <button 
                onClick={() => addToast('Redirecionando para visualização no Meu Mini SAP...', 'info')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-600 text-center cursor-pointer"
              >
                🔍 Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TeamsAdaptiveCardModal;
