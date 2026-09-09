/**
 * Power BI Streaming & Push Dataset Integration Service
 * Gerencia autenticação Azure AD (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
 * e o Push de dados para o Power BI em tempo real (POWERBI_PUSH_URL).
 */

import { Divergencia } from '../types/audit';

export interface PowerBiAuditRow {
  material: string;
  descricao: string;
  fornecedor: string;
  cnpjFornecedor: string;
  centro: string;
  cfop: string;
  numeroNF: string;
  quantidade: number;
  precoUnitarioNF: number;
  custoSAP_CKM3: number;
  variacaoUnitario: number;
  variacaoPercentual: number;
  impactoFinanceiro: number;
  statusAuditoria: string;
  aprovacaoStatus: string;
  categoriaDivergencia: string;
  temRiscoFiscal: boolean;
  auditorResponsavel: string;
  dataEmissaoNF: string;
  timestampTransmissao: string;
}

export interface PowerBiPushResponse {
  success: boolean;
  count?: number;
  durationMs?: number;
  timestamp?: string;
  mode?: 'push_url' | 'azure_rest_api';
  message?: string;
  error?: string;
  details?: string;
  statusCode?: number;
}

export interface PowerBiServerStatus {
  configured: boolean;
  hasEnvVar: boolean;
  maskedUrl: string | null;
  datasetId: string | null;
  hasAzureCredentials?: boolean;
  tenantId?: string | null;
  clientId?: string | null;
  tokenStatus?: 'unauthenticated' | 'valid' | 'expired' | 'error';
  tokenExpiresAt?: string | null;
  lastError?: string | null;
  timestamp: string;
}

export interface AzureAuthTestResponse {
  success: boolean;
  message?: string;
  tokenPrefix?: string;
  expiresAt?: string | null;
  error?: string;
}

export interface PowerBiVerifyResponse {
  success: boolean;
  envVarsValid: boolean;
  pushUrlReachable: boolean | null;
  missingVars: string[];
  details: string[];
  timestamp: string;
}

/**
 * Executa verificação diagnóstica da configuração e alcançabilidade da POWERBI_PUSH_URL e credenciais Azure
 */
export async function verifyPowerBiConnection(): Promise<PowerBiVerifyResponse> {
  const timestamp = new Date().toISOString();
  console.info(`[Power BI] [${timestamp}] Iniciando verificação diagnóstica de configuração e alcançabilidade...`);
  try {
    const res = await fetch('/api/powerbi/verify');
    if (res.ok) {
      const data = await res.json();
      console.info(`[Power BI] [${new Date().toISOString()}] Verificação concluída. Sucesso: ${data.success}, Alcançável: ${data.pushUrlReachable}`);
      return data;
    }
    const errText = `Falha na verificação HTTP (${res.status} ${res.statusText})`;
    console.error(`[Power BI] [${new Date().toISOString()}] ${errText}`);
    return {
      success: false,
      envVarsValid: false,
      pushUrlReachable: false,
      missingVars: [],
      details: [errText],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Power BI] [${new Date().toISOString()}] Exceção na verificação de conexão: ${errMsg}`);
    return {
      success: false,
      envVarsValid: false,
      pushUrlReachable: false,
      missingVars: [],
      details: [errMsg],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Converte a lista de divergências da auditoria para o formato de linhas aceito pelo Power BI
 */
export function formatAuditRowsForPowerBi(
  divergencias: Divergencia[],
  auditorNome: string = 'Auditor Fiscal / NatuAssist'
): PowerBiAuditRow[] {
  const currentIso = new Date().toISOString();

  return divergencias.map(div => {
    const precoNF = Number(div.precoEfetivo ?? div.precoSemFrete ?? 0);
    const precoCKM3 = Number(div.custoPadrao ?? 0);
    const variacaoUnit = precoNF - precoCKM3;
    const variacaoPerc = Number(div.variacaoPerc ?? 0);
    const impacto = Number(div.impactoFinanceiro ?? 0);

    return {
      material: String(div.material || 'N/A'),
      descricao: String(div.descricao || div.material || 'Item de Auditoria'),
      fornecedor: String(div.fornecedor || 'Fornecedor Padrão'),
      cnpjFornecedor: String(div.fornecedor || 'N/A'),
      centro: String(div.empresa || '1000'),
      cfop: String(div.cfop || '1101AA'),
      numeroNF: String(div.numeroNF || '000000'),
      quantidade: Number(div.quantidade || 1),
      precoUnitarioNF: Number(precoNF.toFixed(4)),
      custoSAP_CKM3: Number(precoCKM3.toFixed(4)),
      variacaoUnitario: Number(variacaoUnit.toFixed(4)),
      variacaoPercentual: Number(variacaoPerc.toFixed(2)),
      impactoFinanceiro: Number(impacto.toFixed(2)),
      statusAuditoria: String(div.status || 'Pendente'),
      aprovacaoStatus: String(div.aprovacaoStatus || 'Em Análise'),
      categoriaDivergencia: impacto > 0 ? 'Prejuízo / Acima do Custo' : impacto < 0 ? 'Economia / Abaixo do Custo' : 'Neutro',
      temRiscoFiscal: Math.abs(variacaoPerc) >= 10 || Math.abs(impacto) >= 5000,
      auditorResponsavel: String(div.aprovadoPor?.nome || auditorNome),
      dataEmissaoNF: String(div.dataLancamento || div.data || currentIso.split('T')[0]),
      timestampTransmissao: currentIso
    };
  });
}

/**
 * Consulta o backend para obter o status das credenciais (POWERBI_PUSH_URL e Azure AD)
 */
export async function getPowerBiStatus(): Promise<PowerBiServerStatus> {
  try {
    const res = await fetch('/api/powerbi/status');
    if (res.ok) {
      return await res.json();
    }
    return {
      configured: false,
      hasEnvVar: false,
      maskedUrl: null,
      datasetId: null,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      configured: false,
      hasEnvVar: false,
      maskedUrl: null,
      datasetId: null,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Testa a autenticação OAuth 2.0 com o Azure AD / Entra ID
 */
export async function testPowerBiAzureAuth(credentials?: {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}): Promise<AzureAuthTestResponse> {
  try {
    const res = await fetch('/api/powerbi/test-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials || {}),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || 'Autenticação com Azure AD realizada com sucesso.',
        tokenPrefix: data.tokenPrefix,
        expiresAt: data.expiresAt,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Falha na autenticação com Azure AD',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Dispara a transmissão em tempo real das linhas de auditoria para o Power BI
 */
export async function pushDataToPowerBi(
  rows: PowerBiAuditRow[],
  customPushUrl?: string,
  tableName: string = 'Divergencias_CKM3_MB51'
): Promise<PowerBiPushResponse> {
  const timestamp = new Date().toISOString();
  console.info(`[Power BI] [${timestamp}] Tentando transmitir ${rows.length} registros para o Power BI (Tabela: ${tableName})...`);
  try {
    const res = await fetch('/api/powerbi/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: rows,
        pushUrl: customPushUrl || undefined,
        tableName
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.info(`[Power BI] [${new Date().toISOString()}] Transmissão bem-sucedida de ${rows.length} registros.`);
      return {
        success: true,
        count: data.count || rows.length,
        durationMs: data.durationMs,
        mode: data.mode,
        timestamp: data.timestamp || new Date().toISOString(),
        message: data.message || `${rows.length} registros transmitidos ao Power BI com sucesso.`
      };
    } else {
      const errReason = data.error || 'Falha ao enviar dados para o Power BI';
      console.error(`[Power BI] [${new Date().toISOString()}] Erro na transmissão (${res.status}): ${errReason} - ${data.details || res.statusText}`);
      return {
        success: false,
        error: errReason,
        details: data.details || res.statusText,
        statusCode: res.status,
        durationMs: data.durationMs
      };
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Power BI] [${new Date().toISOString()}] Exceção na transmissão de dados para o Power BI: ${errMsg}`);
    return {
      success: false,
      error: 'Erro de comunicação com o servidor ao transmitir para o Power BI',
      details: errMsg
    };
  }
}

