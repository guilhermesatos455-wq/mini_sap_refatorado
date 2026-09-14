import React, { useState } from 'react';
import { FolderOpen, Lock, ShieldCheck, Download, Key, CheckCircle2, HardDrive, ScrollText } from 'lucide-react';
import { saveBackupLocally } from '../utils/backup';

interface FileSystemBackupManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const FileSystemBackupManager: React.FC<FileSystemBackupManagerProps> = ({ darkMode, addToast }) => {
  const [password, setPassword] = useState('SapSecureAudit2026!');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLogs, setIsSavingLogs] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [lastLogsSaved, setLastLogsSaved] = useState<string | null>(null);

  const handleRunBackup = async () => {
    if (!password.trim()) {
      addToast('A senha de criptografia é obrigatória.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sampleAuditPayload = {
        timestamp: new Date().toISOString(),
        system: 'Mini-SAP Web Auditoria Enterprise',
        modules: ['CKM3', 'MB51', 'SE16N', 'SOX Tickets', 'Brazilian Tax Matrix'],
        status: 'VERIFIED',
        recordsCount: 1420
      };

      const fileName = `sap_audit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const success = await saveBackupLocally(sampleAuditPayload, fileName, password);

      if (success) {
        setLastSaved(new Date().toLocaleString());
        addToast('Backup criptografado (AES-256) salvo com sucesso na pasta local selecionada!', 'success');
      } else {
        addToast('Operação de salvamento cancelada pelo usuário.', 'error');
      }
    } catch (error: any) {
      addToast(`Erro ao salvar backup: ${error.message || error}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLogsLocally = async () => {
    if (!password.trim()) {
      addToast('A senha de criptografia é obrigatória.', 'error');
      return;
    }

    setIsSavingLogs(true);
    try {
      const sampleLogsPayload = {
        timestamp: new Date().toISOString(),
        system: 'Mini-SAP Web Auditoria Enterprise - Audit Logs & Immutable Ledger',
        auditTrail: [
          { index: 1, timestamp: '2026-09-10 02:00:00', action: 'INIT_SYSTEM_BOOT_SAP_1909_2022', user: 'SYSTEM_DAEMON', hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0' },
          { index: 2, timestamp: '2026-09-10 04:15:22', action: 'EXEC_SAP_PING_S4HANA_1909 (Latency: 24ms)', user: 'AUDIT_RFC_1909', hash: 'f8e7d6c5b4a3210fedcba9876543210ffedcba9876543210fedcba987654321f' },
          { index: 3, timestamp: '2026-09-10 06:10:05', action: 'EXPORT_ENCRYPTED_BACKUP_AES256', user: 'guilhermesatos455@gmail.com', hash: '99887766554433221100ffeeeeddccbbaa99887766554433221100ffeeeeddccbb' }
        ],
        status: 'VERIFIED_CHAIN_INTACT'
      };

      const fileName = `sap_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      const success = await saveBackupLocally(sampleLogsPayload, fileName, password);

      if (success) {
        setLastLogsSaved(new Date().toLocaleString());
        addToast('Logs e trilha de auditoria criptografados (AES-256) salvos com sucesso!', 'success');
      } else {
        addToast('Operação de salvamento de logs cancelada pelo usuário.', 'error');
      }
    } catch (error: any) {
      addToast(`Erro ao salvar logs: ${error.message || error}`, 'error');
    } finally {
      setIsSavingLogs(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <FolderOpen className="w-6 h-6 text-[#8DC63F]" /> Backup Local & Logs com File System Access API & AES-256
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Selecione uma pasta na máquina cliente para gravação segura de pacotes de auditoria e trilhas de logs criptografados com a Web Crypto API.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6 max-w-2xl`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
            <HardDrive className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">File System Access API & Criptografia</span>
              Escolha abaixo se deseja exportar o pacote completo de auditoria ou somente a trilha de logs imutáveis com criptografia AES-GCM 256-bit.
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Senha Mestre de Criptografia (AES-256)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
              />
            </div>
          </div>

          {lastSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Último backup salvo em: {lastSaved}
            </div>
          )}

          {lastLogsSaved && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Últimos logs salvos em: {lastLogsSaved}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-inherit flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-slate-400">Padrão PBKDF2 + AES-GCM 256-bit</span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleSaveLogsLocally}
              disabled={isSavingLogs}
              className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50 border border-slate-700"
            >
              <ScrollText className="w-4 h-4 text-blue-400" />
              {isSavingLogs ? 'Salvando Logs...' : 'Salvar Logs (.enc)'}
            </button>
            <button
              onClick={handleRunBackup}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-5 py-3 bg-[#8DC63F] hover:bg-[#78AF32] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Download className="w-4 h-4 fill-slate-950" />
              {isSaving ? 'Salvando Backup...' : 'Salvar Backup Geral'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FileSystemBackupManager;
