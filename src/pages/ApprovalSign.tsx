import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { ShieldCheck, Lock, KeyRound, CheckCircle, AlertCircle, FileSignature, UserCheck, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const ApprovalSignPage: React.FC = () => {
  const { selectedPlant, addToast } = useAudit();
  const [pin, setPin] = useState('');
  const [signed, setSigned] = useState(false);
  const [auditorName, setAuditorName] = useState('Auditor Sênior / Controller');
  const [signatureDate, setSignatureDate] = useState(new Date().toLocaleDateString('pt-BR'));

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      addToast('Digite um PIN de segurança válido (mínimo 4 dígitos).', 'error');
      return;
    }
    setSigned(true);
    addToast('Relatório assinado digitalmente e bloqueado com sucesso!', 'success');
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <FileSignature className="w-7 h-7 text-[#8DC63F]" />
          Assinatura Digital & Aprovação C-Level (Dois Fatores)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Fechamento formal do trimestre auditado com PIN de segurança e bloqueio de edições para o Centro {selectedPlant}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8DC63F]" /> Credenciais de Aprovação
          </h2>

          {!signed ? (
            <form onSubmit={handleSign} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  Nome do Auditor Responsável
                </label>
                <input 
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  PIN de Assinatura Digital (4+ Dígitos)
                </label>
                <input 
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#8DC63F] hover:bg-[#7db438] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#8DC63F]/20 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Assinar Digitalmente e Bloquear
              </button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-base">Relatório Assinado com Sucesso</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                O trimestre para o Centro {selectedPlant} encontra-se formalmente fechado e imutável no sistema.
              </p>
              <button
                onClick={() => setSigned(false)}
                className="text-xs font-bold text-emerald-600 underline hover:text-emerald-700"
              >
                Revogar Assinatura
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8DC63F]" /> Status de Imutabilidade e Conformidade
          </h2>

          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-slate-400" /> Auditor:</span>
              <span className="font-bold text-slate-900 dark:text-white">{auditorName}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Data de Validação:</span>
              <span className="font-bold text-slate-900 dark:text-white">{signatureDate}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span>Status do Período:</span>
              <span className={`px-2.5 py-1 rounded-full font-bold ${signed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>
                {signed ? 'FECHADO & BLOQUEADO' : 'EM ABERTO'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalSignPage;
