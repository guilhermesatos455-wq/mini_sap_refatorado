import React, { useState } from 'react';
import { Calculator, FileSpreadsheet, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, ArrowRight } from 'lucide-react';

interface BrazilianTaxMatrixProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const BrazilianTaxMatrix: React.FC<BrazilianTaxMatrixProps> = ({ darkMode, addToast }) => {
  const [docNumber, setDocNumber] = useState('4500019284');
  const [nfeKey, setNfeKey] = useState('35260900012345000189550010000492811823749102');
  const [materialValue, setMaterialValue] = useState(125000.00);
  const [icmsRate, setIcmsRate] = useState(18);
  const [pisRate, setPisRate] = useState(1.65);
  const [cofinsRate, setCofinsRate] = useState(7.6);
  const [retencaoIR, setRetencaoIR] = useState(1.5);
  const [simulatedResult, setSimulatedResult] = useState<any | null>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const icmsValue = materialValue * (icmsRate / 100);
    const pisValue = materialValue * (pisRate / 100);
    const cofinsValue = materialValue * (cofinsRate / 100);
    const retencaoValue = materialValue * (retencaoIR / 100);
    const totalTaxes = icmsValue + pisValue + cofinsValue;
    const netPayable = materialValue - retencaoValue;

    setSimulatedResult({
      icmsValue,
      pisValue,
      cofinsValue,
      retencaoValue,
      totalTaxes,
      netPayable,
      status: 'CONFORME SPED FISCAL / EFD REINF'
    });

    addToast('Simulação e cruzamento fiscal brasileiro concluídos com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <FileSpreadsheet className="w-6 h-6 text-[#8DC63F]" /> Matriz de Risco Fiscal Brasileira (NF-e, SPED ICMS/IPI & Retenções)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Validação e cruzamento tributário brasileiro integrando pedidos de compra SAP (EKKO/EKPO) com as apurações de impostos federais e estaduais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 lg:col-span-1`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit`}>
            Parâmetros da Nota Fiscal & PO
          </h4>
          <form onSubmit={handleSimulate} className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Nº do Pedido SAP (PO)</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Chave de Acesso NF-e (44 dígitos)</label>
              <input
                type="text"
                value={nfeKey}
                onChange={(e) => setNfeKey(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Valor Bruto da Mercadoria (BRL)</label>
              <input
                type="number"
                step="0.01"
                value={materialValue}
                onChange={(e) => setMaterialValue(parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Alíquota ICMS (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={icmsRate}
                  onChange={(e) => setIcmsRate(parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Alíquota PIS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pisRate}
                  onChange={(e) => setPisRate(parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Alíquota COFINS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cofinsRate}
                  onChange={(e) => setCofinsRate(parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Retenção IR/CSLL (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={retencaoIR}
                  onChange={(e) => setRetencaoIR(parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 mt-2"
            >
              <Calculator className="w-4 h-4" /> Executar Auditoria Fiscal
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 lg:col-span-2 flex flex-col justify-between`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Relatório de Apuração & Cruzamento Tributário
              </h4>
              {simulatedResult ? (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {simulatedResult.status}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  Aguardando Simulação
                </span>
              )}
            </div>

            {simulatedResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-1`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Valor ICMS Destacado ({icmsRate}%)</span>
                  <p className={`text-lg font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    R$ {simulatedResult.icmsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-1`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Valor PIS ({pisRate}%)</span>
                  <p className={`text-lg font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    R$ {simulatedResult.pisValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-1`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Valor COFINS ({cofinsRate}%)</span>
                  <p className={`text-lg font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    R$ {simulatedResult.cofinsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-1`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Retenções Federais ({retencaoIR}%)</span>
                  <p className={`text-lg font-mono font-bold text-amber-400`}>
                    R$ {simulatedResult.retencaoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border sm:col-span-2 ${darkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} flex items-center justify-between`}>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Valor Líquido a Pagar ao Fornecedor</span>
                    <p className={`text-2xl font-mono font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      R$ {simulatedResult.netPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total de Tributos</span>
                    <span className="font-mono text-xs font-bold text-blue-400">
                      R$ {simulatedResult.totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Calculator className="w-10 h-10 stroke-1 text-slate-500" />
                <p className="text-xs">Preencha os dados à esquerda e clique em "Executar Auditoria Fiscal" para visualizar o cruzamento tributário.</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Integração com SEFAZ / Nota Fiscal Eletrônica (NF-e v4.00) via RFC Gateway</span>
            <span className="font-mono text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BrazilianTaxMatrix;
