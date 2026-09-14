import React, { useState, useMemo } from 'react';
import { Sliders, FileSpreadsheet, Download, Bookmark, RefreshCw, Filter, CheckCircle2, Layers } from 'lucide-react';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface SapReportBuilderProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
  allData: Array<any>;
}

interface SapVariant {
  id: string;
  name: string;
  plant: string;
  cfop: string;
  minImpact: number;
}

export const SapReportBuilder: React.FC<SapReportBuilderProps> = ({ darkMode, addToast, allData }) => {
  // SAP Selection Screen state
  const [plant, setPlant] = useState<string>('ALL');
  const [cfopFilter, setCfopFilter] = useState<string>('ALL');
  const [minImpact, setMinImpact] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  // ALV Layout Variants state
  const [variants, setVariants] = useState<SapVariant[]>([
    { id: 'v1', name: '/SOX_AUDIT - Visão Geral Financeira', plant: 'ALL', cfop: 'ALL', minImpact: 1000 },
    { id: 'v2', name: '/LOG_BA - Logística Filial Bahia', plant: '1200', cfop: '5102', minImpact: 0 }
  ]);
  const [variantName, setVariantName] = useState<string>('');
  const [executed, setExecuted] = useState<boolean>(false);

  const filteredReportData = useMemo(() => {
    if (!allData || allData.length === 0) {
      // Mock data if no files uploaded yet
      return [
        { transacao: 'MB51', material: 'MAT-1001', desc: 'Dipirona Sódica 500mg', centro: '1000', cfop: '5102', qtd: 5000, valor: 45000, status: 'CONFORME' },
        { transacao: 'CKM3', material: 'MAT-1024', desc: 'Paracetamol 750mg', centro: '1200', cfop: '6102', qtd: 12000, valor: 96000, status: 'DIVERGENTE' },
        { transacao: 'MB51', material: 'MAT-2050', desc: 'Ácido Acetilsalicílico', centro: '1000', cfop: '5102', qtd: 8000, valor: 32000, status: 'CONFORME' },
        { transacao: 'CKM3', material: 'MAT-3091', desc: 'Ibuprofeno 600mg', centro: '1100', cfop: '6403', qtd: 3500, valor: 28000, status: 'DIVERGENTE' }
      ];
    }
    return allData.filter((item: any) => {
      if (plant !== 'ALL' && item.centro && item.centro !== plant) return false;
      if (cfopFilter !== 'ALL' && item.cfop && item.cfop !== cfopFilter) return false;
      if (minImpact > 0 && (item.valor || 0) < minImpact) return false;
      return true;
    });
  }, [allData, plant, cfopFilter, minImpact]);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    setExecuted(true);
    addToast(`Relatório SAP gerado com sucesso! ${filteredReportData.length} registros encontrados.`, 'success');
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantName) {
      addToast('Informe o nome da variante (ex: /MEU_LAYOUT).', 'error');
      return;
    }
    const newVariant: SapVariant = {
      id: `var-${Date.now()}`,
      name: variantName,
      plant,
      cfop: cfopFilter,
      minImpact
    };
    setVariants([...variants, newVariant]);
    setVariantName('');
    addToast('Variante de layout SAP salva com sucesso!', 'success');
  };

  const handleSelectVariant = (v: SapVariant) => {
    setPlant(v.plant);
    setCfopFilter(v.cfop);
    setMinImpact(v.minImpact);
    addToast(`Variante '${v.name}' carregada com sucesso!`, 'success');
  };

  const handleExportExcel = () => {
    exportToExcel(filteredReportData, 'sap_alv_report.xlsx');
    addToast('Relatório ALV exportado para Excel com sucesso!', 'success');
  };

  const handleExportPdf = () => {
    const headers = ['Transação', 'Material', 'Descrição', 'Centro', 'CFOP', 'Qtd', 'Valor (BRL)', 'Status'];
    const rows = filteredReportData.map((d: any) => [
      d.transacao || 'MB51',
      d.material || d.codigoMaterial || 'N/A',
      d.desc || d.descricao || 'Material SAP',
      d.centro || '1000',
      d.cfop || '5102',
      d.qtd || d.quantidade || 100,
      d.valor || d.total || 15000,
      d.status || 'CONFORME'
    ]);
    exportToPdf('Relatório SAP Customizado (ALV Grid)', headers, rows, 'sap_report.pdf');
    addToast('Relatório ALV exportado para PDF com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Sliders className="w-6 h-6 text-[#8DC63F]" /> Gerador de Relatórios SAP (SE38 / ALV Grid)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Crie telas de seleção dinâmicas, salve variantes de layout e visualize resultados em grade ALV interativa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* SAP Selection Screen (Parâmetros) */}
      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <h4 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
            <Filter className="w-4 h-4 text-emerald-500" /> Tela de Seleção de Parâmetros (Selection Screen)
          </h4>
          <span className="text-[10px] font-mono text-slate-400">Transação: /N/SAP/ALV_REPORT_BUILDER</span>
        </div>

        {/* Variants Quick Access */}
        <div className="space-y-2">
          <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-gray-600'} flex items-center gap-1.5`}>
            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Variantes de Layout Salvas:
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => handleSelectVariant(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Selection */}
        <form onSubmit={handleExecute} className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Centro / Planta SAP</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
            >
              <option value="ALL">Todos os Centros (ALL)</option>
              <option value="1000">1000 - Matriz São Paulo</option>
              <option value="1100">1100 - Filial Campinas</option>
              <option value="1200">1200 - Filial Bahia</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>CFOP de Entrada/Saída</label>
            <select
              value={cfopFilter}
              onChange={(e) => setCfopFilter(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
            >
              <option value="ALL">Todos os CFOPs</option>
              <option value="5102">5102 - Venda de mercadoria</option>
              <option value="6102">6102 - Venda interestadual</option>
              <option value="6403">6403 - Substituição tributária</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Impacto Financeiro Mínimo (R$)</label>
            <input
              type="number"
              value={minImpact}
              onChange={(e) => setMinImpact(Number(e.target.value))}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Executar Relatório (F8)
            </button>
          </div>
        </form>

        {/* Save current variant form */}
        <form onSubmit={handleSaveVariant} className="pt-2 border-t border-inherit flex items-center gap-2">
          <input
            type="text"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="Nome da nova variante (ex: /MEU_LAYOUT_SOX)..."
            className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
          >
            Salvar Variante
          </button>
        </form>
      </div>

      {/* SAP ALV Grid Result Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <h4 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
            <Layers className="w-4 h-4 text-emerald-500" /> Grade ALV (Resultado: {filteredReportData.length} linhas)
          </h4>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Status: OK • Layout Padrão SAP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <th className="p-4">Transação</th>
                <th className="p-4">Material</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Centro</th>
                <th className="p-4">CFOP</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Valor (BRL)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-mono">
              {filteredReportData.map((item: any, idx: number) => (
                <tr key={idx} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-4 font-bold text-indigo-400">{item.transacao || 'MB51'}</td>
                  <td className="p-4 font-bold text-emerald-400">{item.material || item.codigoMaterial || 'MAT-1001'}</td>
                  <td className="p-4 font-sans">{item.desc || item.descricao || 'Material SAP'}</td>
                  <td className="p-4">{item.centro || '1000'}</td>
                  <td className="p-4">{item.cfop || '5102'}</td>
                  <td className="p-4">{(item.qtd || item.quantidade || 100).toLocaleString()}</td>
                  <td className="p-4 font-bold text-emerald-400">R$ {(item.valor || item.total || 15000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border flex items-center gap-1 w-max ${
                      item.status === 'CONFORME' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" /> {item.status || 'CONFORME'}
                    </span>
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
