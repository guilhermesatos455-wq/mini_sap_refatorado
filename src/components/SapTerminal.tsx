import React, { useState } from 'react';
import { Terminal, Play, CornerDownLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface SapTerminalProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface TerminalLog {
  command: string;
  response: string;
  type: 'success' | 'info' | 'error';
  timestamp: string;
}

export const SapTerminal: React.FC<SapTerminalProps> = ({ darkMode, addToast }) => {
  const [inputCmd, setInputCmd] = useState('');
  const [history, setHistory] = useState<TerminalLog[]>([
    { command: 'HELP', response: 'Mini-SAP Easy Access CLI v1.2. Transações disponíveis: /nMB51, /nFB03, /nCKM3, /nSE16N, /nFBL3N, /nWE02, CLEAR', type: 'info', timestamp: new Date().toLocaleTimeString() }
  ]);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCmd.trim().toUpperCase();
    if (!cmd) return;

    let response = '';
    let type: 'success' | 'info' | 'error' = 'success';

    if (cmd === 'CLEAR') {
      setHistory([]);
      setInputCmd('');
      return;
    } else if (cmd === 'HELP') {
      response = 'Transações válidas: /nMB51 (Movimentações), /nFB03 (Contábil), /nCKM3 (Ledger), /nSE16N (Tabelas), /nWE02 (IDOCs), CLEAR';
      type = 'info';
    } else if (cmd.startsWith('/NMB51') || cmd === 'MB51') {
      response = 'Executando Transação MB51: 450 registros de movimentação de material carregados com sucesso em buffer RFC.';
      addToast('Transação MB51 aberta via CLI!', 'success');
    } else if (cmd.startsWith('/NFB03') || cmd === 'FB03') {
      response = 'Executando Transação FB03: Documento contábil 1900004521 exibido. Partidas dobradas equilibradas (Débito = Crédito).';
      addToast('Transação FB03 aberta via CLI!', 'success');
    } else if (cmd.startsWith('/NCKM3') || cmd === 'CKM3') {
      response = 'Executando Transação CKM3: Cockpit do Ledger de Materiais verificado. PMM atualizado para R$ 1.250,00.';
      addToast('Transação CKM3 aberta via CLI!', 'success');
    } else if (cmd.startsWith('/NSE16N') || cmd === 'SE16N') {
      response = 'Executando Transação SE16N: Visualizador universal pronto para consulta nas tabelas MSEG, MARA, EKKO.';
      addToast('Transação SE16N aberta via CLI!', 'success');
    } else if (cmd.startsWith('/NWE02') || cmd === 'WE02') {
      response = 'Executando Transação WE02: Monitor de IDOCs acessado. 3 mensagens EDI monitoradas.';
      addToast('Transação WE02 aberta via CLI!', 'success');
    } else {
      response = `Erro SAP 00/025: Transação ou comando '${cmd}' desconhecido ou não autorizado para o perfil do usuário.`;
      type = 'error';
      addToast(`Erro SAP: ${cmd} não encontrado.`, 'error');
    }

    const newLog: TerminalLog = {
      command: inputCmd,
      response,
      type,
      timestamp: new Date().toLocaleTimeString()
    };

    setHistory(prev => [newLog, ...prev]);
    setInputCmd('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <Terminal className="w-6 h-6 text-[#8DC63F]" /> Terminal de Comandos SAP (SAP Easy Access CLI)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Digite códigos de transação corporativa (ex: /nMB51, /nFB03, /nCKM3, SE16N) para interagir instantaneamente com o sistema SAP.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
        {/* CLI Input form */}
        <form onSubmit={handleExecute} className="flex gap-2">
          <div className="relative flex-1">
            <span className={`absolute left-4 top-3 font-mono font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>SAP:000 &gt;</span>
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Digite o código da transação (ex: /nMB51, HELP)..."
              className={`w-full pl-28 pr-4 py-3 rounded-xl border text-xs font-mono shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-gray-300 placeholder-gray-400'}`}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Executar
          </button>
        </form>

        {/* Terminal Output Log */}
        <div className={`p-4 rounded-xl border font-mono text-xs h-96 overflow-y-auto space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-gray-900 text-gray-100 border-gray-800'}`}>
          <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>--- SAP NetWeaver AS ABAP 7.55 / S/4HANA Kernel ---</span>
            <span>Sessão [01] ATIVA</span>
          </div>
          {history.map((log, idx) => (
            <div key={idx} className="space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>[{log.timestamp}] &gt;&gt;</span>
                <span className="font-bold text-white">{log.command}</span>
              </div>
              <div className={`pl-4 text-[11px] ${log.type === 'error' ? 'text-red-400' : log.type === 'info' ? 'text-blue-300' : 'text-slate-300'}`}>
                {log.response}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SapTerminal;
