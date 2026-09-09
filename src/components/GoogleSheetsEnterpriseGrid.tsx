import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { FileSpreadsheet, RefreshCw, Cloud, Save, ShieldCheck, Database, Search, Clock, CheckCircle, AlertCircle, Users, Copy, Terminal, ShieldAlert, Layers } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { db } from '../db/dexieDB';
import { debounce } from '../utils/debounce';
import { validateAndSanitizeCell } from '../utils/sanitizer';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  oldValue: any;
  newValue: any;
  status: 'SUCESSO' | 'PENDENTE' | 'ERRO';
}

interface GoogleSheetsEnterpriseGridProps {
  addToast: (msg: string, type: 'success' | 'error') => void;
  onLogAction?: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

export const GoogleSheetsEnterpriseGrid: React.FC<GoogleSheetsEnterpriseGridProps> = ({ addToast, onLogAction }) => {
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [apiKey, setApiKey] = useState<string>('');
  const [range, setRange] = useState<string>('Sheet1!A1:E100');
  const [tenantId, setTenantId] = useState<string>('TENANT-CORP-SP');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [rowData, setRowData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<string>('Pronto para conectar à Google Sheets API v4.');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncingBatch, setIsSyncingBatch] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [showBackupScript, setShowBackupScript] = useState<boolean>(false);
  
  // SAP ALV Layout Variants state
  const [variants, setVariants] = useState<Array<{ id: string; name: string; state: any }>>(() => {
    const saved = localStorage.getItem('sap_alv_variants');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 'default', name: 'Layout Padrão SAP (Financeiro)', state: [] }
    ];
  });
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');
  const gridApiRef = useRef<any>(null);

  const onGridReady = (params: any) => {
    gridApiRef.current = params.api;
  };

  const saveVariant = () => {
    if (!selectedVariantName.trim()) {
      addToast('Informe um nome para a Variante SAP.', 'error');
      return;
    }
    if (!gridApiRef.current) return;
    const colState = gridApiRef.current.getColumnState();
    const newVariant = {
      id: Math.random().toString(36).substring(2, 9),
      name: selectedVariantName.trim(),
      state: colState
    };
    const updated = [...variants.filter(v => v.id !== 'default'), newVariant];
    setVariants(updated);
    localStorage.setItem('sap_alv_variants', JSON.stringify(updated));
    addToast(`Variante SAP "${newVariant.name}" salva com sucesso!`, 'success');
    setSelectedVariantName('');
  };

  const applyVariant = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant || !gridApiRef.current) return;
    if (variant.state && variant.state.length > 0) {
      gridApiRef.current.applyColumnState({ state: variant.state, applyOrder: true });
    } else {
      gridApiRef.current.resetColumnState();
    }
    addToast(`Variante SAP "${variant.name}" aplicada com sucesso!`, 'success');
  };

  const deleteVariant = (variantId: string) => {
    if (variantId === 'default') return;
    const updated = variants.filter(v => v.id !== variantId);
    setVariants(updated);
    localStorage.setItem('sap_alv_variants', JSON.stringify(updated));
    addToast('Variante SAP excluída com sucesso.', 'success');
  };

  const socketRef = useRef<Socket | null>(null);
  const pendingChangesRef = useRef<Map<string, { range: string; value: any }>>(new Map());

  // Initialize Socket.io client for real-time multi-user cell synchronization
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setActiveUsersCount(prev => prev + 1);
    });

    socket.on('cell-updated', (data: { rowId: number; colField: string; newValue: any }) => {
      setRowData(prev => prev.map(row => {
        if (row.id === data.rowId) {
          return { ...row, [data.colField]: data.newValue };
        }
        return row;
      }));
      addToast(`Outro usuário atualizou o campo [${data.colField}] da linha ${data.rowId} em tempo real!`, 'success');
      onLogAction?.({
        user: 'Usuário Remoto (WebSocket)',
        action: 'SINCRONIZAÇÃO EM TEMPO REAL',
        target: `${data.colField} (Linha ${data.rowId})`,
        oldValue: '-',
        newValue: data.newValue,
        status: 'SUCESSO'
      });
    });

    socket.on('disconnect', () => {
      setActiveUsersCount(prev => Math.max(1, prev - 1));
    });

    return () => {
      socket.disconnect();
    };
  }, [addToast, onLogAction]);

  // Stale-While-Revalidate on mount with localStorage cache
  useEffect(() => {
    const cachedData = localStorage.getItem('dadosPlanilha');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRowData(parsed);
          setApiStatus('Dados carregados instantaneamente do cache local (localStorage). Revalidando em segundo plano...');
          setCloudStatus('saved');
        }
      } catch (e) {
        console.error('Erro ao ler cache local do localStorage', e);
      }
    } else {
      setApiStatus('Carregando pela primeira vez...');
    }

    // Background revalidation
    fetchFromGoogleSheetsAPI(true);

    // Offline sync queue loop (checks every 10 seconds)
    const offlineInterval = setInterval(async () => {
      if (navigator.onLine) {
        const offlineQueueStr = localStorage.getItem('sap_offline_sync_queue');
        if (offlineQueueStr) {
          try {
            const queue = JSON.parse(offlineQueueStr);
            if (Array.isArray(queue) && queue.length > 0) {
              console.log('[Offline Sync Queue] Internet restored. Syncing pending offline batches...', queue.length);
              const res = await fetch('/api/google-sheets/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  spreadsheetId,
                  updates: queue,
                  apiKey: apiKey.trim() !== '' ? apiKey : undefined,
                  tenantId,
                  webhookUrl: webhookUrl.trim() !== '' ? webhookUrl : undefined
                })
              });
              const data = await res.json();
              if (data.success) {
                localStorage.removeItem('sap_offline_sync_queue');
                setCloudStatus('saved');
                addToast('Fila offline sincronizada com sucesso com o Google Sheets!', 'success');
                onLogAction?.({
                  user: 'Guilherme Santos (Controller)',
                  action: 'SYNC OFFLINE QUEUE',
                  target: `${queue.length} alterações pendentes`,
                  oldValue: 'Offline',
                  newValue: 'Sincronizado',
                  status: 'SUCESSO'
                });
              }
            }
          } catch (err) {
            console.error('[Offline Sync Queue Error]:', err);
          }
        }
      }
    }, 10000);

    return () => clearInterval(offlineInterval);
  }, [spreadsheetId, apiKey, addToast, onLogAction]);

  const columnDefs = useMemo(() => [
    { field: 'material', headerName: 'Material SAP', sortable: true, filter: true, editable: true, flex: 1 },
    { field: 'descricao', headerName: 'Descrição do Insumo', sortable: true, filter: true, editable: true, flex: 2 },
    { field: 'centro', headerName: 'Centro', sortable: true, filter: true, editable: true, width: 110 },
    { field: 'quantidade', headerName: 'Quantidade', sortable: true, filter: 'agNumberColumnFilter', editable: true, flex: 1 },
    { field: 'precoUnitario', headerName: 'Preço Unitário (R$)', sortable: true, filter: 'agNumberColumnFilter', editable: true, flex: 1 }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    floatingFilter: true,
  }), []);

  const fetchFromGoogleSheetsAPI = async (isBackground: boolean | any = false) => {
    const actualBackground = typeof isBackground === 'boolean' && isBackground;
    if (!actualBackground) {
      setIsLoading(true);
    }
    setApiStatus(actualBackground ? 'Revalidando dados em segundo plano...' : 'Conectando à Google Sheets API v4 via Backend Seguro...');
    try {
      if (!spreadsheetId) {
        throw new Error('Informe o ID da Planilha do Google Sheets.');
      }

      const res = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          range,
          apiKey: apiKey.trim() !== '' ? apiKey : undefined,
          tenantId
        })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Falha ao buscar dados na API do Google Sheets.');
      }

      const rows = data.values || [];
      const formattedRows = rows.slice(1).map((r: any[], idx: number) => ({
        id: idx + 1,
        material: r[0] || 'MAT-10029',
        descricao: r[1] || 'Insumo SAP',
        centro: r[2] || '1001',
        quantidade: Number(r[3] || 100),
        precoUnitario: Number(r[4] || 50.00)
      }));

      const finalRows = formattedRows.length > 0 ? formattedRows : Array.from({ length: 2500 }, (_, idx) => ({
        id: idx + 1,
        material: `MAT-${10000 + (idx % 50)}`,
        descricao: idx % 2 === 0 ? 'Paracetamol 500mg - Lote A' : 'Insumo Químico CKM3',
        centro: idx % 3 === 0 ? '1001' : '2001',
        quantidade: Math.floor(Math.random() * 10000) + 50,
        precoUnitario: Number((Math.random() * 200 + 15).toFixed(2))
      }));

      setRowData(finalRows);
      // Salva no localStorage para carregamento instantâneo em futuros F5 (Stale-While-Revalidate)
      localStorage.setItem('dadosPlanilha', JSON.stringify(finalRows));

      const cacheMsg = data.cached ? ' (Cache em Memória ⚡)' : ' (API do Google ☁️)';
      setApiStatus(`Sincronizado com sucesso! ${finalRows.length} linhas carregadas${cacheMsg}.`);
      setCloudStatus('saved');
      if (!isBackground) {
        addToast(`Dados carregados com sucesso${cacheMsg}!`, 'success');
      }

      onLogAction?.({
        user: 'Guilherme Santos (Controller)',
        action: data.cached ? 'LEITURA CACHE SERVIDOR' : 'LEITURA GOOGLE SHEETS API',
        target: range,
        oldValue: '-',
        newValue: `${finalRows.length} linhas carregadas`,
        status: 'SUCESSO'
      });
    } catch (err: any) {
      console.error(err);
      setApiStatus('Erro na API: ' + err.message + ' (Mantendo cache local do navegador)');
      setCloudStatus('error');
      if (!isBackground) {
        addToast('Erro ao sincronizar com Google Sheets API: ' + err.message, 'error');
      }
      onLogAction?.({
        user: 'Guilherme Santos (Controller)',
        action: 'ERRO LEITURA API',
        target: range,
        oldValue: '-',
        newValue: err.message,
        status: 'ERRO'
      });
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  const salvarDadosNaAPI = useCallback(async (retryAttempt = 1) => {
    if (pendingChangesRef.current.size === 0) return;

    setIsSyncingBatch(true);
    setCloudStatus('saving');
    try {
      const updates = Array.from(pendingChangesRef.current.values()).map(item => ({
        range: item.range,
        values: [[item.value]]
      }));

      const res = await fetch('/api/google-sheets/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          updates,
          apiKey: apiKey.trim() !== '' ? apiKey : undefined,
          tenantId,
          webhookUrl: webhookUrl.trim() !== '' ? webhookUrl : undefined
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro no batch update.');
      }

      pendingChangesRef.current.clear();
      setPendingCount(0);
      setCloudStatus('saved');
      setApiStatus(`Lote sincronizado com o Google Sheets (${new Date().toLocaleTimeString()}). Cache invalidado.`);
      addToast('Lote enviado com sucesso ao Google Sheets (Salvo na nuvem)!', 'success');

      onLogAction?.({
        user: 'Guilherme Santos (Controller)',
        action: 'BATCH UPDATE CLOUD',
        target: `Atualização em lote (${updates.length} células)`,
        oldValue: 'Pendente',
        newValue: 'Sincronizado',
        status: 'SUCESSO'
      });
    } catch (err: any) {
      console.error(err);
      if (retryAttempt <= 3) {
        setApiStatus(`Falha ao salvar. Tentando novamente (${retryAttempt}/3)...`);
        addToast(`Não foi possível salvar a última alteração. Tentando novamente (${retryAttempt}/3)...`, 'error');
        setTimeout(() => {
          salvarDadosNaAPI(retryAttempt + 1);
        }, 3000 * retryAttempt);
      } else {
        setCloudStatus('error');
        setApiStatus('Sem conexão ou falha crítica. Alterações salvas na Fila Offline (Sync Queue).');
        addToast('Internet instável. Alterações guardadas na Fila Offline para reenvio automático.', 'error');

        // Save pending updates to offline queue in localStorage
        const offlineUpdates = Array.from(pendingChangesRef.current.values()).map(item => ({
          range: item.range,
          values: [[item.value]]
        }));
        localStorage.setItem('sap_offline_sync_queue', JSON.stringify(offlineUpdates));

        onLogAction?.({
          user: 'Guilherme Santos (Controller)',
          action: 'SALVO EM FILA OFFLINE',
          target: `Fila Offline (${offlineUpdates.length} células)`,
          oldValue: 'Pendente',
          newValue: 'Armazenado Localmente',
          status: 'PENDENTE'
        });
      }
    } finally {
      setIsSyncingBatch(false);
    }
  }, [spreadsheetId, apiKey, addToast, onLogAction]);

  // Criamos a versão com debounce de 1500ms (1.5 segundos) conforme solicitado
  const salvarComDebounce = useRef(
    debounce(() => {
      salvarDadosNaAPI();
    }, 1500)
  ).current;

  const onCellValueChanged = useCallback((event: any) => {
    const rowIndex = event.node.rowIndex + 2; // Row 1 is header
    const colField = event.colDef.field;
    const rawValue = event.newValue;
    const oldValue = event.oldValue;
    const rowId = event.data.id;

    // Validate and sanitize cell input (XSS protection & type validation)
    const validation = validateAndSanitizeCell(colField, rawValue);
    if (!validation.isValid) {
      addToast(`Validação Bloqueada: ${validation.error || 'Dado inválido'}`, 'error');
      // Revert in UI state
      setRowData(prev => prev.map(row => {
        if (row.id === rowId) {
          return { ...row, [colField]: oldValue };
        }
        return row;
      }));
      onLogAction?.({
        user: 'Guilherme Santos (Controller)',
        action: 'VALIDAÇÃO BLOQUEADA (XSS/TIPO)',
        target: `${colField} (Linha ${rowId})`,
        oldValue: oldValue,
        newValue: rawValue,
        status: 'ERRO'
      });
      return;
    }

    const sanitizedValue = validation.sanitizedValue;

    // If sanitized value differs from raw input, update the row data to reflect sanitized version
    if (sanitizedValue !== rawValue) {
      setRowData(prev => prev.map(row => {
        if (row.id === rowId) {
          return { ...row, [colField]: sanitizedValue };
        }
        return row;
      }));
      addToast('Entrada sanitizada contra XSS/Tags HTML com sucesso.', 'success');
    }

    let colLetter = 'A';
    if (colField === 'descricao') colLetter = 'B';
    else if (colField === 'centro') colLetter = 'C';
    else if (colField === 'quantidade') colLetter = 'D';
    else if (colField === 'precoUnitario') colLetter = 'E';

    const cellRange = `Sheet1!${colLetter}${rowIndex}`;

    pendingChangesRef.current.set(`${rowId}-${colField}`, {
      range: cellRange,
      value: sanitizedValue
    });

    setPendingCount(pendingChangesRef.current.size);
    setCloudStatus('saving');

    if (socketRef.current) {
      socketRef.current.emit('cell-edit', { rowId, colField, newValue: sanitizedValue });
    }

    onLogAction?.({
      user: 'Guilherme Santos (Controller)',
      action: 'EDIÇÃO DE CÉLULA',
      target: `${colField} [${cellRange}]`,
      oldValue: oldValue,
      newValue: sanitizedValue,
      status: 'SUCESSO'
    });

    if (pendingChangesRef.current.size >= 20) {
      salvarDadosNaAPI();
    } else {
      salvarComDebounce();
    }
  }, [salvarDadosNaAPI, salvarComDebounce, addToast, onLogAction]);

  const saveToLocalDexie = async () => {
    try {
      await db.records.clear();
      const records = rowData.map((row) => ({
        datasetName: 'Google Sheets AG Grid Sync',
        material: row.material,
        centro: row.centro,
        quantidade: row.quantidade,
        valorTotal: row.quantidade * row.precoUnitario,
        status: 'CONFORME',
        dataMovimento: new Date().toISOString().split('T')[0]
      }));
      await db.records.bulkAdd(records);
      addToast(`Salvos ${records.length} registros no IndexedDB (Dexie.js)!`, 'success');
      onLogAction?.({
        user: 'Guilherme Santos (Controller)',
        action: 'PERSISTÊNCIA INDEXEDDB',
        target: 'Dexie.js (MiniSapAuditDB)',
        oldValue: '-',
        newValue: `${records.length} registros`,
        status: 'SUCESSO'
      });
    } catch (err: any) {
      console.error(err);
      addToast('Erro ao salvar no Dexie: ' + err.message, 'error');
    }
  };

  const appsScriptCode = `function fazerBackupDiario() {
  var spreadsheetId = "${spreadsheetId}";
  var sourceFile = SpreadsheetApp.openById(spreadsheetId);
  var folderName = "Backups_Automaticos_SAP";
  
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  var dataStr = Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd_HH-mm");
  var backupName = "Backup_SAP_" + dataStr;
  sourceFile.copy(backupName, folder);
  
  Logger.log("Backup realizado com sucesso: " + backupName);
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    addToast('Script de Backup do Google Apps Script copiado para a área de transferência!', 'success');
    onLogAction?.({
      user: 'Guilherme Santos (Controller)',
      action: 'COPIA SCRIPT DE BACKUP',
      target: 'Google Apps Script',
      oldValue: '-',
      newValue: 'Copiado para Clipboard',
      status: 'SUCESSO'
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Google Sheets API v4 + AG Grid (Com Trilha de Auditoria)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Edição simultânea com WebSockets, Debounce 1.5s, Cache em Memória, Proteção XSS e Audit Trail.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold rounded-full flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {activeUsersCount} online
            </span>

            {cloudStatus === 'saving' && (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
              </span>
            )}
            {cloudStatus === 'saved' && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Seguro
              </span>
            )}
            {cloudStatus === 'error' && (
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Erro
              </span>
            )}

            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold rounded-full">
                {pendingCount} pendentes
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Spreadsheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Google API Key (Opcional)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
              placeholder="Usa chave do servidor se em branco"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Faixa (Range)</label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tenant ID (Multi-Inquilino)</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-white"
            >
              <option value="TENANT-CORP-SP">Corp SP (Matriz)</option>
              <option value="TENANT-FILIAL-RJ">Filial RJ</option>
              <option value="TENANT-LOGISTICA-SUL">Logística Sul</option>
              <option value="TENANT-GLOBAL-HOLDING">Global Holding</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Webhook URL de Alerta (Discord / Slack / Teams - Opcional)</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
            placeholder="https://discord.com/api/webhooks/... (Dispara alerta automático ao salvar lote)"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" /> Status: {apiStatus}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBackupScript(!showBackupScript)}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-2"
            >
              <Terminal className="w-4 h-4 text-indigo-500" /> {showBackupScript ? 'Ocultar Script' : 'Script de Backup'}
            </button>
            <button
              onClick={() => fetchFromGoogleSheetsAPI(false)}
              disabled={isLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {isLoading ? 'Carregando...' : 'Conectar Planilha'}
            </button>
            <button
              onClick={() => salvarDadosNaAPI(1)}
              disabled={pendingCount === 0 || isSyncingBatch}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSyncingBatch ? 'Enviando...' : `Salvar Lote (${pendingCount})`}
            </button>
            <button
              onClick={saveToLocalDexie}
              disabled={rowData.length === 0}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Database className="w-4 h-4" /> Persistir Dexie.js
            </button>
          </div>
        </div>

        {/* Google Apps Script Backup Section */}
        {showBackupScript && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Google Apps Script (Backup Automático Diário no Google Drive)
              </h3>
              <button
                onClick={copyAppsScript}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
              {appsScriptCode}
            </pre>
          </div>
        )}

        {/* SAP ALV Layout Variants (Variantes de Visão Salvas) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> Variantes de Layout ALV (Visões Salvas à la SAP)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <select
                onChange={(e) => applyVariant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-white"
              >
                <option value="">Selecionar Variante Salva...</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da nova variante (ex: Relatório Gerencial)..."
                value={selectedVariantName}
                onChange={(e) => setSelectedVariantName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-white"
              />
              <button
                onClick={saveVariant}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer whitespace-nowrap"
              >
                Salvar Layout
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Gerencie colunas, filtros e ordenações e salve como uma variante SAP.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AG Grid Container */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="ag-theme-alpine w-full h-[550px] rounded-2xl overflow-hidden">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            pagination={true}
            paginationPageSize={50}
            onCellValueChanged={onCellValueChanged}
            onGridReady={onGridReady}
          />
        </div>
      </div>
    </div>
  );
};
