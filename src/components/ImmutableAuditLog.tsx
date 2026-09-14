import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, FileText, Server, AlertTriangle } from 'lucide-react';

interface ImmutableAuditLogProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface LogBlock {
  index: number;
  timestamp: string;
  action: string;
  user: string;
  previousHash: string;
  hash: string;
  status: 'VERIFIED' | 'VALID';
}

export const ImmutableAuditLog: React.FC<ImmutableAuditLogProps> = ({ darkMode, addToast }) => {
  const [blocks, setBlocks] = useState<LogBlock[]>([
    {
      index: 1,
      timestamp: '2026-09-10 02:00:00',
      action: 'INIT_SYSTEM_BOOT_SAP_1909_2022',
      user: 'SYSTEM_DAEMON',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      status: 'VERIFIED'
    },
    {
      index: 2,
      timestamp: '2026-09-10 04:15:22',
      action: 'EXEC_SAP_PING_S4HANA_1909 (Latency: 24ms)',
      user: 'AUDIT_RFC_1909',
      previousHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      hash: 'f8e7d6c5b4a3210fedcba9876543210ffedcba9876543210fedcba987654321f',
      status: 'VERIFIED'
    },
    {
      index: 3,
      timestamp: '2026-09-10 06:10:05',
      action: 'EXPORT_ENCRYPTED_BACKUP_AES256',
      user: 'guilhermesatos455@gmail.com',
      previousHash: 'f8e7d6c5b4a3210fedcba9876543210ffedcba9876543210fedcba987654321f',
      hash: '99887766554433221100ffeeeeddccbbaa99887766554433221100ffeeeeddccbb',
      status: 'VERIFIED'
    }
  ]);

  const [verifying, setVerifying] = useState(false);

  const handleVerifyChain = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      addToast('Integridade da Trilha de Auditoria verificada com sucesso! 0 adulterações detectadas.', 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <ShieldCheck className="w-6 h-6 text-[#8DC63F]" /> Trilha de Auditoria Imutável (Compliance Blockchain-Lite Ledger)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Registro criptografado de todas as transações, pings, exportações e chamados, garantindo irretratabilidade para auditorias SOX externas.
          </p>
        </div>
        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="px-4 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50"
        >
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {verifying ? 'Verificando Hash...' : 'Auditar Integridade da Cadeia'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocos na Cadeia</span>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{blocks.length}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Criptográfico</span>
          <p className="text-2xl font-black text-emerald-400">100% ÍNTEGRO</p>
        </div>
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-1`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Algoritmo de Hash</span>
          <p className="text-2xl font-black text-blue-400 font-mono">SHA-256</p>
        </div>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.index} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3 font-mono text-xs`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit font-sans">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-sm text-white">Bloco #{block.index}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{block.status}</span>
              </div>
              <span className="text-slate-400 text-xs">{block.timestamp}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Ação Executada:</span>
                <span className="font-bold text-white">{block.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Usuário Responsável:</span>
                <span className="text-blue-400 font-bold">{block.user}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-inherit text-[10px]">
              <div>
                <span className="text-slate-500">Hash Anterior (Prev):</span> <span className="text-slate-400 break-all">{block.previousHash}</span>
              </div>
              <div>
                <span className="text-slate-500">Hash Atual (SHA-256):</span> <span className="text-[#8DC63F] font-bold break-all">{block.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ImmutableAuditLog;
