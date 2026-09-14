import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, FileText, KeyRound, X } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsAuditService';

interface SoxApprovalModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SoxApprovalModal: React.FC<SoxApprovalModalProps> = ({ darkMode, isOpen, onClose, reportTitle, addToast }) => {
  const [pin, setPin] = useState<string>('');
  const [auditorName, setAuditorName] = useState<string>('Guilherme Santos (Controller Sênior)');
  const [signing, setSigning] = useState<boolean>(false);
  const [signedSuccess, setSignedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSignReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      addToast('Informe o PIN de assinatura digital válido (mínimo 4 dígitos).', 'error');
      return;
    }

    setSigning(true);
    try {
      // Simulate cryptographic approval and sync with Google Sheets audit log tab
      await googleSheetsService.writeAuditLog({
        timestamp: new Date().toISOString(),
        tenantId: 'TENANT-NATULAB-SP',
        userEmail: 'guilherme.santos@natulab.com.br',
        actionType: 'SOX_DIGITAL_SIGNATURE',
        status: 'APPROVED',
        details: JSON.stringify({ report: reportTitle, auditor: auditorName, hash: 'SHA256-9F8E7D6C5B4A3' })
      }, 'AuditoriaLogs!A:F');

      setSigning(false);
      setSignedSuccess(true);
      addToast('Parecer SOX assinado digitalmente com sucesso!', 'success');
      setTimeout(() => {
        setSignedSuccess(false);
        setPin('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setSigning(false);
      addToast('Erro ao assinar parecer: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'} space-y-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Assinatura Digital SOX</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Validação Criptográfica de Compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {signedSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-bold text-lg text-emerald-400">Assinatura Confirmada!</h4>
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              O carimbo imutável SOX foi aplicado e sincronizado com o Google Sheets.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignReport} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Relatório / Parecer Alvo</label>
              <div className={`p-3 rounded-xl border font-mono text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-gray-50 border-gray-300 text-emerald-600'}`}>
                {reportTitle}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Auditor Responsável</label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>PIN de Assinatura (Mín. 4 dígitos)</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  placeholder="••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono tracking-widest ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sua assinatura equivale a um selo de conformidade Sarbanes-Oxley (Sec. 404).</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={signing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Lock className={`w-3.5 h-3.5 ${signing ? 'animate-spin' : ''}`} />
                {signing ? 'Assinando...' : 'Assinar Digitalmente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
