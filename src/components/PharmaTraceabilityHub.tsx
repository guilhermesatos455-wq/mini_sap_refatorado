import React, { useState } from 'react';
import { 
  QrCode, Scan, ShieldCheck, CheckCircle2, AlertTriangle, Truck,
  FileCheck, Layers, ArrowRight, RefreshCw, Download, Database, 
  ExternalLink, Sparkles, Box, Check, Copy, History
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface SerializedUnit {
  id: string;
  gtin: string; // 14 dígitos (07891234567890)
  serialNumber: string; // 13 dígitos
  batch: string;
  expDate: string; // AAMMDD
  manufacturingDate: string;
  status: 'Ativado' | 'Agregado em Caixa' | 'Expedido' | 'Dispensado no PDV' | 'Recolhido (Recall)';
  aggregationBoxId?: string;
  anvisaTransmissionStatus: 'Transmitido' | 'Pendente' | 'Erro';
  anvisaReceiptProtocol?: string;
}

export const PharmaTraceabilityHub: React.FC<{ darkMode: boolean; addToast: (msg: string, type: 'success' | 'error') => void }> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [selectedLot, setSelectedLot] = useState('LOTE-2026-X88');
  const [activeUnit, setActiveUnit] = useState<SerializedUnit | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [simulatedIumInput, setSimulatedIumInput] = useState('');

  const [serializedList, setSerializedList] = useState<SerializedUnit[]>([
    {
      id: 'IUM-001',
      gtin: '07891234567890',
      serialNumber: '9948210384712',
      batch: 'LOTE-2026-X88',
      expDate: '280831',
      manufacturingDate: '2026-08-15',
      status: 'Expedido',
      aggregationBoxId: 'CX-EMBARQUE-9021',
      anvisaTransmissionStatus: 'Transmitido',
      anvisaReceiptProtocol: 'ANV-SNCM-2026-9817420'
    },
    {
      id: 'IUM-002',
      gtin: '07891234567890',
      serialNumber: '9948210384713',
      batch: 'LOTE-2026-X88',
      expDate: '280831',
      manufacturingDate: '2026-08-15',
      status: 'Agregado em Caixa',
      aggregationBoxId: 'CX-EMBARQUE-9021',
      anvisaTransmissionStatus: 'Transmitido',
      anvisaReceiptProtocol: 'ANV-SNCM-2026-9817421'
    },
    {
      id: 'IUM-003',
      gtin: '07891234567890',
      serialNumber: '9948210384714',
      batch: 'LOTE-2026-X88',
      expDate: '280831',
      manufacturingDate: '2026-08-15',
      status: 'Ativado',
      aggregationBoxId: 'CX-EMBARQUE-9022',
      anvisaTransmissionStatus: 'Transmitido',
      anvisaReceiptProtocol: 'ANV-SNCM-2026-9817422'
    },
    {
      id: 'IUM-004',
      gtin: '07891234567891',
      serialNumber: '4451029381745',
      batch: 'LOTE-2026-DP09',
      expDate: '280930',
      manufacturingDate: '2026-09-01',
      status: 'Ativado',
      aggregationBoxId: undefined,
      anvisaTransmissionStatus: 'Pendente',
      anvisaReceiptProtocol: undefined
    },
    {
      id: 'IUM-005',
      gtin: '07891234567891',
      serialNumber: '4451029381746',
      batch: 'LOTE-2026-DP09',
      expDate: '280930',
      manufacturingDate: '2026-09-01',
      status: 'Recolhido (Recall)',
      aggregationBoxId: undefined,
      anvisaTransmissionStatus: 'Transmitido',
      anvisaReceiptProtocol: 'ANV-RECALL-2026-0041'
    }
  ]);

  const handleTransmitAnvisa = (unitId: string) => {
    setSerializedList(prev => prev.map(u => {
      if (u.id === unitId) {
        const protocol = `ANV-SNCM-${Date.now().toString().slice(-7)}`;
        addAuditLog('SNCM / ANVISA', `Evento de movimentação serial do IUM ${u.serialNumber} transmitido à ANVISA. Protocolo: ${protocol}`);
        return {
          ...u,
          anvisaTransmissionStatus: 'Transmitido',
          anvisaReceiptProtocol: protocol
        };
      }
      return u;
    }));
    addToast('Evento transmitido e protocolado no WebService da ANVISA!', 'success');
  };

  const handleSimulateScan = () => {
    if (!simulatedIumInput.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const found = serializedList.find(u => u.serialNumber.includes(simulatedIumInput.trim()) || u.id === simulatedIumInput.trim());
      if (found) {
        setActiveUnit(found);
        addToast(`Datamatrix GS1 2D decodificado com sucesso: Serial ${found.serialNumber}`, 'success');
      } else {
        addToast('Código IUM não localizado na base do SNCM.', 'error');
      }
    }, 600);
  };

  const handleExportSncmXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<envioEventoSNCM xmlns="http://sncm.anvisa.gov.br/schemas">
  <identificadorLote>${selectedLot}</identificadorLote>
  <dataHoraEvento>${new Date().toISOString()}</dataHoraEvento>
  <cnpjEmissor>12345678000190</cnpjEmissor>
  <itensSerializados>
${serializedList.map(u => `    <ium>
      <gtin>${u.gtin}</gtin>
      <serial>${u.serialNumber}</serial>
      <lote>${u.batch}</lote>
      <validade>${u.expDate}</validade>
      <status>${u.status}</status>
      <protocolo>${u.anvisaReceiptProtocol || 'PENDENTE'}</protocolo>
    </ium>`).join('\n')}
  </itensSerializados>
