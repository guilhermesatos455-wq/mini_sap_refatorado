import React, { useState } from 'react';
import { Compass, Search, Database, LayoutGrid, FolderTree, ExternalLink, Filter, CheckCircle2, FileSpreadsheet, Download, ChevronRight } from 'lucide-react';
import { sapService } from '../services/sapService';

interface SapReferenceLibraryProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
  allData: Array<any>;
}

export const SapReferenceLibrary: React.FC<SapReferenceLibraryProps> = ({ darkMode, addToast, allData }) => {
  const [activeTab, setActiveTab] = useState<'sap1' | 'fiori' | 'se16n'>('sap1');
  const [fioriVersion, setFioriVersion] = useState<'all' | '1909' | '2022'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // SE16N State
  const [tableName, setTableName] = useState<string>('MARA');

  const sap1Tree = sapService.getSap1Tree();
  const fioriApps = sapService.getFioriApps(fioriVersion);

  const se16nTablesData: Record<string, Array<any>> = {
    MARA: [
      { MATNR: 'MAT-1001', MTART: 'FERT', MEINS: 'UN', ERSDA: '2026-01-15', MAKTX: 'Dipirona Sódica 500mg' },
      { MATNR: 'MAT-1024', MTART: 'FERT', MEINS: 'UN', ERSDA: '2026-02-10', MAKTX: 'Paracetamol 750mg' },
      { MATNR: 'MAT-2050', MTART: 'RAW', MEINS: 'KG', ERSDA: '2026-03-01', MAKTX: 'Ácido Acetilsalicílico' }
    ],
    MSEG: allData.length > 0 ? allData.slice(0, 5) : [
      { MBLNR: '4900012345', MJAHR: '2026', ZEILE: '001', BWART: '101', MATNR: 'MAT-1001', DMBTR: 45000 },
      { MBLNR: '4900012346', MJAHR: '2026', ZEILE: '001', BWART: '201', MATNR: 'MAT-1024', DMBTR: 96000 }
    ],
    EKKO: [
      { EBELN: '4500001234', BUKRS: '1000', BSART: 'NB', LIFNR: 'FORN-001', AEDAT: '2026-01-10' },
      { EBELN: '4500001235', BUKRS: '1000', BSART: 'NB', LIFNR: 'FORN-002', AEDAT: '2026-01-12' }
    ]
  };

  const currentTableRows = se16nTablesData[tableName] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Compass className="w-6 h-6 text-[#8DC63F]" /> Navegador SAP: SAP1, Fiori & SE16N
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Explore relatórios clássicos (SAP1), aplicativos modernos (Fiori Reference Library) e o visualizador universal de tabelas (SE16N).
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (activeTab !== 'sap1' && e.target.value.trim() !== '') {
                setActiveTab('sap1');
              }
            }}
            placeholder="Pesquisa global SAP1 (ex: MB51, Financeiro)..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 border-b pb-4 border-inherit">
        <button
          onClick={() => setActiveTab('sap1')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'sap1' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FolderTree className="w-4 h-4" /> 1. Atalho SAP1 (Árvore Clássica)
        </button>
        <button
          onClick={() => setActiveTab('fiori')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'fiori' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" /> 2. SAP Fiori Apps Library
        </button>
        <button
          onClick={() => setActiveTab('se16n')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'se16n' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Database className="w-4 h-4" /> 3. Visualizador SE16N (Tabelas)
        </button>
      </div>

      {/* TAB 1: SAP1 Árvore de Relatórios Clássica */}
      {activeTab === 'sap1' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <FolderTree className="w-4 h-4 text-emerald-500" /> Transação SAP1 - Easy Access (Menu de Relatórios)
              </h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Navegue pelas pastas corporativas padrão SAP para localizar transações e relatórios de auditoria em tempo real.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar árvore por código (ex: MB51) ou nome..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sap1Tree.map((branch, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                <h5 className="font-bold text-xs text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5" /> {branch.category}
                </h5>
                <div className="space-y-2">
                  {branch.items
                    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-700 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-500'} space-y-1`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{item.code}</span>
                          <button
                            onClick={() => addToast(`Executando transação SAP ${item.code}...`, 'success')}
                            className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            Abrir <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                        <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{item.desc}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SAP Fiori Apps Reference Library */}
      {activeTab === 'fiori' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <LayoutGrid className="w-4 h-4 text-indigo-500" /> SAP Fiori Apps Reference Library (S/4HANA 1909 & 2022)
              </h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Catálogo de aplicativos analíticos e dashboards interativos baseados na experiência Fiori por versão.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFioriVersion('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${fioriVersion === 'all' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                Todas (1909 & 2022)
              </button>
              <button
                onClick={() => setFioriVersion('1909')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${fioriVersion === '1909' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                S/4HANA 1909
              </button>
              <button
                onClick={() => setFioriVersion('2022')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${fioriVersion === '2022' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                S/4HANA 2022
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fioriApps.map((app) => (
              <div key={app.id} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">{app.id}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{app.area}</span>
                  </div>
                  <h5 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.title}</h5>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{app.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-inherit">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">{app.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${app.version === '2022' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      S/4HANA {app.version}
                    </span>
                  </div>
                  <button
                    onClick={() => addToast(`Carregando aplicativo Fiori ${app.id}...`, 'success')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    Iniciar App <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SE16N Visualizador de Tabelas Universal */}
      {activeTab === 'se16n' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <Database className="w-4 h-4 text-amber-500" /> Transação SE16N - Visualizador Universal de Tabelas SAP
              </h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Acesse dados puros diretamente das tabelas do banco de dados SAP para auditoria e exportação.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="MARA">MARA - Dados Gerais de Materiais</option>
                <option value="MSEG">MSEG - Segmento de Documento de Material (MB51)</option>
                <option value="EKKO">EKKO - Cabeçalho de Pedidos de Compra</option>
              </select>
              <button
                onClick={() => addToast(`Tabela ${tableName} consultada via SE16N!`, 'success')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Filter className="w-3.5 h-3.5" /> Executar (F8)
              </button>
            </div>
          </div>

          {/* Table Results */}
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="p-3 border-b border-inherit flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400">Tabela SE16N: {tableName} ({currentTableRows.length} registros)</span>
              <span className="text-[10px] text-slate-400 font-mono">Modo Leitura Direta (DB Read)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {currentTableRows.length > 0 && Object.keys(currentTableRows[0]).map((key) => (
                      <th key={key} className="p-3 font-mono">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-mono">
                  {currentTableRows.map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="p-3">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SapReferenceLibrary;
