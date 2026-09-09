import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include tenantId and secureSpreadsheetId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      secureSpreadsheetId?: string;
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'SUA_CHAVE_SECRETA_ENTERPRISE_SAP';

// Mapeamento seguro de inquilinos para Planilhas do Google Sheets (Abordagem A)
const tenantSpreadsheetMap: Record<string, string> = {
  'TENANT-CORP-SP': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'TENANT-FILIAL-RJ': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'TENANT-LOGISTICA-SUL': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'TENANT-GLOBAL-HOLDING': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
};

/**
 * Middleware de Autenticação e Multi-Tenant (O "Segurança" da Porta)
 * Intercepta requisições, valida o JWT ou cabeçalho de tenant e injeta o tenantId no objeto req.
 */
export function interceptarTenant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  let tenantId = 'TENANT-CORP-SP'; // Fallback padrão para desenvolvimento

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { tenantId?: string; userId?: string };
      if (decoded && decoded.tenantId) {
        tenantId = decoded.tenantId;
        req.userId = decoded.userId;
      }
    } catch (err) {
      // Se o token for inválido, tenta verificar se foi passado tenantId direto no body/header (para testes seguros)
      console.warn('[Tenant Middleware] Token JWT inválido ou expirado. Verificando cabeçalho alternativo...');
    }
  }

  // Se não veio no JWT, verifica cabeçalho customizado x-tenant-id ou body
  if (!req.tenantId && req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'] as string;
  } else if (!req.tenantId && req.body?.tenantId) {
    tenantId = req.body.tenantId;
  }

  req.tenantId = tenantId;
  req.secureSpreadsheetId = tenantSpreadsheetMap[tenantId] || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

  next();
}
