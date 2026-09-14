import React, { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, ShieldCheck, Zap } from 'lucide-react';

interface SapConnectionManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SapConnectionManager: React.FC<SapConnectionManagerProps> = ({ darkMode, addToast }) => {
  // Version 1909 State
  const [host1909, setHost1909] = useState('https://s4hana1909.corp.internal:44300');
  const [client1909, setClient1909] = useState('100');
  const [user1909, setUser1909] = useState('AUDIT_RFC_1909');
  const [testing1909, setTesting1909] = useState(false);
  const [status1909, setStatus1909] = useState<'idle' | 'success' | 'error'>('idle');
  const [latency1909, setLatency1909] = useState<number | null>(null);

  // Version 2022 State
  const [host2022, setHost2022] = useState('https://s4hana2022.corp.internal:44300');
  const [client2022, setClient2022] = useState('400');
  const [user2022, setUser2022] = useState('AUDIT_API_2022');
  const [testing2022, setTesting2022] = useState(false);
  const [status2022, setStatus2022] = useState<'idle' | 'success' | 'error'>('idle');
  const [latency2022, setLatency2022] = useState<number | null>(null);

  const handleTestConnection = async (version: '1909' | '2022') => {
    const is1909 = version === '1909';
    if (is1909) {
      setTesting1909(true);
      setStatus1909('idle');
    } else {
      setTesting2022(true);
      setStatus2022('idle');
    }

    try {
      const res = await fetch('/api/sap/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: is1909 ? host1909 : host2022,
          client: is1909 ? client1909 : client2022,
          user: is1909 ? user1909 : user2022,
          version
        })
      });

      const data = await res.json();
      if (data.success) {
        if (is1909) {
          setStatus1909('success');
          setLatency1909(data.latencyMs);
          addToast(`Conexão RFC/OData com SAP S/4HANA 1909 estabelecida (${data.latencyMs}ms)!`, 'success');
        } else {
          setStatus2022('success');
          setLatency2022(data.latencyMs);
          addToast(`Conexão segura HTTPS/API com SAP S/4HANA 2022 estabelecida (${data.latencyMs}ms)!`, 'success');
        }
      } else {
        throw new Error(data.error || 'Falha na conexão');
      }
    } catch (error) {
      console.error('SAP Ping Error:', error);
      if (is1909) {
        setStatus1909('error');
        addToast('Falha ao conectar com SAP S/4HANA 1909 via proxy backend.', 'error');
      } else {
        setStatus2022('error');
        addToast('Falha ao conectar com SAP S/4HANA 2022 via proxy backend.', 'error');
      }
    } finally {
      if (is1909) setTesting1909(false);
      else setTesting2022(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <Server className="w-6 h-6 text-[#8DC63F]" /> Conexão S/4HANA (Indicador de Latência & Endpoints 1909/2022)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Configure os parâmetros de conexão e teste o tempo de resposta (ping de latência) em tempo real com o servidor SAP.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* S/4HANA 1909 Environment */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ambiente SAP S/4HANA 1909</h4>
            </div>
            {status1909 === 'success' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Ping: {latency1909}ms
                </span>
              </div>
            )}
            {status1909 === 'error' && (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Falha no Gateway
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Gateway / Host URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={host1909}
                  onChange={(e) => setHost1909(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Mandante (Client)</label>
                <input
                  type="text"
                  value={client1909}
                  onChange={(e) => setClient1909(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Usuário RFC</label>
                <input
                  type="text"
                  value={user1909}
                  onChange={(e) => setUser1909(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-inherit">
            <span className="text-[10px] text-slate-400">Protocolo: RFC / SOAP / OData v2</span>
            <button
              onClick={() => handleTestConnection('1909')}
              disabled={testing1909}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing1909 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {testing1909 ? 'Testando Ping...' : 'Testar Conexão 1909'}
            </button>
          </div>
        </div>

        {/* S/4HANA 2022 Environment */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ambiente SAP S/4HANA 2022</h4>
            </div>
            {status2022 === 'success' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Ping: {latency2022}ms
                </span>
              </div>
            )}
            {status2022 === 'error' && (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Falha no Gateway
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>API Gateway / Host URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={host2022}
                  onChange={(e) => setHost2022(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Mandante (Client)</label>
                <input
                  type="text"
                  value={client2022}
                  onChange={(e) => setClient2022(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Usuário API</label>
                <input
                  type="text"
                  value={user2022}
                  onChange={(e) => setUser2022(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-inherit">
            <span className="text-[10px] text-slate-400">Protocolo: REST / OData v4 / gRPC</span>
            <button
              onClick={() => handleTestConnection('2022')}
              disabled={testing2022}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing2022 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {testing2022 ? 'Testando Ping...' : 'Testar Conexão 2022'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SapConnectionManager;
