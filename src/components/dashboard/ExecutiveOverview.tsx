import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell 
} from 'recharts';
import { AlertTriangle, ShieldAlert, BarChart3, TrendingUp, CheckCircle2, FileText, Layers } from 'lucide-react';

interface ExecutiveOverviewProps {
  resultado: any;
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ resultado, darkMode, formatoMoeda }) => {
  const [activeTab, setActiveTab] = useState<'categorias' | 'fornecedores' | 'centros'>('categorias');

  const { criticalErrors, errorByCategory, errorBySupplier, errorByPlant, totalCriticalImpact } = useMemo(() => {
    if (!resultado || !resultado.divergencias) {
      return {
        criticalErrors: [],
        errorByCategory: [],
        errorBySupplier: [],
        errorByPlant: [],
        totalCriticalImpact: 0
      };
    }

    // Filter critical errors (e.g. variacaoPerc > 10% or impact > 5000 or divergence between NF & CKM3 cost)
    const critical = resultado.divergencias.filter((d: any) => 
      Math.abs(d.variacaoPerc || 0) > 10 || Math.abs(d.impactoFinanceiro || 0) > 2000 || d.tipo === 'acima do custo padrão'
    );

    const totalImpact = critical.reduce((acc: number, curr: any) => acc + Math.abs(curr.impactoFinanceiro || 0), 0);

    // Group by Category / Type
    const catMap: Record<string, { name: string; count: number; impact: number }> = {};
    // Group by Supplier
    const supMap: Record<string, { name: string; count: number; impact: number }> = {};
    // Group by Plant (Centro)
    const plantMap: Record<string, { name: string; count: number; impact: number }> = {};

    critical.forEach((d: any) => {
      // Category
      const cat = d.tipo || 'Desvio CKM3 vs NF';
      if (!catMap[cat]) catMap[cat] = { name: cat, count: 0, impact: 0 };
      catMap[cat].count += 1;
      catMap[cat].impact += Math.abs(d.impactoFinanceiro || 0);

      // Supplier
      const sup = d.fornecedor || 'Fornecedor Não Identificado';
      if (!supMap[sup]) supMap[sup] = { name: sup, count: 0, impact: 0 };
      supMap[sup].count += 1;
      supMap[sup].impact += Math.abs(d.impactoFinanceiro || 0);

      // Plant
      const plant = d.empresa || d.centro || 'Centro 1000';
      if (!plantMap[plant]) plantMap[plant] = { name: `Centro ${plant}`, count: 0, impact: 0 };
      plantMap[plant].count += 1;
      plantMap[plant].impact += Math.abs(d.impactoFinanceiro || 0);
    });

    return {
      criticalErrors: critical,
      errorByCategory: Object.values(catMap).sort((a, b) => b.impact - a.impact),
      errorBySupplier: Object.values(supMap).sort((a, b) => b.impact - a.impact).slice(0, 8),
      errorByPlant: Object.values(plantMap).sort((a, b) => b.impact - a.impact),
      totalCriticalImpact: totalImpact
    };
  }, [resultado]);

  if (!resultado || !resultado.divergencias || resultado.divergencias.length === 0) {
    return (
      <div className={`p-8 rounded-3xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-amber-500 opacity-80" />
        <h3 className="text-base font-bold mb-1">Nenhum Dado Consolidado para a Visão Executiva</h3>
        <p className="text-xs">Faça o upload dos relatórios SAP CKM3 e Notas Fiscais para gerar o consolidado executivo de erros críticos.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-8 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-800/40">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Visão Geral Executiva — Erros Críticos (NF vs CKM3)</h2>
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Consolidação gerencial das divergências de valuation entre Notas Fiscais de Entrada e o relatório de custeio SAP CKM3.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2.5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Impacto Crítico Consolidado</span>
            <span className="text-base font-mono font-black text-red-500">{formatoMoeda.format(totalCriticalImpact)}</span>
          </div>
          <div className={`px-4 py-2.5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total de Erros Críticos</span>
            <span className="text-base font-mono font-black text-indigo-400">{criticalErrors.length} Itens</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs for charts */}
      <div className="flex items-center gap-2 border-b pb-4 border-slate-800/30 overflow-x-auto">
        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'categorias'
              ? 'bg-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20'
              : (darkMode ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Erros por Categoria / Tipo
        </button>
        <button
          onClick={() => setActiveTab('fornecedores')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fornecedores'
              ? 'bg-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20'
              : (darkMode ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <Layers className="w-4 h-4" />
          Top Fornecedores Afetados
        </button>
        <button
          onClick={() => setActiveTab('centros')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'centros'
              ? 'bg-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20'
              : (darkMode ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Distribuição por Centro / Planta
        </button>
      </div>

      {/* Render Chart based on active tab */}
      <div className="pt-2">
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">Impacto Financeiro de Erros Críticos por Categoria (R$)</h3>
              <span className="text-xs text-slate-400 font-mono">{errorByCategory.length} Categorias mapeadas</span>
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className="text-xs font-black uppercase text-indigo-400 mb-1">{label}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Impacto Total:</span>
                                <span className="font-bold text-red-500">{formatoMoeda.format(data.impact)}</span>
                              </div>
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Qtd. Ocorrências:</span>
                                <span className="font-bold text-slate-200">{data.count} itens</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="impact" name="Impacto Financeiro (R$)" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={45}>
                    {errorByCategory.map((_, index) => (
                      <Cell key={`cell-cat-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f87171' : '#fca5a5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'fornecedores' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">Top Fornecedores com Divergências Críticas CKM3 vs NF (R$)</h3>
              <span className="text-xs text-slate-400 font-mono">Top 8 Fornecedores</span>
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorBySupplier} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className="text-xs font-black uppercase text-emerald-400 mb-1">{label}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Impacto Financeiro:</span>
                                <span className="font-bold text-red-500">{formatoMoeda.format(data.impact)}</span>
                              </div>
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Notas Afetadas:</span>
                                <span className="font-bold text-slate-200">{data.count} notas</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="impact" name="Impacto no Fornecedor (R$)" fill="#8DC63F" radius={[6, 6, 0, 0]} barSize={45}>
                    {errorBySupplier.map((_, index) => (
                      <Cell key={`cell-sup-${index}`} fill={index === 0 ? '#8DC63F' : '#a3e635'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'centros' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">Volume de Erros Críticos por Centro / Planta SAP</h3>
              <span className="text-xs text-slate-400 font-mono">{errorByPlant.length} Plantas</span>
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorByPlant} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    angle={0} 
                    textAnchor="middle" 
                    interval={0} 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={11} 
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke={darkMode ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className="text-xs font-black uppercase text-indigo-400 mb-1">{label}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Qtd. Ocorrências:</span>
                                <span className="font-bold text-indigo-400">{data.count} divergências</span>
                              </div>
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Impacto Acumulado:</span>
                                <span className="font-bold text-red-500">{formatoMoeda.format(data.impact)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Qtd. Divergências" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#8DC63F] flex-shrink-0" />
          <span>Os dados acima são consolidados em tempo real com base na comparação cruzada de Notas Fiscais e custeio real SAP CKM3.</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Módulo Executivo C-Level</span>
      </div>
    </div>
  );
};
export default ExecutiveOverview;
