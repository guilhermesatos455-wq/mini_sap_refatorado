import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BlindAuditToggleProps {
  isBlindMode: boolean;
  setIsBlindMode: (val: boolean) => void;
  darkMode: boolean;
}

export const BlindAuditToggle: React.FC<BlindAuditToggleProps> = ({ isBlindMode, setIsBlindMode, darkMode }) => {
  return (
    <button
      onClick={() => setIsBlindMode(!isBlindMode)}
      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${isBlindMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
      title="Oculta nomes de fornecedores e valores para evitar viés em auditorias"
    >
      {isBlindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      <span>{isBlindMode ? 'Modo Cego: ATIVO' : 'Modo Cego: OFF'}</span>
    </button>
  );
};
