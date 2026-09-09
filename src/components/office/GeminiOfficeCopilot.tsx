import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Copy,
  Check,
  Mic,
  MicOff,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import {
  requestOfficeAi,
  downloadOfficeWordReport,
  downloadOfficeExcelSheet,
  sendTeamsAdaptiveCard,
  sendOutlookEmail,
  syncToSharePoint,
  OfficeAiResponse
} from '../../services/officeAiService';

interface QuickPrompt {
  label: string;
  icon: React.ReactNode;
  prompt: string;
  badge: string;
}

export const GeminiOfficeCopilot: React.FC = () => {
  const { darkMode, resultado, cfops, dataInicio, dataFim, aiUser, addToast } = useAudit();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<OfficeAiResponse | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'word' | 'teams' | 'email' | 'excel' | 'sharepoint'>('summary');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const quickPrompts: QuickPrompt[] = [
    {
      label: 'Pacote Completo Office',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      prompt: 'Gere um pacote completo de auditoria para o Office: Parecer Word oficial, Alerta estruturado no Teams, E-mail formal para o setor de compras via Outlook e Registro no SharePoint.',
      badge: 'Completo'
    },
    {
      label: 'Parecer Técnico Word',
      icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
      prompt: 'Gere um Parecer Técnico formal em Word (.doc) detalhando os 3 maiores desvios de custo com fundamentação contábil SOX e recomendações de correção cadastral.',
      badge: 'Word .docx'
    },
    {
      label: 'Alerta Microsoft Teams',
      icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />,
      prompt: 'Crie um Adaptive Card para o Microsoft Teams alertando a equipe de Controladoria sobre variações acima de 20% com botões de aprovação e solicitação de justificativa.',
      badge: 'Teams Card'
    },
    {
      label: 'Cobrança Outlook / Compras',
      icon: <Mail className="w-3.5 h-3.5 text-cyan-400" />,
      prompt: 'Redija um e-mail executivo no Outlook cobrando justificativa imediata do comprador responsável pelos sobrepreços em insumos faturados nas notas fiscais.',
      badge: 'Outlook'
    },
    {
      label: 'Planilha Excel com Fórmulas',
      icon: <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />,
      prompt: 'Estruture uma planilha Excel CKM3 vs NF com fórmulas automáticas de variação percentual =(NF-SAP)/SAP*100 e classificação condicional de risco SOX.',
      badge: 'Excel'
    },
    {
      label: 'Governança no SharePoint',
      icon: <Cloud className="w-3.5 h-3.5 text-purple-400" />,
      prompt: 'Registre a versão auditada atual no repositório corporativo do SharePoint com carimbo de retenção fiscal de 5 anos e hash de integridade.',
      badge: 'SharePoint'
    }
  ];

  const handleExecutePrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setLoading(true);
    setPrompt(promptText);

    try {
      const res = await requestOfficeAi(promptText, {
        resultado: resultado || undefined,
        periodo: `${dataInicio || '01/08/2026'} a ${dataFim || '31/08/2026'}`,
        planta: '1001 - Fábrica Central',
        auditor: aiUser?.nome || 'Auditor NatuAssist',
        config: {
          teamsWebhook: '',
          outlookEmail: 'controladoria.insumos@natulab.com.br',
          sharepointFolder: '/Auditoria_SAP/2026/08_Agosto'
        }
      });

      setResponse(res);
      addToast('Gemini estruturou as ações do Office com sucesso!', 'success');

      if (res.taskType === 'GENERATE_WORD_REPORT') setActiveResultTab('word');
      else if (res.taskType === 'SEND_TEAMS_ALERT') setActiveResultTab('teams');
      else if (res.taskType === 'DRAFT_OUTLOOK_EMAIL') setActiveResultTab('email');
      else if (res.taskType === 'BUILD_EXCEL_AUDIT') setActiveResultTab('excel');
      else if (res.taskType === 'SHAREPOINT_CHECKIN') setActiveResultTab('sharepoint');
      else setActiveResultTab('summary');

    } catch (error: any) {
      console.error(error);
      addToast(error?.message || 'Falha ao solicitar tarefa ao Gemini.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Conteúdo copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadWord = () => {
    if (!response?.wordReport) return;
    downloadOfficeWordReport(response.wordReport);
    addToast('Documento Word (.doc) baixado com sucesso!', 'success');
  };

  const handleDownloadExcel = () => {
    if (!response?.excelWorkbook) return;
    downloadOfficeExcelSheet(response.excelWorkbook);
    addToast('Planilha Excel (.csv) exportada com sucesso!', 'success');
  };

  const handleSendTeams = async () => {
    if (!response?.teamsCard) return;
    setActionLoading('teams');
    try {
      await sendTeamsAdaptiveCard(response.teamsCard.webhookUrl || '', response.teamsCard.card);
      addToast('Adaptive Card disparado com sucesso para o Microsoft Teams!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Falha ao disparar card no Teams.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!response?.emailDraft) return;
    setActionLoading('email');
    try {
      await sendOutlookEmail(response.emailDraft);
      addToast(`E-mail executivo enviado com sucesso para ${response.emailDraft.to}!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Falha ao enviar e-mail via Outlook.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncSP = async () => {
    if (!response?.sharepointSync) return;
    setActionLoading('sharepoint');
    try {
      await syncToSharePoint({
        folderPath: response.sharepointSync.folderPath,
        fileName: response.sharepointSync.fileName,
        author: aiUser?.nome || 'Auditor NatuAssist'
      });
      addToast('Documento versionado com sucesso na biblioteca do SharePoint!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Falha ao sincronizar com SharePoint.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      addToast('Reconhecimento de voz não suportado neste navegador.', 'error');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${darkMode ? 'bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border-blue-200 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500 text-white flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3.7 Flash + Office Suite
              </span>
              <span className="text-xs font-bold text-slate-400">Word • Excel • Teams • Outlook • SharePoint</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Peça ao Gemini para executar tarefas no Microsoft Office
            </h2>
            <p className={`text-xs md:text-sm max-w-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Solicite em linguagem natural e o Gemini irá compor pareceres em Word, disparar Adaptive Cards no Teams, redigir e-mails formais no Outlook e estruturar planilhas Excel com fórmulas prontas.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col gap-1 min-w-[240px] ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contexto Ativo de Auditoria</span>
            <div className="flex items-center justify-between text-xs font-bold mt-1">
              <span className="text-slate-400">Apontamentos:</span>
              <span className="text-blue-400">{resultado?.divergencias?.length || 3} divergências</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Impacto Fiscal:</span>
              <span className="text-red-400">
                {(resultado?.totalImpacto || 71600).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>Auditor:</span>
              <span className="truncate max-w-[120px] text-slate-200">{aiUser?.nome || 'Auditor NatuAssist'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Input Box */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            O que você deseja que a IA faça no Microsoft Office?
          </label>
          <span className="text-[11px] text-slate-500">Ex: "Gere um parecer Word e envie alerta no Teams"</span>
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleExecutePrompt(prompt);
              }
            }}
            placeholder="Digite o comando para o Gemini (ex: Redija um parecer Word oficial com os maiores desvios de matéria-prima e dispare um alerta crítico no Teams)..."
            rows={3}
            className={`w-full p-4 pr-24 rounded-2xl text-xs md:text-sm font-medium border resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            <button
              onClick={toggleVoiceInput}
              type="button"
              title="Ditado por voz"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isListening ? 'bg-red-500 text-white animate-pulse border-red-400' : (darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300')}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleExecutePrompt(prompt)}
              disabled={loading || !prompt.trim()}
              type="button"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Executar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Action Prompt Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">Ações Rápidas em 1 Clique:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleExecutePrompt(qp.prompt)}
                disabled={loading}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer group ${darkMode ? 'bg-slate-950/60 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900' : 'bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-white shadow-xs'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                    {qp.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                      {qp.label}
                    </p>
                    <span className="text-[10px] text-slate-400">{qp.badge}</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Workspace */}
      {response && (
        <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          {/* Header of Results */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b dark:border-slate-800 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Tarefa Concluída pelo Gemini
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {response.wordReport?.codigoParecer || 'PAR-AUD-2026'}
                </span>
              </div>
              <h3 className="text-base font-bold mt-1 text-slate-100">
                {response.summary}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(response, null, 2), 'all_json')}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 bg-slate-100 border-slate-200 text-slate-700"
              >
                {copiedKey === 'all_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'all_json' ? 'Copiado!' : 'Copiar Dados JSON'}
              </button>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b dark:border-slate-800 border-slate-200">
            <button
              onClick={() => setActiveResultTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'summary' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Parecer Executivo & IA
            </button>

            {response.wordReport && (
              <button
                onClick={() => setActiveResultTab('word')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'word' ? 'bg-emerald-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Parecer Word (.docx)
              </button>
            )}

            {response.teamsCard && (
              <button
                onClick={() => setActiveResultTab('teams')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'teams' ? 'bg-indigo-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Microsoft Teams Card
              </button>
            )}

            {response.emailDraft && (
              <button
                onClick={() => setActiveResultTab('email')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'email' ? 'bg-cyan-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Mail className="w-3.5 h-3.5" />
                E-mail Outlook
              </button>
            )}

            {response.excelWorkbook && (
              <button
                onClick={() => setActiveResultTab('excel')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'excel' ? 'bg-amber-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Planilha Excel CKM3
              </button>
            )}

            {response.sharepointSync && (
              <button
                onClick={() => setActiveResultTab('sharepoint')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeResultTab === 'sharepoint' ? 'bg-purple-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Cloud className="w-3.5 h-3.5" />
                SharePoint Sync
              </button>
            )}
          </div>

          {/* Tab 1: Executive Summary & AI Reasoning */}
          {activeResultTab === 'summary' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Detalhamento Técnico da Análise</h4>
                <p className="text-xs md:text-sm leading-relaxed text-slate-300">
                  {response.details}
                </p>
              </div>

              {response.wordReport?.recomendacoes && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Recomendações Fiscais e Contábeis do Gemini:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {response.wordReport.recomendacoes.map((rec, i) => (
                      <div key={i} className={`p-3.5 rounded-2xl border flex items-start gap-3 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="text-xs text-slate-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Trigger Grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300">Execuções Diretas Prontas:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {response.wordReport && (
                    <button
                      onClick={handleDownloadWord}
                      className="p-4 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex flex-col gap-2 transition-all cursor-pointer text-left"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Baixar Parecer Word</span>
                      <span className="text-[10px] text-emerald-500 font-normal">.doc MSO / Carimbo SOX</span>
                    </button>
                  )}

                  {response.teamsCard && (
                    <button
                      onClick={handleSendTeams}
                      disabled={actionLoading === 'teams'}
                      className="p-4 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex flex-col gap-2 transition-all cursor-pointer text-left disabled:opacity-50"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>{actionLoading === 'teams' ? 'Disparando...' : 'Disparar para o Teams'}</span>
                      <span className="text-[10px] text-indigo-500 font-normal">Adaptive Card v1.4</span>
                    </button>
                  )}

                  {response.emailDraft && (
                    <button
                      onClick={handleSendEmail}
                      disabled={actionLoading === 'email'}
                      className="p-4 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs flex flex-col gap-2 transition-all cursor-pointer text-left disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{actionLoading === 'email' ? 'Enviando...' : 'Enviar pelo Outlook'}</span>
                      <span className="text-[10px] text-cyan-500 font-normal">Notificar Compras</span>
                    </button>
                  )}

                  {response.sharepointSync && (
                    <button
                      onClick={handleSyncSP}
                      disabled={actionLoading === 'sharepoint'}
                      className="p-4 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold text-xs flex flex-col gap-2 transition-all cursor-pointer text-left disabled:opacity-50"
                    >
                      <Cloud className="w-5 h-5" />
                      <span>{actionLoading === 'sharepoint' ? 'Sincronizando...' : 'Publicar no SharePoint'}</span>
                      <span className="text-[10px] text-purple-500 font-normal">Controle de Versão</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Word Technical Report Preview */}
          {activeResultTab === 'word' && response.wordReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Parecer Técnico Word Gerado</h4>
                  <p className="text-[11px] text-slate-400">Compatível com Word 2013, 2016, 2019, 2021 e Microsoft 365.</p>
                </div>

                <button
                  onClick={handleDownloadWord}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Documento Word (.doc)
                </button>
              </div>

              {/* Document Paper Preview */}
              <div className="p-6 md:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-300 font-sans space-y-6 max-h-[500px] overflow-y-auto">
                <div className="border-b-2 border-blue-900 pb-3 flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold text-blue-900 tracking-tight">{response.wordReport.titulo}</h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Código: <strong>{response.wordReport.codigoParecer}</strong> | Planta: {response.wordReport.planta}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Conformidade SOX
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block">Auditor:</span>
                    <span className="font-bold">{response.wordReport.auditorNome}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Data de Emissão:</span>
                    <span className="font-bold">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Apontamentos:</span>
                    <span className="font-bold text-red-600">{response.wordReport.totalDivergencias} itens</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Impacto Financeiro:</span>
                    <span className="font-bold text-red-600">
                      {(response.wordReport.impactoFinanceiro || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">1. Parecer Conclusivo do Auditor</h3>
                  <p className="text-xs leading-relaxed text-slate-700">{response.wordReport.parecerConclusivo}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-1">2. Demonstrativo de Insumos Auditados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left">Material</th>
                          <th className="border border-slate-300 p-2 text-left">Descrição</th>
                          <th className="border border-slate-300 p-2 text-center">CFOP</th>
                          <th className="border border-slate-300 p-2 text-right">Standard SAP</th>
                          <th className="border border-slate-300 p-2 text-right">Preço NF</th>
                          <th className="border border-slate-300 p-2 text-right">Variação %</th>
                          <th className="border border-slate-300 p-2 text-right">Impacto R$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {response.wordReport.itensCriticos.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-300 p-2 font-mono">{item.material}</td>
                            <td className="border border-slate-300 p-2">{item.descricao}</td>
                            <td className="border border-slate-300 p-2 text-center">{item.cfop}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono">R$ {Number(item.custoPadrao).toFixed(2)}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono text-red-600 font-bold">R$ {Number(item.precoEfetivo).toFixed(2)}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono text-red-600 font-bold">+{Number(item.variacaoPerc).toFixed(2)}%</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold">R$ {Number(item.impactoFinanceiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Teams Adaptive Card Preview */}
          {activeResultTab === 'teams' && response.teamsCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Adaptive Card do Microsoft Teams</h4>
                  <p className="text-[11px] text-slate-400">Payload pronto para disparo no canal da Controladoria.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(response.teamsCard?.card, null, 2), 'teams_json')}
                    className="px-3 py-2 rounded-xl border text-xs font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'teams_json' ? 'JSON Copiado!' : 'Copiar JSON do Card'}
                  </button>

                  <button
                    onClick={handleSendTeams}
                    disabled={actionLoading === 'teams'}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {actionLoading === 'teams' ? 'Disparando...' : 'Disparar para o Teams'}
                  </button>
                </div>
              </div>

              {/* Teams Card Simulation */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#292B2F] border border-indigo-500/40 text-slate-100 shadow-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    SAP
                  </div>
                  <div>
                    <p className="text-xs font-bold">Meu Mini SAP • Bot</p>
                    <span className="text-[10px] text-slate-400">Adaptive Card v1.4</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Alerta de Divergência de Custos CKM3
                  </h5>
                  <p className="text-xs text-slate-300">
                    Parecer: <strong>{response.wordReport?.codigoParecer || 'PAR-AUD-2026'}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#202225] text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Impacto:</span>
                    <p className="font-bold text-red-400">
                      {(response.wordReport?.impactoFinanceiro || 71600).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Apontamentos:</span>
                    <p className="font-bold text-slate-200">{response.wordReport?.totalDivergencias || 3} itens</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow">
                    Visualizar no Sistema
                  </button>
                  <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold">
                    Solicitar Justificativa de Compras
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Outlook Email Preview */}
          {activeResultTab === 'email' && response.emailDraft && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">E-mail Executivo para Outlook</h4>
                  <p className="text-[11px] text-slate-400">Destinatário configurado: {response.emailDraft.to}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(response.emailDraft?.text || '', 'email_txt')}
                    className="px-3 py-2 rounded-xl border text-xs font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'email_txt' ? 'Texto Copiado!' : 'Copiar Texto'}
                  </button>

                  <button
                    onClick={handleSendEmail}
                    disabled={actionLoading === 'email'}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    {actionLoading === 'email' ? 'Enviando...' : 'Enviar pelo Outlook'}
                  </button>
                </div>
              </div>

              {/* Email Client Preview */}
              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="space-y-2 border-b dark:border-slate-800 border-slate-200 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-16">Para:</span>
                    <span className="font-mono text-cyan-400">{response.emailDraft.to}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-16">Assunto:</span>
                    <span className="font-bold text-slate-200">{response.emailDraft.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-16">Prioridade:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                      {response.emailDraft.priority}
                    </span>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl bg-white text-slate-900 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: response.emailDraft.html }}
                />
              </div>
            </div>
          )}

          {/* Tab 5: Excel Sheet Preview */}
          {activeResultTab === 'excel' && response.excelWorkbook && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Planilha Excel de Auditoria</h4>
                  <p className="text-[11px] text-slate-400">Arquivo: {response.excelWorkbook.fileName}</p>
                </div>

                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Planilha (.csv/.xlsx)
                </button>
              </div>

              {/* Formulas Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.excelWorkbook.formulas.map((form, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                      <span>Célula / Coluna: {form.cell}</span>
                      <span>Fórmula Excel</span>
                    </div>
                    <p className="text-slate-200 font-bold">{form.formula}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">{form.description}</p>
                  </div>
                ))}
              </div>

              {/* Tabular Preview */}
              <div className="overflow-x-auto rounded-2xl border dark:border-slate-800 border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className={`text-[11px] font-bold uppercase ${darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                    <tr>
                      {response.excelWorkbook.headers.map((h, i) => (
                        <th key={i} className="p-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 divide-slate-200">
                    {response.excelWorkbook.rows.map((row, idx) => (
                      <tr key={idx} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 whitespace-nowrap font-mono">
                            {typeof cell === 'number' ? cell.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: SharePoint Sync */}
          {activeResultTab === 'sharepoint' && response.sharepointSync && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Governança & Repositório SharePoint</h4>
                  <p className="text-[11px] text-slate-400">Controle de Versão SOX e Retenção Fiscal.</p>
                </div>

                <button
                  onClick={handleSyncSP}
                  disabled={actionLoading === 'sharepoint'}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-4 h-4" />
                  {actionLoading === 'sharepoint' ? 'Registrando...' : 'Registrar no SharePoint'}
                </button>
              </div>

              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Pasta de Destino:</span>
                    <span className="font-mono text-purple-400 font-bold">{response.sharepointSync.folderPath}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Nome do Arquivo:</span>
                    <span className="font-mono text-slate-200 font-bold">{response.sharepointSync.fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Nível de Risco SOX:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400">
                      {response.sharepointSync.soxRiskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Política de Retenção:</span>
                    <span className="text-slate-300">{response.sharepointSync.retentionPolicy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiOfficeCopilot;
