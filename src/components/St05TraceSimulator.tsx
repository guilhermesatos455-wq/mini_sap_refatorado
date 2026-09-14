import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, Clock, HardDrive, Database, Zap, RefreshCw, Layers } from 'lucide-react';

interface St05TraceSimulatorProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface TraceResult {
  id: string;
  transaction: string;
  sqlStatement: string;
  durationMs: number;
  bufferHits: number;
  rowsProcessed: number;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'SLOW';
}

export const St05TraceSimulator: React.FC<St05TraceSimulatorProps> = ({ darkMode, addToast }) => {
  const [selectedTransaction, setSelectedTransaction] = useState('CKM3');
  const [customQuery, setCustomQuery] = useState('SELECT MANDT, BELNR, GJAHR, WRBTR FROM BSEG WHERE BUKRS = \'1000\' AND GJAHR = \'2026\'');
  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<TraceResult[]>([
    {
      id: '1',
      transaction: 'CKM3',
      sqlStatement: 'SELECT MATNR, BWKEY, LBKUM, SALK3 FROM CKMLHD WHERE BKLAS = \'7920\'',
      durationMs: 14.2,
      bufferHits: 98,
      rowsProcessed: 1250,
      timestamp: '06:55:12',
      status: 'SUCCESS'
    },
    {
      id: '2',
      transaction: 'MB51',
      sqlStatement: 'SELECT MBLNR, MJAHR, ZEILE, BWART, ERFMG FROM MSEG WHERE BUDAT >= \'20260101\'',
      durationMs: 185.6,
      bufferHits: 42,
      rowsProcessed: 28400,
      timestamp: '07:01:40',
      status: 'SLOW'
    }
  ]);

  const handleRunTrace = () => {
    setIsRunning(true);
    setTimeout(() => {
      const duration = Number((Math.random() * 80 + 5).toFixed(1));
      const buffer = Math.floor(Math.random() * 60) + 40;
      const rows = Math.floor(Math.random() * 5000) + 120;
      const status: 'SUCCESS' | 'WARNING' | 'SLOW' = duration > 100 ? 'SLOW' : duration > 50 ? 'WARNING' : 'SUCCESS';

      const newTrace: TraceResult = {
        id: Date.now().toString(),
        transaction: selectedTransaction,
        sqlStatement: customQuery,
        durationMs: duration,
        bufferHits: buffer,
        rowsProcessed: rows,
        timestamp: new Date().toLocaleTimeString(),
        status
      };

      setTraces([newTrace, ...traces]);
      setIsRunning(false);
      addToast(`Trace ST05 executado com sucesso para ${selectedTransaction} (${duration}ms)!`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <Cpu className="w-6 h-6 text-[#8DC63F]" /> Simulador ST05 (SAP SQL Trace & Performance)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Simule a execução de consultas SQL e transações no SAP S/4HANA (HANA Database), monitorando tempo de resposta, buffer hits e planos de execução.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Config */}
        <div className={`lg:col-span-1 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit flex items-center gap-2`}>
            <Zap className="w-4 h-4 text-amber-500" /> Parâmetros de Execução ST05
          </h4>

          <div className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Transação SAP Alvo</label>
              <select
                value={selectedTransaction}
                onChange={(e) => setSelectedTransaction(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              >
                <option value="CKM3">CKM3 - Material Ledger Analysis</option>
                <option value="MB51">MB51 - Material Document List</option>
                <option value="SE16N">SE16N - General Table Display</option>
                <option value="WE02">WE02 - IDoc List Monitoring</option>
                <option value="VF04">VF04 - Billing Due List</option>
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Instrução SQL / Open SQL</label>
              <textarea
                rows={4}
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunTrace}
                disabled={isRunning}
                className="w-full py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                {isRunning ? 'Executando Trace ST05...' : 'Iniciar SQL Trace (ST05)'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Trace Results Table */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-inherit">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Layers className="w-4 h-4 text-blue-500" /> Histórico de Execuções e Performance HANA
            </h4>
            <span className="text-[10px] font-mono text-slate-400">{traces.length} Traces Capturados</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {traces.map((trace) => (
              <div key={trace.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-gray-200'} space-y-2`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{trace.transaction}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trace.status === 'SLOW' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : trace.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {trace.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{trace.timestamp}</span>
                </div>

                <p className="font-mono text-xs text-white bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 break-all">{trace.sqlStatement}</p>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duração: <strong className="text-white">{trace.durationMs}ms</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Buffer Hits: <strong className="text-white">{trace.bufferHits}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Linhas: <strong className="text-white">{trace.rowsProcessed}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default St05TraceSimulator;
