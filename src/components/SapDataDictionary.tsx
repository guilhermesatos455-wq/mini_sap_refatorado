import React, { useState } from 'react';
import { Database, Key, FileCode } from 'lucide-react';
import { sapService } from '../services/sapService';

interface SapDataDictionaryProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SapDataDictionary: React.FC<SapDataDictionaryProps> = ({ darkMode, addToast }) => {
  const [selectedTable, setSelectedTable] = useState<string>('MSEG');
  const currentTable = sapService.getTableDefinition(selectedTable);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <FileCode className="w-6 h-6 text-[#8DC63F]" /> Transação SE11 - Dicionário de Dados SAP (ABAP Dictionary)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Inspecione a estrutura técnica das tabelas do banco de dados, campos, chaves primárias e tipos ABAP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              addToast(`Tabela ${e.target.value} carregada no SE11.`, 'success');
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          >
            <option value="MSEG">MSEG - Documento de Material</option>
            <option value="MARA">MARA - Mestre de Materiais</option>
            <option value="EKKO">EKKO - Pedidos de Compra</option>
          </select>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
        <div className="flex items-center justify-between border-b pb-4 border-inherit">
          <div>
            <h4 className={`font-mono font-bold text-base text-emerald-400 flex items-center gap-2`}>
              <Database className="w-5 h-5" /> Tabela: {selectedTable}
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{currentTable.desc}</p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Status: Ativa no Dicionário (Transparent Table)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <th className="p-3">Chave</th>
                <th className="p-3">Campo</th>
                <th className="p-3">Tipo ABAP</th>
                <th className="p-3">Tamanho</th>
                <th className="p-3">Descrição Técnica / Domínio</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-mono">
              {currentTable.fields.map((f, idx) => (
                <tr key={idx} className={`transition-colors ${darkMode ? 'divide-slate-800 hover:bg-slate-800/40 text-slate-300' : 'divide-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-3">
                    {f.key ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1 w-max">
                        <Key className="w-3 h-3" /> PK
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-indigo-400">{f.name}</td>
                  <td className="p-3 font-bold text-emerald-400">{f.type}</td>
                  <td className="p-3">{f.length}</td>
                  <td className="p-3 font-sans text-slate-400">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SapDataDictionary;
