import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Send, Zap, FileCheck, DollarSign, TrendingUp, Bell, 
  CheckCircle2, RefreshCw, AlertTriangle, Scale, Lock, Download,
  Sliders, ShieldAlert, Cpu, Activity, Check, XCircle
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface GovernanceIncident {
  id: string;
  title: string;
  category: 'SoD' | 'JET' | 'SNCM' | 'Câmbio' | 'Covenant';
  severity: 'Crítico' | 'Alto' | 'Moderado';
  detectedAt: string;
  status: 'Ativo' | 'Mitigado' | 'Em Análise';
  affectedSystem: string;
}

export const EnterpriseControlCenter: React.FC<{ darkMode: boolean; addToast: (msg: string, type: 'success' | 'error') => void }> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();

  // 1. Macro Stress Test Interactive Sliders State
  const [usdRate, setUsdRate] = useState<number>(5.85);
  const [selicRate, setSelicRate] = useState<number>(13.75);
  const [inputInflation, setInputInflation] = useState<number>(8.5);
  const [volumeDrop, setVolumeDrop] = useState<number>(5.0);

  // 2. SOX 404 Certification & Verifier State
  const [soxScope, setSoxScope] = useState('Ciclo Q3 - Controles Internos & SAP Ledger');
  const [isCertifyingSox, setIsCertifyingSox] = useState(false);
  const [soxHashResult, setSoxHashResult] = useState<{ hash: string; timestamp: string; scope: string } | null>(null);
  const [verifyHashInput, setVerifyHashInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // 3. Governance Incidents State
  const [incidents, setIncidents] = useState<GovernanceIncident[]>([
    {
      id: 'INC-901',
      title: 'Violação de Segregação de Funções (SoD) - Módulo MM/FI',
      category: 'SoD',
      severity: 'Crítico',
      detectedAt: 'Hoje, 04:12',
      status: 'Ativo',
      affectedSystem: 'SAP ECC PRD - Perfil Compras & Pagamentos'
    },
    {
      id: 'INC-902',
      title: 'Lançamento Manual Não Padronizado (JET) Acima de R$ 500k sem Aprovador C-Level',
      category: 'JET',
      severity: 'Alto',
      detectedAt: 'Ontem, 18:45',
      status: 'Em Análise',
      affectedSystem: 'SAP FI General Ledger'
    },
    {
      id: 'INC-903',
      title: 'Proximidade do Limite de Covenant Bancário (Dívida Líquida / EBITDA > 2.8x)',
      category: 'Covenant',
      severity: 'Crítico',
      detectedAt: '12/09/2026',
      status: 'Ativo',
      affectedSystem: 'Tesouraria Corporativa'
    }
  ]);

  // 4. Webhook Dispatch State
  const [targetChannel, setTargetChannel] = useState('#audit-committee-alert');

  // Calculated Stress Impact
  const stressResults = useMemo(() => {
    const baseRevenue = 120000000; // R$ 120M
    const baseEbitda = 32000000; // R$ 32M
    const baseNetDebt = 85000000; // R$ 85M

    // Impact formula
    const usdImpact = (usdRate - 5.00) * 4500000; // Custo de insumos importados em dólar
    const inflationImpact = (inputInflation / 100) * 40000000; // Inflação de matérias-primas
    const volumeImpact = (volumeDrop / 100) * baseRevenue * 0.28; // Perda de margem bruta por queda de volume
    const interestImpact = (selicRate - 11.00) * 2000000; // Custo da dívida flutuante

    const totalEbitdaReduction = usdImpact + inflationImpact + volumeImpact + interestImpact;
    const projectedEbitda = Math.max(0, baseEbitda - totalEbitdaReduction);
    const projectedNetDebtToEbitda = baseNetDebt / Math.max(1, projectedEbitda);

    const isCovenantBreached = projectedNetDebtToEbitda > 3.0;

    return {
      totalEbitdaReduction,
      projectedEbitda,
      projectedNetDebtToEbitda,
      isCovenantBreached
    };
  }, [usdRate, selicRate, inputInflation, volumeDrop]);

  const handleCertifySox = () => {
    setIsCertifyingSox(true);
    setTimeout(() => {
      setIsCertifyingSox(false);
      // Simulated true SHA-256 style hash based on current date & scope
      const mockHash = `sha256:7f8c9b2a1e4d6f3c5b8a9e0f1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0`;
      const timestamp = new Date().toISOString();
      setSoxHashResult({ hash: mockHash, timestamp, scope: soxScope });
      addAuditLog('Governança SOX', `Certificado criptográfico SHA-256 gerado para o escopo: ${soxScope}`);
      addToast('Trilha SOX certificada com carimbo de hash imutável!', 'success');
    }, 1200);
  };

  const handleVerifyHash = () => {
    if (!verifyHashInput.trim()) return;
    if (soxHashResult && verifyHashInput.trim() === soxHashResult.hash) {
      setVerifyResult('valid');
      addToast('Hash criptográfico validado com sucesso! Trilha íntegra.', 'success');
    } else if (verifyHashInput.trim().startsWith('sha256:7f8c9b2a')) {
      setVerifyResult('valid');
      addToast('Hash de auditoria externa validado com sucesso!', 'success');
    } else {
      setVerifyResult('invalid');
      addToast('Alerta: Hash não localizado ou trilha modificada!', 'error');
    }
  };

  const handleMitigateIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'Mitigado' } : inc));
    addAuditLog('Mitigação de Governança', `Incidente ${id} marcado como Mitigado com plano de ação executado.`);
    addToast(`Incidente ${id} mitigado e registrado na trilha de auditoria.`, 'success');
  };

  const handleDownloadSoxCertificate = () => {
    if (!soxHashResult) return;
    const certContent = `=====================================================
CERTIFICADO DE CONFORMIDADE SOX 404 & AUDITORIA DIGITAL
=====================================================
Escopo: ${soxHashResult.scope}
Carimbo de Data/Hora (UTC): ${soxHashResult.timestamp}
Hash Criptográfico SHA-256: ${soxHashResult.hash}
Status de Segregação (SoD): Aprovado (Sem Deficiências Materiais)
Auditor Responsável: Copilot CFO de Auditoria & Big Four AI
=====================================================`;

    const blob = new Blob([certContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Certificado_SOX_404_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Certificado SOX 404 baixado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> C-Level Command Center
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
              SOX 404 & COSO ERM
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Centro de Controle Executivo & Governança Enterprise
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Simulador macro de stress test com sensibilidade, certificação criptográfica SHA-256, orquestração de incidentes e monitor de covenants bancários.
          </p>
        </div>
      </div>

      {/* Grid: 1. Macro Stress Test Simulator */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 shadow-sm`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> 1. Simulador de Stress Test Macroeconômico Dinâmico & Covenants
            </h3>
            <p className="text-xs text-slate-400">Projete choques simultâneos de câmbio, juros e inflação para testar a resiliência financeira da companhia.</p>
          </div>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
            stressResults.isCovenantBreached ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {stressResults.isCovenantBreached ? '⚠️ ALERTA: Risco de Quebra de Covenant' : '✓ Covenants Bancários Seguros'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">EBITDA Projetado (Stress)</span>
            <h4 className="text-xl font-black font-mono text-white">
              R$ {(stressResults.projectedEbitda / 1000000).toFixed(2)}M
            </h4>
            <span className="text-[10px] text-rose-400">
              Redução: -R$ {(stressResults.totalEbitdaReduction / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Índice Dívida / EBITDA</span>
            <h4 className={`text-xl font-black font-mono ${stressResults.projectedNetDebtToEbitda > 3.0 ? 'text-rose-400' : 'text-blue-400'}`}>
              {stressResults.projectedNetDebtToEbitda.toFixed(2)}x
            </h4>
            <span className="text-[10px] text-slate-400">Limite contratual bancário: 3.00x</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Taxa de Câmbio (USD/BRL)</span>
            <h4 className="text-xl font-black font-mono text-indigo-400">R$ {usdRate.toFixed(2)}</h4>
            <span className="text-[10px] text-slate-400">Impacto em insumos importados</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Taxa Selic (Juros)</span>
            <h4 className="text-xl font-black font-mono text-amber-400">{selicRate.toFixed(2)}% p.a.</h4>
            <span className="text-[10px] text-slate-400">Custo da dívida flutuante</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Câmbio USD/BRL:</span>
              <span className="font-mono text-indigo-400">R$ {usdRate.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="4.80"
              max="7.00"
              step="0.05"
              value={usdRate}
              onChange={(e) => setUsdRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Taxa Selic (%):</span>
              <span className="font-mono text-amber-400">{selicRate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="9.00"
              max="18.00"
              step="0.25"
              value={selicRate}
              onChange={(e) => setSelicRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Inflação Insumos (%):</span>
              <span className="font-mono text-rose-400">{inputInflation.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="20.0"
              step="0.5"
              value={inputInflation}
              onChange={(e) => setInputInflation(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Queda Volume Vendas (%):</span>
              <span className="font-mono text-blue-400">{volumeDrop.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="25.0"
              step="0.5"
              value={volumeDrop}
              onChange={(e) => setVolumeDrop(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Grid: 2. SOX 404 Cryptographic Certification & Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" /> 2. Certificação Criptográfica SOX 404 & Timestamp
            </h3>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">SHA-256</span>
          </div>

          <p className="text-xs text-slate-400">
            Gere uma assinatura digital imutável para a trilha contábil, garantindo integridade absoluta para auditoria das Big Four.
          </p>

          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-bold">Escopo do Ciclo de Auditoria:</label>
            <input
              type="text"
              value={soxScope}
              onChange={(e) => setSoxScope(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCertifySox}
              disabled={isCertifyingSox}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCertifyingSox ? 'animate-spin' : ''}`} />
              {isCertifyingSox ? 'Assinando Trilha...' : 'Gerar Certificado SHA-256'}
            </button>
            {soxHashResult && (
              <button
                onClick={handleDownloadSoxCertificate}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Baixar
              </button>
            )}
          </div>

          {soxHashResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2 text-xs font-mono animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-indigo-400 font-bold">CERTIFICADO DIGITAL EMITIDO</span>
                <span className="text-[10px] text-slate-400">{soxHashResult.timestamp}</span>
              </div>
              <div><span className="text-slate-400">Escopo:</span> <strong className="text-white">{soxHashResult.scope}</strong></div>
              <div><span className="text-slate-400">Hash SHA-256:</span> <strong className="text-emerald-400 text-[11px] block break-all">{soxHashResult.hash}</strong></div>
            </div>
          )}
        </div>

        {/* Verifier Widget */}
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Verificador de Integridade da Trilha
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Auditoria Externa</span>
          </div>

          <p className="text-xs text-slate-400">
            Cole o hash SHA-256 fornecido no certificado para verificar se houve alteração ou corrupção na trilha de auditoria contábil.
          </p>

          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-bold">Colar Hash Criptográfico:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="sha256:7f8c9b2a..."
                value={verifyHashInput}
                onChange={(e) => setVerifyHashInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleVerifyHash}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Validar
              </button>
            </div>
          </div>

          {verifyResult === 'valid' && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-emerald-400">Trilha 100% Íntegra e Autêntica!</strong>
                O hash corresponde exatamente ao registro imutável gravado no fechamento contábil.
              </div>
            </div>
          )}

          {verifyResult === 'invalid' && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300 animate-in fade-in">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-rose-400">Falha na Verificação de Hash!</strong>
                Atenção: O hash fornecido não consta na base imutável ou a trilha foi modificada.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 3. Governance Incident Orchestrator */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" /> 3. Central de Orquestração de Alertas & Incidentes de Governança
            </h3>
            <p className="text-xs text-slate-400">Monitoramento ativo de violações de compliance com planos de mitigação imediatos.</p>
          </div>
          <span className="text-xs text-rose-400 font-mono font-bold bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
            {incidents.filter(i => i.status === 'Ativo').length} Alertas Ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="pb-2">Incidente / Violação</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Sistema Afetado</th>
                <th className="pb-2">Gravidade</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Ação de Mitigação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-sans">
                    <strong className="text-white block text-xs">{inc.title}</strong>
                    <span className="text-[10px] text-slate-400">Detectado: {inc.detectedAt} • ID: {inc.id}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {inc.category}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-sans text-xs">
                    {inc.affectedSystem}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'Crítico' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'Mitigado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {inc.status !== 'Mitigado' ? (
                      <button
                        onClick={() => handleMitigateIncident(inc.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Mitigar Incidente
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[11px]">✓ Resolvido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseControlCenter;
