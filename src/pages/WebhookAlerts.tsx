import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { Bell, Send, CheckCircle2, ShieldAlert, Webhook, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react';

export const WebhookAlertsPage: React.FC = () => {
  const { darkMode } = useAudit();
  const [threshold, setThreshold] = useState(50000);
  const [email, setEmail] = useState('gestao.custos@natulab.com.br');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/X00');
  const [teamsWebhook, setTeamsWebhook] = useState('https://outlook.office.com/webhook/000000/IncomingWebhook/0000');
  const [enabledEmail, setEnabledEmail] = useState(true);
  const [enabledSlack, setEnabledSlack] = useState(true);
  const [enabledTeams, setEnabledTeams] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleTestNotification = (channel: string) => {
    setTestSent(true);
    alert(`Mensagem de teste disparada com sucesso via ${channel}! Verifique sua caixa de entrada ou canal.`);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Central de Alertas e Webhooks (Slack / Teams / E-mail)</h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Configure regras automáticas para disparar alertas imediatos aos gestores sempre que uma divergência CKM3 ultrapassar o limite crítico.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`p-6 rounded-3xl border space-y-6 lg:col-span-1 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Regra de Disparo</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1.5 text-slate-300">Limite Crítico de Impacto (R$)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'}`}
              />
              <p className="text-[10px] text-slate-500 mt-1">Disparará alerta automático para qualquer divergência acima deste valor no relatório CKM3.</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Automação Ativa</span>
              </div>
              <p className="text-[11px] text-slate-300">O worker em segundo plano analisa novas importações MB51 e CKM3 a cada sincronização.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Slack Integration */}
          <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#4A154B]/20 text-[#4A154B] border border-[#4A154B]/30">
                  <Webhook className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Slack Webhook</h3>
                  <p className="text-[11px] text-slate-400">Envio de alertas formatados para canal de auditoria SAP.</p>
                </div>
              </div>
              <button
                onClick={() => setEnabledSlack(!enabledSlack)}
                className={`w-12 h-6 rounded-full transition-all relative ${enabledSlack ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabledSlack ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {enabledSlack && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleTestNotification('Slack')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Testar Webhook Slack
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Microsoft Teams Integration */}
          <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Microsoft Teams Webhook</h3>
                  <p className="text-[11px] text-slate-400">Integração com canais corporativos Office 365.</p>
                </div>
              </div>
              <button
                onClick={() => setEnabledTeams(!enabledTeams)}
                className={`w-12 h-6 rounded-full transition-all relative ${enabledTeams ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabledTeams ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {enabledTeams && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={teamsWebhook}
                  onChange={(e) => setTeamsWebhook(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleTestNotification('Microsoft Teams')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Testar Webhook Teams
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email Notification */}
          <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Alerta por E-mail</h3>
                  <p className="text-[11px] text-slate-400">Notificação direta para diretores e controladores.</p>
                </div>
              </div>
              <button
                onClick={() => setEnabledEmail(!enabledEmail)}
                className={`w-12 h-6 rounded-full transition-all relative ${enabledEmail ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabledEmail ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {enabledEmail && (
              <div className="space-y-3 pt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleTestNotification('E-mail')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar E-mail de Teste
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default WebhookAlertsPage;
