import React, { useState, useMemo } from 'react';
import { 
  Calculator, ArrowRightLeft, DollarSign, PieChart, ShieldCheck, 
  TrendingDown, TrendingUp, AlertCircle, RefreshCw, FileText, CheckCircle2,
  Sliders, ArrowUpRight, Scale, Info, Sparkles, Building2, Download
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface TaxSimulationScenario {
  productName: string;
  sku: string;
  revenueAmount: number;
  inputCosts: number; // Materiais e serviços com crédito
  currentIcmsRate: number; // %
  currentIpiRate: number; // %
  currentPisRate: number; // % (ex: 1.65)
  currentCofinsRate: number; // % (ex: 7.6)
  isPharmaExempt: boolean; // Regime especial de medicamentos
}

export const TaxReformSimulator: React.FC<{ darkMode: boolean; addToast: (msg: string, type: 'success' | 'error') => void }> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();

  // Alíquotas de Referência da Reforma Tributária (PEC 45 / EC 132/2023)
  const [cbsRate, setCbsRate] = useState<number>(8.8); // Federal (PIS/COFINS)
  const [ibsRate, setIbsRate] = useState<number>(17.7); // Subnacional (ICMS/ISS)
  const [selectiveTaxRate, setSelectiveTaxRate] = useState<number>(0.0); // Imposto Seletivo
  const [pharmaDiscountPercent, setPharmaDiscountPercent] = useState<number>(60.0); // 60% de redução para medicamentos essenciais
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState<boolean>(true);
  const [splitRetainedRate, setSplitRetainedRate] = useState<number>(26.5); // CBS + IBS retido na liquidação bancária

  const [scenario, setScenario] = useState<TaxSimulationScenario>({
    productName: 'Paracetamol 500mg (Cx 50 Comp)',
    sku: 'MAT-101',
    revenueAmount: 1000000.00, // R$ 1.000.000 de faturamento
    inputCosts: 450000.00, // R$ 450.000 em insumos e serviços
    currentIcmsRate: 18.0,
    currentIpiRate: 0.0,
    currentPisRate: 1.65,
    currentCofinsRate: 7.60,
    isPharmaExempt: true // Medicamentos essenciais com redução
  });

  // Cálculo Sistema Atual (Cumulativo / Não-Cumulativo Híbrido)
  const currentTaxes = useMemo(() => {
    const rev = scenario.revenueAmount;
    const inputs = scenario.inputCosts;

    // Débitos
    const icmsDebit = rev * (scenario.currentIcmsRate / 100);
    const ipiDebit = rev * (scenario.currentIpiRate / 100);
    const pisDebit = rev * (scenario.currentPisRate / 100);
    const cofinsDebit = rev * (scenario.currentCofinsRate / 100);

    // Créditos Estimados sobre insumos
    const icmsCredit = inputs * (scenario.currentIcmsRate / 100) * 0.85; // Estorno parcial de créditos tributários
    const pisCredit = inputs * (scenario.currentPisRate / 100);
    const cofinsCredit = inputs * (scenario.currentCofinsRate / 100);

    const totalDebits = icmsDebit + ipiDebit + pisDebit + cofinsDebit;
    const totalCredits = icmsCredit + pisCredit + cofinsCredit;
    const netTaxPayable = Math.max(0, totalDebits - totalCredits);
    const effectiveBurden = (netTaxPayable / rev) * 100;

    return {
      icmsDebit,
      icmsCredit,
      pisDebit,
      pisCredit,
      cofinsDebit,
      cofinsCredit,
      totalDebits,
      totalCredits,
      netTaxPayable,
      effectiveBurden
    };
  }, [scenario]);

  // Cálculo Novo Sistema IVA Dual (CBS + IBS + Não-Cumulatividade Plena)
  const reformedTaxes = useMemo(() => {
    const rev = scenario.revenueAmount;
    const inputs = scenario.inputCosts;

    // Fator de redução para medicamentos (ex: 60% de redução = paga 40%)
    const reductionMultiplier = scenario.isPharmaExempt ? (100 - pharmaDiscountPercent) / 100 : 1.0;

    const effectiveCbsRate = cbsRate * reductionMultiplier;
    const effectiveIbsRate = ibsRate * reductionMultiplier;
    const effectiveTotalRate = effectiveCbsRate + effectiveIbsRate + selectiveTaxRate;

    // Débitos IVA
    const cbsDebit = rev * (effectiveCbsRate / 100);
    const ibsDebit = rev * (effectiveIbsRate / 100);
    const isDebit = rev * (selectiveTaxRate / 100);
    const totalDebits = cbsDebit + ibsDebit + isDebit;

    // Crédito Pleno e Imediato (Não-cumulatividade irrestrita sobre TODOS insumos, bens de capital e energia)
    const cbsCredit = inputs * (effectiveCbsRate / 100);
    const ibsCredit = inputs * (effectiveIbsRate / 100);
    const totalCredits = cbsCredit + ibsCredit;

    const netTaxPayable = Math.max(0, totalDebits - totalCredits);
    const effectiveBurden = (netTaxPayable / rev) * 100;

    // Retenção Split Payment (banco recolhe diretamente o imposto na liquidação do boleto/PIX)
    const splitPaymentAmount = splitPaymentEnabled ? rev * (effectiveTotalRate / 100) : 0;
    const netCashSettlement = rev - splitPaymentAmount;

    return {
      effectiveCbsRate,
      effectiveIbsRate,
      cbsDebit,
      ibsDebit,
      isDebit,
      cbsCredit,
      ibsCredit,
      totalDebits,
      totalCredits,
      netTaxPayable,
      effectiveBurden,
      splitPaymentAmount,
      netCashSettlement
    };
  }, [scenario, cbsRate, ibsRate, selectiveTaxRate, pharmaDiscountPercent, splitPaymentEnabled]);

  // Comparativo Delta
  const taxDifference = reformedTaxes.netTaxPayable - currentTaxes.netTaxPayable;
  const isTaxFavorable = taxDifference <= 0;

  const handleApplyPharmaPreset = () => {
    setScenario({
      productName: 'Dipirona Sódica Gotas 20ml',
      sku: 'MAT-102',
      revenueAmount: 2500000.00,
      inputCosts: 1100000.00,
      currentIcmsRate: 18.0,
      currentIpiRate: 0.0,
      currentPisRate: 1.65,
      currentCofinsRate: 7.60,
      isPharmaExempt: true
    });
    addAuditLog('Reforma Tributária', 'Aplicado cenário benchmark da indústria farmacêutica com redução de 60%.');
    addToast('Cenário Farmacêutico carregado com sucesso!', 'success');
  };

  const handleExportTaxReport = () => {
    const csvContent = [
      ['SIMULAÇÃO DA REFORMA TRIBUTÁRIA (EC 132/2023) - COMPARATIVO EXECUTIVO'],
      ['Produto / Linha', scenario.productName],
      ['Faturamento Bruto Simulado', `R$ ${scenario.revenueAmount.toFixed(2)}`],
      ['Insumos com Direito a Crédito', `R$ ${scenario.inputCosts.toFixed(2)}`],
      [''],
      ['SISTEMA TRIBUTÁRIO ATUAL (ICMS + PIS + COFINS + IPI)'],
      ['Débito Bruto Apurado', `R$ ${currentTaxes.totalDebits.toFixed(2)}`],
      ['Créditos Fiscais Aproveitados', `R$ ${currentTaxes.totalCredits.toFixed(2)}`],
      ['Imposto Líquido a Recolher', `R$ ${currentTaxes.netTaxPayable.toFixed(2)}`],
      ['Carga Tributária Efetiva Atual', `${currentTaxes.effectiveBurden.toFixed(2)}%`],
      [''],
      ['NOVO SISTEMA TRIBUTÁRIO IVA DUAL (CBS + IBS + IMPOSTO SELETIVO)'],
      ['Alíquota Efetiva CBS (Federal)', `${reformedTaxes.effectiveCbsRate.toFixed(2)}%`],
      ['Alíquota Efetiva IBS (Estados/Municípios)', `${reformedTaxes.effectiveIbsRate.toFixed(2)}%`],
      ['Débito Bruto IVA', `R$ ${reformedTaxes.totalDebits.toFixed(2)}`],
      ['Crédito Pleno sobre Insumos', `R$ ${reformedTaxes.totalCredits.toFixed(2)}`],
      ['Imposto Líquido a Recolher', `R$ ${reformedTaxes.netTaxPayable.toFixed(2)}`],
      ['Carga Tributária Efetiva Reforma', `${reformedTaxes.effectiveBurden.toFixed(2)}%`],
      ['Retenção Estimada Split Payment', `R$ ${reformedTaxes.splitPaymentAmount.toFixed(2)}`],
      ['Variação Financeira Líquida', `${taxDifference >= 0 ? '+' : ''}R$ ${taxDifference.toFixed(2)}`],
      ['Parecer Tributário', isTaxFavorable ? 'Ganho de Eficiência e Redução de Carga' : 'Aumento de Desembolso Fiscal']
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reforma_Tributaria_IBS_CBS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('Exportação Reforma Tributária', 'Exportado laudo de impacto tributário comparativo.');
    addToast('Relatório de impacto da Reforma Tributária baixado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3 h-3" /> Emenda Constitucional 132/2023
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              IVA Dual + Split Payment
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <Calculator className="w-6 h-6 text-blue-400" /> Simulador de Impacto da Reforma Tributária (IBS + CBS)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Comparativo de carga tributária entre o regime atual (ICMS/PIS/COFINS) e o novo modelo IVA Dual com cálculo de Split Payment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyPharmaPreset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Carregar Indústria Farma
          </button>
          <button
            onClick={handleExportTaxReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Laudo (.CSV)
          </button>
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Carga Tributária Atual</span>
          <h3 className="text-2xl font-black font-mono text-white">
            {currentTaxes.effectiveBurden.toFixed(2)}%
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            R$ {currentTaxes.netTaxPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 block pt-1">ICMS + PIS + COFINS cumulativo</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-blue-400">Carga Novo Sistema (IVA Dual)</span>
          <h3 className="text-2xl font-black font-mono text-blue-400">
            {reformedTaxes.effectiveBurden.toFixed(2)}%
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            R$ {reformedTaxes.netTaxPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 block pt-1">CBS ({reformedTaxes.effectiveCbsRate.toFixed(1)}%) + IBS ({reformedTaxes.effectiveIbsRate.toFixed(1)}%)</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Variação no Desembolso</span>
          <div className="flex items-center gap-2">
            <h3 className={`text-2xl font-black font-mono ${isTaxFavorable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTaxFavorable ? '-' : '+'} R$ {Math.abs(taxDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${isTaxFavorable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {isTaxFavorable ? '✓ Economia Fiscal no Novo Modelo' : '⚠️ Aumento Tributário'}
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-purple-400">Split Payment (Retenção)</span>
          <h3 className="text-2xl font-black font-mono text-purple-400">
            R$ {reformedTaxes.splitPaymentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Caixa Líquido: R$ {reformedTaxes.netCashSettlement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 block pt-1">Retido automaticamente na liquidação</span>
        </div>
      </div>

      {/* Simulator Control Sliders & Side-by-Side Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Controls */}
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-5 shadow-sm`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Parâmetros de Simulação
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">EC 132/23</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Faturamento Bruto (R$):</label>
              <input
                type="number"
                value={scenario.revenueAmount}
                onChange={(e) => setScenario({ ...scenario, revenueAmount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Custos c/ Insumos e Serviços (R$):</label>
              <input
                type="number"
                value={scenario.inputCosts}
                onChange={(e) => setScenario({ ...scenario, inputCosts: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500">Gera crédito financeiro irrestrito no novo IVA.</span>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">Alíquota Federal CBS:</span>
                <span className="font-mono text-blue-400 font-bold">{cbsRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="12"
                step="0.1"
                value={cbsRate}
                onChange={(e) => setCbsRate(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">Alíquota Subnacional IBS:</span>
                <span className="font-mono text-indigo-400 font-bold">{ibsRate}%</span>
              </div>
              <input
                type="range"
                min="12"
                max="22"
                step="0.1"
                value={ibsRate}
                onChange={(e) => setIbsRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-bold">Redução Farmacêutica:</span>
                <span className="font-mono text-emerald-400 font-bold">-{pharmaDiscountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={pharmaDiscountPercent}
                onChange={(e) => setPharmaDiscountPercent(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-bold block text-xs">Regime Especial Medicamentos</span>
                <span className="text-[10px] text-slate-400">Aplica desconto de 60% previsto no Art. 9º</span>
              </div>
              <input
                type="checkbox"
                checked={scenario.isPharmaExempt}
                onChange={(e) => setScenario({ ...scenario, isPharmaExempt: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Detailed Comparison Table */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-white">Demonstrativo Analítico de Apuração</h4>
              <p className="text-xs text-slate-400">Comparação detalhada de débitos, créditos e compensação financeira.</p>
            </div>
            <span className="text-xs text-blue-400 font-mono font-bold bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
              Não-Cumulatividade Plena
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                <tr>
                  <th className="pb-2">Tributo / Componente</th>
                  <th className="pb-2 text-right">Sistema Atual (R$)</th>
                  <th className="pb-2 text-right">Novo Sistema IVA (R$)</th>
                  <th className="pb-2 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2.5 font-sans text-slate-300 font-bold">ICMS vs. IBS (Estados/Municípios)</td>
                  <td className="py-2.5 text-right text-slate-200">
                    R$ {(currentTaxes.icmsDebit - currentTaxes.icmsCredit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-indigo-400 font-bold">
                    R$ {(reformedTaxes.ibsDebit - reformedTaxes.ibsCredit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">Substituição Integral</td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans text-slate-300 font-bold">PIS/COFINS vs. CBS (Federal)</td>
                  <td className="py-2.5 text-right text-slate-200">
                    R$ {((currentTaxes.pisDebit + currentTaxes.cofinsDebit) - (currentTaxes.pisCredit + currentTaxes.cofinsCredit)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-blue-400 font-bold">
                    R$ {(reformedTaxes.cbsDebit - reformedTaxes.cbsCredit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">Substituição Integral</td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans text-slate-300 font-bold">Créditos de Entrada (Insumos/Serviços)</td>
                  <td className="py-2.5 text-right text-amber-400">
                    - R$ {currentTaxes.totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    - R$ {reformedTaxes.totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    + R$ {(reformedTaxes.totalCredits - currentTaxes.totalCredits).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Crédito Amplo)
                  </td>
                </tr>

                <tr className="border-t-2 border-slate-700 bg-slate-950/40">
                  <td className="py-3 font-sans text-white font-black text-sm">Custo Tributário Líquido Final</td>
                  <td className="py-3 text-right text-white font-bold text-sm">
                    R$ {currentTaxes.netTaxPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-blue-400 font-black text-sm">
                    R$ {reformedTaxes.netTaxPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 text-right font-black text-sm ${isTaxFavorable ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isTaxFavorable ? '-' : '+'} R$ {Math.abs(taxDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40 space-y-1 text-xs">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" /> Vantagem Competitiva da Não-Cumulatividade Plena:
            </span>
            <p className="text-slate-300 leading-relaxed">
              No modelo IVA Dual, despesas com energia elétrica industrial, fretes, aquisição de maquinários e serviços terceirizados geram <strong>100% de crédito financeiro imediato</strong>, eliminando o efeito cascata e resíduos fiscais no custo unitário de produção (CPV).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReformSimulator;
