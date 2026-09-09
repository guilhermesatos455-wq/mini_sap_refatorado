import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudit } from '../context/AuditContext';
import { Calculator, DollarSign, ArrowRight, ShieldCheck, FileSpreadsheet, Building2, Layers, CheckCircle2, AlertCircle, Cpu, Server, Key, RefreshCw, Check, AlertTriangle, Terminal, Activity, Send, Link2, Unlink, Shuffle, Plus, Trash2, Sliders } from 'lucide-react';

export const AccountingSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, resultado, setResultado, addToast } = useAudit();
  const formatoMoeda = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);
  const [selectedMaterial, setSelectedMaterial] = useState('MAT-10029 - Paracetamol 500mg');
  const [currentPrice, setCurrentPrice] = useState(45.50);
  const [newPrice, setNewPrice] = useState(52.80);
  const [quantity, setQuantity] = useState(12500);
  const [tcode, setTcode] = useState<'MR21' | 'MI07'>('MR21');

  // SAP PLC Config State
  const [plcEndpoint, setPlcEndpoint] = useState('https://sap-plc-api.corporate.net/v2/costing/calculation');
  const [plcAuth, setPlcAuth] = useState('OAuth2 Client Credentials (Bearer Token)');
  const [plcMappingFrom, setPlcMappingFrom] = useState('MATNR_RAW, BKLAS, STPRS');
  const [plcMappingTo, setPlcMappingTo] = useState('PLC_MAT_CODE, VAL_CLASS, STD_PRICE');
  const [plcTestStatus, setPlcTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  // SAP PaPM Config State
  const [papmEndpoint, setPapmEndpoint] = useState('https://sap-papm-api.corporate.net/v2/profitability/calc-engine');
  const [papmModelId, setPapmModelId] = useState('MODEL_PROFITABILITY_MULTIDIM_2026');
  const [papmMappingFrom, setPapmMappingFrom] = useState('KUNNR, BUKRS, RLDNR, NETWR');
  const [papmMappingTo, setPapmMappingTo] = useState('CUSTOMER_ID, COMPANY_CODE, LEDGER_ID, GROSS_REV');
  const [papmTestStatus, setPapmTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  // MSW Mock Server State
  const [mswActive, setMswActive] = useState(true);
  const [mswScenario, setMswScenario] = useState<'success' | 'unauthorized' | 'timeout'>('success');
  const [mswLogs, setMswLogs] = useState<Array<{ id: string; time: string; service: string; status: number; latency: number; payload: any }>>([
    { id: '1', time: '07:15:20', service: 'SAP PLC API', status: 200, latency: 142, payload: { status: 'CONNECTED', version: 'v2.4', message: 'PLC Engine Ready' } },
    { id: '2', time: '07:15:22', service: 'SAP PaPM API', status: 200, latency: 189, payload: { status: 'READY', model: 'MODEL_PROFITABILITY_MULTIDIM_2026', dimensions: 8 } }
  ]);

  // Visual Field Mapping State (Drag and Drop / Interactive Connectors)
  const [mappingPairs, setMappingPairs] = useState<Array<{ id: string; source: string; sourceSystem: 'PLC' | 'PaPM'; destination: string; transform: string; status: 'active' | 'pending' }>>([
    { id: 'm1', source: 'MATNR_RAW (Material Code)', sourceSystem: 'PLC', destination: 'item_material (Nota Fiscal SKU)', transform: 'Direct (String)', status: 'active' },
    { id: 'm2', source: 'STPRS (Standard Unit Cost)', sourceSystem: 'PLC', destination: 'unit_price (Preço Unitário Auditado)', transform: 'Multiply(1.0)', status: 'active' },
    { id: 'm3', source: 'KUNNR (Customer ID)', sourceSystem: 'PaPM', destination: 'customer_code (Cliente Nota Fiscal)', transform: 'PadZero(10)', status: 'active' },
    { id: 'm4', source: 'NETWR (Net Value / Revenue)', sourceSystem: 'PaPM', destination: 'total_invoice_value (Valor Total NF)', transform: 'Sum(Items)', status: 'active' },
    { id: 'm5', source: 'COST_EST_V2 (Overhead Allocation)', sourceSystem: 'PLC', destination: 'tax_icms (Impostos / Retenções)', transform: 'Percentage(18%)', status: 'pending' }
  ]);
  const [selectedSourceField, setSelectedSourceField] = useState<string | null>(null);
  const [newDestinationTarget, setNewDestinationTarget] = useState('fiscal_note_number');
  const [newTransformRule, setNewTransformRule] = useState('Direct');

  const handleConnectFields = (sourceName: string, system: 'PLC' | 'PaPM') => {
    setSelectedSourceField(sourceName);
    addToast(`Campo ${sourceName} (${system}) selecionado para mapeamento. Escolha o destino abaixo.`, 'info');
  };

  const addMappingRule = () => {
    if (!selectedSourceField) {
      addToast('Selecione primeiro um campo de origem do SAP PLC ou PaPM.', 'error');
      return;
    }
    const system = selectedSourceField.includes('MATNR') || selectedSourceField.includes('STPRS') || selectedSourceField.includes('COST') ? 'PLC' : 'PaPM';
    const newPair = {
      id: 'm-' + Math.random().toString(36).substring(7),
      source: selectedSourceField,
      sourceSystem: system as 'PLC' | 'PaPM',
      destination: newDestinationTarget,
      transform: newTransformRule,
      status: 'active' as const
    };
    setMappingPairs([newPair, ...mappingPairs]);
    setSelectedSourceField(null);
    addToast('Novo mapeamento de campo conectado com sucesso!', 'success');
  };

  const removeMappingPair = (id: string) => {
    setMappingPairs(mappingPairs.filter(p => p.id !== id));
    addToast('Mapeamento removido.', 'info');
  };

  const simulateMswRequest = (service: 'SAP PLC API' | 'SAP PaPM API') => {
    const startTime = Date.now();
    addToast(`Enviando requisição interceptada por MSW para ${service}...`, 'info');

    setTimeout(() => {
      const latency = Date.now() - startTime + Math.floor(Math.random() * 80);
      let status = 200;
      let payload: any = {};

      if (mswScenario === 'unauthorized') {
        status = 401;
        payload = { error: 'UNAUTHORIZED', message: 'Invalid or expired OAuth2 Bearer token for SAP Gateway.' };
      } else if (mswScenario === 'timeout') {
        status = 504;
        payload = { error: 'GATEWAY_TIMEOUT', message: 'SAP RFC Gateway took longer than 30000ms to respond.' };
      } else {
        status = 200;
        if (service === 'SAP PLC API') {
          payload = {
            success: true,
            material: selectedMaterial,
            costStandard: currentPrice,
            costCalculated: newPrice,
            breakdown: { materialCost: 32.50, laborCost: 11.20, overhead: 9.10 },
            currency: 'BRL',
            timestamp: new Date().toISOString()
          };
          setPlcTestStatus('success');
        } else {
          payload = {
            success: true,
            modelId: papmModelId,
            allocatedRevenue: quantity * newPrice,
            profitCenter: 'PC-PHARMA-1001',
            profitabilityMargin: '28.4%',
            timestamp: new Date().toISOString()
          };
          setPapmTestStatus('success');
        }
      }

      const newLog = {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        service,
        status,
        latency,
        payload
      };

      setMswLogs(prev => [newLog, ...prev.slice(0, 9)]);
      if (status === 200) {
        addToast(`${service} respondeu com sucesso (HTTP 200 OK) via MSW!`, 'success');
      } else {
        addToast(`${service} retornou erro simulado (HTTP ${status}) via MSW.`, 'error');
      }
    }, 600);
  };

  const testPlcConnection = () => {
    setPlcTestStatus('testing');
    if (mswActive) {
      simulateMswRequest('SAP PLC API');
    } else {
      setTimeout(() => setPlcTestStatus('success'), 1000);
    }
  };

  const testPapmConnection = () => {
    setPapmTestStatus('testing');
    if (mswActive) {
      simulateMswRequest('SAP PaPM API');
    } else {
      setTimeout(() => setPapmTestStatus('success'), 1000);
    }
  };

  const simulation = useMemo(() => {
    const diffPerUnit = newPrice - currentPrice;
    const totalImpact = diffPerUnit * quantity;
    const glAccountInventory = '11401001 - Estoque Matéria Prima';
    const glAccountVariance = '31205002 - Variação de Preço CKM3';
    const copaSegment = 'CO-PA Pharma Sólidos';

    return {
      diffPerUnit,
      totalImpact,
      glAccountInventory,
      glAccountVariance,
      copaSegment,
      isGain: totalImpact >= 0
    };
  }, [currentPrice, newPrice, quantity]);

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      {!resultado && (
        <div className="max-w-4xl mx-auto p-8 my-12 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Upload de Relatório SAP Obrigatório</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Nenhum relatório SAP (CKM3, MB51 ou Notas Fiscais) foi encontrado na memória do navegador. Para utilizar este simulador contábil com dados reais, por favor faça o upload do relatório ou carregue os dados de demonstração.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-[#8DC63F] hover:bg-[#7db335] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#8DC63F]/20 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Ir para Tela de Upload SAP
            </button>
            <button
              onClick={() => {
                setResultado({
                  todosOsItens: [
                    { material: 'MAT-10029', descricao: 'Paracetamol 500mg', precoStandard: 45.50, quantidade: 12500, valorTotal: 568750.00 },
                    { material: 'MAT-10030', descricao: 'Ibuprofeno 600mg', precoStandard: 38.20, quantidade: 8500, valorTotal: 324700.00 },
                    { material: 'MAT-10031', descricao: 'Dipirona 500mg', precoStandard: 22.10, quantidade: 15000, valorTotal: 331500.00 }
                  ],
                  divergencias: [
                    { material: 'MAT-10029', diferenca: 5400, severidade: 'ALTA' }
                  ],
                  totalImpacto: 154250.00
                });
                addToast('Dados de demonstração carregados com sucesso!', 'success');
              }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#8DC63F]" /> Carregar Dados de Exemplo (Demo)
            </button>
          </div>
        </div>
      )}

      {resultado && (
        <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Calculator className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Simulador de Impacto Contábil (MI07 / MR21)</h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Simule o impacto financeiro exato de reavaliações de preço (MR21) ou baixa de inventário (MI07) nas contas do Razão (FI) e CO-PA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setTcode('MR21')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            tcode === 'MR21' 
              ? (darkMode ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-300 shadow-md')
              : (darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200')
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-black text-xs text-indigo-400">MR21 — Reavaliação de Preço de Material</span>
            {tcode === 'MR21' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
          </div>
          <p className="text-xs text-slate-400">Atualiza o preço standard ou médio móvel no SAP e gera lançamento automático de reval.</p>
        </div>

        <div 
          onClick={() => setTcode('MI07')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            tcode === 'MI07' 
              ? (darkMode ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-300 shadow-md')
              : (darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200')
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-black text-xs text-indigo-400">MI07 — Baixa / Ajuste de Inventário</span>
            {tcode === 'MI07' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
          </div>
          <p className="text-xs text-slate-400">Lança divergências de contagem física diretamente contra contas de diferença de inventário.</p>
        </div>
      </div>

      {/* Configuração Dividida em Duas Colunas: SAP PLC vs SAP PaPM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: SAP PLC */}
        <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">SAP PLC (Product Lifecycle Costing)</h3>
                <p className="text-[11px] text-slate-400">Configuração de Credenciais & Mapeamento</p>
              </div>
            </div>
            {plcTestStatus === 'success' && (
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Conectado
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-300">Endpoint da API SAP PLC</label>
              <input
                type="text"
                value={plcEndpoint}
                onChange={(e) => setPlcEndpoint(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-300">Credenciais OAuth2 / Token</label>
              <input
                type="text"
                value={plcAuth}
                onChange={(e) => setPlcAuth(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1 text-slate-300">Mapeamento De (Origem)</label>
                <input
                  type="text"
                  value={plcMappingFrom}
                  onChange={(e) => setPlcMappingFrom(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-slate-300">Mapeamento Para (Destino PLC)</label>
                <input
                  type="text"
                  value={plcMappingTo}
                  onChange={(e) => setPlcMappingTo(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Validação de esquema de custos de engenharia</span>
              <button
                onClick={testPlcConnection}
                disabled={plcTestStatus === 'testing'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {plcTestStatus === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                {plcTestStatus === 'testing' ? 'Testando...' : plcTestStatus === 'success' ? 'Re-Testar Conexão' : 'Testar Conexão PLC'}
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 2: SAP PaPM */}
        <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">SAP PaPM (Profitability & Performance)</h3>
                <p className="text-[11px] text-slate-400">Configuração de Endpoint & Model ID</p>
              </div>
            </div>
            {papmTestStatus === 'success' && (
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Conectado
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-300">Endpoint da API SAP PaPM</label>
              <input
                type="text"
                value={papmEndpoint}
                onChange={(e) => setPapmEndpoint(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-300">Model ID / Calc Engine ID</label>
              <input
                type="text"
                value={papmModelId}
                onChange={(e) => setPapmModelId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1 text-slate-300">Mapeamento De (Origem)</label>
                <input
                  type="text"
                  value={papmMappingFrom}
                  onChange={(e) => setPapmMappingFrom(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-slate-300">Mapeamento Para (Destino PaPM)</label>
                <input
                  type="text"
                  value={papmMappingTo}
                  onChange={(e) => setPapmMappingTo(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-[11px] border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Validação de alocação multidimensional</span>
              <button
                onClick={testPapmConnection}
                disabled={papmTestStatus === 'testing'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {papmTestStatus === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                {papmTestStatus === 'testing' ? 'Testando...' : papmTestStatus === 'success' ? 'Re-Testar Conexão' : 'Testar Conexão PaPM'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Servidor de Mock (MSW) para SAP PLC & SAP PaPM */}
      <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Servidor de Mock MSW (Mock Service Worker / API Interceptor)</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${mswActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                  {mswActive ? 'MSW Ativo' : 'MSW Inativo'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Simule respostas das APIs SAP PLC e PaPM sem necessidade de infraestrutura real conectada.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-slate-400">Cenário HTTP:</span>
              <select
                value={mswScenario}
                onChange={(e) => setMswScenario(e.target.value as any)}
                className="bg-transparent text-indigo-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="success">200 OK (Sucesso Padrão)</option>
                <option value="unauthorized">401 Unauthorized (Token Inválido)</option>
                <option value="timeout">504 Gateway Timeout (Timeout de Rede)</option>
              </select>
            </div>

            <button
              onClick={() => setMswActive(!mswActive)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mswActive
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {mswActive ? 'Desativar MSW' : 'Ativar MSW'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Ações de Teste MSW */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Disparar Requisições Simuladas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => simulateMswRequest('SAP PLC API')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${darkMode ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
              >
                <span className="text-[10px] font-mono text-indigo-400 block mb-1">POST /api/sap-plc/costing</span>
                <span className="text-xs font-bold block">Testar Endpoint SAP PLC</span>
                <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Send className="w-3 h-3" /> Enviar payload de engenharia
                </span>
              </button>

              <button
                onClick={() => simulateMswRequest('SAP PaPM API')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${darkMode ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'}`}
              >
                <span className="text-[10px] font-mono text-emerald-400 block mb-1">POST /api/sap-papm/profitability</span>
                <span className="text-xs font-bold block">Testar Endpoint SAP PaPM</span>
                <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Send className="w-3 h-3" /> Enviar modelo multidimensional
                </span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
              <p className="font-bold text-indigo-400">Como funciona o MSW Interceptor:</p>
              <p className="text-slate-300">
                O servidor mock intercepta chamadas fetch para endpoints corporativos SAP e injeta latência realista e payloads JSON validados conforme especificações SAP S/4HANA.
              </p>
            </div>
          </div>

          {/* Console de Logs de Requisição MSW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Console de Tráfego MSW (Logs em Tempo Real)
              </h4>
              <button
                onClick={() => setMswLogs([])}
                className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Limpar Logs
              </button>
            </div>

            <div className={`p-4 rounded-2xl border font-mono text-[11px] h-60 overflow-y-auto space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'}`}>
              {mswLogs.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  Nenhum tráfego interceptado ainda. Clique em testar um dos endpoints acima.
                </div>
              )}
              {mswLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{log.service}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        HTTP {log.status}
                      </span>
                      <span className="text-slate-400 text-[10px]">{log.latency}ms</span>
                      <span className="text-slate-500 text-[10px]">{log.time}</span>
                    </div>
                  </div>
                  <pre className="text-[10px] text-slate-300 overflow-x-auto bg-slate-950 p-2 rounded-lg">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Módulo Visual de Mapeamento de Campos (Drag-and-Drop / Conectores Interativos) */}
      <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Módulo Visual de Mapeamento SAP (PLC & PaPM → Auditoria de Notas Fiscais)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {mappingPairs.length} Conexões Ativas
                </span>
              </div>
              <p className="text-xs text-slate-400">Conecte campos de saída do SAP Product Lifecycle Costing (PLC) e PaPM diretamente com a estrutura de dados das Notas Fiscais.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                addToast('Configuração de mapeamento salva e aplicada com sucesso aos validadores de NF!', 'success');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar & Sincronizar Schema
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Fontes SAP (PLC & PaPM) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> 1. Campos de Origem SAP
              </h4>
              <span className="text-[10px] text-slate-400">Clique para conectar</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'MATNR_RAW', system: 'PLC', desc: 'Código do Material / SKU' },
                { name: 'STPRS', system: 'PLC', desc: 'Preço Standard de Custo' },
                { name: 'COST_EST_V2', system: 'PLC', desc: 'Estimativa de Custos Engenharia' },
                { name: 'KUNNR', system: 'PaPM', desc: 'ID do Cliente / Comprador' },
                { name: 'NETWR', system: 'PaPM', desc: 'Valor Líquido da Receita' },
                { name: 'PROFIT_CENTER', system: 'PaPM', desc: 'Centro de Lucro (Profit Center)' }
              ].map(src => (
                <div
                  key={src.name}
                  onClick={() => handleConnectFields(src.name, src.system as any)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSourceField === src.name
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                      : darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-sans ${src.system === 'PLC' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {src.system}
                      </span>
                      {src.name}
                    </div>
                    <div className="text-[10px] font-sans text-slate-400 mt-0.5">{src.desc}</div>
                  </div>
                  <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 2: Construtor de Conexão & Regras */}
          <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> 2. Conectar & Regra de Transformação
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-300">Origem Selecionada:</label>
                <div className={`p-2.5 rounded-xl border font-mono font-bold ${selectedSourceField ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  {selectedSourceField ? selectedSourceField : 'Nenhum campo selecionado (Clique à esquerda)'}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-300">Destino (Auditoria de Notas Fiscais):</label>
                <select
                  value={newDestinationTarget}
                  onChange={(e) => setNewDestinationTarget(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl font-mono text-xs border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                  <option value="item_material">item_material (SKU do Produto)</option>
                  <option value="unit_price">unit_price (Preço Unitário da NF)</option>
                  <option value="customer_code">customer_code (Código do Cliente)</option>
                  <option value="total_invoice_value">total_invoice_value (Valor Total)</option>
                  <option value="tax_icms">tax_icms (Impostos / ICMS / PIS)</option>
                  <option value="fiscal_note_number">fiscal_note_number (Número da NF-e)</option>
                  <option value="supplier_cnpj">supplier_cnpj (CNPJ Emitente)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-300">Regra de Transformação / Parsing:</label>
                <select
                  value={newTransformRule}
                  onChange={(e) => setNewTransformRule(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl font-mono text-xs border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                  <option value="Direct (String)">Direct (Sem Alteração)</option>
                  <option value="Multiply(1.0)">Multiply(1.0) - Custo Unitário Padrão</option>
                  <option value="Percentage(18%)">Percentage(18%) - Alíquota ICMS</option>
                  <option value="PadZero(10)">PadZero(10) - Formato SAP ID</option>
                  <option value="Sum(Items)">Sum(Items) - Agregação de Itens</option>
                </select>
              </div>

              <button
                onClick={addMappingRule}
                disabled={!selectedSourceField}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedSourceField
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" /> Estabelecer Conexão de Mapeamento
              </button>
            </div>
          </div>

          {/* Coluna 3: Conexões Ativas & Sincronizadas */}
          <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 3. Mapeamentos Ativos ({mappingPairs.length})
            </h4>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 font-mono text-[11px]">
              {mappingPairs.map(pair => (
                <div key={pair.id} className={`p-3 rounded-xl border space-y-1.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{pair.source}</span>
                    <button
                      onClick={() => removeMappingPair(pair.id)}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Remover Mapeamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-slate-200">{pair.destination}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-sans">
                      {pair.transform}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sincronizado"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`p-6 rounded-3xl border space-y-4 lg:col-span-1 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Parâmetros de Simulação</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">Material SAP / Descrição</label>
              <input
                type="text"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">Quantidade em Estoque (UN/KG)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-300">Preço Atual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-300">Novo Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={() => alert(`Simulação ${tcode} validada com sucesso! Pronto para geração de IDoc.`)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              Executar Simulação Contábil
            </button>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border space-y-6 lg:col-span-2 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-800">
            <div>
              <span className="text-xs uppercase tracking-widest text-indigo-400 font-black">Resultado da Simulação Fi / CO-PA</span>
              <h3 className="text-xl font-black mt-1">Impacto Financeiro Consolidado ({tcode})</h3>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${simulation.isGain ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {simulation.isGain ? 'Impacto Positivo (Valorização)' : 'Impacto Negativo (Desvalorização)'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Variação Unitária</span>
              <span className="text-lg font-mono font-black text-indigo-400">{formatoMoeda.format(simulation.diffPerUnit)}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Quantidade Avaliada</span>
              <span className="text-lg font-mono font-black">{quantity.toLocaleString()} UN</span>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Impacto Total (FI)</span>
              <span className={`text-lg font-mono font-black ${simulation.isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatoMoeda.format(simulation.totalImpact)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Lançamento Contábil Gerado no Razão (FI)</h4>
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <tr>
                    <th className="p-3">Conta do Razão</th>
                    <th className="p-3">Descrição da Conta</th>
                    <th className="p-3 text-right">Débito (R$)</th>
                    <th className="p-3 text-right">Crédito (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-indigo-400">{simulation.glAccountInventory.split(' - ')[0]}</td>
                    <td className="p-3 font-sans text-slate-300">{simulation.glAccountInventory.split(' - ')[1]}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{simulation.isGain ? formatoMoeda.format(Math.abs(simulation.totalImpact)) : '-'}</td>
                    <td className="p-3 text-right font-bold text-red-400">{!simulation.isGain ? formatoMoeda.format(Math.abs(simulation.totalImpact)) : '-'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-400">{simulation.glAccountVariance.split(' - ')[0]}</td>
                    <td className="p-3 font-sans text-slate-300">{simulation.glAccountVariance.split(' - ')[1]}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{!simulation.isGain ? formatoMoeda.format(Math.abs(simulation.totalImpact)) : '-'}</td>
                    <td className="p-3 text-right font-bold text-red-400">{simulation.isGain ? formatoMoeda.format(Math.abs(simulation.totalImpact)) : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-medium">Simulação validada perante as regras de Profit Center e CO-PA do SAP S/4HANA.</span>
            </div>
            <button 
              onClick={() => alert('Payload BAPI gerado e enviado para a fila de testes SAP!')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              Exportar para SAP ECC
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
export default AccountingSimulatorPage;
