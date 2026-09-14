import React from 'react';
import { History, ShieldCheck, User, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface AuditTrailItem {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  targetField: string;
  oldValue: string;
  newValue: string;
  status: 'SUCCESS' | 'PENDING' | 'APPROVED';
}

interface CellAuditTrailViewerProps {
  darkMode: boolean;
  auditTrail: AuditTrailItem[];
}

export const CellAuditTrailViewer: React.FC<CellAuditTrailViewerProps> = ({ darkMode, auditTrail }) => {
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
      <div className="flex items-center justify-between">
        <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <History className="w-4 h-4 text-indigo-500" /> Trilha de Auditoria por Célula (Cell-Level Audit Trail)
        </h4>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
          Conformidade SOX Sec. 404
        </span>
      </div>

      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
        Histórico imutável de todas as modificações efetuadas em células e registros contábeis.
      </p>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {auditTrail.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">Nenhum registro de alteração na sessão atual.</div>
        ) : (
          auditTrail.map((item) => (
            <div key={item.id} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${darkMode ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-indigo-400">{item.action}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{item.targetField}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    De: <span className="text-rose-400">{item.oldValue}</span> → Para: <span className="text-emerald-400">{item.newValue}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-end">
                  <User className="w-3 h-3" /> {item.userEmail}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 justify-end mt-0.5">
                  <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
