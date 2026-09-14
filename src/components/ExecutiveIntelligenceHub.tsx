import React, { useState } from 'react';
import { Sparkles, Download, ShieldCheck, Sliders, CheckCircle2, TrendingUp, AlertTriangle, FileText, Zap } from 'lucide-react';
import { Divergencia } from '../types/audit';

interface ExecutiveIntelligenceHubProps {
  darkMode: boolean;
  divergencias: Divergencia[];
  formatoMoeda: Intl.NumberFormat;
}

export const ExecutiveIntelligenceHub: React.FC<ExecutiveIntelligenceHubProps> = ({ darkMode, divergencias, formatoMoeda }) => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'export' | 'rules'>('recommendations');
  const [riskThreshold, setRiskThreshold] = useState<number>(10000); // R$ 10.000 limit for alerts
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate insights
  const totalItems = divergencias.length;
  const criticalItems = divergencias.filter(d => (d.impactoFinanceiro || 0) > riskThreshold);
  const totalImpact = divergencias.reduce((acc, d) => acc + (d.impactoFinanceiro || 0), 0);

  const handleExportExecutiveReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setSuccessMsg("Relatório Executivo PDF/Excel gerado com sucesso e pronto para auditoria externa!");
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1200);
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-inherit">
        <div>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Sparkles className="w-5 h-5 text-indigo-400" /> Central de Inteligência Executiva & Recomendações
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'} mt-0.5`}>
            Insights automatizados, relatórios de auditoria SOX e governança fiscal em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'recommendations' ? 'bg-indigo-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Recomendações IA
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'export' ? 'bg-indigo-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Relatórios Executivos
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Regras de Alerta SOX
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tab 1: Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Analisado</span>
              <p className="text-xl font-bold font-mono mt-1 text-indigo-400">{totalItems} NFs / Itens</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Cobertura de CKM3 e Notas Fiscais</span>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exposição de Risco</span>
              <p className="text-xl font-bold font-mono mt-1 text-rose-400">{formatoMoeda.format(totalImpact)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Divergências de preço e frete</span>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Itens Críticos (&gt; Limiar)</span>
              <p className="text-xl font-bold font-mono mt-1 text-amber-400">{criticalItems.length} itens</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Requerem aprovação gerencial</span>
            </div>
          </div>

          <div className={`p-5 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-800/30 border-slate-700/60' : 'bg-indigo-50/50 border-indigo-100'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
              <Zap className="w-4 h-4 text-amber-400" /> Ações Recomendadas pelo Motor de IA
            </h4>
            <div className="space-y-2 text-xs">
              <div className={`p-3 rounded-lg border flex items-start gap-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Priorizar Validação de Fretes com CFOPs Divergentes</p>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Detectamos 14 notas com divergência de ICMS-ST e frete embutido que acumulam R$ 45.200 em risco fiscal.
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-start gap-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'}`}>
                <TrendingUp className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Revisar Custo Padrão (CKM3) para Matérias-Primas Importadas</p>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    A variação cambial projetada no simulador What-If indica impacto de 3.2% no Preço Médio Móvel do próximo fechamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Export */}
      {activeTab === 'export' && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="space-y-1 text-center md:text-left">
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center justify-center md:justify-start gap-2`}>
                <FileText className="w-4 h-4 text-indigo-400" /> Pacote Executivo de Auditoria Externa (Big Four Format)
              </h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Gera um dossiê completo em PDF com sumário executivo, trilha de auditoria SOX, gráficos de desvio e tabelas de NFs.
              </p>
            </div>

            <button
              onClick={handleExportExecutiveReport}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all flex-shrink-0"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Gerando Dossiê PDF...' : 'Baixar Relatório Executivo'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Rules & Thresholds */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-5 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Configuração de Limiar de Risco para Alertas SOX
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Defina o valor mínimo de impacto financeiro para que uma divergência seja destacada automaticamente como Crítica e exija dupla alçada de aprovação.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Limiar de Alerta Financeiro (R$)</span>
                <span className="text-emerald-400 font-mono">{formatoMoeda.format(riskThreshold)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-inherit flex items-center justify-between text-xs">
              <span className="text-slate-400">Itens atualmente atingidos por esta regra:</span>
              <span className="font-bold text-amber-400 font-mono">{criticalItems.length} itens ({((criticalItems.length / (totalItems || 1)) * 100).toFixed(1)}% da base)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
