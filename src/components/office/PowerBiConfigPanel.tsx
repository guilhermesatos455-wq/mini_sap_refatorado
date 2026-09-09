import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { usePowerBI } from '../../hooks/usePowerBI';
import { 
  ShieldCheck, 
  Key, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Send,
  ExternalLink,
  Lock
} from 'lucide-react';

interface PowerBiConfigPanelProps {
  onSaved?: () => void;
}

export const PowerBiConfigPanel: React.FC<PowerBiConfigPanelProps> = ({ onSaved }) => {
  const { darkMode, addToast, powerBiPushUrl, setPowerBiPushUrl } = useAudit();
  const { status, diagnostic, isLoading, isConfigured, isReachable, errorMessage, validateConnection, refreshStatus } = usePowerBI();

  const [pushUrlInput, setPushUrlInput] = useState(powerBiPushUrl || '');
  const [tenantIdInput, setTenantIdInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [datasetIdInput, setDatasetIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setPowerBiPushUrl(pushUrlInput.trim());
      // Also store local preferences if needed
      localStorage.setItem('miniSap_pbi_tenantId', tenantIdInput.trim());
      localStorage.setItem('miniSap_pbi_clientId', clientIdInput.trim());
      localStorage.setItem('miniSap_pbi_datasetId', datasetIdInput.trim());
      
      addToast('Configurações e credenciais do Power BI salvas com sucesso!', 'success');
      refreshStatus();
      if (onSaved) onSaved();
    } catch (err) {
      addToast('Erro ao salvar configurações do Power BI', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    try {
      const res = await validateConnection();
      if (res.success) {
        addToast('Conexão e alcançabilidade validadas com sucesso!', 'success');
      } else {
        addToast(`Atenção: ${res.missingVars.length > 0 ? 'Faltam variáveis obrigatórias' : 'Falha na alcançabilidade'}`, 'error');
      }
    } catch (err) {
      addToast('Falha ao testar conexão com Power BI', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-slate-800'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#8DC63F]" />
            <h3 className="text-lg font-bold">Painel de Configuração & Diagnóstico Power BI</h3>
          </div>
          <p className="text-xs opacity-75">
            Valide e configure as credenciais da API de Push e URLs de streaming antes de iniciar a transmissão de dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            isConfigured 
              ? (darkMode ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
              : (darkMode ? 'bg-amber-950/40 border-amber-800/60 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isConfigured ? 'Configurado' : 'Pendente Configuração'}
          </span>

          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            isReachable === true 
              ? (darkMode ? 'bg-blue-950/40 border-blue-800/60 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700')
              : isReachable === false
              ? (darkMode ? 'bg-red-950/40 border-red-800/60 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
              : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-600')
          }`}>
            {isReachable === true ? 'Alcançável' : isReachable === false ? 'Inalcançável' : 'Não Testado'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#8DC63F]" />
            URL do Conjunto de Dados de Streaming (POWERBI_PUSH_URL)
          </label>
          <div className="flex gap-2">
            <input 
              type="url"
              value={pushUrlInput}
              onChange={(e) => setPushUrlInput(e.target.value)}
              placeholder="https://api.powerbi.com/beta/.../datasets/.../rows?key=..."
              className={`flex-1 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-mono border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8DC63F] ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-slate-900'
              }`}
            />
          </div>
          <p className="text-[11px] opacity-60 mt-1">
            Cole a URL gerada ao criar um novo Conjunto de Dados de Streaming do tipo API no Power BI Service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Azure Tenant ID (Opcional)
            </label>
            <input 
              type="text"
              value={tenantIdInput}
              onChange={(e) => setTenantIdInput(e.target.value)}
              placeholder="xxxxxxxx-xxxx-..."
              className={`w-full px-3.5 py-2 rounded-2xl text-xs font-mono border transition-all ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Azure Client ID (Opcional)
            </label>
            <input 
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="xxxxxxxx-xxxx-..."
              className={`w-full px-3.5 py-2 rounded-2xl text-xs font-mono border transition-all ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Dataset ID (Opcional)
            </label>
            <input 
              type="text"
              value={datasetIdInput}
              onChange={(e) => setDatasetIdInput(e.target.value)}
              placeholder="Dataset GUID..."
              className={`w-full px-3.5 py-2 rounded-2xl text-xs font-mono border transition-all ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Diagnostic feedback box */}
        {diagnostic && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            diagnostic.success 
              ? (darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200')
              : (darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200')
          }`}>
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${diagnostic.success ? 'text-emerald-400' : 'text-amber-400'}`} />
              Relatório de Diagnóstico do Servidor
            </div>
            <div className="space-y-1 font-mono opacity-90 text-[11px]">
              {diagnostic.details.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[#8DC63F]">›</span> {d}
                </div>
              ))}
            </div>
            {diagnostic.missingVars.length > 0 && (
              <div className="text-red-400 font-bold mt-1">
                Atenção: Variáveis ausentes: {diagnostic.missingVars.join(', ')}
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRunDiagnostic}
            disabled={isTesting || isLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting || isLoading ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testando Conexão...' : 'Testar Conexão com API'}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#8DC63F] text-slate-950 hover:bg-[#7ab233] transition-all shadow-md cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
