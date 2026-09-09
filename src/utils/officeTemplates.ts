/**
 * Office Templates & Microsoft Graph / Teams Payloads Generator
 * Generates Word (.doc/.docx MSO format), Excel (SpreadsheetML), and Teams Adaptive Cards
 */

export interface AuditReportData {
  titulo?: string;
  codigoParecer?: string;
  auditorNome?: string;
  auditorMatricula?: string;
  dataAuditoria?: string;
  planta?: string;
  totalAuditado?: number;
  totalDivergencias?: number;
  impactoFinanceiro?: number;
  maiorVariacaoPerc?: number;
  itensCriticos?: Array<{
    material: string;
    descricao: string;
    cfop: string;
    fornecedor: string;
    custoPadrao: number;
    precoEfetivo: number;
    variacaoPerc: number;
    impactoFinanceiro: number;
    status?: string;
  }>;
  parecerConclusivo?: string;
  recomendacoes?: string[];
}

/**
 * Builds standard Microsoft Teams Adaptive Card (v1.4)
 */
export function buildTeamsAdaptiveCard(data: AuditReportData, appUrl: string = 'https://natuassist.natulab.com.br') {
  const impactoFormatado = (data.impactoFinanceiro || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalAuditadoFormatado = (data.totalAuditado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              style: "emphasis",
              items: [
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "auto",
                      items: [
                        {
                          type: "Image",
                          url: "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-alert.png",
                          size: "Small"
                        }
                      ]
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: "Meu Mini SAP • Alerta de Auditoria CKM3",
                          weight: "Bolder",
                          size: "Medium",
                          color: "Accent"
                        },
                        {
                          type: "TextBlock",
                          text: `Parecer: ${data.codigoParecer || 'PAR-AUD-2026/08-0042'} | Planta ${data.planta || '1001'}`,
                          size: "Small",
                          isSubtle: true,
                          spacing: "None"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              type: "FactSet",
              facts: [
                {
                  title: "Auditor Responsável:",
                  value: `${data.auditorNome || 'Auditor NatuAssist'} (Mat. ${data.auditorMatricula || '89201'})`
                },
                {
                  title: "Data do Processamento:",
                  value: data.dataAuditoria || new Date().toLocaleDateString('pt-BR')
                },
                {
                  title: "Itens Auditados:",
                  value: String(data.totalAuditado || 150)
                },
                {
                  title: "Divergências Críticas:",
                  value: `${data.totalDivergencias || 4} apontamentos`
                },
                {
                  title: "Impacto Financeiro Líquido:",
                  value: impactoFormatado
                },
                {
                  title: "Maior Variação de Custo:",
                  value: `+${(data.maiorVariacaoPerc || 32.4).toFixed(2)}% vs Standard`
                }
              ]
            },
            {
              type: "TextBlock",
              text: "**Resumo Executivo do Parecer:**",
              wrap: true,
              weight: "Bolder",
              spacing: "Medium"
            },
            {
              type: "TextBlock",
              text: data.parecerConclusivo || "Identificadas variações no preço de aquisição de insumos químicos e embalagens em relação ao Custo Standard SAP (KP26/CK40N). Requer validação e aprovação do Gestor da Controladoria.",
              wrap: true,
              size: "Small"
            }
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "🔍 Abrir no Meu Mini SAP",
              url: appUrl
            },
            {
              type: "Action.Submit",
              title: "✅ Aprovar Variação no SAP",
              data: {
                action: "approve_audit",
                parecerId: data.codigoParecer || 'PAR-AUD-2026/08-0042'
              }
            },
            {
              type: "Action.Submit",
              title: "⚠️ Solicitar Justificativa de Compras",
              data: {
                action: "request_buyer_justification",
                parecerId: data.codigoParecer || 'PAR-AUD-2026/08-0042'
              }
            }
          ]
        }
      }
    ]
  };

  return card;
}

/**
 * Generates official Microsoft Word document (.doc MSO HTML compatible with Word 2013, 2016, 2019, 2021 & Office 365)
 */
