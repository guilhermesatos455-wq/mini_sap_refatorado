import { generateWordTechnicalReport } from '../utils/officeTemplates';

export interface OfficeAiContext {
  resultado?: any;
  periodo?: string;
  planta?: string;
  auditor?: string;
  config?: {
    teamsWebhook?: string;
    outlookEmail?: string;
    sharepointFolder?: string;
  };
}

export interface OfficeAiResponse {
  success: boolean;
  taskType: 'GENERATE_WORD_REPORT' | 'SEND_TEAMS_ALERT' | 'DRAFT_OUTLOOK_EMAIL' | 'BUILD_EXCEL_AUDIT' | 'SHAREPOINT_CHECKIN' | 'FULL_OFFICE_PACK' | 'GENERAL_ADVICE';
  summary: string;
  details: string;
  wordReport?: {
    titulo: string;
    codigoParecer: string;
    planta: string;
    auditorNome: string;
    impactoFinanceiro: number;
    totalDivergencias: number;
    parecerConclusivo: string;
    recomendacoes: string[];
    itensCriticos: Array<{
      material: string;
      descricao: string;
      cfop: string;
      fornecedor: string;
      custoPadrao: number;
      precoEfetivo: number;
      variacaoPerc: number;
      impactoFinanceiro: number;
    }>;
  };
  teamsCard?: {
    webhookUrl?: string;
    card: any;
  };
  emailDraft?: {
    to: string;
    subject: string;
    html: string;
    text: string;
    priority: 'Alta' | 'Normal' | 'Urgente';
  };
  excelWorkbook?: {
    fileName: string;
    sheetName: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    formulas: Array<{ cell: string; formula: string; description: string }>;
  };
  sharepointSync?: {
    folderPath: string;
    fileName: string;
    soxRiskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
    retentionPolicy: string;
    approvalStatus: string;
  };
  suggestedActions?: string[];
}

export async function requestOfficeAi(prompt: string, context?: OfficeAiContext): Promise<OfficeAiResponse> {
  const response = await fetch('/api/ai/office-copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Downloads generated Word technical report directly in the browser (.doc MSO HTML format)
 */
export function downloadOfficeWordReport(wordData: NonNullable<OfficeAiResponse['wordReport']>) {
  const htmlContent = generateWordTechnicalReport({
    titulo: wordData.titulo,
    codigoParecer: wordData.codigoParecer,
    planta: wordData.planta,
    auditorNome: wordData.auditorNome,
    impactoFinanceiro: wordData.impactoFinanceiro,
    totalDivergencias: wordData.totalDivergencias,
    parecerConclusivo: wordData.parecerConclusivo,
    recomendacoes: wordData.recomendacoes,
    itensCriticos: wordData.itensCriticos,
  });

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Parecer_Tecnico_Word_${(wordData.codigoParecer || 'PAR').replace(/[/\\:]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads generated Excel worksheet (.csv with semicolon for Brazilian Excel or HTML XML)
 */
export function downloadOfficeExcelSheet(excelData: NonNullable<OfficeAiResponse['excelWorkbook']>) {
  const headers = excelData.headers.join(';');
  const rows = excelData.rows.map(r => r.join(';')).join('\n');
  const csvContent = `${headers}\n${rows}`;

  const blob = new Blob(['\ufeff', csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = excelData.fileName || 'Auditoria_CKM3_Variacoes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dispatches Adaptive Card payload to Microsoft Teams via API
 */
export async function sendTeamsAdaptiveCard(webhookUrl: string, card: any) {
  const response = await fetch('/api/office/teams-adaptive-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl, card }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao disparar Adaptive Card');
  }

  return response.json();
}

/**
 * Sends Outlook Email via Backend
 */
export async function sendOutlookEmail(draft: NonNullable<OfficeAiResponse['emailDraft']>) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: draft.to,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao enviar e-mail via Outlook/Exchange');
  }

  return response.json();
}

/**
 * Synchronizes document to SharePoint / OneDrive
 */
export async function syncToSharePoint(data: { siteUrl?: string; folderPath?: string; fileName?: string; author?: string }) {
  const response = await fetch('/api/office/sharepoint-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao sincronizar com SharePoint');
  }

  return response.json();
}
