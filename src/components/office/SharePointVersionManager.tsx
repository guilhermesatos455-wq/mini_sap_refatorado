import React, { useState } from 'react';
import { Cloud, HardDrive, Lock, Unlock, History, CheckCircle, RefreshCw, Shield, Folder, FileSpreadsheet, Key, Users } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';

interface DocumentVersion {
  version: string;
  fileName: string;
  modifiedBy: string;
  matricula: string;
  modifiedAt: string;
  sha256: string;
  status: 'Checked-In (Oficial)' | 'Checked-Out (Em Revisão)' | 'Aprovado SOX';
  comment: string;
}

export const SharePointVersionManager: React.FC = () => {
  const { darkMode, addToast, aiUser } = useAudit();

  const [siteUrl, setSiteUrl] = useState('https://natulab.sharepoint.com/sites/Controladoria');
  const [docLibrary, setDocLibrary] = useState('/Auditoria_SAP/2026/08_Agosto');
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('1001');

  const [versions, setVersions] = useState<DocumentVersion[]>([
    {
      version: 'v2.0',
      fileName: 'Relatorio_Auditoria_CKM3_Planta1001_Agosto_Final.xlsx',
      modifiedBy: 'Guilherme Santos de Souza',
      matricula: '89201',
      modifiedAt: '14/08/2026 15:40',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'Aprovado SOX',
      comment: 'Conciliação fechada com todas as justificativas de compras anexadas e aprovadas pelo gestor.'
    },
    {
      version: 'v1.1',
      fileName: 'Relatorio_Auditoria_CKM3_Planta1001_Agosto_Rev1.xlsx',
      modifiedBy: 'Auditor NatuAssist',
      matricula: '89201',
      modifiedAt: '14/08/2026 11:20',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      status: 'Checked-In (Oficial)',
      comment: 'Ajuste de matriz de CFOPs de transferências intercompany e frete CIF.'
    },
    {
      version: 'v1.0',
      fileName: 'Relatorio_Auditoria_CKM3_Planta1001_Agosto_Inicial.xlsx',
      modifiedBy: 'Sistema SAP Auto-Ingest',
      matricula: 'SPOOL_AUTO',
      modifiedAt: '13/08/2026 18:00',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      status: 'Checked-In (Oficial)',
      comment: 'Carga inicial do spool CKM3 e notas fiscais MIRO.'
    }
  ]);

  const [plantPermissions, setPlantPermissions] = useState([
    { plant: '1001 - Farmacêutica (SAJ)', centroCusto: 'CC-3100 (Produção Sólidos)', role: 'Auditoria & Aprovação', users: 'Guilherme Souza, Gerente Controladoria' },
    { plant: '1005 - Nutracêuticos (FSA)', centroCusto: 'CC-3200 (Nutracêuticos)', role: 'Auditoria & Edição', users: 'Analista de Custos Pleno' },
    { plant: '2001 - Logística & CD (Simões Filho)', centroCusto: 'CC-4100 (Logística)', role: 'Somente Leitura', users: 'Equipe de Faturamento' }
  ]);

  const handleSyncSharePoint = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/office/sharepoint-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          folderPath: docLibrary,
          fileName: `Relatorio_CKM3_Planta${selectedPlant}_${Date.now()}.xlsx`,
          author: aiUser?.nome || 'Guilherme Santos de Souza'
        })
      });

      const data = await res.json();
      if (res.ok) {
        const newVer: DocumentVersion = {
          version: data.details.versionId || 'v2.1',
          fileName: data.details.fileName,
          modifiedBy: aiUser?.nome || 'Guilherme Santos de Souza',
          matricula: aiUser?.matricula || '89201',
          modifiedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          sha256: data.details.sha256,
          status: 'Checked-In (Oficial)',
          comment: 'Sincronização com SharePoint via Microsoft Graph API.'
        };
        setVersions(prev => [newVer, ...prev]);
        addToast(data.message || 'Sincronizado com sucesso no SharePoint!', 'success');
      } else {
        addToast(data.error || 'Erro na sincronização', 'error');
      }
    } catch (err) {
      addToast('Erro na conexão com o SharePoint', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleCheckOut = () => {
    setIsCheckedOut(!isCheckedOut);
    if (!isCheckedOut) {
      addToast('Documento em Check-Out (Bloqueado para outros usuários enquanto você edita).', 'info');
    } else {
      addToast('Check-In realizado com sucesso! Nova versão oficial arquivada no SharePoint.', 'success');
    }
  };

  return (
    <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Governança & Controle de Versão no SharePoint / OneDrive</h2>
            <p className="text-xs text-slate-400">Armazenamento imutável de relatórios CKM3 com controle de versão SOX, hashes SHA-256 e permissões por Centro de Custo.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCheckOut}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${isCheckedOut ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
          >
            {isCheckedOut ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isCheckedOut ? 'Fazer Check-In (Liberar)' : 'Fazer Check-Out (Bloquear Edição)'}
          </button>

          <button
            onClick={handleSyncSharePoint}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar no SharePoint'}
          </button>
        </div>
      </div>

      {/* Directory & Permissions Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-400" />
            Caminho da Biblioteca Corporativa
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">URL do Site SharePoint</label>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">Estrutura de Pastas (Hierarquia Automática)</label>
              <input
                type="text"
                value={docLibrary}
                onChange={(e) => setDocLibrary(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
          </div>

          {/* Plant Permission Matrix */}
          <div className="pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Matriz de Governança por Centro de Custo / Planta
            </h4>

            <div className="space-y-2">
              {plantPermissions.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200">{p.plant}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {p.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.centroCusto}</span>
                    <span className="text-[10px] text-slate-500">Usuários: {p.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Version History with SHA-256 */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Histórico Imutável de Versões (Controle SOX 404)
          </h3>

          <div className="space-y-3">
            {versions.map((ver, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs px-2 py-0.5 rounded-md bg-blue-600 text-white shadow">
                      {ver.version}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{ver.fileName}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ver.status.includes('SOX') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {ver.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 italic bg-slate-900/40 p-2 rounded-xl border border-slate-800/80">
                  "{ver.comment}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">Autor:</span> {ver.modifiedBy} (Mat. {ver.matricula})
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Modificado em:</span> {ver.modifiedAt}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[9px] text-slate-400 break-all flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>SHA-256: {ver.sha256}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SharePointVersionManager;
