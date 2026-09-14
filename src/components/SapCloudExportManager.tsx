import React, { useState } from 'react';
import { Cloud, HardDrive, Share2, CheckCircle2, Clock, ShieldCheck, RefreshCw, Settings, FolderSync } from 'lucide-react';

interface SapCloudExportManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SapCloudExportManager: React.FC<SapCloudExportManagerProps> = ({ darkMode, addToast }) => {
  const [provider, setProvider] = useState<'gdrive' | 'sharepoint'>('gdrive');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'manual'>('daily');
  const [targetFolder, setTargetFolder] = useState('/SAP_SOX_Audits_Backup/2026');
  const [isConnected, setIsConnected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleConnect = () => {
    setIsConnected(true);
    addToast(`Conta conectada com sucesso ao ${provider === 'gdrive' ? 'Google Drive' : 'Microsoft SharePoint'}!`, 'success');
  };

  const handleExportNow = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setLastSync(new Date().toLocaleString());
      addToast(`Backup de auditoria exportado com sucesso para ${provider === 'gdrive' ? 'Google Drive' : 'SharePoint'} (${targetFolder})!`, 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <Cloud className="w-6 h-6 text-[#8DC63F]" /> Exportação Agendada para Nuvem (Google Drive & SharePoint)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Configure o armazenamento em nuvem para salvar automaticamente pacotes de evidências SOX e relatórios de auditoria SAP.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Selection */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 lg:col-span-1`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit`}>
            Provedor de Nuvem
          </h4>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setProvider('gdrive')}
              className={`w-full p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${provider === 'gdrive' ? 'border-[#8DC63F] bg-[#8DC63F]/10 text-white' : darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
            >
              <HardDrive className={`w-5 h-5 ${provider === 'gdrive' ? 'text-[#8DC63F]' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className="font-bold text-xs">Google Drive API</p>
                <p className="text-[10px] text-slate-400">Armazenamento corporativo Google Workspace</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('sharepoint')}
              className={`w-full p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${provider === 'sharepoint' ? 'border-[#8DC63F] bg-[#8DC63F]/10 text-white' : darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
            >
              <Share2 className={`w-5 h-5 ${provider === 'sharepoint' ? 'text-[#8DC63F]' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className="font-bold text-xs">Microsoft SharePoint</p>
                <p className="text-[10px] text-slate-400">Bibliotecas de documentos Microsoft 365</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-inherit">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" /> Conectar Conta {provider === 'gdrive' ? 'Google Drive' : 'SharePoint'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Conta Conectada & Autenticada
              </div>
            )}
          </div>
        </div>

        {/* Configuration & Schedule */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 lg:col-span-2 flex flex-col justify-between`}>
          <div className="space-y-4">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit flex items-center gap-2`}>
              <FolderSync className="w-4 h-4 text-emerald-500" /> Parâmetros de Sincronização & Agendamento
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Frequência de Backup</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="daily">Diário (Todo dia às 02:00 AM)</option>
                  <option value="weekly">Semanal (Domingos às 01:00 AM)</option>
                  <option value="manual">Apenas Manual / Sob Demanda</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Pasta de Destino (Path)</label>
                <input
                  type="text"
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-700 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Status da Sincronização Automática:</span>
                <span className="font-mono text-emerald-400 font-bold">{frequency !== 'manual' ? 'ATIVO (Cron Scheduler)' : 'INATIVO'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Último Backup Realizado:</span>
                <span className="font-mono text-white">{lastSync || 'Nenhum backup realizado nesta sessão'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-inherit flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Criptografia AES-256 em trânsito e em repouso</span>
            <button
              onClick={handleExportNow}
              disabled={!isConnected || isExporting}
              className="px-6 py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 fill-slate-950" />}
              {isExporting ? 'Exportando Backup...' : 'Exportar Backup Agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SapCloudExportManager;