</envioEventoSNCM>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SNCM_Eventos_ANVISA_${selectedLot}_${Date.now()}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('Exportação SNCM', `Gerado arquivo XML de eventos seriais para o Lote ${selectedLot}.`);
    addToast('Arquivo XML homologado para o WebService ANVISA exportado!', 'success');
  };

  const filteredUnits = serializedList.filter(u => {
    if (filterStatus === 'all') return true;
    return u.status === filterStatus;
  });

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Sistema Nacional de Controle de Medicamentos
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
              Lei 11.903 / ANVISA RDC 301
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <QrCode className="w-6 h-6 text-emerald-400" /> Rastreabilidade Serial Farmacêutica (Datamatrix 2D & SNCM)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Controle de Identificador Único de Medicamento (IUM), agregação hierárquica e comunicação via WebService com a ANVISA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSncmXml}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Eventos ANVISA (.XML)
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Unidades Serializadas</span>
          <h3 className="text-2xl font-black font-mono text-white">
            {serializedList.length.toLocaleString('pt-BR')} IUMs
          </h3>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Padrão GS1 DataMatrix
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Transmitidos para a ANVISA</span>
          <h3 className="text-2xl font-black font-mono text-emerald-400">
            {serializedList.filter(u => u.anvisaTransmissionStatus === 'Transmitido').length} / {serializedList.length}
          </h3>
          <span className="text-[10px] text-slate-400">
            Protocolos digitais validados
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-slate-400">Agregação em Caixa (Shipping)</span>
          <h3 className="text-2xl font-black font-mono text-blue-400">
            {serializedList.filter(u => u.aggregationBoxId).length} unidades
          </h3>
          <span className="text-[10px] text-slate-400">
            Vinculadas a caixas de embarque
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1 shadow-sm`}>
          <span className="text-[10px] uppercase font-bold text-rose-400">Eventos de Recall ou Bloqueio</span>
          <h3 className="text-2xl font-black font-mono text-rose-400">
            {serializedList.filter(u => u.status === 'Recolhido (Recall)').length}
          </h3>
          <span className="text-[10px] text-slate-400">
            Quarentena e rastreamento reverso
          </span>
        </div>
      </div>

      {/* Simulator: Datamatrix Scanner & Decoder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Box */}
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Scan className="w-4 h-4 text-emerald-400" /> Leitor Virtual GS1 DataMatrix
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Scanner Óptico 2D</span>
          </div>

          <p className="text-xs text-slate-400">
            Digite ou selecione o Serial Number do IUM impresso no cartucho para auditar a cadeia de custódia:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex: 9948210384712"
              value={simulatedIumInput}
              onChange={(e) => setSimulatedIumInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              Decodificar
            </button>
          </div>

          {/* Decoded IUM Card */}
          {activeUnit ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2 text-xs font-mono animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold">IUM DECODIFICADO (01)(21)(17)(10)</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                  {activeUnit.status}
                </span>
              </div>
              <div><span className="text-slate-400">(01) GTIN:</span> <strong className="text-white">{activeUnit.gtin}</strong></div>
              <div><span className="text-slate-400">(21) Serial:</span> <strong className="text-emerald-300">{activeUnit.serialNumber}</strong></div>
              <div><span className="text-slate-400">(17) Validade:</span> <strong className="text-white">{activeUnit.expDate}</strong></div>
              <div><span className="text-slate-400">(10) Lote:</span> <strong className="text-white">{activeUnit.batch}</strong></div>
              <div className="pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Protocolo ANVISA:</span>{' '}
                <strong className="text-blue-400">{activeUnit.anvisaReceiptProtocol || 'Aguardando Transmissão'}</strong>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center py-8">
              <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nenhum Datamatrix selecionado no scanner.</p>
            </div>
          )}

          {/* Visual Agregação Hierárquica */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Agregação Hierárquica SNCM:</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <span className="bg-slate-800 px-2 py-1 rounded">Cartucho (IUM)</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="bg-slate-800 px-2 py-1 rounded">Caixa (SSCC)</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="bg-slate-800 px-2 py-1 rounded">Palete GS1</span>
            </div>
          </div>
        </div>

        {/* Units Table & ANVISA Protocol Status */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-white">Base Serial de Medicamentos (SNCM)</h4>
              <p className="text-xs text-slate-400">Unidades controladas por lote farmacêutico ativo.</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Filtrar:</span>
              {['all', 'Ativado', 'Agregado em Caixa', 'Expedido', 'Recolhido (Recall)'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    filterStatus === st ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="pb-2">Serial (IUM)</th>
                  <th className="pb-2">Lote / Validade</th>
                  <th className="pb-2">Status Logístico</th>
                  <th className="pb-2">ANVISA Status</th>
                  <th className="pb-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      {u.serialNumber}
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {u.batch} <span className="text-slate-500 font-sans">({u.expDate})</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'Recolhido (Recall)' ? 'bg-rose-500/20 text-rose-300' :
                        u.status === 'Expedido' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px]">
                      {u.anvisaTransmissionStatus === 'Transmitido' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {u.anvisaReceiptProtocol}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">Pendente Envio</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {u.anvisaTransmissionStatus === 'Pendente' ? (
                        <button
                          onClick={() => handleTransmitAnvisa(u.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Transmitir SNCM
                        </button>
                      ) : (
                        <button
                          onClick={() => { setActiveUnit(u); setSimulatedIumInput(u.serialNumber); }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Auditar IUM
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmaTraceabilityHub;
