import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e) {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8DC63F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-[#8DC63F]/10 border border-[#8DC63F]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-[#8DC63F]" />
        </div>

        <div className="text-center mb-8">
          <span className="px-3 py-1 bg-[#8DC63F]/10 text-[#8DC63F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#8DC63F]/20 inline-block mb-3">
            Acesso Restrito - Natulab
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Mini SAP Auditoria Fiscal</h1>
          <p className="text-xs text-slate-400 mt-2">
            Autenticação obrigatória com conta corporativa <strong className="text-slate-200">@natulab.com.br</strong> (ou guilhermesatos455@gmail.com).
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Acesso Negado</p>
              {authError}
            </div>
            <button onClick={clearAuthError} className="text-red-400 hover:text-red-300 font-bold ml-2">×</button>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-[#8DC63F] hover:bg-[#7db235] text-slate-950 font-black text-sm transition-all shadow-lg shadow-[#8DC63F]/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google (@natulab.com.br)
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            NatuAssist Security & Compliance v1.2
          </p>
        </div>
      </div>
    </div>
  );
};
