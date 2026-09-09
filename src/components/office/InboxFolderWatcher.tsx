import React, { useState, useEffect } from 'react';
import { Mail, Inbox, HardDrive, RefreshCw, CheckCircle2, ArrowDownToLine, Zap, FileSpreadsheet, FileCode, Clock } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';

interface InboxFile {
  id: string;
  source: string;
  from: string;
  subject: string;
  fileName: string;
  size: string;
  receivedAt: string;
  type: 'CKM3' | 'MB51' | 'NF';
  status: 'READY_TO_INGEST' | 'VALIDATED' | 'INGESTED' | 'PROCESSING';
}

export const InboxFolderWatcher: React.FC = () => {
  const { darkMode, addToast, setFilesCKM3, setFilesNF, setStatus } = useAudit();

  const [isScanning, setIsScanning] = useState(false);
  const [autoPollInterval, setAutoPollInterval] = useState('5'); // minutes
  const [monitoredMailbox, setMonitoredMailbox] = useState('auditoria.sap@natulab.com.br');
  const [monitoredFolder, setMonitoredFolder] = useState('/Auditoria_SAP/Entrada_Automatica');
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString('pt-BR'));

  const [files, setFiles] = useState<InboxFile[]>([
    {
      id: 'msg-001',
      source: 'Outlook / Exchange 365',
      from: 'controladoria.fabril@natulab.com.br',
      subject: 'Fechamento CKM3 - Planta 1001 (Agosto 2026)',
      fileName: 'CKM3_Planta_1001_Agosto_2026.xlsx',
      size: '1.4 MB',
      receivedAt: '14/08/2026 15:15',
      type: 'CKM3',
      status: 'READY_TO_INGEST'
    },
    {
      id: 'sp-002',
      source: 'SharePoint Watcher',
      from: 'Sistema SAP Spool Automático',
      subject: 'Extração Automática MB51 - Movimentações Período',
      fileName: 'MB51_Extracao_01a15_Agosto.csv',
      size: '3.8 MB',
      receivedAt: '14/08/2026 14:48',
      type: 'MB51',
      status: 'READY_TO_INGEST'
    },
    {
      id: 'msg-003',
      source: 'OneDrive Drop Folder',
      from: 'fiscal@natulab.com.br',
      subject: 'Lote de XMLs de Entrada - Fornecedores Químicos',
      fileName: 'XML_NFe_Entradas_Quimicos_Lote44.xml',
      size: '890 KB',
      receivedAt: '14/08/2026 13:20',
      type: 'NF',
      status: 'VALIDATED'
    }
  ]);

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/office/inbox-monitor');
      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files);
        setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
        addToast('Verificação concluída: novos anexos sincronizados!', 'success');
      }
    } catch (err) {
      addToast('Erro ao verificar caixa de entrada do Outlook/SharePoint', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleIngestFile = (fileItem: InboxFile) => {
    // Update state to processing
    setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'PROCESSING' } : f));
    addToast(`Iniciando ingestão do arquivo "${fileItem.fileName}"...`, 'info');

    setTimeout(() => {
      // Create a dummy File object representing the incoming stream
      const dummyContent = 'Material,Descricao,Quantidade,Custo\n1000452,DIPIRONA SODICA,5000,12.50\n2000891,FRASCO PET,25000,0.85';
      const blob = new Blob([dummyContent], { type: 'text/csv' });
      const file = new File([blob], fileItem.fileName, { type: 'text/csv' });

      if (fileItem.type === 'CKM3') {
        setFilesCKM3([file]);
      } else if (fileItem.type === 'NF') {
        setFilesNF([file]);
      }

      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'INGESTED' } : f));
      addToast(`Arquivo "${fileItem.fileName}" carregado e pronto para conciliação no sistema!`, 'success');
    }, 1500);
  };

  return (
    <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Leitura Direta de Pastas & Inbox Monitor (Outlook & OneDrive)</h2>
            <p className="text-xs text-slate-400">Varredura contínua de e-mails corporativos e diretórios em nuvem para ingestão automática de arquivos CKM3 e NFs.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Última checagem: {lastCheckTime}
          </span>

          <button
            onClick={handleManualScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
            {isScanning ? 'Verificando...' : 'Verificar Agora'}
          </button>
        </div>
      </div>

      {/* Configuration Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border space-y-1.5 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <label className="text-xs font-bold block text-slate-300">Caixa de Entrada Outlook Monitorada</label>
          <input
            type="email"
            value={monitoredMailbox}
            onChange={(e) => setMonitoredMailbox(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
          />
        </div>

        <div className={`p-4 rounded-2xl border space-y-1.5 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <label className="text-xs font-bold block text-slate-300">Pasta Compartilhada OneDrive / SharePoint</label>
          <input
            type="text"
            value={monitoredFolder}
            onChange={(e) => setMonitoredFolder(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
          />
        </div>

        <div className={`p-4 rounded-2xl border space-y-1.5 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <label className="text-xs font-bold block text-slate-300">Frequência de Polling Automático</label>
          <select
            value={autoPollInterval}
            onChange={(e) => setAutoPollInterval(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
          >
            <option value="1">A cada 1 minuto (Tempo Real)</option>
            <option value="5">A cada 5 minutos (Recomendado)</option>
            <option value="15">A cada 15 minutos</option>
            <option value="manual">Apenas Manual</option>
          </select>
        </div>
      </div>

      {/* Incoming Stream Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Fila de Arquivos Detectados para Ingestão Automática
        </h3>

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${file.status === 'INGESTED' ? (darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/50 border-emerald-200') : (darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200')}`}
            >
              <div className="flex items-start md:items-center gap-3.5">
                <div className={`p-2.5 rounded-2xl ${file.type === 'CKM3' ? 'bg-blue-500/10 text-blue-400' : file.type === 'MB51' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {file.type === 'CKM3' ? <FileSpreadsheet className="w-5 h-5" /> : file.type === 'MB51' ? <HardDrive className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-200">{file.fileName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {file.type} • {file.size}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800">
                      {file.source}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    <strong className="text-slate-300">{file.from}</strong>: "{file.subject}" • Recebido em {file.receivedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {file.status === 'INGESTED' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Carregado no Sistema
                  </div>
                ) : (
                  <button
                    onClick={() => handleIngestFile(file)}
                    disabled={file.status === 'PROCESSING'}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    <ArrowDownToLine className={`w-3.5 h-3.5 ${file.status === 'PROCESSING' ? 'animate-bounce' : ''}`} />
                    {file.status === 'PROCESSING' ? 'Ingerindo...' : 'Ingerir na Auditoria'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default InboxFolderWatcher;
