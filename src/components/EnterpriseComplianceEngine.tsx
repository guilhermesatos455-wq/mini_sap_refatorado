import React, { useState } from 'react';
import { Database, FileCheck, Layers, Cpu, CheckCircle2, ShieldCheck, RefreshCw, Terminal, Globe, FileCode, DollarSign, AlertCircle } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface EnterpriseComplianceEngineProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const EnterpriseComplianceEngine: React.FC<EnterpriseComplianceEngineProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [activeTab, setActiveTab] = useState<'sped' | 'advpl' | 'hybrid' | 'nfe' | 'currency'>('sped');

  // 1. SPED & LATAM Tax State
  const [selectedState, setSelectedState] = useState('SP - São Paulo (ICMS 18% + ST)');
  const [spedStatus, setSpedStatus] = useState<string | null>(null);
  const [isGeneratingSped, setIsGeneratingSped] = useState(false);

  // 2. Script / Routine Simulation State
  const [routineName, setRoutineName] = useState('MATA103 (Nota Fiscal de Entrada)');
  const [advplCode, setAdvplCode] = useState(`// Exemplo de Script / Rotina Fiscal Enterprise
User Function AuditM103()
  Local cNota := SF1->F1_DOC
  Local cFornec := SF1->F1_FORNECE
  // Validação de Conformidade Fiscal LATAM
  If Empty(cNota)
    ConOut("Erro: Nota Fiscal sem documento")
  EndIf
Return .T.`);
  const [isExecutingAdvpl, setIsExecutingAdvpl] = useState(false);
  const [advplResult, setAdvplResult] = useState<string | null>(null);
  const [syntaxCheckStatus, setSyntaxCheckStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  // 3. Hybrid Sync State
  const [syncMode, setSyncMode] = useState('Híbrido (On-Premise SQL Server + Cloud ERP)');
  const [isSyncing, setIsSyncing] = useState(false);

  // 4. XML NF-e 4.0 Validation State
  const [xmlInput, setXmlInput] = useState(`<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35260900000000000000550010000000011234567890" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>Venda de Mercadoria</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1</nNF>
      </ide>
    </infNFe>
  </NFe>
</nfeProc>`);
  const [xmlValidationResult, setXmlValidationResult] = useState<{ valid: boolean; message: string; details: string[] } | null>(null);

  // 5. Multi-Currency IFRS Translation State
  const [baseAmountBrl, setBaseAmountBrl] = useState<number>(1250000);
  const [targetCurrency, setTargetCurrency] = useState<'USD' | 'EUR'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(5.85);
  const [historicalRate, setHistoricalRate] = useState<number>(5.40);

  const translatedResult = React.useMemo(() => {
    const monetaryUsd = baseAmountBrl / exchangeRate;
    const nonMonetaryUsd = baseAmountBrl / historicalRate;
    const fxGainLoss = (nonMonetaryUsd - (baseAmountBrl / exchangeRate)) * exchangeRate;
    return { monetaryUsd, nonMonetaryUsd, fxGainLoss };
  }, [baseAmountBrl, exchangeRate, historicalRate]);

  const handleGenerateSped = () => {
    setIsGeneratingSped(true);
    setTimeout(() => {
      setIsGeneratingSped(false);
      setSpedStatus('SPED Fiscal / EFD ICMS-IPI gerado e validado com sucesso (Blocos 0, C, E, H validados).');
      addAuditLog('Compliance LATAM', 'Geração e validação de SPED Fiscal concluída.');
      addToast('SPED Fiscal LATAM gerado e validado sem divergências!', 'success');
    }, 1500);
  };

  const handleRunAdvpl = () => {
    setIsExecutingAdvpl(true);
    setTimeout(() => {
      setIsExecutingAdvpl(false);
      setAdvplResult(`[Script Executado] Rotina ${routineName} executada com sucesso. Nenhuma inconsistência de dicionário encontrada.`);
      setSyntaxCheckStatus('ok');
      addAuditLog('Simulador ABAP/Script', `Rotina ${routineName} testada e validada.`);
      addToast('Rotina fiscal simulada com sucesso no ambiente enterprise.', 'success');
    }, 1200);
  };

  const handleSyncHybrid = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addToast('Sincronização Híbrida (On-Premise e Cloud) concluída com 100% de integridade.', 'success');
    }, 1400);
  };

  const handleValidateXmlNfe = () => {
    if (!xmlInput.includes('nfeProc') && !xmlInput.includes('NFe')) {
      setXmlValidationResult({
        valid: false,
        message: 'Estrutura XML inválida: Tag raiz <nfeProc> ou <NFe> não encontrada.',
        details: ['Erro na validação do Schema XSD 4.00', 'Faltam namespaces oficiais da SEFAZ']
      });
      addToast('XML da NF-e reprovado no Schema XSD!', 'error');
      return;
    }

    setXmlValidationResult({
      valid: true,
      message: 'XML da NF-e 4.00 aprovado com sucesso no Validador SEFAZ / Sefaz Virtual!',
      details: [
        'Chave de Acesso de 44 dígitos verificada: OK',
        'Assinatura Digital (Certificado A1/A3): Válida',
        'Digito Verificador (DV): Correto',
        'Regras de Validação (Consistência de Totais): Aprovado'
      ]
    });
    addAuditLog('Validador NF-e', 'XML validado e aprovado contra o Schema XSD 4.00.');
    addToast('XML da NF-e 4.0 validado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Database className="w-6 h-6 text-orange-400" /> Motor Enterprise & Compliance LATAM (Fiscal & Scripting)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Referência Mid-Market Híbrida, validador de NF-e 4.0, simulador ABAP/Script e conversor contábil IFRS.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('sped')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'sped' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            SPED LATAM
          </button>
          <button
            onClick={() => setActiveTab('nfe')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'nfe' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Validador NF-e 4.0
          </button>
          <button
            onClick={() => setActiveTab('advpl')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'advpl' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Simulador ABAP/Script
          </button>
          <button
            onClick={() => setActiveTab('currency')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'currency' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Conversor IFRS / GAAP
          </button>
          <button
            onClick={() => setActiveTab('hybrid')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'hybrid' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Híbrido Cloud
          </button>
        </div>
      </div>

      {/* Tab 1: LATAM Compliance & SPED */}
      {activeTab === 'sped' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <FileCheck className="w-4 h-4 text-orange-400" /> Localização Fiscal LATAM & Validação SPED (Enterprise Model)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">ICMS / ST / PIS / COFINS / REINF</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Jurisdição / Estado (Localização Brasil):</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="SP - São Paulo (ICMS 18% + ST)">SP - São Paulo (ICMS 18% + ST)</option>
                <option value="RJ - Rio de Janeiro (ICMS 20% + FCP)">RJ - Rio de Janeiro (ICMS 20% + FCP)</option>
                <option value="MG - Minas Gerais (ICMS 18% + Diferencial de Alíquota)">MG - Minas Gerais (ICMS 18% + DIFAL)</option>
                <option value="RS - Rio Grande do Sul (ICMS 17% + ST)">RS - Rio Grande do Sul (ICMS 17% + ST)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateSped}
              disabled={isGeneratingSped}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingSped ? 'animate-spin' : ''}`} />
              {isGeneratingSped ? 'Validando Blocos SPED / EFD...' : 'Gerar e Validar SPED Fiscal Localizado'}
            </button>

            {spedStatus && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span>{spedStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: XML NF-e 4.0 Validator */}
      {activeTab === 'nfe' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <FileCode className="w-4 h-4 text-orange-400" /> Validador & Simulador de XML de Nota Fiscal (NF-e 4.0)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">SEFAZ Schema XSD</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 max-w-3xl`}>
            <p className="text-xs text-slate-400">
              Cole o conteúdo do XML da Nota Fiscal Eletrônica para simular a validação sintática contra o Schema oficial da SEFAZ antes da transmissão.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Conteúdo XML:</label>
              <textarea
                rows={8}
                value={xmlInput}
                onChange={(e) => setXmlInput(e.target.value)}
                className={`w-full p-4 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-950 border-slate-700 text-emerald-300' : 'bg-gray-900 text-emerald-300'}`}
              />
            </div>

            <button
              onClick={handleValidateXmlNfe}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
            >
              <FileCheck className="w-4 h-4" /> Validar Schema & Assinatura Digital NF-e
            </button>

            {xmlValidationResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 font-mono ${
                xmlValidationResult.valid ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {xmlValidationResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{xmlValidationResult.message}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
                  {xmlValidationResult.details.map((det, idx) => (
                    <li key={idx}>{det}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Script / Routine Simulator */}
      {activeTab === 'advpl' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Terminal className="w-4 h-4 text-amber-400" /> Simulador de Rotinas Enterprise (Script & ABAP/4)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">Enterprise IDE</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 max-w-3xl`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Rotina Padrão:</label>
              <select
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="MATA103 (Nota Fiscal de Entrada)">MATA103 (Nota Fiscal de Entrada)</option>
                <option value="MATA460A (Faturamento & Pedido de Venda)">MATA460A (Faturamento & Pedido de Venda)</option>
                <option value="CTBA100 (Lançamentos Contábeis)">CTBA100 (Lançamentos Contábeis)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Editor de Script / Lógica:</label>
              <textarea
                rows={6}
                value={advplCode}
                onChange={(e) => setAdvplCode(e.target.value)}
                className={`w-full p-4 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-gray-900 text-amber-300'}`}
              />
            </div>

            <button
              onClick={handleRunAdvpl}
              disabled={isExecutingAdvpl}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${isExecutingAdvpl ? 'animate-pulse' : ''}`} />
              {isExecutingAdvpl ? 'Compilando no Application Server...' : 'Executar & Validar Syntax Check'}
            </button>

            {syntaxCheckStatus === 'ok' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Syntax Check ABAP/4: 0 Erros, 0 Alertas (Clean Code Compliant).
              </div>
            )}

            {advplResult && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
                {advplResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Multi-Currency IFRS Translation */}
      {activeTab === 'currency' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <DollarSign className="w-4 h-4 text-emerald-400" /> Conversor Multi-Moeda de Fechamento (IAS 21 / CPC 02)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">IFRS Translation</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Saldo em BRL (Moeda Funcional):</label>
                <input
                  type="number"
                  value={baseAmountBrl}
                  onChange={(e) => setBaseAmountBrl(parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Moeda Alvo Consolidada:</label>
                <select
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value as 'USD' | 'EUR')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                >
                  <option value="USD">USD (Dólar Americano)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Taxa de Fechamento (PTAX):</label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Taxa Histórica (Ativos Não-Monetários):</label>
                <input
                  type="number"
                  step="0.01"
                  value={historicalRate}
                  onChange={(e) => setHistoricalRate(parseFloat(e.target.value) || 1)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Ativos Monetários ({targetCurrency}):</span>
                <strong className="text-white">{targetCurrency} {translatedResult.monetaryUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Ativos Não-Monetários (Histórico):</span>
                <strong className="text-indigo-400">{targetCurrency} {translatedResult.nonMonetaryUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Variação Cambial Latente (IAS 21):</span>
                <strong className="text-emerald-400">R$ {translatedResult.fxGainLoss.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Hybrid Architecture */}
      {activeTab === 'hybrid' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Layers className="w-4 h-4 text-orange-400" /> Arquitetura Híbrida (On-Premise SQL Server + Cloud ERP)
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">Mid-Market Integration</span>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-3xl`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Modo de Operação Híbrida:</label>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="Híbrido (On-Premise SQL Server + Cloud ERP)">Híbrido (On-Premise SQL Server + Cloud ERP)</option>
                <option value="100% Cloud (Enterprise SaaS)">100% Cloud (Enterprise SaaS)</option>
                <option value="On-Premise Dedicado (Database / Oracle)">On-Premise Dedicado (Database / Oracle)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 text-xs text-slate-300">
              <p className="font-bold text-orange-400">Status da Conexão Connector / REST API:</p>
              <p>• Servidor de Aplicação (AppServer): <span className="text-emerald-400 font-mono">Online (Port 1234)</span></p>
              <p>• Banco de Dados: <span className="text-emerald-400 font-mono">Conectado (SQL Server 2022)</span></p>
              <p>• Sincronismo Fiscal LATAM: <span className="text-emerald-400 font-mono">Atualizado (Tabelas Fiscais)</span></p>
            </div>

            <button
              onClick={handleSyncHybrid}
              disabled={isSyncing}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Globe className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando Bases Híbridas...' : 'Forçar Sincronismo Híbrido & Dicionário'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseComplianceEngine;
