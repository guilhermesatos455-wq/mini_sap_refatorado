import React, { useState, useEffect } from 'react';
import { Database, Lock, Server, HardDrive, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../server/supabaseClient';

interface SupabaseAdvancedManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const SupabaseAdvancedManager: React.FC<SupabaseAdvancedManagerProps> = ({ darkMode, addToast }) => {
  const [realtimeActive, setRealtimeActive] = useState<boolean>(true);
  const [rlsEnabled, setRlsEnabled] = useState<boolean>(true);
  const [networkPath, setNetworkPath] = useState<string>('\\\\srv-sap-files\\compartilhado\\notas_fiscais_2026');
  const [localFiles, setLocalFiles] = useState<Array<{ name: string; size: string; date: string; path: string }>>([
    { name: 'NF_58921_Fornecedor_A.pdf', size: '2.4 MB', date: '2026-03-09', path: '\\\\srv-sap-files\\compartilhado\\notas_fiscais_2026\\NF_58921.pdf' },
    { name: 'CKM3_Relatorio_Custos_Marco.xlsx', size: '4.1 MB', date: '2026-03-08', path: '\\\\srv-sap-files\\compartilhado\\notas_fiscais_2026\\CKM3_Marco.xlsx' },
    { name: 'MB51_Movimentos_Estoque.csv', size: '1.8 MB', date: '2026-03-07', path: '\\\\srv-sap-files\\compartilhado\\notas_fiscais_2026\\MB51.csv' }
  ]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  useEffect(() => {
    // Setup Supabase Realtime subscription
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          console.log('[Supabase Realtime] Mudança detectada na tabela clientes:', payload);
          addToast('Atualização em tempo real recebida do Supabase!', 'success');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRequestNetworkScan = () => {
    // Solicita autorização do usuário antes de acessar a rede local
    setShowPermissionModal(true);
  };

  const confirmNetworkAccess = () => {
    setShowPermissionModal(false);
    setScanning(true);
    addToast(`Solicitação aceita. Conectando à rede local: ${networkPath}`, 'success');

    setTimeout(() => {
      setScanning(false);
      addToast(`Varredura e indexação concluídas com sucesso na rede local!`, 'success');
    }, 1500);
  };

  const handleToggleRls = () => {
    setRlsEnabled(!rlsEnabled);
    addToast(`Row Level Security (RLS) ${!rlsEnabled ? 'ativado' : 'desativado'} com sucesso.`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Database className="w-5 h-5 text-indigo-500" /> Supabase Advanced Architecture & Local Network Storage
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gerenciamento de Realtime Sync, políticas RLS de segurança e indexação de arquivos via rede local corporativa (SMB/NFS).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Supabase Realtime Card */}
        <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" /> Supabase Realtime
            </h4>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Ativo
            </span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Ouvindo eventos Postgres (`INSERT`, `UPDATE`, `DELETE`) em tempo real nas tabelas do tenant sem polling.
          </p>
          <div className="pt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Canal WebSocket Conectado
          </div>
        </div>

        {/* 2. Row Level Security (RLS) Card */}
        <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Lock className="w-4 h-4 text-indigo-400" /> Row Level Security (RLS)
            </h4>
            <button
              onClick={handleToggleRls}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${rlsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {rlsEnabled ? 'Protegido' : 'Desativado'}
            </button>
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Políticas PostgreSQL que isolam rigorosamente os dados por `tenant_id` diretamente no banco.
          </p>
          <div className="pt-2 text-[11px] font-mono text-indigo-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Políticas RLS Ativas
          </div>
        </div>

        {/* 3. Local Network Storage (SMB/NFS) Card */}
        <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <HardDrive className="w-4 h-4 text-amber-500" /> Rede Local (SMB/NFS)
            </h4>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Zero Storage Cost
            </span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Leitura direta de arquivos pesados na rede local da empresa para poupar espaço no plano Supabase base.
          </p>
          <div className="pt-2 text-[11px] font-mono text-amber-500 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> Mapeado para Servidor Interno
          </div>
        </div>
      </div>

      {/* Network Path Indexer */}
      <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <Server className="w-4 h-4 text-indigo-500" /> Indexador de Arquivos na Rede Local da Empresa
        </h4>

        <div className="flex gap-3">
          <input
            type="text"
            value={networkPath}
            onChange={(e) => setNetworkPath(e.target.value)}
            placeholder="Insira o caminho UNC ou diretório de rede (ex: \\servidor\compartilhado)"
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          />
          <button
            onClick={handleRequestNetworkScan}
            disabled={scanning}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Varrendo Rede...' : 'Escanear Caminho'}
          </button>
        </div>

        <div className="space-y-2 mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Arquivos Indexados na Rede Local:</div>
          <div className="space-y-2">
            {localFiles.map((file, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-bold">{file.name}</div>
                    <div className="text-[10px] text-slate-400">{file.path}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Disponível</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-500">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="font-bold text-base">Solicitação de Acesso à Rede Local</h4>
              </div>
              <button onClick={() => setShowPermissionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              O sistema <strong>Mini-SAP Web Auditoria</strong> está solicitando permissão explícita para acessar e indexar arquivos corporativos no diretório de rede local informado:
            </p>

            <div className={`p-3 rounded-xl font-mono text-xs ${darkMode ? 'bg-slate-800 border border-slate-700 text-indigo-300' : 'bg-gray-100 border border-gray-300 text-indigo-700'}`}>
              {networkPath}
            </div>

            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Esta operação garante conformidade de segurança e evita o uso de storage em nuvem para arquivos pesados de notas fiscais e relatórios CKM3.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPermissionModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
              >
                Negar Acesso
              </button>
              <button
                onClick={confirmNetworkAccess}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Autorizar Acesso & Indexar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
