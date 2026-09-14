import React, { useState } from 'react';
import { Sliders, Calculator, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface WhatIfSimulatorProps {
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ darkMode, formatoMoeda }) => {
  const [exchangeRateDelta, setExchangeRateDelta] = useState<number>(10); // +10% USD
  const [freightDelta, setFreightDelta] = useState<number>(5); // +5% Frete
  const [baseStockValue, setBaseStockValue] = useState<number>(1850000); // 1.85M BRL

  const simulatedStockValue = baseStockValue * (1 + exchangeRateDelta / 100) * (1 + freightDelta / 200);
  const deltaImpact = simulatedStockValue - baseStockValue;

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Sliders className="w-4 h-4 text-emerald-500" /> Simulador What-if (Cenários PMM & Custo)
          </h4>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Simule variações de câmbio e frete para prever o impacto no Preço Médio Móvel antes do fechamento contábil.
          </p>
        </div>
        <button
          onClick={() => { setExchangeRateDelta(0); setFreightDelta(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
        >
          <RefreshCw className="w-3 h-3" /> Resetar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Variação Cambial / USD</span>
              <span className="text-emerald-400 font-mono">+{exchangeRateDelta}%</span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              value={exchangeRateDelta}
              onChange={(e) => setExchangeRateDelta(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Ajuste Tarifa de Frete & Logística</span>
              <span className="text-indigo-400 font-mono">+{freightDelta}%</span>
            </div>
            <input
              type="range"
              min="-10"
              max="30"
              value={freightDelta}
              onChange={(e) => setFreightDelta(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Results Box */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impacto Projetado no PMM</span>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {formatoMoeda.format(simulatedStockValue)}
            </p>
          </div>

          <div className="pt-4 border-t border-inherit flex items-center justify-between text-xs">
            <span className="text-slate-400">Diferencial (Delta):</span>
            <span className={`font-bold font-mono ${deltaImpact >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {deltaImpact >= 0 ? '+' : ''}{formatoMoeda.format(deltaImpact)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
