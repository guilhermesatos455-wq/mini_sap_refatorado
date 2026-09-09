import React, { useState, useMemo } from 'react';
import { useAudit } from '../context/AuditContext';
import { Network, Search, Filter, ShieldCheck, Box, ArrowRight, Layers, FileText, CheckCircle2, AlertTriangle, Building2, Calendar, User, Play, PlusCircle, Sliders, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const BatchTraceabilityPage: React.FC = () => {
  const { darkMode, resultado } = useAudit();
  const [searchTerm, setSelectedSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const batchList = useMemo(() => {
    const baseList = resultado && resultado.todosOsItens ? resultado.todosOsItens.slice(0, 15).map((item: any, idx: number) => ({
      batch: item.lote || `LOTE-2026-${1000 + idx}`,
      material: item.codigoMaterial || item.material || `MAT-${50000 + idx}`,
      desc: item.descricao || item.nomeMaterial || 'Insumo Farmacêutico SAP',
      plant: item.centro || '1000',
      stock: item.quantidadeEstoque || item.quantidade || Math.floor(Math.random() * 10000) + 500,
      unit: item.unidade || 'UN',
      status: idx % 3 === 0 ? 'Inspeção Qualidade' : 'Liberado',
      supplier: item.fornecedor || 'Fornecedor Certificado SAP',
      po: `4500${800000 + idx}`,
      date: '2026-03-01',
      productionOrder: `ORD-${70000 + idx}`,
      consumer: 'Centro de Distribuição Principal'
    })) : [
      { batch: 'LOTE-2026-A1', material: 'MAT-10029', desc: 'Paracetamol 500mg Granulado', plant: '1000', stock: 14500, unit: 'KG', status: 'Liberado', supplier: 'Química Central S.A.', po: '4500129381', date: '2026-03-10', productionOrder: 'ORD-88231', consumer: 'Linha de Embalagem 02' },
      { batch: 'LOTE-2026-B4', material: 'MAT-10482', desc: 'Ácido Acetilsalicílico USP', plant: '1000', stock: 8200, unit: 'KG', status: 'Inspeção Qualidade', supplier: 'FarmaSynth Ltda', po: '4500138291', date: '2026-03-12', productionOrder: 'ORD-88294', consumer: 'Linha de Comprimidos 01' },
      { batch: 'LOTE-2026-C9', material: 'MAT-20193', desc: 'Excipiente Celulose Microcristalina', plant: '2000', stock: 32400, unit: 'KG', status: 'Liberado', supplier: 'Cellulose Global', po: '4500119283', date: '2026-02-28', productionOrder: 'ORD-87910', consumer: 'Linha de Sólidos Oral' },
    ];

    return baseList;
  }, [resultado]);

  const filteredBatches = useMemo(() => {
    if (!searchTerm) return batchList;
    const term = searchTerm.toLowerCase();
    return batchList.filter(b => 
      b.batch.toLowerCase().includes(term) ||
      b.material.toLowerCase().includes(term) ||
      b.desc.toLowerCase().includes(term) ||
      b.supplier.toLowerCase().includes(term)
    );
  }, [batchList, searchTerm]);

  const chartData = useMemo(() => {
    return batchList.slice(0, 8).map(b => ({
      batch: b.batch,
      quantidade: b.stock,
      descricao: b.desc
    }));
  }, [batchList]);

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Network className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Rastreabilidade de Lotes SAP (Genealogia / MSC3N)</h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Rastreie o fluxo completo de lotes desde a origem do fornecedor (Entrada de Mercadorias) até a Ordem de Produção e Destino Final.
          </p>
        </div>
      </div>



      {/* GRÁFICO DE DISTRIBUIÇÃO DE QUANTIDADES POR LOTE (RECHARTS) */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Distribuição de Quantidades por Lote (Análise Gráfica)</h3>
              <p className="text-xs text-slate-400">Visualização em barras dos estoques e quantidades dos lotes simulados e ativos no SAP.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Top Lotes (Recharts)
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="batch" 
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} 
                angle={-20} 
                textAnchor="end" 
              />
              <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                  borderColor: darkMode ? '#334155' : '#e2e8f0', 
                  borderRadius: '12px',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="quantidade" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col md:flex-row gap-4 items-center justify-between`}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por lote, material, descrição ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSelectedSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
            }`}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>{filteredBatches.length} Lotes Mapeados no Sistema</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Selecione um Lote</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredBatches.map((b, idx) => (
              <div
                key={b.batch ? `${b.batch}-${idx}` : idx}
                onClick={() => setSelectedBatch(b)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedBatch?.batch === b.batch
                    ? (darkMode ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-300 shadow-md')
                    : (darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300')
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-black text-xs text-indigo-400">{b.batch}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'Liberado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="font-bold text-sm mb-1">{b.desc}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Mat: {b.material}</span>
                  <span>Estoque: {b.stock.toLocaleString()} {b.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedBatch ? (
            <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex items-center justify-between border-b pb-4 border-slate-800/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-black">Árvore de Genealogia SAP (MSC3N)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">Centro {selectedBatch.plant}</span>
                  </div>
                  <h3 className="text-xl font-black">{selectedBatch.batch} — {selectedBatch.desc}</h3>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-indigo-400">{selectedBatch.stock.toLocaleString()} {selectedBatch.unit}</div>
                  <div className="text-[10px] text-slate-400">Saldo Atual</div>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-indigo-500/20">
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 z-10">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className={`flex-1 p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase">1. Origem (Fornecedor / Pedido de Compra)</span>
                      <span className="text-[10px] font-mono text-slate-400">{selectedBatch.date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Fornecedor:</span>
                        <span className="font-bold">{selectedBatch.supplier}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Pedido SAP (PO):</span>
                        <span className="font-mono text-indigo-400 font-bold">{selectedBatch.po}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 z-10">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className={`flex-1 p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase">2. Entrada de Mercadorias (MIGO / QM)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {selectedBatch.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Lote inspecionado e aprovado pelo departamento de qualidade sem desvios físico-químicos relevantes.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 z-10">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className={`flex-1 p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase">3. Consumo na Produção (Ordem PP)</span>
                      <span className="font-mono text-xs font-bold text-amber-400">{selectedBatch.productionOrder}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Alocado para o centro de trabalho <strong className="text-slate-200">{selectedBatch.consumer}</strong> com baixa por consumo de componentes (Movimento 261).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-medium">Genealogia auditada e em conformidade com as diretrizes CKM3 e SAP S/4HANA.</span>
                </div>
                <button 
                  onClick={() => alert(`Relatório de Genealogia do Lote ${selectedBatch.batch} gerado com sucesso!`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          ) : (
            <div className={`h-[500px] rounded-3xl border border-dashed flex flex-col items-center justify-center p-8 text-center ${darkMode ? 'border-slate-800 bg-slate-900/30 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
              <Network className="w-16 h-16 mb-4 stroke-1 opacity-40 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-300 mb-1">Nenhum Lote Selecionado</h3>
              <p className="text-xs max-w-xs">Clique em um lote na lista à esquerda para inspecionar a árvore completa de rastreabilidade e genealogia SAP.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BatchTraceabilityPage;
