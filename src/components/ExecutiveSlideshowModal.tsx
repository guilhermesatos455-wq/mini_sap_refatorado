import React from 'react';
import { X, ShieldCheck, BarChart3, Server, Ticket, CheckCircle2 } from 'lucide-react';

interface ExecutiveSlideshowModalProps {
  darkMode: boolean;
  onClose: () => void;
}

export const ExecutiveSlideshowModal: React.FC<ExecutiveSlideshowModalProps> = ({ darkMode, onClose }) => {
  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-8 animate-in fade-in duration-300 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#8DC63F] animate-ping"></span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Mini-SAP Web Auditoria Enterprise — Apresentação Executiva C-Level</h2>
            <p className="text-xs text-slate-400">Resumo consolidado para o Board de Diretores & Comitê de Auditoria SOX</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base">Conformidade SoD & SOX</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monitoramento em tempo real de matrizes de risco de acesso (Segregação de Funções) em ambientes SAP S/4HANA 1909 e 2022 com índice de conformidade superior a 94.8%.
          </p>
          <div className="pt-2 font-mono text-emerald-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> 0 Violações Críticas Abertas
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base">Reconciliação CKM3 vs MB51</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Análise automatizada de Preço Médio Móvel (PMM), inventários perpétuos e desvios de ledger de materiais entre transações financeiras e de suprimentos.
          </p>
          <div className="pt-2 font-mono text-blue-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Precisão de Estoque 99.2%
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base">Segurança & Criptografia</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Backups locais e de rede protegidos por AES-256 (Web Crypto API) e trilha de auditoria imutável baseada em hash encadeado (SHA-256).
          </p>
          <div className="pt-2 font-mono text-purple-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Criptografia Ativa
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-4 border-slate-800 text-xs text-slate-400 font-mono">
        <span>Pressione ESC ou feche no canto superior para retornar ao modo analítico.</span>
        <span className="text-[#8DC63F] font-bold">SAP S/4HANA Enterprise Gateway Connected</span>
      </div>
    </div>
  );
};
export default ExecutiveSlideshowModal;
