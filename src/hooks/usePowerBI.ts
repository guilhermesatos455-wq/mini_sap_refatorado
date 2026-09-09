import { useState, useEffect, useCallback } from 'react';
import { getPowerBiStatus, verifyPowerBiConnection, PowerBiServerStatus, PowerBiVerifyResponse } from '../services/powerBiService';

export interface UsePowerBIReturn {
  status: PowerBiServerStatus | null;
  diagnostic: PowerBiVerifyResponse | null;
  isLoading: boolean;
  isConfigured: boolean;
  isReachable: boolean | null;
  errorMessage: string | null;
  validateConnection: () => Promise<PowerBiVerifyResponse>;
  refreshStatus: () => Promise<void>;
}

/**
 * Custom hook 'usePowerBI' to validate the existence of the push URL
 * and required credentials before rendering manager controls or attempting connections.
 */
export function usePowerBI(): UsePowerBIReturn {
  const [status, setStatus] = useState<PowerBiServerStatus | null>(null);
  const [diagnostic, setDiagnostic] = useState<PowerBiVerifyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfigured = Boolean(
    status?.configured || 
    status?.hasEnvVar || 
    status?.hasAzureCredentials ||
    diagnostic?.envVarsValid
  );

  const isReachable = diagnostic?.pushUrlReachable ?? null;

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const [serverStatus, verifyRes] = await Promise.all([
        getPowerBiStatus().catch(() => null),
        verifyPowerBiConnection().catch(() => null)
      ]);

      if (serverStatus) {
        setStatus(serverStatus);
      }
      if (verifyRes) {
        setDiagnostic(verifyRes);
      }
      if (serverStatus?.lastError) {
        setErrorMessage(serverStatus.lastError);
      } else {
        setErrorMessage(null);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateConnection = useCallback(async (): Promise<PowerBiVerifyResponse> => {
    setIsLoading(true);
    try {
      const res = await verifyPowerBiConnection();
      setDiagnostic(res);
      if (!res.success && res.missingVars.length > 0) {
        setErrorMessage(`Power BI não configurado: Faltam ${res.missingVars.join(', ')}`);
      } else {
        setErrorMessage(null);
      }
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      const failedRes: PowerBiVerifyResponse = {
        success: false,
        envVarsValid: false,
        pushUrlReachable: false,
        missingVars: ['Erro de comunicação'],
        details: [msg],
        timestamp: new Date().toISOString()
      };
      setDiagnostic(failedRes);
      return failedRes;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    diagnostic,
    isLoading,
    isConfigured,
    isReachable,
    errorMessage,
    validateConnection,
    refreshStatus
  };
}