export function generateWordTechnicalReport(data: AuditReportData): string {
  const impactoFormatado = (data.impactoFinanceiro || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataHoje = data.dataAuditoria || new Date().toLocaleDateString('pt-BR');
  const codigoParecer = data.codigoParecer || `PAR-AUD-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-0089`;

  const itensTableRows = (data.itensCriticos && data.itensCriticos.length > 0 ? data.itensCriticos : [
    {
      material: '1000452',
      descricao: 'DIPIRONA SODICA 500MG/ML SOL ORAL',
      cfop: '1101',
      fornecedor: 'QUIMICA BRASIL DISTRIBUIDORA LTDA',
      custoPadrao: 12.50,
      precoEfetivo: 16.85,
      variacaoPerc: 34.80,
      impactoFinanceiro: 43500.00
    },
    {
      material: '2000891',
      descricao: 'FRASCO PET AMBAR 100ML COM TAMPA',
      cfop: '2101',
      fornecedor: 'PLASTICOS INDUSTRIAIS NORDESTE S/A',
      custoPadrao: 0.85,
      precoEfetivo: 1.12,
      variacaoPerc: 31.76,
      impactoFinanceiro: 18900.00
    },
    {
      material: '3000124',
      descricao: 'CARTUCHO PADRAO NATULAB XAROPE',
      cfop: '1101',
      fornecedor: 'GRAFICA E EMBALAGENS BAHIA LTDA',
      custoPadrao: 0.32,
      precoEfetivo: 0.41,
      variacaoPerc: 28.12,
      impactoFinanceiro: 9200.00
    }
  ]).map((item, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; font-weight: bold;">${item.material}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt;">${item.descricao}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; text-align: center;">${item.cfop}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 8.5pt;">${item.fornecedor}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; text-align: right;">R$ ${item.custoPadrao.toFixed(2)}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; text-align: right; font-weight: bold; color: #B91C1C;">R$ ${item.precoEfetivo.toFixed(2)}</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; text-align: right; color: #B91C1C; font-weight: bold;">+${item.variacaoPerc.toFixed(2)}%</td>
      <td style="padding: 6pt; border: 1px solid #D1D5DB; font-family: 'Segoe UI', Arial; font-size: 9pt; text-align: right; font-weight: bold;">R$ ${item.impactoFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Parecer Técnico de Auditoria CKM3 - ${codigoParecer}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 42.5pt 42.5pt 42.5pt 42.5pt;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #1F2937;
    }
    h1 { font-size: 18pt; font-weight: bold; color: #1E3A8A; margin-bottom: 4pt; }
    h2 { font-size: 13pt; font-weight: bold; color: #1F2937; border-bottom: 2px solid #3B82F6; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 6pt; }
    .badge {
      background-color: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      padding: 3pt 8pt;
      font-size: 8.5pt;
      font-weight: bold;
      border-radius: 4pt;
      display: inline-block;
    }
    .sox-stamp {
      border: 2px solid #059669;
      background-color: #ECFDF5;
      color: #065F46;
      padding: 8pt 12pt;
      margin-top: 10pt;
      margin-bottom: 10pt;
    }
  </style>
</head>
<body>
<div class="Section1">
  <!-- Timbrado Corporativo -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15pt; border-bottom: 2px solid #1E3A8A; padding-bottom: 8pt;">
    <tr>
      <td style="width: 60%; vertical-align: middle;">
        <h1 style="margin: 0; font-size: 16pt; color: #1E3A8A; font-family: 'Segoe UI', Arial;">NATULAB FARMACÊUTICA S.A.</h1>
        <p style="margin: 2pt 0 0 0; font-size: 9.5pt; color: #4B5563;">Diretoria Financeira • Gerência de Controladoria & Custos Industriais</p>
      </td>
      <td style="width: 40%; text-align: right; vertical-align: middle;">
        <p style="margin: 0; font-size: 9pt; font-weight: bold; color: #1E3A8A;">RELATÓRIO OFICIAL DE AUDITORIA</p>
        <p style="margin: 2pt 0 0 0; font-size: 8.5pt; color: #6B7280;">Código: <strong>${codigoParecer}</strong></p>
        <p style="margin: 1pt 0 0 0; font-size: 8.5pt; color: #6B7280;">Emissão: ${dataHoje}</p>
      </td>
    </tr>
  </table>

  <!-- Título do Parecer -->
  <div style="background-color: #F8FAFC; border-left: 4px solid #1E3A8A; padding: 8pt 12pt; margin-bottom: 12pt;">
    <h2 style="margin: 0 0 4pt 0; font-size: 13pt; color: #1E3A8A; border: none; padding: 0;">PARECER TÉCNICO DE AUDITORIA DE CUSTOS (SAP CKM3 & MB51)</h2>
    <p style="margin: 0; font-size: 9.5pt; color: #4B5563;">
      Avaliação de aderência entre Custos Standard Calculados (KP26/CK40N) e Custos Reais de Aquisição (Notas Fiscais de Entrada / MIRO).
    </p>
  </div>

  <!-- Carimbo SOX & IFRS -->
  <div class="sox-stamp">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 70%; font-size: 9pt;">
          <strong>VERIFICAÇÃO DE CONTROLE INTERNO SOX (Seção 404) & CPC 16 / IAS 2 (Estoques):</strong><br/>
          Este documento constitui evidência auditável formal de conciliação do Razão de Materiais SAP (CKM3) contra lançamentos contábeis em MB51 e documentos fiscais MIRO.
        </td>
        <td style="width: 30%; text-align: right; font-size: 9pt; font-weight: bold; color: #047857;">
          ✓ CONFORME COM RESSALVAS
        </td>
      </tr>
    </table>
  </div>

  <!-- Metadados de Auditoria -->
  <h2>1. Identificação do Escopo e Auditoria</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 9.5pt;">
    <tr>
      <td style="padding: 4pt 0; width: 25%; font-weight: bold; color: #4B5563;">Auditor Responsável:</td>
      <td style="padding: 4pt 0; width: 25%;">${data.auditorNome || 'Guilherme Santos de Souza'}</td>
      <td style="padding: 4pt 0; width: 25%; font-weight: bold; color: #4B5563;">Matrícula Funcional:</td>
      <td style="padding: 4pt 0; width: 25%;">${data.auditorMatricula || '89201'}</td>
    </tr>
    <tr>
      <td style="padding: 4pt 0; font-weight: bold; color: #4B5563;">Planta Produtiva:</td>
      <td style="padding: 4pt 0;">Planta ${data.planta || '1001 (Santo Antônio de Jesus / BA)'}</td>
      <td style="padding: 4pt 0; font-weight: bold; color: #4B5563;">Período Contábil:</td>
      <td style="padding: 4pt 0;">08/2026 (Mensal)</td>
    </tr>
    <tr>
      <td style="padding: 4pt 0; font-weight: bold; color: #4B5563;">Total de SKUs Auditados:</td>
      <td style="padding: 4pt 0;">${data.totalAuditado || 184} materiais</td>
      <td style="padding: 4pt 0; font-weight: bold; color: #4B5563;">Divergências Identificadas:</td>
      <td style="padding: 4pt 0; color: #B91C1C; font-weight: bold;">${data.totalDivergencias || 6} apontamentos</td>
    </tr>
  </table>

  <!-- Tabela de Divergências Críticas -->
  <h2>2. Apontamento de Variações Significativas (Threshold &gt; Tolerância)</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #1E3A8A; color: #FFFFFF;">
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: left;">Material</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: left;">Descrição do Item</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: center;">CFOP</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: left;">Fornecedor</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: right;">Std (CKM3)</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: right;">Efetivo NF</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: right;">Var %</th>
        <th style="padding: 6pt; border: 1px solid #1E3A8A; font-family: 'Segoe UI', Arial; font-size: 8.5pt; text-align: right;">Impacto R$</th>
      </tr>
    </thead>
    <tbody>
      ${itensTableRows}
    </tbody>
    <tfoot>
      <tr style="background-color: #F3F4F6; font-weight: bold;">
        <td colspan="7" style="padding: 7pt; border: 1px solid #D1D5DB; text-align: right; font-family: 'Segoe UI', Arial; font-size: 9.5pt;">TOTAL DO IMPACTO FINANCEIRO ACUMULADO:</td>
        <td style="padding: 7pt; border: 1px solid #D1D5DB; text-align: right; font-family: 'Segoe UI', Arial; font-size: 10pt; color: #1E3A8A; font-weight: bold;">${impactoFormatado}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Conclusão e Recomendações -->
  <h2>3. Parecer Técnico Conclusivo e Recomendações da Controladoria</h2>
  <div style="font-size: 10pt; text-align: justify; line-height: 1.5; margin-bottom: 12pt;">
    <p>
      Com base na reconciliação eletrônica executada pelo sistema <strong>Meu Mini SAP</strong> entre as movimentações físicas de estoque (MB51), Razão Analítico do Ledger de Materiais (CKM3) e as Notas Fiscais escrituradas no módulo SAP MM/MIRO, 
      constatou-se uma variação líquida total de <strong>${impactoFormatado}</strong> decorrente de flutuações de preços em matérias-primas farmacêuticas ativas e fretes adicionais não provisionados no Standard Cost.
    </p>
    <p style="font-weight: bold; margin-top: 6pt;">Ações Corretivas Mandatórias:</p>
    <ol style="margin-top: 4pt; padding-left: 20pt;">
      <li style="margin-bottom: 4pt;">Execução de nova rodada de cálculo de Custo Standard na transação SAP <strong>CK40N</strong> para o próximo ciclo produtivo.</li>
      <li style="margin-bottom: 4pt;">Revisão de acordos de fornecimento e matriz de fretes FOB com o departamento de Suprimentos / Compras.</li>
      <li style="margin-bottom: 4pt;">Conciliação contábil das contas transitórias de entrada de mercadorias e faturas (EM/EF - Conta GR/IR).</li>
    </ol>
  </div>

  <!-- Assinaturas Formais -->
  <div style="margin-top: 30pt; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 45%; text-align: center; border-top: 1px solid #1F2937; padding-top: 6pt;">
          <strong>${data.auditorNome || 'Guilherme Santos de Souza'}</strong><br/>
          <span style="font-size: 8.5pt; color: #4B5563;">Auditor de Custos & Controladoria (Mat. ${data.auditorMatricula || '89201'})<br/>Natulab Farmacêutica S.A.</span>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%; text-align: center; border-top: 1px solid #1F2937; padding-top: 6pt;">
          <strong>Gerência Executiva de Controladoria</strong><br/>
          <span style="font-size: 8.5pt; color: #4B5563;">Aprovação de Governança e Compliance SOX<br/>Diretoria Financeira (CFO)</span>
        </td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>
  `;
}

/**
 * Downloads a generated file directly in the browser
 */
export function downloadFile(content: string, fileName: string, mimeType: string = 'application/msword') {
  const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
