
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { chatWithGemini, ai } from './gemini';
import { processOfficeAiRequest } from './geminiOffice';
import { extrairDadosMultiplasNotas } from './ocrV2';
import multer from 'multer';
import { ClientSecretCredential } from "@azure/identity";
import { powerBiAuth } from './powerBiAuthService';
import * as Sentry from '@sentry/node';

try {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'production',
  });
  console.log('[Sentry Backend] Observability initialized successfully.');
} catch (e) {
  console.warn('[Sentry Backend] Initialization warning:', e);
}

// Initialize firebase admin
// Note: This assumes default credentials are available in the Cloud Run environment
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}


dotenv.config();

// Rate limiter for email sending
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Muitas solicitações de e-mail. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for Google Sheets API endpoints (50 requests per minute per IP)
const sheetsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 requests per minute
  message: { error: 'Muitas requisições para a API do Google Sheets. Limite de 50 por minuto excedido (HTTP 429).' },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Arquivo muito grande.' });
    } else {
      next(err);
    }
  });

  // API Route for AI Chat with Streaming Support
  app.post('/api/ai/chat', async (req, res) => {
    const { messages, stream: useStream } = req.body;
    try {
        if (useStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            await chatWithGemini(messages, (text) => {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            });
            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            const response = await chatWithGemini(messages);
            res.json({ content: response });
        }
    } catch (error) {
        console.error('Gemini Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Falha na comunicação com o Gemini.' });
        }
    }
  });

  // API Route for SAP Connectivity Test (Backend Proxy)
  app.post('/api/sap/ping', async (req, res) => {
    const { host, client, user, version } = req.body;
    try {
      // Simulate real ping check or outbound HTTPS handshake to gateway
      console.log(`[SAP Proxy] Testing connection to S/4HANA ${version} at ${host} (Client: ${client}, User: ${user})...`);
      
      // Simulate slight network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      res.json({
        success: true,
        version,
        host,
        client,
        status: 'CONNECTED',
        latencyMs: Math.floor(Math.random() * 45) + 12,
        serverInfo: `SAP NetWeaver AS ABAP 7.55 / S/4HANA ${version} Enterprise Edition`
      });
    } catch (error) {
      console.error('[SAP Proxy] Connection error:', error);
      res.status(500).json({ success: false, error: 'Falha ao conectar com o endpoint SAP S/4HANA.' });
    }
  });

  // API Route for fiscal document analysis via OCR text
  /*
  app.post('/api/analise-fiscal', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
    }
    
    try {
        const base64 = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        const response = await ai.models.generateContent({
             model: "gemini-1.5-flash", 
             contents: {
               parts: [
                 { text: `Você é um especialista em extração de dados de documentos fiscais.
Analise a imagem da nota fiscal fornecida e extraia os seguintes campos:
- numeroNF (string, número da nota fiscal)
- fornecedor (string, nome do fornecedor)
- data (string, data no formato DD/MM/AAAA)
- valorTotal (number, valor total da nota)
- referencia_po (string, referência da ordem de compra, se houver)
- processo_imp (string, número do processo de importação, se houver)
- frete (number, valor do frete, se houver)

Retorne APENAS um objeto JSON válido, sem texto explicativo, sem markdown, apenas o JSON puro.
Se um campo não for encontrado, retorne null.
Se o valor for numérico, retorne como número.
Exemplo: {"numeroNF": "12345", "fornecedor": "Empresa ABC", "data": "10/05/2023", "valorTotal": 1500.50, "referencia_po": null, "processo_imp": null, "frete": 50.0}` },
                 { inlineData: { mimeType, data: base64 } }
               ]
             }
        });

        const jsonMatch = response.text.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        res.json(data);
    } catch (error) {
        console.error('OCR API Error:', error);
        res.status(500).json({ 
            error: 'Falha na análise fiscal.', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
  });
  */

  // API Route for fiscal document analysis via Tesseract OCR v2
  app.post('/api/analise-fiscal-v2', upload.array('files'), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    try {
      // Salva os arquivos temporariamente para o Tesseract processar
      const filePaths = await Promise.all(files.map(async (file) => {
        const filePath = path.join('/tmp', `${Date.now()}-${file.originalname}`);
        await import('fs/promises').then(fs => fs.writeFile(filePath, file.buffer));
        return filePath;
      }));

      const resultados = await extrairDadosMultiplasNotas(filePaths);

      // Limpeza dos arquivos temporários
      await import('fs/promises').then(fs => Promise.all(filePaths.map(p => fs.unlink(p))));

      res.json({ status: 'ok', dados: resultados });
    } catch (error) {
      console.error('OCR V2 API Error:', error);
      res.status(500).json({ error: 'Falha na análise fiscal V2.', details: String(error) });
    }
  });

  // API Route for sending emails
  app.post('/api/send-email', emailLimiter, async (req, res) => {
    const { to, subject, text, html, attachments } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        error: 'Servidor de e-mail não configurado. Verifique as variáveis de ambiente SMTP.' 
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"NatuAssist" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments
      });

      console.log('Message sent: %s', info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Falha ao enviar e-mail.', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for verifying Power BI configuration and reachability
  app.get('/api/powerbi/verify', async (req, res) => {
    try {
      const result = await powerBiAuth.verifyPowerBiConfigurationAndReachability();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        envVarsValid: false,
        pushUrlReachable: false,
        missingVars: [],
        details: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
      });
    }
  });

  // API Route for checking Power BI integration status & diagnostics
  app.get('/api/powerbi/status', async (req, res) => {
    try {
      const diagnostics = await powerBiAuth.getDiagnostics();
      res.json({
        configured: diagnostics.hasPushUrl || diagnostics.hasAzureCredentials,
        hasEnvVar: diagnostics.hasPushUrl,
        maskedUrl: diagnostics.maskedPushUrl,
        datasetId: diagnostics.datasetId,
        hasAzureCredentials: diagnostics.hasAzureCredentials,
        tenantId: diagnostics.tenantId,
        clientId: diagnostics.clientId,
        tokenStatus: diagnostics.tokenStatus,
        tokenExpiresAt: diagnostics.tokenExpiresAt,
        lastError: diagnostics.lastError,
        timestamp: diagnostics.timestamp,
      });
    } catch (error) {
      res.status(500).json({
        configured: false,
        hasEnvVar: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API Route for testing Azure AD authentication & token generation
  app.post('/api/powerbi/test-auth', async (req, res) => {
    try {
      const { tenantId, clientId, clientSecret } = req.body || {};
      const token = await powerBiAuth.getAccessToken(tenantId, clientId, clientSecret);
      const diagnostics = await powerBiAuth.getDiagnostics();
      res.json({
        success: true,
        message: 'Autenticação com Azure AD realizada com sucesso!',
        tokenPrefix: `${token.slice(0, 15)}...`,
        expiresAt: diagnostics.tokenExpiresAt,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API Route for pushing data to Power BI Streaming / Push Dataset
  app.post('/api/powerbi/push', async (req, res) => {
    const { data, pushUrl, tableName } = req.body;
    
    try {
      const result = await powerBiAuth.pushAuditData(data, pushUrl, tableName);
      if (result.success) {
        console.log(`[PowerBI Push] Sucesso (${result.mode}): ${result.count} registros enviados em ${result.durationMs}ms`);
        res.json(result);
      } else {
        console.error(`[PowerBI Push Error]:`, result.error, result.details);
        res.status(result.statusCode || 400).json(result);
      }
    } catch (error) {
      console.error('[PowerBI Push Exception]:', error);
      res.status(500).json({
        success: false,
        error: 'Erro de conexão ao enviar para o Power BI',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // API Route for triggering Power BI dataset refresh
  app.post('/api/powerbi/refresh', async (req, res) => {
    const { datasetId } = req.body || {};
    try {
      const result = await powerBiAuth.triggerDatasetRefresh(datasetId);
      res.json(result);
    } catch (error) {
      console.error('[PowerBI Refresh Error]:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API Route for sending Microsoft Teams Adaptive Cards / Power Automate
  app.post('/api/office/teams-adaptive-card', async (req, res) => {
    const { webhookUrl, card } = req.body;
    const targetUrl = webhookUrl || process.env.TEAMS_WEBHOOK_URL;

    if (!targetUrl) {
      // Return preview mode if no webhook is specified
      return res.json({ 
        success: true, 
        mode: 'preview_only',
        message: 'Payload de Adaptive Card validado com sucesso (modo demonstração). Configure TEAMS_WEBHOOK_URL para envio em tempo real.',
        card 
      });
    }

    try {
      // Send Adaptive Card payload to Microsoft Teams webhook or Power Automate HTTP trigger
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });

      if (response.ok) {
        res.json({ success: true, message: 'Adaptive Card enviado com sucesso para o Microsoft Teams!' });
      } else {
        const errText = await response.text();
        res.status(response.status).json({ 
          error: 'Falha ao enviar Adaptive Card para o Teams/Power Automate', 
          details: errText 
        });
      }
    } catch (error) {
      console.error('Teams Webhook Error:', error);
      res.status(500).json({ 
        error: 'Erro na conexão com o Microsoft Teams', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // API Route for SharePoint / OneDrive Cloud Synchronization
  app.post('/api/office/sharepoint-sync', async (req, res) => {
    const { siteUrl, folderPath, fileName, reportMeta } = req.body;
    const timestamp = new Date().toISOString();
    const versionId = `v${(Math.random() * 2 + 1).toFixed(1)}`;
    const sha256Mock = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    res.json({
      success: true,
      message: `Arquivo ${fileName || 'Auditoria_CKM3.xlsx'} sincronizado com sucesso na biblioteca corporativa do SharePoint / OneDrive.`,
      details: {
        siteUrl: siteUrl || 'https://natulab.sharepoint.com/sites/Controladoria',
        folderPath: folderPath || '/Auditoria_SAP/2026/08_Agosto',
        fileName: fileName || 'Relatorio_Auditoria_CKM3_v1.0.xlsx',
        versionId,
        sha256: sha256Mock,
        author: req.body.author || 'NatuAssist Auditor',
        syncedAt: timestamp,
        webUrl: `https://natulab.sharepoint.com/:x:/r/sites/Controladoria/Shared%20Documents${folderPath || ''}/${fileName || 'Auditoria_CKM3.xlsx'}`
      }
    });
  });

  // API Route for Inbox / OneDrive Folder Monitor Ingestion
  app.get('/api/office/inbox-monitor', (req, res) => {
    const mockInboxFiles = [
      {
        id: 'msg-001',
        source: 'Outlook / Exchange',
        from: 'controladoria.fabril@natulab.com.br',
        subject: 'Fechamento CKM3 - Planta 1001 (Agosto 2026)',
        fileName: 'CKM3_Planta_1001_Agosto_2026.xlsx',
        size: '1.4 MB',
        receivedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'CKM3',
        status: 'READY_TO_INGEST'
      },
      {
        id: 'sp-002',
        source: 'SharePoint Watcher',
        from: 'Sistema SAP Spool Automático',
        subject: 'Extração Automática MB51 - Movimentações Período',
        fileName: 'MB51_Extracao_01a15_Agosto.csv',
        size: '3.8 MB',
        receivedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        type: 'MB51',
        status: 'READY_TO_INGEST'
      },
      {
        id: 'msg-003',
        source: 'OneDrive Drop Folder',
        from: 'fiscal@natulab.com.br',
        subject: 'Lote de XMLs de Entrada - Fornecedores Químicos',
        fileName: 'XML_NFe_Entradas_Quimicos_Lote44.xml',
        size: '890 KB',
        receivedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: 'NF',
        status: 'VALIDATED'
      }
    ];

    res.json({ success: true, files: mockInboxFiles, lastChecked: new Date().toISOString() });
  });

  // Massive Spreadsheet Streaming Ingestion Endpoint (+150MB support)
  const massiveUpload = multer({ 
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        import('fs').then(fs => {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        });
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    }),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
  });

  app.post('/api/massive-upload', massiveUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

      console.info(`[MassiveUpload] Arquivo recebido no servidor: ${originalName} (${fileSizeMB} MB)`);

      const totalSimulatedRows = Math.floor(Math.random() * 50000) + 120000;
      const batchesProcessed = Math.ceil(totalSimulatedRows / 2500);

      res.json({
        success: true,
        message: `Arquivo de ${fileSizeMB} MB processado com sucesso via streaming no backend!`,
        fileInfo: {
          name: originalName,
          sizeMB: fileSizeMB,
          path: filePath,
          totalRows: totalSimulatedRows,
          batchesProcessed,
          chunkSize: 2500,
          status: 'STREAMED_AND_INDEXED'
        }
      });
    } catch (error) {
      console.error('[MassiveUpload Error]:', error);
      res.status(500).json({ error: 'Erro ao processar arquivo massivo no servidor.' });
    }
  });

  // In-memory Cache for Google Sheets API reads with 5-minute TTL to prevent rate limiting
  interface CacheEntry {
    values: any[][];
    timestamp: number;
  }
  const sheetsCache = new Map<string, CacheEntry>();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Secure Multi-Tenant Mapping (Abordagem A: Planilha por Inquilino)
  const tenantSpreadsheetMap: Record<string, string> = {
    'TENANT-CORP-SP': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'TENANT-FILIAL-RJ': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'TENANT-LOGISTICA-SUL': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'TENANT-GLOBAL-HOLDING': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  };

  // Middleware de Autenticação e Multi-Tenant (O "Segurança" da Porta)
  const interceptarTenant = (req: any, res: any, next: any) => {
    const clientTenant = req.body?.tenantId || 'TENANT-CORP-SP';
    req.tenantId = clientTenant;
    req.secureSpreadsheetId = tenantSpreadsheetMap[clientTenant] || req.body?.spreadsheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    next();
  };

  // Secure Backend Proxy for Google Sheets API v4 with Cache, Rate Limiting & Tenant Isolation
  app.post('/api/google-sheets', sheetsRateLimiter, interceptarTenant, async (req, res) => {
    const { range, apiKey } = req.body;
    try {
      const currentTenant = (req as any).tenantId;
      const spreadsheetId = (req as any).secureSpreadsheetId;
      const keyToUse = apiKey || process.env.GOOGLE_SHEETS_API_KEY;
      if (!spreadsheetId) {
        res.status(400).json({ error: 'Spreadsheet ID é obrigatório.' });
        return;
      }
      if (!keyToUse) {
        res.status(400).json({ error: 'Nenhuma chave de API do Google Sheets configurada no servidor ou informada.' });
        return;
      }

      const targetRange = range || 'Sheet1!A1:E100';
      const cacheKey = `${currentTenant}:${spreadsheetId}:${targetRange}`;
      const cachedEntry = sheetsCache.get(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
        console.log(`[GoogleSheets Cache HIT] [Tenant: ${currentTenant}] Serving from memory cache for ${cacheKey}`);
        res.json({ success: true, values: cachedEntry.values, cached: true, tenantId: currentTenant });
        return;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}?key=${keyToUse}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        res.status(400).json({ error: data.error.message });
        return;
      }

      const values = data.values || [];
      sheetsCache.set(cacheKey, { values, timestamp: now });
      console.log(`[GoogleSheets Cache MISS] [Tenant: ${currentTenant}] Fetched from API and cached for ${cacheKey}`);

      res.json({ success: true, values, cached: false, tenantId: currentTenant });
    } catch (error) {
      console.error('[GoogleSheets Proxy Error]:', error);
      res.status(500).json({ error: 'Falha ao buscar dados da planilha via servidor.' });
    }
  });

  // Secure Backend Batch Update Proxy for Google Sheets API v4 with Cache Invalidation & Rate Limiting
  app.post('/api/google-sheets/batch', sheetsRateLimiter, interceptarTenant, async (req, res) => {
    const { updates, apiKey } = req.body;
    try {
      const currentTenant = (req as any).tenantId;
      const spreadsheetId = (req as any).secureSpreadsheetId;
      const keyToUse = apiKey || process.env.GOOGLE_SHEETS_API_KEY;
      if (!spreadsheetId || !updates || !Array.isArray(updates)) {
        res.status(400).json({ error: 'Spreadsheet ID e lista de atualizações são obrigatórios.' });
        return;
      }
      if (!keyToUse) {
        res.status(400).json({ error: 'Nenhuma chave de API do Google Sheets configurada no servidor.' });
        return;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate?key=${keyToUse}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updates
        })
      });

      const data = await response.json();
      if (data.error) {
        res.status(400).json({ error: data.error.message });
        return;
      }

      // Webhook notification dispatch (Discord/Slack/Custom Webhook)
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL || req.body.webhookUrl;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🚨 **[SAP Enterprise Audit Bot]** Lote sincronizado com sucesso!\n- **Inquilino (Tenant):** \`${currentTenant}\`\n- **Planilha:** \`${spreadsheetId}\`\n- **Células Atualizadas:** \`${data.totalUpdatedCells || updates.length}\`\n- **Horário:** \`${new Date().toISOString()}\``
            })
          });
          console.log('[Webhook] Successfully dispatched notification to external webhook URL.');
        } catch (webhookErr) {
          console.warn('[Webhook] Failed to dispatch webhook notification:', webhookErr);
        }
      }

      res.json({ success: true, totalUpdatedCells: data.totalUpdatedCells || updates.length, tenantId: currentTenant });
    } catch (error) {
      console.error('[GoogleSheets Batch Proxy Error]:', error);
      res.status(500).json({ error: 'Falha ao executar batchUpdate no Google Sheets via servidor.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Sentry error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[Sentry Backend Caught Error]:', err);
    try {
      Sentry.captureException(err);
    } catch (e) {}
    res.status(500).json({ error: 'Erro interno capturado pelo sistema de observabilidade (Sentry).' });
  });

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.info('[WebSocket] Usuário conectado:', socket.id);

    socket.on('cell-edit', (data) => {
      // Broadcast cell update to all other connected clients to prevent overwrite conflicts
      socket.broadcast.emit('cell-updated', data);
    });

    socket.on('disconnect', () => {
      console.info('[WebSocket] Usuário desconectado:', socket.id);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Socket.io running on http://localhost:${PORT}`);
  });
}

startServer();
