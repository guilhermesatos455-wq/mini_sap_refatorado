import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { Calculator, Percent, DollarSign, RefreshCw, Layers, ShieldCheck, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const PriceSimulatorPage: React.FC = () => {
  const { resultado, currency } = useAudit();
  const [taxRate, setTaxRate] = useState<number>(18); // 18% ICMS/PIS/COFINS
  const [fxVariation, setFxVariation] = useState<number>(0); // -20% a +20%
  const [markup, setMarkup] = useState<number>(10); // 10%

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(val);
  };

  const baseImpact = resultado?.totalImpacto || 154250.00;

  // Calculando simulação
  const simulatedImpact = baseImpact * (1 + fxVariation / 100) * (1 + markup / 100) * (1 - taxRate / 300);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Calculator className="w-7 h-7 text-[#8DC63F]" />
            Simulador de Impacto Cambial & Fiscal (CKM3)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simule variações de câmbio, reajustes fiscais (ICMS/PIS/COFINS) e margens sobre o valuation do estoque e divergências SAP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controles de Simulação */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#8DC63F]" /> Parâmetros de Simulação
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                Variação Cambial / USD (%): <span className="text-[#8DC63F] font-black">{fxVariation > 0 ? `+${fxVariation}%` : `${fxVariation}%`}</span>
              </label>
              <input 
                type="range" 
                min="-30" 
                max="30" 
                step="1"
                value={fxVariation}
                onChange={(e) => setFxVariation(Number(e.target.value))}
                className="w-full accent-[#8DC63F]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-30% (Desvalorização)</span>
                <span>0%</span>
                <span>+30% (Valorização)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                Ajuste Carga Tributária (ICMS/PIS/COFINS %): <span className="text-[#8DC63F] font-black">{taxRate}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="35" 
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full accent-[#8DC63F]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span>
                <span>18%</span>
                <span>35%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                Markup / Reclassificação de Custo (%): <span className="text-[#8DC63F] font-black">{markup}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={markup}
                onChange={(e) => setMarkup(Number(e.target.value))}
                className="w-full accent-[#8DC63F]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setTaxRate(18); setFxVariation(0); setMarkup(10); }}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Restaurar Padrões
          </button>
        </div>

        {/* Resultados da Simulação */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8DC63F]/5 rounded-full blur-2xl"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Impacto Financeiro Base</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(baseImpact)}</p>
              <p className="text-xs text-slate-500 mt-2">Valuation atual consolidado das divergências SAP.</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-[#8DC63F]/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8DC63F]/10 rounded-full blur-2xl"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8DC63F] mb-2">Impacto Simulado Projetado</p>
              <p className="text-3xl font-black text-white">{formatCurrency(simulatedImpact)}</p>
              <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" /> Variação líquida: {formatCurrency(simulatedImpact - baseImpact)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Resumo da Análise de Sensibilidade</h3>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span>Impacto Cambial Direto ({fxVariation > 0 ? `+${fxVariation}%` : `${fxVariation}%`}):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(baseImpact * (fxVariation / 100))}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span>Ajuste Tributário Efetivo ({taxRate}%):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(baseImpact * (taxRate / 100))}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span>Efeito Margem / Markup ({markup}%):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(baseImpact * (markup / 100))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSimulatorPage;
