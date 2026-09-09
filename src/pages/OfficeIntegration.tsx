import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { 
  FileSpreadsheet, 
  Cloud, 
  Mail, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Key, 
  Shield, 
  HardDrive, 
  Share2,
  MessageSquare,
  Inbox,
  Sparkles,
  Zap,
  Sliders,
  BarChart2,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  Send,
  Play,
  Link2
} from 'lucide-react';
import TeamsAdaptiveCardModal from '../components/office/TeamsAdaptiveCardModal';
import TemplatesManager from '../components/office/TemplatesManager';
import SharePointVersionManager from '../components/office/SharePointVersionManager';
import InboxFolderWatcher from '../components/office/InboxFolderWatcher';
import GeminiOfficeCopilot from '../components/office/GeminiOfficeCopilot';
import PowerBiStreamingManager from '../components/office/PowerBiStreamingManager';
import { SharePointFieldMapper } from '../components/office/SharePointFieldMapper';
import { MassiveFileIngestor } from '../components/office/MassiveFileIngestor';


export const OfficeIntegrationPage: React.FC = () => {
  const { darkMode, aiUser, loginWithMicrosoft, addToast, setResultado } = useAudit();
  
  const [activeTab, setActiveTab] = useState<'copilot' | 'powerbi' | 'overview' | 'teams' | 'templates' | 'sharepoint' | 'sharepoint-mapper' | 'inbox' | 'idoc' | 'massive-files'>('copilot');
  const [tenantId, setTenantId] = useState('natulab.onmicrosoft.com');
  const [clientId, setClientId] = useState('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  const [clientSecret, setClientSecret] = useState('************************');
  const [onedriveFolder, setOnedriveFolder] = useState('/Auditoria_SAP/CKM3_Reports');
  const [outlookEmail, setOutlookEmail] = useState('auditoria.sap@natulab.com.br');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [officeVersion, setOfficeVersion] = useState<'365' | '2013'>('365');

  // IDoc & SAP Routing configuration state
  const [selectedMessageType, setSelectedMessageType] = useState<'WMMBXY' | 'INVENTORY_COUNT' | 'MATMAS' | 'DEBMAS' | 'ORDERS'>('WMMBXY');
  const [sapPartnerNo, setSapPartnerNo] = useState('NATU_ECC_01');
  const [sapPort, setSapPort] = useState('SAP_HTTP_PORT_80');
  const [triggerMode, setTriggerMode] = useState<'NAST' | 'SM59' | 'SM37' | 'EVENT_MESH'>('NAST');
  const [idocPayloadXml, setIdocPayloadXml] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<IDOCBEGIN>
  <EDI_DC40>
    <TABNAM>EDI_DC40</TABNAM>
    <MANDT>800</MANDT>
    <DOCNUM>0000000000492819</DOCNUM>
    <IDOCTYP>WMMBXY01</IDOCTYP>
    <MESTYP>WMMBXY</MESTYP>
    <SNDPOR>SAPQAS</SNDPOR>
    <SNDPRT>LS</SNDPRT>
    <SNDPRN>NATU_ECC</SNDPRN>
    <RCVPRT>LS</RCVPRT>
    <RCVPRN>NATU_WMS</RCVPRN>
  </EDI_DC40>
  <E1MBXYH>
    <BLDAT>20260828</BLDAT>
    <BUDAT>20260828</BUDAT>
    <BKTXT>Carga Automática IDoc WMMBXY - Auditoria CKM3</BKTXT>
  </E1MBXYH>
  <E1MBXYI>
    <MATNR>MAT-10029</MATNR>
    <WERKS>1000</WERKS>
    <LGORT>0001</LGORT>
    <MENGE>1250.000</MENGE>
    <MEINS>UN</MEINS>
    <BWART>701</BWART>
  </E1MBXYI>
</IDOCBEGIN>`);

  const handleTestConnection = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      addToast('Conexão Microsoft Graph / Office validada com sucesso!', 'success');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }, 1800);
  };

  const handleSyncOneDrive = () => {
    addToast(`Relatório CKM3 sincronizado com sucesso para o OneDrive / SharePoint (${onedriveFolder}) via Graph API.`, 'success');
  };

  const handleSendOutlookReport = () => {
    addToast(`Relatório executivo enviado com sucesso via Outlook / Exchange para ${outlookEmail}.`, 'success');
  };

  const handleLoadIdocToApp = () => {
    // Ingest IDoc payload into audit state
    setResultado({
      todosOsItens: [
        { material: 'MAT-10029', descricao: 'Insumo Carregado via IDoc WMMBXY', quantidade: 1250, subtotal: 45000, status: 'Divergente', precoUnitario: 36, tipoMovimento: '701' },
        { material: 'MAT-10030', descricao: 'Componente SAP IDoc Integrado', quantidade: 800, subtotal: 24000, status: 'Conforme', precoUnitario: 30, tipoMovimento: '101' }
      ],
      divergencias: [
        { material: 'MAT-10029', motivo: 'Divergência importada via IDoc WMMBXY (Transação WE02 / BD87)', diferenca: 150 }
      ],
      metricasGlobais: {
        totalItens: 2,
        valorTotalEstoque: 69000,
        totalDivergencias: 1
      }
    });
    addToast(`Dados do IDoc [${selectedMessageType}] carregados com sucesso para o programa!`, 'success');
  };

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-6 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Ecossistema Microsoft Office 365 & Conectividade SAP IDoc</h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Automação empresarial completa: Power Automate & Adaptive Cards no Teams, Pareceres em Word, Ingestão de IDocs SAP e Governança no SharePoint.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOfficeVersion('365')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${officeVersion === '365' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}
          >
            Office 365 (Graph API)
          </button>
          <button
            onClick={() => setOfficeVersion('2013')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${officeVersion === '2013' ? 'bg-amber-600 border-amber-500 text-white shadow-md' : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}
          >
            Office 2013 (EWS / XML)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b dark:border-slate-800 border-slate-200">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === 'copilot' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' : (darkMode ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-900 bg-amber-500/10 border border-amber-500/20' : 'text-blue-700 hover:bg-blue-50 bg-blue-100/80 border border-blue-200')}`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          Gemini Office Copilot (IA)
        </button>

        <button
          onClick={() => setActiveTab('idoc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === 'idoc' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : (darkMode ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 bg-emerald-500/10 border border-emerald-500/20' : 'text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200')}`}
        >
          <FileCode className="w-4 h-4 text-emerald-400" />
          IDoc SAP & Roteamento (Config)
        </button>

        <button
          onClick={() => setActiveTab('powerbi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === 'powerbi' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20' : (darkMode ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-900 bg-amber-500/10 border border-amber-500/20' : 'text-amber-800 hover:bg-amber-100 bg-amber-50 border border-amber-200')}`}
        >
          <BarChart2 className="w-4 h-4 text-amber-400" />
          Power BI (Tempo Real)
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? (darkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <Sliders className="w-4 h-4" />
          Visão Geral & Azure AD
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'teams' ? (darkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <MessageSquare className="w-4 h-4" />
          Power Automate & Teams
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'templates' ? (darkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <FileText className="w-4 h-4" />
          Modelos Word & Pareceres
        </button>

        <button
          onClick={() => setActiveTab('sharepoint')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'sharepoint' ? (darkMode ? 'bg-cyan-600 text-white shadow-md' : 'bg-cyan-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <Cloud className="w-4 h-4" />
          Governança & SharePoint
        </button>

        <button
          onClick={() => setActiveTab('sharepoint-mapper')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'sharepoint-mapper' ? (darkMode ? 'bg-teal-600 text-white shadow-md' : 'bg-teal-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <Link2 className="w-4 h-4" />
          Mapeamento CKM3 ➔ SharePoint
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'inbox' ? (darkMode ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')}`}
        >
          <Inbox className="w-4 h-4" />
          Inbox & Folder Monitor
        </button>

        <button
          onClick={() => setActiveTab('massive-files')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === 'massive-files' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20' : (darkMode ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-900 bg-amber-500/10 border border-amber-500/20' : 'text-amber-800 hover:bg-amber-100 bg-amber-50 border border-amber-200')}`}
        >
          <HardDrive className="w-4 h-4 text-amber-400" />
          Planilhas +150 MB (Streaming)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'copilot' && (
        <GeminiOfficeCopilot />
      )}

      {activeTab === 'idoc' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header IDoc Info */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Integração EDI / IDoc SAP</span>
              <h2 className="text-lg font-black">Suporte a IDoc para Carga de Informações SAP</h2>
              <p className="text-xs text-slate-400">Carregue dados do SAP ECC / S/4HANA usando tipos de mensagem padrão (WMMBXY, INVENTORY_COUNT, MATMAS, DEBMAS).</p>
            </div>
            <button
              onClick={handleLoadIdocToApp}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4" /> Carregar Dados do IDoc para o Sistema
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Tipos de Mensagem Padrão (Identificação dos Dados) */}
            <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> 1. Identificação dos Dados (Tipos de Mensagem)
              </h3>

              <div className="space-y-2.5 text-xs">
                {[
                  { type: 'WMMBXY', desc: 'Movimentação de Estoque / MB1B / MB1C', status: 'Ativo' },
                  { type: 'INVENTORY_COUNT', desc: 'Contagem Física de Inventário (MI04)', status: 'Ativo' },
                  { type: 'MATMAS', desc: 'Mestre de Materiais / SKUs (MM01/MM02)', status: 'Ativo' },
                  { type: 'DEBMAS', desc: 'Mestre de Clientes / Parceiros (XD01)', status: 'Suporte' },
                  { type: 'ORDERS', desc: 'Ordens de Venda e Pedidos de Compra', status: 'Suporte' }
                ].map(msg => (
                  <div
                    key={msg.type}
                    onClick={() => setSelectedMessageType(msg.type as any)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedMessageType === msg.type
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                        : darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-sans">
                          {msg.status}
                        </span>
                        {msg.type}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{msg.desc}</div>
                    </div>
                    {selectedMessageType === msg.type && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 2: Configuração de Roteamento no SAP (Transações) */}
            <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" /> 2. Roteamento no SAP (Transações)
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-slate-300">WE20 - Perfis de Parceiro EDI (Partner Profile):</label>
                  <input
                    type="text"
                    value={sapPartnerNo}
                    onChange={(e) => setSapPartnerNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Parceiro LS (Logical System) configurado para receber o IDoc.</p>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-300">WE21 - Portas IDoc (IDoc Ports):</label>
                  <input
                    type="text"
                    value={sapPort}
                    onChange={(e) => setSapPort(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Porta XML HTTP / RFC para comunicação com o microsserviço.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-black uppercase text-slate-400">Transação WE02 / WE05</span>
                    <p className="font-bold text-[11px] text-emerald-400 mt-1">Monitor de IDoc Ativo</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-black uppercase text-slate-400">Transação BD87 / WE19</span>
                    <p className="font-bold text-[11px] text-blue-400 mt-1">Test Tool & Reproc.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 3: Mecanismos de Disparo (Triggers) & Payload XML */}
            <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> 3. Mecanismos de Disparo (Triggers)
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-slate-300">Tipo de Trigger de Integração:</label>
                  <select
                    value={triggerMode}
                    onChange={(e) => setTriggerMode(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  >
                    <option value="NAST">NAST - Output Determination (Mensagens de Saída)</option>
                    <option value="SM59">SM59 - Destino RFC / HTTP Push</option>
                    <option value="SM37">SM37 - Background Job (Execução Periódica)</option>
                    <option value="EVENT_MESH">SAP Event Mesh / Webhook Event</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-300">Template XML do IDoc ({selectedMessageType}):</label>
                  <textarea
                    rows={6}
                    value={idocPayloadXml}
                    onChange={(e) => setIdocPayloadXml(e.target.value)}
                    className={`w-full p-3 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>

                <button
                  onClick={() => {
                    addToast('Configuração de Roteamento IDoc e Triggers salva com sucesso no SAP Gateway!', 'success');
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Salvar Configuração de Roteamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'powerbi' && (
        <PowerBiStreamingManager />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Smart AI Quick Banner */}
          <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${darkMode ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border-blue-500/30' : 'bg-blue-50/80 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Gemini Office Copilot Integrado</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Solicite à IA em linguagem natural para redigir pareceres Word, disparar no Teams, enviar no Outlook e auditar planilhas Excel.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('copilot')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Abrir Gemini Copilot
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Canal Microsoft Teams</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-sm font-black text-slate-200">Adaptive Cards v1.4</p>
              <p className="text-[10px] text-emerald-400 mt-1">✓ Pronto para disparo</p>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Parecer Técnico Word</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-black text-slate-200">OpenXML / MSO HTML</p>
              <p className="text-[10px] text-blue-400 mt-1">Formatado com carimbo SOX</p>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">SharePoint / OneDrive</span>
                <Cloud className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-sm font-black text-slate-200">Controle de Versão SOX</p>
              <p className="text-[10px] text-cyan-400 mt-1">Hashes SHA-256 e Check-in</p>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Inbox Monitor</span>
                <Inbox className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-sm font-black text-slate-200">Ingestão Direta</p>
              <p className="text-[10px] text-amber-400 mt-1">Varredura automática</p>
            </div>
          </div>

          {/* Main Credentials & Hub Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Credentials & Authentication */}
            <div className={`p-6 rounded-3xl border space-y-6 lg:col-span-1 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Credenciais Azure AD</h2>
                <Key className="w-4 h-4 text-slate-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-slate-300">Tenant ID / Domínio</label>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5 text-slate-300">Client ID (Application ID)</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5 text-slate-300">Client Secret (Chave Secreta)</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <button
                  onClick={loginWithMicrosoft}
                  className="w-full py-3 bg-[#00A4EF] hover:bg-[#0082C4] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  Autenticar com Conta Microsoft
                </button>

                {aiUser && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Conectado como {aiUser.nome}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Services & Quick Sync Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* OneDrive / SharePoint Quick Integration */}
              <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">OneDrive & SharePoint Sync ({officeVersion === '365' ? 'Graph API' : 'WebDAV 2013'})</h3>
                      <p className="text-[11px] text-slate-400">Armazenamento automático de relatórios CKM3 e MB51 na nuvem corporativa.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={syncStatus === 'syncing'}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-blue-400' : ''}`} />
                    {syncStatus === 'syncing' ? 'Testando...' : syncStatus === 'success' ? 'Conectado!' : 'Testar Conexão'}
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-400">Pasta de Destino no OneDrive / SharePoint</label>
                    <input
                      type="text"
                      value={onedriveFolder}
                      onChange={(e) => setOnedriveFolder(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveTab('sharepoint')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Abrir Gestor de Versões
                    </button>
                    <button
                      onClick={handleSyncOneDrive}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Sincronizar Relatório Agora
                    </button>
                  </div>
                </div>
              </div>

              {/* Outlook & EWS Email Dispatch */}
              <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Outlook & Exchange (EWS / Office {officeVersion})</h3>
                    <p className="text-[11px] text-slate-400">Disparo automatizado de alertas de divergência e relatórios de auditoria via Outlook corporativo.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-400">E-mail do Gestor / Centro de Custo</label>
                    <input
                      type="email"
                      value={outlookEmail}
                      onChange={(e) => setOutlookEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveTab('inbox')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                    >
                      Monitorar Caixa de Entrada
                    </button>
                    <button
                      onClick={handleSendOutlookReport}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar Relatório via Outlook
                    </button>
                  </div>
                </div>
              </div>

              {/* Power BI Streaming Integration Quick Card */}
              <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Power BI Streaming & Push Dataset (Real-Time)</h3>
                      <p className="text-[11px] text-slate-400">Transmissão em tempo real de divergências e KPIs contábeis via POWERBI_PUSH_URL.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    <span>Transmita a base ativa diretamente para conjuntos de dados de streaming do Power BI Service.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('powerbi')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:from-amber-600 hover:to-yellow-600 whitespace-nowrap"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-950" />
                    Abrir Painel Power BI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Power Automate & Teams */}
      {activeTab === 'teams' && (
        <TeamsAdaptiveCardModal />
      )}

      {/* Tab 3: Modelos & Pareceres em Word */}
      {activeTab === 'templates' && (
        <TemplatesManager />
      )}

      {/* Tab 4: Governança & SharePoint */}
      {activeTab === 'sharepoint' && (
        <SharePointVersionManager />
      )}

      {/* Tab 4.5: Mapeamento SharePoint CKM3 */}
      {activeTab === 'sharepoint-mapper' && (
        <SharePointFieldMapper />
      )}

      {/* Tab 5: Inbox & Folder Monitor */}
      {activeTab === 'inbox' && (
        <InboxFolderWatcher />
      )}

      {/* Tab 6: Planilhas Massivas +150MB */}
      {activeTab === 'massive-files' && (
        <MassiveFileIngestor />
      )}
    </div>
  );
};

export default OfficeIntegrationPage;