/**
 * Dispara a atualização forçada (refresh) de um conjunto de dados no Power BI Service via REST API
 */
export async function triggerPowerBiRefresh(datasetId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/powerbi/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ datasetId })
    });

    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || 'Refresh disparado com sucesso no Power BI.' };
    } else {
      return { success: false, error: data.error || 'Falha ao disparar refresh.' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Retorna o esquema JSON completo para criação do Push/Streaming Dataset no Power BI Service
 */
export function getPowerBiStreamingSchemaJson(): string {
  return JSON.stringify({
    name: "Auditoria_SAP_RealTime",
    tables: [
      {
        name: "Divergencias_CKM3_MB51",
        columns: [
          { name: "material", dataType: "string" },
          { name: "descricao", dataType: "string" },
          { name: "fornecedor", dataType: "string" },
          { name: "cnpjFornecedor", dataType: "string" },
          { name: "centro", dataType: "string" },
          { name: "cfop", dataType: "string" },
          { name: "numeroNF", dataType: "string" },
          { name: "quantidade", dataType: "Double" },
          { name: "precoUnitarioNF", dataType: "Double" },
          { name: "custoSAP_CKM3", dataType: "Double" },
          { name: "variacaoUnitario", dataType: "Double" },
          { name: "variacaoPercentual", dataType: "Double" },
          { name: "impactoFinanceiro", dataType: "Double" },
          { name: "statusAuditoria", dataType: "string" },
          { name: "aprovacaoStatus", dataType: "string" },
          { name: "categoriaDivergencia", dataType: "string" },
          { name: "temRiscoFiscal", dataType: "Boolean" },
          { name: "auditorResponsavel", dataType: "string" },
          { name: "dataEmissaoNF", dataType: "DateTime" },
          { name: "timestampTransmissao", dataType: "DateTime" }
        ]
      }
    ]
  }, null, 2);
}

/**
 * Medidas DAX prontas para visualização executiva no Power BI
 */
export function getPowerBiDaxMeasures(): string {
  return `
-- 1. Total de Divergências Identificadas
Total Divergencias = COUNTROWS(Divergencias_CKM3_MB51)

-- 2. Impacto Financeiro Total (Prejuízo)
Impacto Total Prejuizo = 
CALCULATE(
    SUM(Divergencias_CKM3_MB51[impactoFinanceiro]),
    Divergencias_CKM3_MB51[impactoFinanceiro] > 0
)

-- 3. Economia Gerada (Abaixo do Custo)
Economia Total = 
CALCULATE(
    ABS(SUM(Divergencias_CKM3_MB51[impactoFinanceiro])),
    Divergencias_CKM3_MB51[impactoFinanceiro] < 0
)

-- 4. Variação Percentual Média Ponderada
Variacao Media = AVERAGE(Divergencias_CKM3_MB51[variacaoPercentual])

-- 5. Total de Itens com Alto Risco Fiscal
Qtd Alto Risco Fiscal = 
CALCULATE(
    COUNTROWS(Divergencias_CKM3_MB51),
    Divergencias_CKM3_MB51[temRiscoFiscal] = TRUE()
)
  `.trim();
}
