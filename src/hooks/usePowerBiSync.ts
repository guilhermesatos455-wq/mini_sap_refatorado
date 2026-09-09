import { useState, useEffect, useCallback } from 'react';
import { 
  getPowerBiStatus, 
  testPowerBiAzureAuth, 
  pushDataToPowerBi, 
  formatAuditRowsForPowerBi,
  PowerBiServerStatus, 
  PowerBiPushResponse,
  PowerBiAuditRow 
} from '../services/powerBiService';
import { Divergencia } from '../types/audit';

export type PowerBiSyncState = 'idle' | 'checking' | 'authenticating' | 'pushing' | 'connected' | 'error';

export interface UsePowerBiSyncReturn {
  status: PowerBiServerStatus | null;
  syncState: PowerBiSyncState;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastRecordCount: number;
  lastDurationMs: number | null;
  errorMessage: string | null;
  tokenValid: boolean;
  checkStatus: () => Promise<void>;
  authenticateAzure: () => Promise<boolean>;
  pushAuditData: (divergencias: Divergencia[], customUrl?: string) => Promise<PowerBiPushResponse | null>;
  pushRawRows: (rows: PowerBiAuditRow[], customUrl?: string) => Promise<PowerBiPushResponse | null>;
}

/**
 * Hook dedicado para gerenciar autenticação OAuth2 com o Azure AD / Power BI
 * e o envio assíncrono de dados de auditoria para a URL de Push em tempo real.
 */
export function usePowerBiSync(): UsePowerBiSyncReturn {
  const [status, setStatus] = useState<PowerBiServerStatus | null>(null);
  const [syncState, setSyncState] = useState<PowerBiSyncState>('idle');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('powerbi_last_synced_at');
    } catch {
      return null;
    }
  });
  const [lastRecordCount, setLastRecordCount] = useState<number>(0);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tokenValid = status?.tokenStatus === 'valid' || Boolean(status?.configured);

  const checkStatus = useCallback(async () => {
    setSyncState('checking');
    try {
      const res = await getPowerBiStatus();
      setStatus(res);
      setSyncState(res.configured ? 'connected' : 'idle');
      if (res.lastError) {
        setErrorMessage(res.lastError);
      }
    } catch (err) {
      setSyncState('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const authenticateAzure = useCallback(async (): Promise<boolean> => {
    setSyncState('authenticating');
    setErrorMessage(null);
    try {
      const res = await testPowerBiAzureAuth();
      if (res.success) {
        await checkStatus();
        return true;
      } else {
        setSyncState('error');
        setErrorMessage(res.error || 'Falha na autenticação OAuth2 com Azure AD.');
        return false;
      }
    } catch (err) {
      setSyncState('error');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      return false;
    }
  }, [checkStatus]);

  const pushRawRows = useCallback(async (rows: PowerBiAuditRow[], customUrl?: string): Promise<PowerBiPushResponse | null> => {
    if (!rows || rows.length === 0) {
      setErrorMessage('Nenhum dado informado para envio.');
      return null;
    }

    setIsSyncing(true);
    setSyncState('pushing');
    setErrorMessage(null);

    const maxAttempts = 3;
    let attempt = 0;
    let response: PowerBiPushResponse | null = null;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        console.info(`[Power BI Sync] Tentativa de envio ${attempt}/${maxAttempts} (${rows.length} registros)...`);
        response = await pushDataToPowerBi(rows, customUrl);
        
        if (response.success) {
          const isoTime = response.timestamp || new Date().toISOString();
          setSyncState('connected');
          setLastSyncedAt(isoTime);
          setLastRecordCount(response.count || rows.length);
          setLastDurationMs(response.durationMs || null);
          try {
            localStorage.setItem('powerbi_last_synced_at', isoTime);
          } catch {}
          return response;
        } else {
          const isRetryable = response.statusCode && response.statusCode >= 500 || !response.statusCode || response.error?.includes('rede') || response.error?.includes('comunicação');
          if (attempt < maxAttempts && isRetryable) {
            console.warn(`[Power BI Sync] Tentativa ${attempt} falhou (${response.error}). Aguardando 5s para nova tentativa automática...`);
            setErrorMessage(`Tentativa ${attempt} falhou. Tentando novamente em 5 segundos...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          } else {
            setSyncState('error');
            setErrorMessage(response.error || 'Falha no push para o Power BI.');
            return response;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isNetworkErr = msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('comunicação') || msg.includes('rede');
        if (attempt < maxAttempts && (isNetworkErr || attempt < maxAttempts)) {
          console.warn(`[Power BI Sync] Tentativa ${attempt} com erro de rede/servidor (${msg}). Aguardando 5s para nova tentativa automática (${attempt}/${maxAttempts})...`);
          setErrorMessage(`Tentativa ${attempt} falhou por erro de rede. Tentando novamente em 5s...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        } else {
          setSyncState('error');
          const criticalMsg = `Erro crítico após ${maxAttempts} tentativas: ${msg}`;
          setErrorMessage(criticalMsg);
          console.error(`[Power BI Sync] ${criticalMsg}`);
          return {
            success: false,
            error: criticalMsg
          };
        }
      }
    }

    setIsSyncing(false);
    return response || { success: false, error: 'Falha após múltiplas tentativas' };
  }, []);

  const pushAuditData = useCallback(async (divergencias: Divergencia[], customUrl?: string): Promise<PowerBiPushResponse | null> => {
    const rows = formatAuditRowsForPowerBi(divergencias);
    return pushRawRows(rows, customUrl);
  }, [pushRawRows]);

  return {
    status,
    syncState,
    isSyncing,
    lastSyncedAt,
    lastRecordCount,
    lastDurationMs,
    errorMessage,
    tokenValid,
    checkStatus,
    authenticateAzure,
    pushAuditData,
    pushRawRows,
  };
}
