import React, { useState } from 'react';
import { DollarSign, ShieldAlert, FileText, Download, TrendingUp, Calendar, AlertTriangle, CheckCircle2, ShieldCheck, Printer, FileSpreadsheet } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface EnterpriseStrategicHubProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const EnterpriseStrategicHub: React.FC<EnterpriseStrategicHubProps> = ({ darkMode, addToast }) => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'fraud' | 'export'>('cashflow');

  // Cash flow simulator state
  const [horizonDays, setHorizonDays] = useState(30);
  const [inflowEstimate, setInflowEstimate] = useState(14500000);
  const [outflowEstimate, setOutflowEstimate] = useState(12800000);

  // Fraud Alerts state
  const [alerts, setAlerts] = useState([
    { id: 'ALRT-101', type: 'Duplicidade de CNPJ', entity: 'Natulab Matriz x Fornecedor Externo', severity: 'Crítica', time: 'Há 12 min', status: 'Ativo' },
    { id: 'ALRT-102', type: 'Alíquota de ICMS Divergente (Padrão vs ST)', entity: 'Filial SP - Logística', severity: 'Média', time: 'Há 45 min', status: 'Em Análise' },
    { id: 'ALRT-103', type: 'Lançamento fora do Horário Comercial (02:45 AM)', entity: 'Holding Pharma Participações', severity: 'Alta', time: 'Há 3 horas', status: 'Verificado' }
  ]);

  // Export state
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exportReportType, setExportReportType] = useState('Consolidado Intercompany & SOX Trail');
  const [isExporting, setIsExporting] = useState(false);

  const handleRunExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      addToast(`Relatório executivo (${exportReportType}) exportado com sucesso em formato .${exportFormat.toUpperCase()}!`, 'success');
    }, 1500);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Resolvido' } : a));
    addToast(`Alerta ${id} marcado como resolvido e auditado.`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <TrendingUp className="w-6 h-6 text-emerald-400" /> Hub Estratégico Enterprise (Caixa, Fraudes & Exportação)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Módulos avançados de previsão de fluxo de caixa, monitoramento de fraudes em tempo real e exportação certificada.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'cashflow' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Previsão de Caixa
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'fraud' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Centro de Fraudes & Alertas
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'export' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Exportação Executiva
          </button>
        </div>
      </div>

      {/* Tab 1: Cash Flow Forecasting */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Entradas Previstas ({horizonDays} Dias)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">R$ {inflowEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-emerald-400 mt-2 block">+8.4% vs ciclo anterior</span>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Saídas / Obrigações ({horizonDays} Dias)</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">R$ {outflowEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 mt-2 block">Inclui faturas de sistemas ERP</span>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <p className="text-xs text-slate-400">Saldo de Caixa Projetado</p>
              <p className={`text-2xl font-bold mt-1 ${inflowEstimate - outflowEstimate >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                R$ {(inflowEstimate - outflowEstimate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-blue-400 mt-2 block">Liquidez saudável garantida</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <Calendar className="w-4 h-4 text-emerald-400" /> Simulação Preditiva de Fluxo de Caixa (Horizonte Dinâmico)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Horizonte:</span>
                <select
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                  className={`px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value={15}>15 Dias</option>
                  <option value={30}>30 Dias</option>
                  <option value={60}>60 Dias</option>
                  <option value={90}>90 Dias</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O motor preditivo cruza automaticamente os títulos em aberto intercompany, compromissos fiscais de ICMS/PIS/COFINS e faturamento histórico para estimar a posição de caixa líquida de cada filial.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Fraud & Tax Anomaly Real-time Alert Center */}
      {activeTab === 'fraud' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Centro de Alertas de Fraude & Anomalias Fiscais
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">Monitoramento Contínuo 24/7</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                  <tr>
                    <th className="pb-3 font-bold">ID do Alerta</th>
                    <th className="pb-3 font-bold">Tipo de Ocorrência</th>
                    <th className="pb-3 font-bold">Entidade / Processo</th>
                    <th className="pb-3 font-bold">Severidade</th>
                    <th className="pb-3 font-bold">Momento</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {alerts.map((alrt) => (
                    <tr key={alrt.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono font-bold text-white">{alrt.id}</td>
                      <td className="py-3 font-medium text-slate-200">{alrt.type}</td>
                      <td className="py-3 text-slate-400">{alrt.entity}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          alrt.severity === 'Crítica' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          alrt.severity === 'Alta' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {alrt.severity}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{alrt.time}</td>
                      <td className="py-3">
                        <span className={`font-bold text-[10px] ${alrt.status === 'Resolvido' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {alrt.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {alrt.status !== 'Resolvido' ? (
                          <button
                            onClick={() => handleResolveAlert(alrt.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow"
                          >
                            Resolver
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold">✓ Auditado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Executive Export Center */}
      {activeTab === 'export' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Printer className="w-4 h-4 text-emerald-400" /> Central de Exportação de Relatórios Executivos
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Certificado Big Four</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-2xl`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Tipo de Relatório:</label>
              <select
                value={exportReportType}
                onChange={(e) => setExportReportType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="Consolidado Intercompany & SOX Trail">Relatório Consolidado Intercompany & Trilha SOX</option>
                <option value="Balanço Patrimonial & Fluxo de Caixa Preditivo">Balanço Patrimonial & Fluxo de Caixa Preditivo</option>
                <option value="Auditoria de Notas Fiscais e Anomalias Fiscais">Auditoria de Notas Fiscais & Relatório de Anomalias</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Formato de Saída:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    exportFormat === 'pdf' 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow' 
                      : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" /> PDF Executivo (Assinado)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    exportFormat === 'excel' 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow' 
                      : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel Certificado (.XLSX)
                </button>
              </div>
            </div>

            <button
              onClick={handleRunExport}
              disabled={isExporting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Gerando Relatório Certificado...' : `Exportar ${exportReportType} (.${exportFormat.toUpperCase()})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseStrategicHub;
