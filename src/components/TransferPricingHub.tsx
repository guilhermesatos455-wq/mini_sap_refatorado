import React, { useState, useMemo } from 'react';
import { 
  Globe2, Scale, DollarSign, ArrowRightLeft, TrendingUp, AlertTriangle,
  CheckCircle2, FileText, Download, Building, ShieldCheck, HelpCircle,
  Sparkles, Layers
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface TransferPricingTransaction {
  id: string;
  transactionType: 'Importação' | 'Exportação';
  relatedParty: string; // Ex: NatuAssist Global Holding (Suíça / EUA / Índia)
  country: string;
  itemDescription: string;
  intercompanyPriceUsd: number; // Preço Praticado na fatura intercompany
  benchmarkPriceUsd: number; // Preço Parâmetro de Mercado (Arm's Length)
  volumeKg: number;
  exchangeRateBrl: number; // Ex: 5.45
  method: 'PIC' | 'PRL' | 'MCL'; // Preço Independente Comparável | Preço de Revenda Menos Lucro | Margem Líquida
}

export const TransferPricingHub: React.FC<{ darkMode: boolean; addToast: (msg: string, type: 'success' | 'error') => void }> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | 'PIC' | 'PRL' | 'MCL'>('ALL');
  const [exchangeRate, setExchangeRate] = useState<number>(5.45);

  const [transactions, setTransactions] = useState<TransferPricingTransaction[]>([
    {
      id: 'TP-2026-01',
      transactionType: 'Importação',
      relatedParty: 'NatuAssist Pharma International (Índia)',
      country: 'Índia',
      itemDescription: 'API Paracetamol Grau Farmacopéico USP 99.8%',
      intercompanyPriceUsd: 14.50, // Preço Praticado (pago à filial)
      benchmarkPriceUsd: 12.00, // Preço Parâmetro de mercado
      volumeKg: 50000,
      exchangeRateBrl: 5.45,
      method: 'PIC' // Preço Independente Comparável
    },
    {
      id: 'TP-2026-02',
      transactionType: 'Importação',
      relatedParty: 'NatuAssist Bio Laboratories (Suíça)',
      country: 'Suíça',
      itemDescription: 'Enzima Estabilizadora Microencapsulada',
      intercompanyPriceUsd: 85.00,
      benchmarkPriceUsd: 85.00, // Arm's Length perfeitamente aderente
      volumeKg: 5000,
      exchangeRateBrl: 5.45,
      method: 'PRL'
    },
    {
      id: 'TP-2026-03',
      transactionType: 'Exportação',
      relatedParty: 'NatuAssist Distribuidora LatAm (Colômbia)',
      country: 'Colômbia',
      itemDescription: 'Polivitamínico Efervescente Frasco 30 Comp',
      intercompanyPriceUsd: 3.20,
      benchmarkPriceUsd: 3.50,
      volumeKg: 30000,
      exchangeRateBrl: 5.45,
      method: 'MCL'
    }
  ]);

  // Cálculos de Ajuste de Preços de Transferência (Transfer Pricing Adjustment)
  const analysisResults = useMemo(() => {
    return transactions.map(tx => {
      const isImport = tx.transactionType === 'Importação';
      // Na importação: se o preço praticado > preço parâmetro, houve superfaturamento de custo dedutível -> requer adição fiscal no Lalur (IRPJ/CSLL)
      const diffUsdPerUnit = isImport 
        ? Math.max(0, tx.intercompanyPriceUsd - tx.benchmarkPriceUsd)
        : Math.max(0, tx.benchmarkPriceUsd - tx.intercompanyPriceUsd); // Na exportação: se vendeu mais barato que parâmetro

      const totalAdjustmentUsd = diffUsdPerUnit * tx.volumeKg;
      const totalAdjustmentBrl = totalAdjustmentUsd * exchangeRate;
      const taxImpactBrl = totalAdjustmentBrl * 0.34; // 34% IRPJ + CSLL

      return {
        ...tx,
        diffUsdPerUnit,
        totalAdjustmentUsd,
        totalAdjustmentBrl,
        taxImpactBrl,
        isCompliant: diffUsdPerUnit === 0
      };
    });
  }, [transactions, exchangeRate]);

  const totalAdjustmentBrlSum = useMemo(() => {
    return analysisResults.reduce((acc, curr) => acc + curr.totalAdjustmentBrl, 0);
  }, [analysisResults]);

  const totalTaxExposureBrlSum = useMemo(() => {
    return analysisResults.reduce((acc, curr) => acc + curr.taxImpactBrl, 0);
  }, [analysisResults]);

  const handleExportLocalFile = () => {
    const csvContent = [
      ['RELATÓRIO DE PREÇOS DE TRANSFERÊNCIA (TRANSFER PRICING - LEI 14.596 / OCDE)'],
      ['Empresa', 'NatuAssist Indústria Farmacêutica S.A.'],
      ['Data de Emissão', new Date().toISOString()],
      ['Taxa Cambial PTAX Referência', `R$ ${exchangeRate.toFixed(4)}`],
      ['Total Adição Fiscal no LALUR (IRPJ/CSLL)', `R$ ${totalAdjustmentBrlSum.toFixed(2)}`],
      ['Risco Tributário (34% IRPJ/CSLL)', `R$ ${totalTaxExposureBrlSum.toFixed(2)}`],
      [''],
      ['DETALHAMENTO DAS TRANSAÇÕES CONTROLADAS'],
      ['Código', 'Tipo', 'Parte Relacionada', 'País', 'Item / Insumo', 'Método', 'Preço Praticado (USD)', 'Preço Parâmetro (USD)', 'Volume (kg)', 'Ajuste Total (BRL)', 'Impacto IRPJ/CSLL (BRL)', 'Status'],
      ...analysisResults.map(r => [
        r.id,
        r.transactionType,
        r.relatedParty,
        r.country,
        r.itemDescription,
        r.method,
        `$${r.intercompanyPriceUsd.toFixed(2)}`,
        `$${r.benchmarkPriceUsd.toFixed(2)}`,
        r.volumeKg.toString(),
        `R$ ${r.totalAdjustmentBrl.toFixed(2)}`,
        `R$ ${r.taxImpactBrl.toFixed(2)}`,
        r.isCompliant ? "ADERENTE AO ARM'S LENGTH" : "AJUSTE FISCAL NECESSÁRIO"
      ])
    ].map(row => row.map(c => `"${c}"`).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transfer_Pricing_Local_File_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('Preços de Transferência', 'Exportado Local File de Transfer Pricing em conformidade com a Lei 14.596/2023.');
    addToast('Dossiê Local File (OCDE / Lei 14.596) baixado com sucesso!', 'success');
  };

  const filteredAnalysis = analysisResults.filter(tx => {
    if (selectedMethod === 'ALL') return true;
    return tx.method === selectedMethod;
  });

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> Preços de Transferência (Transfer Pricing)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              Lei 14.596/2023 / Padrão OCDE
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <Globe2 className="w-6 h-6 text-indigo-400" /> Gestão de Preços de Transferência & Arm's Length
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Cálculo automatizado de ajustes tributários em transações com partes relacionadas (PIC, PRL e MCL) para apuração do IRPJ/CSLL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLocalFile}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Baixar Local File (.CSV)
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Ajuste Fiscal no LALUR</span>
          <h3 className="text-2xl font-black font-mono text-amber-400">
            R$ {totalAdjustmentBrlSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400">
            Adição à base de cálculo do lucro real
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-rose-400">Exposição Tributária (34%)</span>
          <h3 className="text-2xl font-black font-mono text-rose-400">
            R$ {totalTaxExposureBrlSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400">
            IRPJ (25%) + CSLL (9%) devido
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-emerald-400">Aderência Arm's Length</span>
          <h3 className="text-2xl font-black font-mono text-emerald-400">
            {Math.round((analysisResults.filter(r => r.isCompliant).length / analysisResults.length) * 100)}%
          </h3>
          <span className="text-[10px] text-slate-400">
            Transações dentro da margem de mercado
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Câmbio de Referência (PTAX)</span>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black font-mono text-white">R$ {exchangeRate.toFixed(2)}</h3>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">USD/BRL</span>
          </div>
          <span className="text-[10px] text-slate-400">Atualizado para conversão fiscal</span>
        </div>
      </div>

      {/* Main Analysis Table */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-white">Demonstrativo de Operações com Partes Relacionadas</h4>
            <p className="text-xs text-slate-400">Comparação entre Preço Praticado e Preço Parâmetro de Mercado.</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Filtrar Método OCDE:</span>
            {(['ALL', 'PIC', 'PRL', 'MCL'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMethod === m ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m === 'ALL' ? 'Todos os Métodos' : m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="pb-2">Transação / Empresa</th>
                <th className="pb-2">Insumo Farmacêutico</th>
                <th className="pb-2">Método</th>
                <th className="pb-2 text-right">Praticado (USD)</th>
                <th className="pb-2 text-right">Parâmetro (USD)</th>
                <th className="pb-2 text-right">Volume</th>
                <th className="pb-2 text-right">Ajuste LALUR (R$)</th>
                <th className="pb-2 text-center">Status Arm's Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAnalysis.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-sans">
                    <strong className="text-white block text-xs">{tx.relatedParty}</strong>
                    <span className="text-[10px] text-slate-400">{tx.country} • {tx.transactionType}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-sans text-xs">
                    {tx.itemDescription}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {tx.method}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white font-bold">
                    ${tx.intercompanyPriceUsd.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-bold">
                    ${tx.benchmarkPriceUsd.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-300">
                    {tx.volumeKg.toLocaleString('pt-BR')} kg
                  </td>
                  <td className="py-3 text-right">
                    {tx.totalAdjustmentBrl > 0 ? (
                      <span className="font-bold text-amber-400">
                        + R$ {tx.totalAdjustmentBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">R$ 0,00</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {tx.isCompliant ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ Arm's Length Ok
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ⚠️ Requer Adição Fiscal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Guidance Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 space-y-1 text-xs">
          <span className="font-bold text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Diretrizes da Lei nº 14.596/2023 & BEPS Ação 13:
          </span>
          <p className="text-slate-300 leading-relaxed">
            O Brasil convergiu totalmente para o padrão internacional da OCDE, eliminando as margens fixas arbitrárias do antigo regime. As empresas devem manter anualmente o <strong>Local File</strong> e o <strong>Master File</strong> comprovando que os preços praticados refletem os termos que seriam acordados entre partes não vinculadas em transações comparáveis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransferPricingHub;
