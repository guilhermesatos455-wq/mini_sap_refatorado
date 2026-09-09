import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Code, 
  Table, 
  Activity, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Server,
  ArrowUpRight,
  Database,
  Key,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { 
  formatAuditRowsForPowerBi, 
  getPowerBiStreamingSchemaJson,
  getPowerBiDaxMeasures,
  triggerPowerBiRefresh,
  verifyPowerBiConnection,
  PowerBiAuditRow,
  PowerBiServerStatus,
  PowerBiVerifyResponse
} from '../../services/powerBiService';
import { usePowerBiSync } from '../../hooks/usePowerBiSync';
import { usePowerBI } from '../../hooks/usePowerBI';
import { PowerBiConfigPanel } from './PowerBiConfigPanel';

export const PowerBiStreamingManager: React.FC = () => {
  const { 
    darkMode, 
    resultado, 
    aiUser, 
    addToast, 
    powerBiPushUrl, 
    setPowerBiPushUrl,
    powerBiPushLogs,
    addPowerBiPushLog,
    addAuditLog
  } = useAudit();

  const {
    status: serverStatus,
    syncState,
    isSyncing,
    lastSyncedAt,
    lastRecordCount,
    lastDurationMs,
    errorMessage: syncErrorMessage,
    tokenValid,
    checkStatus,
    authenticateAzure,
    pushRawRows
  } = usePowerBiSync();

  const { isConfigured: hookIsConfigured, isReachable, validateConnection } = usePowerBI();

  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isRefreshingDataset, setIsRefreshingDataset] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedDax, setCopiedDax] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'schema' | 'dax' | 'azure' | 'logs' | 'config'>('preview');
  const [isVerifyingDiagnostic, setIsVerifyingDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<PowerBiVerifyResponse | null>(null);

  const handleVerifyDiagnostic = async () => {
    setIsVerifyingDiagnostic(true);
    try {
      const res = await validateConnection();
      setDiagnosticResult(res);
      if (res.success) {
        addToast('Diagnóstico Power BI: Configuração e alcançabilidade validadas com sucesso!', 'success');
      } else {
        addToast(`Atenção no Diagnóstico Power BI: ${res.missingVars.length > 0 ? 'Faltam variáveis' : 'Falha na alcançabilidade'}`, 'error');
      }
    } catch (err) {
      addToast('Erro ao executar diagnóstico Power BI', 'error');
    } finally {
      setIsVerifyingDiagnostic(false);
    }
  };

  const [customUrlInput, setCustomUrlInput] = useState(powerBiPushUrl || '');
  const [autoPushEnabled, setAutoPushEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('miniSap_autoPushPowerBi') === 'true';
    } catch {
      return false;
    }
  });

  // Formata linhas da auditoria ativa
  const activeRows: PowerBiAuditRow[] = useMemo(() => {
    const divergencias = resultado?.divergencias || resultado?.todosOsItens || [];
    if (divergencias.length > 0) {
      return formatAuditRowsForPowerBi(divergencias, aiUser?.nome || 'Auditor NatuAssist');
    }
    return [
      {
        material: 'MAT-100234',
        descricao: 'FRASCO AMBAR 100ML COM TAMPA',
        fornecedor: 'VIDRARIA NACIONAL S/A',
        cnpjFornecedor: '12.345.678/0001-90',
        centro: '1000',
        cfop: '1101AA',
        numeroNF: '0048921',
        quantidade: 5000,
        precoUnitarioNF: 1.45,
        custoSAP_CKM3: 1.20,
        variacaoUnitario: 0.25,
        variacaoPercentual: 20.83,
        impactoFinanceiro: 1250.00,
        statusAuditoria: 'Divergência Crítica',
        aprovacaoStatus: 'Pendente',
        categoriaDivergencia: 'Prejuízo / Acima do Custo',
        temRiscoFiscal: true,
        auditorResponsavel: aiUser?.nome || 'Auditor Fiscal',
        dataEmissaoNF: new Date().toISOString().split('T')[0],
        timestampTransmissao: new Date().toISOString()
      },
      {
        material: 'MAT-500112',
        descricao: 'EXTRATO GLICOLICO DE CAMOMILA 5KG',
        fornecedor: 'BIOEXTRATOS QUIMICA LTDA',
        cnpjFornecedor: '98.765.432/0001-10',
        centro: '1000',
        cfop: '1101AA',
        numeroNF: '0048930',
        quantidade: 10,
        precoUnitarioNF: 420.00,
        custoSAP_CKM3: 450.00,
        variacaoUnitario: -30.00,
        variacaoPercentual: -6.67,
        impactoFinanceiro: -300.00,
        statusAuditoria: 'Economia Identificada',
        aprovacaoStatus: 'Aprovado',
        categoriaDivergencia: 'Economia / Abaixo do Custo',
        temRiscoFiscal: false,
        auditorResponsavel: aiUser?.nome || 'Auditor Fiscal',
        dataEmissaoNF: new Date().toISOString().split('T')[0],
        timestampTransmissao: new Date().toISOString()
      }
    ];
  }, [resultado, aiUser]);

  const handlePushCurrentAudit = async () => {
    if (activeRows.length === 0) {
      addToast('Não há dados de auditoria carregados para transmitir ao Power BI.', 'error');
      return;
    }

    const targetUrl = customUrlInput.trim() || undefined;
    const response = await pushRawRows(activeRows, targetUrl);

    if (response) {
      if (response.success) {
        addToast(
          `🚀 ${response.count} registros transmitidos com sucesso (${response.durationMs}ms) via ${response.mode === 'azure_rest_api' ? 'Azure REST API' : 'Push Webhook'}!`,
          'success'
        );
        addPowerBiPushLog({
          timestamp: new Date().toISOString(),
          success: true,
          message: `Transmitido ${response.count} registros em ${response.durationMs}ms (${response.mode}).`
        });
        addAuditLog(
          'Power BI Push',
          `Exportação em tempo real de ${response.count} registros de auditoria para o Power BI (${response.mode}).`
        );
      } else {
        addToast(
          `Falha ao transmitir para o Power BI: ${response.error} - ${response.details || ''}`,
          'error'
        );
        addPowerBiPushLog({
          timestamp: new Date().toISOString(),
          success: false,
          message: `Erro: ${response.error} (${response.details || 'Sem detalhes'})`
        });
      }
    }
  };

  const handlePushTestSample = async () => {
    const sampleRow: PowerBiAuditRow = {
      material: 'TESTE-PING-REALTIME',
      descricao: 'Validação de Conexão Push Power BI NatuAssist',
      fornecedor: 'NATULAB AUDITORIA INTERNA',
      cnpjFornecedor: '00.000.000/0001-00',
      centro: '1000',
      cfop: '1101AA',
      numeroNF: 'PING-' + Math.floor(Math.random() * 10000),
      quantidade: 1,
      precoUnitarioNF: 100.0,
      custoSAP_CKM3: 100.0,
      variacaoUnitario: 0.0,
      variacaoPercentual: 0.0,
      impactoFinanceiro: 0.0,
      statusAuditoria: 'Ping Teste',
      aprovacaoStatus: 'Aprovado',
      categoriaDivergencia: 'Neutro',
      temRiscoFiscal: false,
      auditorResponsavel: aiUser?.nome || 'Dev / Auditor',
      dataEmissaoNF: new Date().toISOString().split('T')[0],
      timestampTransmissao: new Date().toISOString()
    };

    const targetUrl = customUrlInput.trim() || undefined;
    const response = await pushRawRows([sampleRow], targetUrl);
    if (response) {
      if (response.success) {
        addToast(`Ping de teste enviado com sucesso ao Power BI (${response.durationMs}ms)!`, 'success');
        addPowerBiPushLog({
          timestamp: new Date().toISOString(),
          success: true,
          message: `Ping de teste enviado com sucesso (${response.mode}).`
        });
      } else {
        addToast(`Erro no teste: ${response.error} - ${response.details || ''}`, 'error');
        addPowerBiPushLog({
          timestamp: new Date().toISOString(),
          success: false,
          message: `Falha no teste: ${response.error}`
        });
      }
    }
  };

  const handleTestAzureAuth = async () => {
    setIsTestingAuth(true);
    try {
      const success = await authenticateAzure();
      if (success) {
        addToast('Azure AD Token obtido com sucesso via OAuth2 Client Credentials!', 'success');
      } else {
        addToast(`Falha na autenticação Azure AD: ${syncErrorMessage || 'Erro desconhecido'}`, 'error');
      }
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleTriggerRefresh = async () => {
    setIsRefreshingDataset(true);
    try {
      const res = await triggerPowerBiRefresh();
      if (res.success) {
        addToast('Solicitação de Refresh de Dataset disparada no Power BI Service!', 'success');
      } else {
        addToast(`Erro ao disparar refresh: ${res.error}`, 'error');
      }
    } finally {
      setIsRefreshingDataset(false);
    }
  };

  const handleSaveCustomUrl = () => {
    setPowerBiPushUrl(customUrlInput);
    addToast('URL personalizada do Power BI atualizada nas configurações!', 'success');
  };

  const handleToggleAutoPush = () => {
    const nextVal = !autoPushEnabled;
    setAutoPushEnabled(nextVal);
    try {
      localStorage.setItem('miniSap_autoPushPowerBi', String(nextVal));
    } catch {}
    addToast(
      nextVal
        ? 'Push Automático ativado: novas auditorias serão enviadas automaticamente ao Power BI.'
        : 'Push Automático desativado.',
      'info'
    );
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(getPowerBiStreamingSchemaJson());
    setCopiedSchema(true);
    addToast('Esquema JSON do Power BI copiado!', 'success');
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleCopyDax = () => {
    navigator.clipboard.writeText(getPowerBiDaxMeasures());
    setCopiedDax(true);
    addToast('Medidas DAX copiadas para a área de transferência!', 'success');
    setTimeout(() => setCopiedDax(false), 2500);
  };

  const isConfigured = Boolean(
    tokenValid || serverStatus?.configured || (customUrlInput && customUrlInput.trim().length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Power BI Header Card */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/30' : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-200 shadow-xl'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0 relative">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400 relative">
                <BarChart2 className={`w-7 h-7 ${isSyncing || syncState === 'pushing' ? 'animate-spin' : 'animate-pulse'}`} />
                {/* Visual active/idle status indicator badge inside the icon element */}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                  isSyncing || syncState === 'pushing' ? 'bg-amber-500 animate-ping' :
                  syncState === 'connected' || tokenValid ? 'bg-emerald-500' : 'bg-slate-500'
                }`} title={`Power BI Status: ${syncState.toUpperCase()}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Power BI Real-Time Streaming & Azure Auth
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isSyncing ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  syncState === 'connected' || tokenValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSyncing ? 'bg-amber-400 animate-ping' :
                    syncState === 'connected' || tokenValid ? 'bg-emerald-400' : 'bg-slate-400'
                  }`} />
                  {isSyncing ? 'Pushing Data (Active)...' : syncState === 'connected' || tokenValid ? 'Connection Active' : 'Connection Idle'}
                </span>
                {serverStatus?.hasAzureCredentials && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="w-3 h-3" /> Azure AD Ativo
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Gerenciamento de autenticação com credenciais Azure AD (<code className="text-amber-300">AZURE_CLIENT_ID</code>, <code className="text-amber-300">AZURE_TENANT_ID</code>, <code className="text-amber-300">AZURE_CLIENT_SECRET</code>) e transmissão contínua de laudos CKM3 / MB51 para a URL <code className="text-amber-300">POWERBI_PUSH_URL</code>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestAzureAuth}
              disabled={isTestingAuth}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer disabled:opacity-50 ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-blue-400 border-blue-500/30' : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 shadow-sm'}`}
              title="Testa autenticação OAuth 2.0 via Client Credentials com Azure AD"
            >
              <Key className="w-3.5 h-3.5" />
              {isTestingAuth ? 'Autenticando...' : 'Testar Token Azure'}
            </button>

            <button
              onClick={handlePushTestSample}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer disabled:opacity-50 ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'}`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Ping de Teste
            </button>

            <button
              onClick={handlePushCurrentAudit}
              disabled={isSyncing}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  Transmitindo Dados...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  Transmitir Auditoria ({activeRows.length} linhas)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Environmental status banner */}
        <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${darkMode ? 'border-slate-800 text-slate-400' : 'border-amber-200/80 text-slate-600'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Push URL: <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">POWERBI_PUSH_URL</code> {serverStatus?.hasEnvVar ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                Azure AD: <code className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px]">AZURE_CLIENT_ID</code> {serverStatus?.hasAzureCredentials ? '✓' : '✗'}
              </span>
            </div>
            {serverStatus?.tokenStatus && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${serverStatus.tokenStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                Token: {serverStatus.tokenStatus.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleVerifyDiagnostic}
              disabled={isVerifyingDiagnostic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingDiagnostic ? 'animate-spin' : ''}`} />
              {isVerifyingDiagnostic ? 'Verificando...' : 'Executar Diagnóstico'}
            </button>

            <button
              onClick={checkStatus}
              disabled={syncState === 'checking'}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 ${syncState === 'checking' ? 'animate-spin' : ''}`} />
              Recarregar Status
            </button>

            <a
              href="https://app.powerbi.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold transition-colors text-[11px]"
            >
              Abrir Power BI Service <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Diagnostic Result Banner if available */}
      {diagnosticResult && (
        <div className={`p-5 rounded-2xl border ${diagnosticResult.success ? (darkMode ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200') : (darkMode ? 'bg-amber-950/30 border-amber-800/50' : 'bg-amber-50 border-amber-200')}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${diagnosticResult.success ? 'text-emerald-400' : 'text-amber-400'}`} />
              <h4 className="font-bold text-sm">Resultado do Diagnóstico Pré-Inicialização Power BI</h4>
            </div>
            <button 
              onClick={() => setDiagnosticResult(null)}
              className="text-xs opacity-70 hover:opacity-100 underline"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs mb-3 font-medium">
            Status Geral: <span className={diagnosticResult.success ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{diagnosticResult.success ? 'Aprovado & Pronto' : 'Atenção Requerida'}</span>
            {' | '}
            Alcançabilidade Push URL: <span className="font-bold">{diagnosticResult.pushUrlReachable === true ? 'Alcançável (OK)' : diagnosticResult.pushUrlReachable === false ? 'Inalcançável / Erro' : 'Não Configurada'}</span>
          </p>
          <div className="space-y-1 bg-black/20 p-3 rounded-xl font-mono text-[11px]">
            {diagnosticResult.details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-amber-400">›</span>
                <span>{detail}</span>
              </div>
            ))}
            {diagnosticResult.missingVars.length > 0 && (
              <div className="text-red-400 mt-2 font-bold">
                Variáveis Ausentes: {diagnosticResult.missingVars.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics & Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total Transmitidos */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Total de Linhas Prontas</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{activeRows.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {resultado ? 'Extraídos da auditoria ativa' : 'Modo demonstração (amostra padrão)'}
          </p>
        </div>

        {/* Metric 2: Impacto Financeiro Total */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Impacto Total Monitorado</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              resultado?.totalPrejuizo || activeRows.reduce((acc, r) => acc + (r.impactoFinanceiro > 0 ? r.impactoFinanceiro : 0), 0)
            )}
          </p>
          <p className="text-[11px] text-amber-400 mt-1">
            Atualizado em tempo real para os KPIs executivos
          </p>
        </div>

        {/* Metric 3: Push Automático */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400">Push Automático (Background)</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-slate-300">
              Transmitir automaticamente após cada execução de auditoria CKM3.
            </p>
          </div>
          <div className="pt-3">
            <button
              onClick={handleToggleAutoPush}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${autoPushEnabled ? 'bg-emerald-600 text-white shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
            >
              {autoPushEnabled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Push Automático Ativado
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-400" /> Ativar Push Automático
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* URL Endpoint Configuration Panel */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">URL do Conjunto de Dados de Streaming (Power BI Push URL)</h3>
              <p className="text-[11px] text-slate-400">
                A aplicação utiliza por padrão a variável <code className="text-amber-300">POWERBI_PUSH_URL</code> do backend, mas você pode especificar ou sobrescrever a URL abaixo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customUrlInput}
            onChange={(e) => setCustomUrlInput(e.target.value)}
            placeholder="https://api.powerbi.com/beta/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/datasets/..."
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          />
          <button
            onClick={handleSaveCustomUrl}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            Salvar URL
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Preview, Schema JSON, DAX, Azure Auth, Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'preview' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <Table className="w-3.5 h-3.5" />
              Prévia dos Dados ({activeRows.length})
            </button>

            <button
              onClick={() => setViewMode('schema')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'schema' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <Code className="w-3.5 h-3.5" />
              Esquema do Dataset (JSON)
            </button>

            <button
              onClick={() => setViewMode('dax')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'dax' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Medidas DAX
            </button>

            <button
              onClick={() => setViewMode('azure')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'azure' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Autenticação Azure AD
            </button>

            <button
              onClick={() => setViewMode('config')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'config' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <Server className="w-3.5 h-3.5" />
              Configurar & Testar
            </button>

            <button
              onClick={() => setViewMode('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'logs' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (darkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Histórico de Disparos ({powerBiPushLogs.length})
            </button>
          </div>

          {viewMode === 'schema' && (
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSchema ? 'Copiado!' : 'Copiar Esquema JSON'}
            </button>
          )}

          {viewMode === 'dax' && (
            <button
              onClick={handleCopyDax}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copiedDax ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedDax ? 'Copiado!' : 'Copiar Medidas DAX'}
            </button>
          )}
        </div>

        {/* Tab 1: Preview Table */}
        {viewMode === 'preview' && (
          <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className={`sticky top-0 z-10 uppercase text-[10px] font-black tracking-wider ${darkMode ? 'bg-slate-950 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}`}>
                  <tr>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4 text-right">Preço NF</th>
                    <th className="py-3 px-4 text-right">Custo CKM3</th>
                    <th className="py-3 px-4 text-right">Var. %</th>
                    <th className="py-3 px-4 text-right">Impacto (R$)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {activeRows.map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{row.material}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={row.descricao}>{row.descricao}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{row.fornecedor}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.precoUnitarioNF)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.custoSAP_CKM3)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${row.variacaoPercentual > 0 ? 'text-red-400' : row.variacaoPercentual < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {row.variacaoPercentual > 0 ? `+${row.variacaoPercentual}%` : `${row.variacaoPercentual}%`}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${row.impactoFinanceiro > 0 ? 'text-red-400' : row.impactoFinanceiro < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.impactoFinanceiro)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${row.statusAuditoria.includes('Crítica') || row.impactoFinanceiro > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {row.statusAuditoria}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Schema JSON */}
        {viewMode === 'schema' && (
          <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Estrutura do Conjunto de Dados de Streaming (Power BI API Schema)
              </h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                No Power BI Service (<a href="https://app.powerbi.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">app.powerbi.com</a>), crie um novo <strong>Conjunto de Dados de Streaming &gt; API</strong> com estes campos:
              </p>
            </div>
            <pre className={`p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-96 ${darkMode ? 'bg-slate-950 text-amber-300 border border-slate-800' : 'bg-slate-900 text-amber-300'}`}>
              {getPowerBiStreamingSchemaJson()}
            </pre>
          </div>
        )}

        {/* Tab 3: DAX Measures */}
        {viewMode === 'dax' && (
          <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Medidas DAX Calculadas para Dashboards Executivos
              </h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                Copie e cole estas medidas na sua tabela do Power BI Desktop para gerar cartões KPI de prejuízo, economia e auditorias fiscais:
              </p>
            </div>
            <pre className={`p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-96 ${darkMode ? 'bg-slate-950 text-emerald-300 border border-slate-800' : 'bg-slate-900 text-emerald-300'}`}>
              {getPowerBiDaxMeasures()}
            </pre>
          </div>
        )}

        {/* Tab 4: Azure AD Auth Diagnostics */}
        {viewMode === 'azure' && (
          <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Gerenciamento de Autenticação Azure AD / Entra ID
                </h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                  As credenciais são gerenciadas com segurança no backend e usadas para adquirir tokens OAuth 2.0 com escopo <code className="text-blue-300">https://analysis.windows.net/powerbi/api/.default</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerRefresh}
                  disabled={isRefreshingDataset}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDataset ? 'animate-spin' : ''}`} />
                  Disparar Refresh de Dataset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-bold text-slate-400 block">Tenant ID (AZURE_TENANT_ID)</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                  {serverStatus?.tenantId || 'Não configurado no .env'}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-bold text-slate-400 block">Client ID (AZURE_CLIENT_ID)</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                  {serverStatus?.clientId || 'Não configurado no .env'}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-bold text-slate-400 block">Status do Token de Acesso</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${serverStatus?.tokenStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {serverStatus?.tokenStatus || 'unauthenticated'}
                  </span>
                  {serverStatus?.tokenExpiresAt && (
                    <span className="text-[10px] text-slate-500">
                      Expira: {new Date(serverStatus.tokenExpiresAt).toLocaleTimeString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Config Panel */}
        {viewMode === 'config' && (
          <PowerBiConfigPanel onSaved={() => setViewMode('preview')} />
        )}

        {/* Tab 6: Push Logs */}
        {viewMode === 'logs' && (
          <div className={`rounded-3xl border p-6 space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Histórico de Transmissões ao Vivo
              </h4>
              <span className="text-xs text-slate-500">{powerBiPushLogs.length} registros</span>
            </div>

            {powerBiPushLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma transmissão registrada ainda. Clique em "Transmitir Auditoria" para enviar a primeira carga.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...powerBiPushLogs].reverse().map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 text-xs ${log.success ? (darkMode ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : (darkMode ? 'bg-red-950/20 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800')}`}
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">{log.message}</p>
                        <p className="text-[10px] opacity-70">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/20">
                      {log.success ? 'HTTP 200 OK' : 'Falha'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PowerBiStreamingManager;
