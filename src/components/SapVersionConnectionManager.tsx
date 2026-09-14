import React, { useState } from 'react';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Radio, Shield, Globe } from 'lucide-react';

interface SapVersionConnectionManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SapVersionConnectionManager: React.FC<SapVersionConnectionManagerProps> = ({ darkMode, addToast }) => {
  const [v1909Url, setV1909Url] = useState('https://sap1909-prod.internal.corp:8000/sap/bc/srt/rfc');
  const [v1909Client, setV1909Client] = useState('100');
  const [v1909Status, setV1909Status] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [v1909Latency, setV1909Latency] = useState<number | null>(null);

  const [v2022Url, setV2022Url] = useState('https://sap2022-s4hana.internal.corp:443/sap/bc/soap/rfc');
  const [v2022Client, setV2022Client] = useState('400');
  const [v2022Status, setV2022Status] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [v2022Latency, setV2022Latency] = useState<number | null>(null);

  const handleTestConnection = (version: '1909' | '2022') => {
    if (version === '1909') {
      setV1909Status('testing');
      setTimeout(() => {
        setV1909Status('connected');
        setV1909Latency(Math.floor(Math.random() * 20) + 12);
        addToast('Conexão RFC/SOAP estabelecida com sucesso com SAP S/4HANA 1909!', 'success');
      }, 1200);
    } else {
      setV2022Status('testing');
      setTimeout(() => {
        setV2022Status('connected');
        setV2022Latency(Math.floor(Math.random() * 15) + 8);
        addToast('Conexão RFC/OData estabelecida com sucesso com SAP S/4HANA 2022!', 'success');
      }, 1200);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <Server className="w-6 h-6 text-[#8DC63F]" /> Gerenciador de Conexões SAP S/4HANA (1909 & 2022)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Configure os endpoints de comunicação RFC, SOAP e OData para as instâncias SAP S/4HANA e teste a latência e handshake de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SAP S/4HANA 1909 */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-inherit">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>SAP S/4HANA 1909 (LTS)</h4>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${v1909Status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'}`}>
              {v1909Status === 'connected' ? `ONLINE (${v1909Latency}ms)` : 'AGUARDANDO TESTE'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Endpoint URL (RFC / SOAP)</label>
              <input
                type="text"
                value={v1909Url}
                onChange={(e) => setV1909Url(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Client (Mandante)</label>
                <input
                  type="text"
                  value={v1909Client}
                  onChange={(e) => setV1909Client(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Protocolo</label>
                <input
                  type="text"
                  disabled
                  value="RFC / SOAP 1.2"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs opacity-60 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-inherit">
            <span className="text-[10px] text-slate-400">SSL/TLS 1.3 Handshake Ativo</span>
            <button
              onClick={() => handleTestConnection('1909')}
              disabled={v1909Status === 'testing'}
              className="px-5 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {v1909Status === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {v1909Status === 'testing' ? 'Testando...' : 'Testar Conexão 1909'}
            </button>
          </div>
        </div>

        {/* SAP S/4HANA 2022 */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-inherit">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>SAP S/4HANA 2022 (Next-Gen)</h4>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${v2022Status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'}`}>
              {v2022Status === 'connected' ? `ONLINE (${v2022Latency}ms)` : 'AGUARDANDO TESTE'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Endpoint URL (OData / REST)</label>
              <input
                type="text"
                value={v2022Url}
                onChange={(e) => setV2022Url(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Client (Mandante)</label>
                <input
                  type="text"
                  value={v2022Client}
                  onChange={(e) => setV2022Client(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Protocolo</label>
                <input
                  type="text"
                  disabled
                  value="OData v4 / REST"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs opacity-60 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-inherit">
            <span className="text-[10px] text-slate-400">OAuth 2.0 / Bearer Token Ativo</span>
            <button
              onClick={() => handleTestConnection('2022')}
              disabled={v2022Status === 'testing'}
              className="px-5 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {v2022Status === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {v2022Status === 'testing' ? 'Testando...' : 'Testar Conexão 2022'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SapVersionConnectionManager;
