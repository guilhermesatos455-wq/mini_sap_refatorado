import React, { useState } from 'react';
import { ChevronDown, Check, History, X } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  darkMode: boolean;
}

export const MultiSelect = ({ label, options, selected, onChange, darkMode }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAuditItem, setActiveAuditItem] = useState<string | null>(null);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o: string) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Abrir ou fechar o seletor de opções para filtragem de dados"
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none border transition-all min-w-[180px] ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-[#8DC63F] shadow-inner'}`}
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${selected.length} selecionados`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full left-0 mt-2 w-full min-w-[260px] max-h-72 overflow-y-auto z-20 rounded-[1.5rem] border shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-2 space-y-1">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 font-bold italic">Nenhum item encontrado</div>
              ) : (
                options.map((option: string) => (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    title={`Selecionar/Deselecionar ${option}`}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${selected.includes(option) ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-500')}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all shrink-0 ${selected.includes(option) ? 'bg-[#8DC63F] border-[#8DC63F] scale-110 shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white')}`}>
                        {selected.includes(option) && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                      </div>
                      <span className="truncate">{option}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAuditItem(option);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-[#8DC63F] transition-colors shrink-0"
                      title="Visualizar histórico de alterações SOX, responsável e timestamp para este item"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeAuditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#8DC63F]" />
                <h3 className="text-sm font-black uppercase tracking-wider">Histórico SOX: {activeAuditItem}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAuditItem(null)}
                title="Fechar janela"
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between font-bold text-[#8DC63F]">
                  <span>Alteração de Status / Atributo</span>
                  <span className="font-mono text-[10px]">11/09/2026 05:32:10</span>
                </div>
                <p className="text-slate-300"><strong>Quem alterou:</strong> auditor.natu@natulab.com.br (Mat. 89201)</p>
                <p className="text-slate-300"><strong>O que foi alterado:</strong> Verificação de conformidade fiscal e validação de base CKM3 para o item "{activeAuditItem}".</p>
              </div>

              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between font-bold text-blue-400">
                  <span>Inclusão no Dicionário / Importação</span>
                  <span className="font-mono text-[10px]">11/09/2026 04:15:00</span>
                </div>
                <p className="text-slate-300"><strong>Quem alterou:</strong> sistema.automatico@natulab.com.br</p>
                <p className="text-slate-300"><strong>O que foi alterado:</strong> Registro inicial importado via arquivo SAP MB51 / CKM3.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveAuditItem(null)}
              title="Fechar o histórico de alterações"
              className="w-full py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors cursor-pointer"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
