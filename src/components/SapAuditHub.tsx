import React, { useState } from 'react';
import { BookOpen, FileText, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, ArrowRight, Download } from 'lucide-react';
import { generateSoxAuditZip } from '../utils/soxZipExporter';
import { generatePdfAuditReport } from '../utils/pdfReportGenerator';
import { useAudit } from '../context/AuditContext';

interface SapAuditHubProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SapAuditHub: React.FC<SapAuditHubProps> = ({ darkMode, addToast }) => {
  const { resultado } = useAudit();
  const [activeSubTab, setActiveSubTab] = useState<'fb03' | 'we02' | 'sod'>('fb03');

  // FB03 State
  const [docNumber, setDocNumber] = useState('1900004521');
  const [fiscalYear, setFiscalYear] = useState('2026');

  // WE02 State
  const [idocs, setIdocs] = useState([
    { id: '3849021', type: 'INVOIC01', status: '51', statusText: 'Erro 51: Erro na contabilização do documento', direction: 'Entrada (EDI)', date: '2026-09-10 08:30' },
    { id: '3849022', type: 'MATMAS03', status: '53', statusText: 'Sucesso: Documento publicado com êxito', direction: 'Entrada (EDI)', date: '2026-09-10 08:32' },
    { id: '3849023', type: 'ORDERS05', status: '29', statusText: 'Erro 29: Erro no serviço ALE / Validação de Fornecedor', direction: 'Saída', date: '2026-09-10 08:35' },
  ]);

  // SoD State
  const [sodConflicts] = useState([
    { user: 'MARIO.SILVA', role: 'FIN_MANAGER', conflict: 'Criação de Fornecedor (XK01) + Lançamento de Fatura (MIRO)', risk: 'Alto (SoD Violation)' },
    { user: 'ANA.SOUZA', role: 'MM_SUPER', conflict: 'Movimentação de Estoque (MB51) + Ajuste de Inventário (MI04)', risk: 'Médio' },
    { user: 'CARLOS.LIMA', role: 'FI_CONTROLLER', conflict: 'Modificação de Razão (FBL3N) + Execução de Pagamento (F110)', risk: 'Alto (SoD Violation)' }
  ]);

  const handleReprocessIdoc = (id: string) => {
    setIdocs(prev => prev.map(item => item.id === id ? { ...item, status: '53', statusText: 'Sucesso: Reprocessado manualmente via WE02' } : item));
    addToast(`IDOC ${id} reprocessado com sucesso!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <BookOpen className="w-6 h-6 text-[#8DC63F]" /> Módulos Avançados de Auditoria SAP (FB03, WE02 & SoD)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Simulação contábil de partidas (FB03), monitoramento de IDOCs com reprocessamento (WE02) e análise de Segregação de Funções (SoD).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePdfAuditReport(resultado?.allFilteredItems || [], addToast)}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer border transition-transform hover:scale-105 ${darkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}`}
          >
            <FileText className="w-4 h-4 text-amber-500" /> Relatório Executivo (PDF)
          </button>
          <button
            onClick={() => generateSoxAuditZip(resultado?.allFilteredItems || [], addToast)}
            className="px-4 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#8DC63F]/20 transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4" /> Baixar Pacote SOX (.ZIP)
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4 border-inherit">
        <button
          onClick={() => setActiveSubTab('fb03')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'fb03' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" /> 1. Documento Contábil (FB03 / MIRO)
        </button>
        <button
          onClick={() => setActiveSubTab('we02')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'we02' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> 2. Monitor IDOCs (WE02 / WE05)
        </button>
        <button
          onClick={() => setActiveSubTab('sod')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'sod' ? 'bg-[#8DC63F] text-slate-950 shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> 3. Auditoria SoD (Segregação de Funções)
        </button>
      </div>

      {/* 1. FB03 */}
      {activeSubTab === 'fb03' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transação FB03 - Exibição de Documento Contábil</h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Visualize partidas dobradas (Débito e Crédito) geradas no Razão (FI-GL).</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Nº Doc"
                className={`px-3 py-2 rounded-xl border text-xs font-mono w-28 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
              <input
                type="text"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="Ano"
                className={`px-3 py-2 rounded-xl border text-xs font-mono w-20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
              <button
                onClick={() => addToast(`Documento contábil ${docNumber}/${fiscalYear} carregado!`, 'success')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Exibir (Enter)
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="p-3 border-b border-inherit bg-emerald-500/10 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Cabeçalho: Empresa 1000 | Moeda: BRL | Data de Lançamento: 10/09/2026</span>
              <span>Status: Contabilizado (Posted)</span>
            </div>
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className={`border-b uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <th className="p-3">Item</th>
                  <th className="p-3">Chave Lançamento</th>
                  <th className="p-3">Conta do Razão</th>
                  <th className="p-3">Nome da Conta</th>
                  <th className="p-3 text-right">Montante (Débito)</th>
                  <th className="p-3 text-right">Montante (Crédito)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                <tr className={`${darkMode ? 'hover:bg-slate-800/40 text-slate-300' : 'hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-3">001</td>
                  <td className="p-3 font-bold text-emerald-400">40 (Débito)</td>
                  <td className="p-3">31010020</td>
                  <td className="p-3">Estoque de Matéria-Prima (PMM)</td>
                  <td className="p-3 text-right font-bold text-emerald-400">R$ 45.000,00</td>
                  <td className="p-3 text-right">-</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-slate-800/40 text-slate-300' : 'hover:bg-gray-50 text-gray-800'}`}>
                  <td className="p-3">002</td>
                  <td className="p-3 font-bold text-indigo-400">50 (Crédito)</td>
                  <td className="p-3">21010010</td>
                  <td className="p-3">Conta Transitória de Fornecedores</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-bold text-indigo-400">R$ 45.000,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. WE02 */}
      {activeSubTab === 'we02' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div>
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transação WE02 / WE05 - Monitor de IDOCs (EDI)</h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Monitore mensagens de integração, analise status de erro e reprocessamento automático.</p>
          </div>

          <div className="space-y-3">
            {idocs.map((item) => (
              <div key={item.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">IDOC #{item.id}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{item.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === '53' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      Status {item.status}
                    </span>
                  </div>
                  <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.statusText}</p>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Direção: {item.direction} | Data: {item.date}</p>
                </div>
                {item.status !== '53' && (
                  <button
                    onClick={() => handleReprocessIdoc(item.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reprocessar IDOC
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SoD */}
      {activeSubTab === 'sod' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <div>
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Matriz de Segregação de Funções (SoD - Segregation of Duties)</h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Auditoria de compliance SOX para detecção de conflitos de acesso crítico no SAP.</p>
          </div>

          <div className="space-y-3">
            {sodConflicts.map((sod, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{sod.user}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400">Perfil: {sod.role}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{sod.risk}</span>
                  </div>
                  <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Conflito: {sod.conflict}</p>
                </div>
                <button
                  onClick={() => addToast(`Mitigação registrada para o usuário ${sod.user}.`, 'success')}
                  className="px-3 py-1.5 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Mitigar Risco
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default SapAuditHub;
