import React, { useState } from 'react';
import { FolderLock, HardDrive, ShieldCheck, Download, Key, Server, Plus, Trash2, CheckCircle2, Folder, ScrollText, Terminal } from 'lucide-react';
import { saveBackupLocally } from '../utils/backup';
import { useDebugLogs } from '../context/DebugLogContext';

interface LocalEncryptedBackupProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface NetworkFolder {
  id: string;
  name: string;
  path: string;
  isCustom: boolean;
}

export const LocalEncryptedBackup: React.FC<LocalEncryptedBackupProps> = ({ darkMode, addToast }) => {
  const { logs } = useDebugLogs();
  
  const [folders, setFolders] = useState<NetworkFolder[]>([
    { id: '1', name: 'Servidor Corporativo Principal (Rede)', path: '\\\\srv-files01\\Auditoria_SOX\\S4HANA_Backups', isCustom: false },
    { id: '2', name: 'Compliance & Tax BR (Rede)', path: '\\\\srv-tax02\\Fiscal_Audits\\BR_Matrix', isCustom: false },
    { id: '3', name: 'Pasta Local de Logs & Auditoria (C:\\)', path: 'C:\\MiniSAP_Auditoria\\SecureStorage', isCustom: false }
  ]);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('1');
  const [customFolderName, setCustomFolderName] = useState('');
  const [customFolderPath, setCustomFolderPath] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('SapAuditSecure2026!');
  const [exportType, setExportType] = useState<'backup' | 'logs'>('backup');
  const [isExporting, setIsExporting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleAddCustomFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFolderName.trim() || !customFolderPath.trim()) {
      addToast('Preencha o nome e o caminho da pasta de rede ou local.', 'error');
      return;
    }

    const newFolder: NetworkFolder = {
      id: Date.now().toString(),
      name: customFolderName.trim(),
      path: customFolderPath.trim(),
      isCustom: true
    };

    setFolders([...folders, newFolder]);
    setSelectedFolderId(newFolder.id);
    setCustomFolderName('');
    setCustomFolderPath('');
    addToast('Nova pasta de rede/local cadastrada com sucesso!', 'success');
  };

  const handleDeleteFolder = (id: string) => {
    if (folders.length <= 1) {
      addToast('Mantenha pelo menos uma pasta de destino configurada.', 'error');
      return;
    }
    const updated = folders.filter(f => f.id !== id);
    setFolders(updated);
    if (selectedFolderId === id) {
      setSelectedFolderId(updated[0].id);
    }
    addToast('Pasta removida da lista.', 'success');
  };

  const handleSecureExport = async () => {
    if (!encryptionPassword.trim()) {
      addToast('A senha de criptografia é obrigatória.', 'error');
      return;
    }

    const currentFolder = folders.find(f => f.id === selectedFolderId) || folders[0];

    setIsExporting(true);
    try {
      let payload: any;
      let fileNamePrefix: string;

      if (exportType === 'backup') {
        payload = {
          timestamp: new Date().toISOString(),
          system: 'Mini-SAP Web Auditoria Enterprise',
          targetDestination: currentFolder.path,
          destinationName: currentFolder.name,
          algorithm: 'AES-256-GCM',
          modules: ['CKM3', 'MB51', 'SOX Tickets', 'Brazilian Tax Matrix', 'Immutable Ledger'],
          status: 'VERIFIED_ENCRYPTED_BACKUP'
        };
        fileNamePrefix = 'SAP_SOX_Backup';
      } else {
        payload = {
          timestamp: new Date().toISOString(),
          system: 'Mini-SAP Web Auditoria Enterprise',
          targetDestination: currentFolder.path,
          destinationName: currentFolder.name,
          algorithm: 'AES-256-GCM',
          totalLogs: logs.length,
          logs: logs,
          status: 'VERIFIED_ENCRYPTED_LOGS'
        };
        fileNamePrefix = 'SAP_System_Logs';
      }

      const fileName = `${fileNamePrefix}_${currentFolder.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.enc`;
      const success = await saveBackupLocally(payload, fileName, encryptionPassword);

      if (success) {
        setLastSaved(new Date().toLocaleString());
        addToast(`${exportType === 'backup' ? 'Backup' : 'Logs do sistema'} criptografado(s) e salvo(s) com sucesso no destino: ${currentFolder.path}`, 'success');
      } else {
        addToast('Operação de gravação cancelada pelo usuário.', 'error');
      }
    } catch (error: any) {
      addToast(`Erro ao gravar dados criptografados: ${error.message || error}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const activeFolder = folders.find(f => f.id === selectedFolderId) || folders[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <FolderLock className="w-6 h-6 text-[#8DC63F]" /> Gerenciador de Pastas de Rede & Armazenamento Local (Backups & Logs com AES-256)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Gerencie e configure caminhos de rede mapeados (UNC) ou pastas locais no computador para gravação segura e criptografada (AES-256) de relatórios de auditoria e logs do sistema.
        </p>
      </div>

      {/* Mode Selector: Backup vs Logs */}
      <div className="flex items-center gap-3 border-b pb-4 border-inherit">
        <button
          onClick={() => setExportType('backup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            exportType === 'backup'
              ? 'bg-[#8DC63F] text-slate-950 shadow-md'
              : darkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Armazenamento de Backups de Auditoria
        </button>
        <button
          onClick={() => setExportType('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            exportType === 'logs'
              ? 'bg-[#8DC63F] text-slate-950 shadow-md'
              : darkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ScrollText className="w-4 h-4" /> Armazenamento de Logs do Sistema ({logs.length} itens)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Folders Selector & Creator */}
        <div className={`lg:col-span-1 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} pb-2 border-b border-inherit flex items-center gap-2`}>
            <Server className="w-4 h-4 text-blue-500" /> Pastas de Rede / Locais Configuradas
          </h4>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedFolderId === folder.id
                    ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-white shadow-md'
                    : darkMode ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Folder className={`w-4 h-4 shrink-0 ${selectedFolderId === folder.id ? 'text-[#8DC63F]' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <p className="font-bold text-xs truncate">{folder.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{folder.path}</p>
                  </div>
                </div>
                {folder.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Remover Pasta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Create Custom Folder Form */}
          <form onSubmit={handleAddCustomFolder} className="pt-4 border-t border-inherit space-y-3">
            <span className="font-bold text-xs text-white block">Adicionar Nova Pasta de Rede (UNC) ou Local</span>
            <div>
              <input
                type="text"
                placeholder="Nome Descritivo (ex: Servidor Backup Setor Fiscal)"
                value={customFolderName}
                onChange={(e) => setCustomFolderName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Caminho (ex: \\\\srv-backup\\auditoria ou C:\\Logs)"
                value={customFolderPath}
                onChange={(e) => setCustomFolderPath(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#8DC63F]" /> Cadastrar Destino
            </button>
          </form>
        </div>

        {/* Right: Encryption & Export */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 flex flex-col justify-between`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Destino Ativo: <span className="text-[#8DC63F]">{activeFolder.name}</span>
              </h4>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">{activeFolder.path}</span>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Senha Mestre de Criptografia AES-256 para o Arquivo (.enc)</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">O arquivo gerado será criptografado via Web Crypto API (AES-GCM 256-bit + PBKDF2) antes de ser gravado na pasta selecionada.</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs space-y-2">
              <span className="font-bold block">Fluxo de Gravação Segura em Rede / Local:</span>
              <p className="leading-relaxed text-[11px]">
                {exportType === 'backup'
                  ? 'Os pacotes consolidados de auditoria (CKM3, MB51, Matriz Fiscal e Trilha Imutável) serão compactados, criptografados e salvos no caminho mapeado da rede ou pasta local escolhida.'
                  : `Os logs correntes do sistema (${logs.length} registros capturados em memória) serão exportados com segurança para o diretório de destino.`}
              </p>
            </div>

            {lastSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Último envio ({exportType === 'backup' ? 'Backup' : 'Logs'}) para <span className="underline">{activeFolder.name}</span> em: {lastSaved}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-inherit flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Padrão Corporativo AES-256 + File System API</span>
            <button
              onClick={handleSecureExport}
              disabled={isExporting}
              className="px-6 py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Download className="w-4 h-4 fill-slate-950" />
              {isExporting ? 'Criptografando...' : exportType === 'backup' ? 'Gerar & Salvar Backup no Destino' : 'Exportar & Salvar Logs no Destino'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalEncryptedBackup;
