import React, { useState, useMemo } from 'react';
import { useAudit } from '../context/AuditContext';
import { FileCode, Terminal, Copy, Check, Download, Send, CheckCircle2, Sliders, RefreshCw, AlertCircle, Wifi, History, Clock } from 'lucide-react';

interface IdocHistoryItem {
  id: string;
  docnum: string;
  messageType: string;
  tcode: string;
  logicalSystem: string;
  port: string;
  timestamp: string;
  status: 'Sucesso' | 'Processando' | 'Erro';
}

export const IdocGeneratorSection: React.FC = () => {
  const { darkMode, resultado, addToast } = useAudit();
  const [selectedTCode, setSelectedTCode] = useState('MB1B');
  const [copied, setCopied] = useState(false);

  // IDoc Routing Configuration Form State
  const [rcvLogicalSystem, setRcvLogicalSystem] = useState('NATU_WMS_PROD_01');
  const [portNumber, setPortNumber] = useState('SAP_HTTP_PORT_80');
  const [selectedMsgTypes, setSelectedMsgTypes] = useState<string[]>(['WMMBXY', 'INVENTORY_COUNT', 'MATMAS', 'ORDERS']);
  const [routingActive, setRoutingActive] = useState(true);

  // IDoc Generation History State
  const [idocHistory, setIdocHistory] = useState<IdocHistoryItem[]>([
    {
      id: '1',
      docnum: '0000000000492819',
      messageType: 'WMMBXY',
      tcode: 'MB1B',
      logicalSystem: 'NATU_WMS_PROD_01',
      port: 'SAP_HTTP_PORT_80',
      timestamp: '28/08/2026 08:30:15',
      status: 'Sucesso'
    },
    {
      id: '2',
      docnum: '0000000000883920',
      messageType: 'INVENTORY_COUNT',
      tcode: 'MI04',
      logicalSystem: 'NATU_WMS_PROD_01',
      port: 'SAP_HTTP_PORT_80',
      timestamp: '28/08/2026 07:12:44',
      status: 'Sucesso'
    }
  ]);

  // Connection Ping State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleTestConnection = () => {
    if (!rcvLogicalSystem.trim()) {
      addToast('Informe o Sistema Lógico de Destino (RCVPRN) antes de testar a conexão.', 'error');
      return;
    }
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('Enviando ping IDoc RFC/HTTP para o sistema lógico...');

    setTimeout(() => {
      setIsTestingConnection(false);
      const isSuccess = rcvLogicalSystem.length >= 3;
      if (isSuccess) {
        setConnectionStatus('success');
        setConnectionMessage(`Conexão estabelecida com sucesso com [${rcvLogicalSystem}] na porta [${portNumber}]. Latência: 24ms.`);
        addToast(`Ping IDoc bem-sucedido para o sistema lógico ${rcvLogicalSystem}!`, 'success');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(`Falha ao conectar com [${rcvLogicalSystem}]. Verifique as configurações da WE21 / SM59.`);
        addToast('Erro ao testar conexão com o sistema lógico.', 'error');
      }
    }, 1200);
  };

  const availableMsgTypes = [
    { code: 'WMMBXY', label: 'WMMBXY (Movimentação de Estoque)' },
    { code: 'INVENTORY_COUNT', label: 'INVENTORY_COUNT (Contagem Física MI04)' },
    { code: 'MATMAS', label: 'MATMAS (Mestre de Materiais / SKUs)' },
    { code: 'ORDERS', label: 'ORDERS (Ordens de Venda e Compra)' },
    { code: 'DEBMAS', label: 'DEBMAS (Mestre de Clientes)' },
    { code: 'CREMAS', label: 'CREMAS (Mestre de Fornecedores)' },
    { code: 'INVOIC', label: 'INVOIC (Faturas e Notas Fiscais)' }
  ];

  const toggleMsgType = (code: string) => {
    if (selectedMsgTypes.includes(code)) {
      setSelectedMsgTypes(selectedMsgTypes.filter(t => t !== code));
    } else {
      setSelectedMsgTypes([...selectedMsgTypes, code]);
    }
  };

  const handleSaveRoutingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(`Configuração de Roteamento IDoc salva! Receptor: [${rcvLogicalSystem}], Porta: [${portNumber}], Tipos interceptados: ${selectedMsgTypes.join(', ')}`, 'success');
  };

  const sampleXml = useMemo(() => {
    const msgType = selectedMsgTypes[0] || 'WMMBXY';
    const idocType = msgType === 'MATMAS' ? 'MATMAS05' : msgType === 'ORDERS' ? 'ORDERS05' : msgType === 'INVENTORY_COUNT' ? 'INVENTORY01' : 'WMMBXY01';

    if (selectedTCode === 'MB1B') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<IDOCBEGIN>
  <EDI_DC40>
    <TABNAM>EDI_DC40</TABNAM>
    <MANDT>800</MANDT>
    <DOCNUM>0000000000492819</DOCNUM>
    <IDOCTYP>${idocType}</IDOCTYP>
    <MESTYP>${msgType}</MESTYP>
    <SNDPOR>SAPQAS</SNDPOR>
    <SNDPRT>LS</SNDPRT>
    <SNDPRN>NATU_ECC</SNDPRN>
    <RCVPRT>LS</RCVPRT>
    <RCVPRN>${rcvLogicalSystem}</RCVPRN>
    <PORT>${portNumber}</PORT>
  </EDI_DC40>
  <E1MBXYH>
    <BLDAT>20260312</BLDAT>
    <BUDAT>20260312</BUDAT>
    <BKTXT>Ajuste de Inventario Auditoria CKM3 - Roteado via ${portNumber}</BKTXT>
  </E1MBXYH>
  <E1MBXYI>
    <MATNR>10029481</MATNR>
    <WERKS>1000</WERKS>
    <LGORT>0001</LGORT>
    <CHARG>LOTE-2026-A1</CHARG>
    <MENGE>150.000</MENGE>
    <MEINS>KG</MEINS>
    <BWART>701</BWART>
  </E1MBXYI>
</IDOCBEGIN>`;
    } else if (selectedTCode === 'MI04') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<IDOCBEGIN>
  <EDI_DC40>
    <TABNAM>EDI_DC40</TABNAM>
    <MANDT>800</MANDT>
    <DOCNUM>0000000000883920</DOCNUM>
    <IDOCTYP>INVENTORY01</IDOCTYP>
    <MESTYP>INVENTORY_COUNT</MESTYP>
    <RCVPRN>${rcvLogicalSystem}</RCVPRN>
    <PORT>${portNumber}</PORT>
  </EDI_DC40>
  <E1IKHDR>
    <IBLNR>0000012938</IBLNR>
    <GJAHR>2026</GJAHR>
    <ZAHED>20260312</ZAHED>
  </E1IKHDR>
  <E1IKITM>
    <ITMNO>0001</ITMNO>
    <MATNR>50029310</MATNR>
    <ERFMG>3240.000</ERFMG>
    <ERFME>UN</ERFME>
  </E1IKITM>
</IDOCBEGIN>`;
    } else {
      return `{\n  "function": "BAPI_GOODSMVT_CREATE",\n  "routing": {\n    "rcv_logical_system": "${rcvLogicalSystem}",\n    "port": "${portNumber}",\n    "intercepted_messages": ${JSON.stringify(selectedMsgTypes)}\n  },\n  "goodsmvt_header": {\n    "pstng_date": "2026-03-12",\n    "doc_date": "2026-03-12",\n    "pr_code": "MB1B"\n  },\n  "goodsmvt_item": [\n    {\n      "material": "MAT-10029",\n      "plant": "1000",\n      "stge_loc": "0001",\n      "move_type": "311",\n      "entry_qnt": 500\n    }\n  ]\n}`;
    }
  }, [selectedTCode, rcvLogicalSystem, portNumber, selectedMsgTypes, resultado]);

  const addHistoryRecord = () => {
    const msgType = selectedMsgTypes[0] || 'WMMBXY';
    const newRecord: IdocHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      docnum: '000000000' + Math.floor(1000000 + Math.random() * 9000000),
      messageType: msgType,
      tcode: selectedTCode,
      logicalSystem: rcvLogicalSystem,
      port: portNumber,
      timestamp: new Date().toLocaleString('pt-BR'),
      status: 'Sucesso'
    };
    setIdocHistory([newRecord, ...idocHistory]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleXml);
    setCopied(true);
    addHistoryRecord();
    addToast('Payload IDoc copiado e registrado no histórico com sucesso!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sampleXml], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAP_${selectedTCode}_${rcvLogicalSystem}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    addHistoryRecord();
    addToast('Arquivo IDoc gerado e registrado no histórico com sucesso!', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <FileCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Gerador de IDoc & Configuração de Roteamento SAP</h2>
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Configure o roteamento de IDocs (Logical Systems, portas e interceptação de tipos de mensagens) e gere payloads XML em tempo real.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE CONFIGURAÇÃO DE ROTEAMENTO IDOC */}
      <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center justify-between border-b pb-4 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Configuração de Roteamento IDoc & Interceptação SAP</h3>
              <p className="text-xs text-slate-400">Defina o receptor (Logical System), porta de comunicação e tipos de mensagens suportados pelo middleware.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${routingActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
              {routingActive ? 'Roteamento Ativo' : 'Roteamento Pausado'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveRoutingConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-slate-300 block">Receptor IDoc (Logical System - RCVPRN):</label>
            <input
              type="text"
              value={rcvLogicalSystem}
              onChange={(e) => setRcvLogicalSystem(e.target.value)}
              placeholder="Ex: NATU_WMS_PROD_01"
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              required
            />
            <p className="text-[10px] text-slate-400">Identificação do sistema lógico de destino no SAP ECC / S/4HANA.</p>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-300 block">Número da Porta (IDoc Port / WE21):</label>
            <input
              type="text"
              value={portNumber}
              onChange={(e) => setPortNumber(e.target.value)}
              placeholder="Ex: SAP_HTTP_PORT_80"
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              required
            />
            <p className="text-[10px] text-slate-400">Porta RFC ou HTTP utilizada para o despacho de saída/entrada.</p>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={routingActive}
                  onChange={(e) => setRoutingActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="font-bold text-slate-200">Habilitar Monitoramento de Entrada</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isTestingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button
                type="submit"
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Salvar
              </button>
            </div>
            {connectionStatus !== 'idle' && (
              <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
                connectionStatus === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {connectionStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span className="truncate">{connectionMessage}</span>
              </div>
            )}
          </div>

          <div className="col-span-full space-y-2 pt-2 border-t border-slate-800">
            <label className="font-bold text-slate-300 block">Tipos de Mensagens Interceptados pelo Sistema (Message Types):</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableMsgTypes.map(msg => {
                const isSelected = selectedMsgTypes.includes(msg.code);
                return (
                  <div
                    key={msg.code}
                    onClick={() => toggleMsgType(msg.code)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs">{msg.code}</div>
                      <div className="text-[10px] opacity-75">{msg.label.split(' ')[1] || ''}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { code: 'MB1B', label: 'Movimentação de Estoque (MB1B / WMMBXY)', desc: 'Transferências e ajustes de centro/depósito' },
          { code: 'MI04', label: 'Contagem de Inventário (MI04 / INVENTORY)', desc: 'Lançamento de contagem física' },
          { code: 'BAPI', label: 'BAPI Goods Movement (JSON)', desc: 'Integração via RFC / OData Middleware' },
        ].map((item) => (
          <div
            key={item.code}
            onClick={() => setSelectedTCode(item.code)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedTCode === item.code
                ? (darkMode ? 'bg-emerald-600/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-emerald-50 border-emerald-300 shadow-md')
                : (darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200')
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-black text-xs text-emerald-400">{item.code}</span>
              {selectedTCode === item.code && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <h3 className="font-bold text-sm mb-1">{item.label}</h3>
            <p className="text-[11px] text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>SAP Payload Output — {selectedTCode} (Receptor: {rcvLogicalSystem} | Porta: {portNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Arquivo
            </button>
          </div>
        </div>
        <div className="p-6">
          <pre className={`p-6 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed ${darkMode ? 'bg-slate-950 text-emerald-400 border border-slate-850' : 'bg-slate-900 text-emerald-300'}`}>
            {sampleXml}
          </pre>
        </div>
      </div>

      {/* HISTÓRICO DE IDOCS GERADOS */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Histórico de IDocs Gerados & Rastreabilidade</h3>
              <p className="text-xs text-slate-400">Registro de todas as operações de geração, status de envio e tipos de mensagem na sessão.</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
            Total: {idocHistory.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400 bg-slate-950/40' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>
              <tr>
                <th className="p-3 font-black">DOCNUM (IDoc)</th>
                <th className="p-3 font-black">Tipo de Mensagem</th>
                <th className="p-3 font-black">Transação</th>
                <th className="p-3 font-black">Sistema Destino (Receptor)</th>
                <th className="p-3 font-black">Data / Hora</th>
                <th className="p-3 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {idocHistory.map((item) => (
                <tr key={item.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                  <td className="p-3 font-mono font-bold text-emerald-400">{item.docnum}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.messageType}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{item.tcode}</td>
                  <td className="p-3 font-mono text-slate-300">{item.logicalSystem} <span className="text-[10px] text-slate-500">({item.port})</span></td>
                  <td className="p-3 text-slate-400 flex items-center gap-1.5 pt-4">
                    <Clock className="w-3.5 h-3.5" /> {item.timestamp}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                      item.status === 'Sucesso' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : item.status === 'Processando'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.status === 'Sucesso' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'Erro' && <AlertCircle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
