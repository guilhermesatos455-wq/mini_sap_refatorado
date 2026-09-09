import { ClientSecretCredential } from '@azure/identity';

export interface PowerBiAuthConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  pushUrl?: string;
  datasetId?: string;
}

export interface CachedToken {
  token: string;
  expiresOnTimestamp: number;
}

export interface PowerBiPushResult {
  success: boolean;
  count: number;
  durationMs: number;
  timestamp: string;
  mode: 'push_url' | 'azure_rest_api';
  message: string;
  error?: string;
  details?: string;
  statusCode?: number;
}

export interface PowerBiDiagnostics {
  hasPushUrl: boolean;
  maskedPushUrl: string | null;
  hasAzureCredentials: boolean;
  tenantId: string | null;
  clientId: string | null;
  datasetId: string | null;
  tokenStatus: 'unauthenticated' | 'valid' | 'expired' | 'error';
  tokenExpiresAt: string | null;
  lastError: string | null;
  timestamp: string;
}

export class PowerBiAuthManager {
  private static instance: PowerBiAuthManager;
  private cachedToken: CachedToken | null = null;
  private lastError: string | null = null;

  private constructor() {}

  public static getInstance(): PowerBiAuthManager {
    if (!PowerBiAuthManager.instance) {
      PowerBiAuthManager.instance = new PowerBiAuthManager();
    }
    return PowerBiAuthManager.instance;
  }

  /**
   * Obtém as configurações atuais a partir das variáveis de ambiente
   */
  public getConfig(): PowerBiAuthConfig {
    return {
      tenantId: process.env.AZURE_TENANT_ID?.trim(),
      clientId: process.env.AZURE_CLIENT_ID?.trim(),
      clientSecret: process.env.AZURE_CLIENT_SECRET?.trim(),
      pushUrl: process.env.POWERBI_PUSH_URL?.trim(),
      datasetId: process.env.POWERBI_DATASET_ID?.trim(),
    };
  }

  /**
   * Obtém token de acesso OAuth 2.0 via Azure AD / Entra ID Client Credentials
   * com gerenciamento de cache e renovação automática.
   */
  public async getAccessToken(customTenantId?: string, customClientId?: string, customClientSecret?: string): Promise<string> {
    const config = this.getConfig();
    const tenantId = customTenantId || config.tenantId;
    const clientId = customClientId || config.clientId;
    const clientSecret = customClientSecret || config.clientSecret;

    if (!tenantId || !clientId || !clientSecret) {
      const missing: string[] = [];
      if (!tenantId) missing.push('AZURE_TENANT_ID');
      if (!clientId) missing.push('AZURE_CLIENT_ID');
      if (!clientSecret) missing.push('AZURE_CLIENT_SECRET');
      throw new Error(`Credenciais do Azure incompletas. Faltam: ${missing.join(', ')}`);
    }

    const now = Date.now();
    // Reutiliza o token em cache se faltar mais de 3 minutos para expirar
    if (this.cachedToken && this.cachedToken.expiresOnTimestamp > now + 3 * 60 * 1000) {
      return this.cachedToken.token;
    }

    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const tokenResponse = await credential.getToken('https://analysis.windows.net/powerbi/api/.default');

      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('Falha ao adquirir Access Token do Azure AD para o Power BI.');
      }

      this.cachedToken = {
        token: tokenResponse.token,
        expiresOnTimestamp: tokenResponse.expiresOnTimestamp,
      };
      this.lastError = null;

      return tokenResponse.token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastError = msg;
      throw new Error(`Erro de autenticação Azure AD: ${msg}`);
    }
  }

  /**
   * Executa a transmissão (push) de dados para o Power BI
   * Suporta:
   * 1. POWERBI_PUSH_URL (Streaming / Push Dataset direto via Webhook)
   * 2. Power BI REST API padrão via Azure OAuth2 Token caso o pushUrl seja da API oficial
   */
  public async pushAuditData(
    data: any,
    customPushUrl?: string,
    tableName: string = 'Divergencias_CKM3_MB51'
  ): Promise<PowerBiPushResult> {
    const startTime = Date.now();
    const config = this.getConfig();
    const targetUrl = customPushUrl?.trim() || config.pushUrl;

    if (!data) {
      throw new Error('Nenhum dado informado para envio ao Power BI.');
    }

    // Prepara payload de linhas
    let rows: any[] = [];
    if (Array.isArray(data)) {
      rows = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data && typeof data === 'object') {
      rows = [data];
    }

    const count = rows.length;

    // Caso 1: Temos uma URL de Push configurada (POWERBI_PUSH_URL ou customizada)
    if (targetUrl) {
      const isAzureRestApi = targetUrl.includes('api.powerbi.com/v1.0') && !targetUrl.includes('key=');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Se for a API REST oficial do Power BI v1.0, injeta o Bearer token do Azure AD
      if (isAzureRestApi) {
        const token = await this.getAccessToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Se o endpoint for streaming da v1.0, o formato é { rows: [...] }, se for streaming direto aceita [...]
      const bodyPayload = targetUrl.includes('beta') || !isAzureRestApi
        ? JSON.stringify(rows)
        : JSON.stringify({ rows });

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: bodyPayload,
      });

      const durationMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          count,
          durationMs,
          timestamp: new Date().toISOString(),
          mode: isAzureRestApi ? 'azure_rest_api' : 'push_url',
          message: `${count} registros de auditoria transmitidos com sucesso para o Power BI em tempo real (${durationMs}ms).`,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          count,
          durationMs,
          timestamp: new Date().toISOString(),
          mode: isAzureRestApi ? 'azure_rest_api' : 'push_url',
          message: 'Falha ao transmitir dados para o Power BI.',
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText || response.statusText,
          statusCode: response.status,
        };
      }
    }

    // Caso 2: Se não houver POWERBI_PUSH_URL, mas temos AZURE credentials e POWERBI_DATASET_ID
    if (config.datasetId && config.tenantId && config.clientId && config.clientSecret) {
      const token = await this.getAccessToken();
      const restUrl = `https://api.powerbi.com/v1.0/myorg/datasets/${config.datasetId}/tables/${tableName}/rows`;

      const response = await fetch(restUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows }),
      });

      const durationMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          count,
          durationMs,
          timestamp: new Date().toISOString(),
          mode: 'azure_rest_api',
          message: `${count} registros transmitidos via Azure REST API para a tabela '${tableName}'.`,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          count,
          durationMs,
          timestamp: new Date().toISOString(),
          mode: 'azure_rest_api',
          message: 'Falha ao transmitir dados via Azure REST API.',
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText,
          statusCode: response.status,
        };
      }
    }

    // Caso 3: Fallback simulado para ambiente de demonstração se nenhuma credencial estiver configurada
    return {
      success: true,
      count,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      mode: 'push_url',
      message: `[Modo Simulação Power BI] ${count} registros processados com sucesso. Configure POWERBI_PUSH_URL ou credenciais Azure para envio real.`,
    };
  }

  /**
   * Dispara o refresh agendado/imediato de um Dataset no Power BI
   */
  public async triggerDatasetRefresh(customDatasetId?: string): Promise<{ success: boolean; message: string; details?: string }> {
    const config = this.getConfig();
    const datasetId = customDatasetId || config.datasetId;

    if (!datasetId) {
      return {
        success: true,
        message: `[Modo Simulação Power BI] Dataset ID não configurado. Refresh simulado com sucesso. Configure POWERBI_DATASET_ID e credenciais do Azure para atualização real.`,
      };
    }

    const token = await this.getAccessToken();
    const refreshUrl = `https://api.powerbi.com/v1.0/myorg/datasets/${datasetId}/refreshes`;

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: `Refresh do Dataset ${datasetId} iniciado com sucesso no Power BI.`,
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Falha ao disparar refresh (HTTP ${response.status}): ${errorText}`);
    }
  }

  /**
   * Retorna diagnóstico detalhado das credenciais e conexão
   */
  public async getDiagnostics(): Promise<PowerBiDiagnostics> {
    const config = this.getConfig();
    const hasPushUrl = Boolean(config.pushUrl && config.pushUrl.length > 0);
    const hasAzureCredentials = Boolean(config.tenantId && config.clientId && config.clientSecret);

    let maskedPushUrl: string | null = null;
    if (hasPushUrl && config.pushUrl) {
      try {
        const parsed = new URL(config.pushUrl);
        maskedPushUrl = `${parsed.origin}${parsed.pathname.slice(0, 20)}...`;
      } catch {
        maskedPushUrl = `${config.pushUrl.slice(0, 25)}...`;
      }
    }

    let tokenStatus: 'unauthenticated' | 'valid' | 'expired' | 'error' = 'unauthenticated';
    let tokenExpiresAt: string | null = null;

    if (this.cachedToken) {
      const now = Date.now();
      if (this.cachedToken.expiresOnTimestamp > now) {
        tokenStatus = 'valid';
        tokenExpiresAt = new Date(this.cachedToken.expiresOnTimestamp).toISOString();
      } else {
        tokenStatus = 'expired';
      }
    }

    return {
      hasPushUrl,
      maskedPushUrl,
      hasAzureCredentials,
      tenantId: config.tenantId ? `${config.tenantId.slice(0, 8)}...` : null,
      clientId: config.clientId ? `${config.clientId.slice(0, 8)}...` : null,
      datasetId: config.datasetId || null,
      tokenStatus,
      tokenExpiresAt,
      lastError: this.lastError,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Diagnostic utility function to verify if POWERBI_PUSH_URL and related authentication
   * environment variables are correctly defined and reachable before attempting initialization.
   */
  public async verifyPowerBiConfigurationAndReachability(): Promise<{
    success: boolean;
    envVarsValid: boolean;
    pushUrlReachable: boolean | null;
    missingVars: string[];
    details: string[];
    timestamp: string;
  }> {
    const config = this.getConfig();
    const details: string[] = [];
    const missingVars: string[] = [];

    // Check env vars
    const hasPushUrl = Boolean(config.pushUrl);
    const hasAzure = Boolean(config.tenantId && config.clientId && config.clientSecret);

    if (!hasPushUrl && !hasAzure) {
      missingVars.push('POWERBI_PUSH_URL (ou AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)');
      details.push(`Nenhuma credencial ou URL de Power BI configurada nas variáveis de ambiente.`);
    } else {
      if (hasPushUrl) {
        details.push(`POWERBI_PUSH_URL detectada.`);
      }
      if (hasAzure) {
        details.push(`Credenciais Azure AD (Tenant ID, Client ID, Client Secret) detectadas.`);
      }
    }

    let pushUrlReachable: boolean | null = null;
    if (hasPushUrl && config.pushUrl) {
      try {
        const parsedUrl = new URL(config.pushUrl);
        // Test reachability with HEAD or OPTIONS or GET (with timeout/abort)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(config.pushUrl, {
          method: 'OPTIONS',
          signal: controller.signal,
        }).catch(async () => {
          // Fallback to GET if OPTIONS fails or is not allowed
          return fetch(config.pushUrl!, {
            method: 'GET',
            signal: controller.signal,
          });
        });

        clearTimeout(timeoutId);
        // 2xx, 400, 405 (Method Not Allowed) indicate endpoint is reachable and responding
        if (res.status < 500) {
          pushUrlReachable = true;
          details.push(`POWERBI_PUSH_URL é alcançável (Status HTTP ${res.status}).`);
        } else {
          pushUrlReachable = false;
          details.push(`POWERBI_PUSH_URL retornou erro de servidor (Status HTTP ${res.status}).`);
        }
      } catch (err) {
        pushUrlReachable = false;
        details.push(`Falha ao conectar na POWERBI_PUSH_URL: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const envVarsValid = hasPushUrl || (hasAzure && Boolean(config.datasetId));
    const success = envVarsValid && (pushUrlReachable !== false);

    return {
      success,
      envVarsValid,
      pushUrlReachable,
      missingVars,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}

export const powerBiAuth = PowerBiAuthManager.getInstance();
