import { z } from 'zod';

export interface Impostos {
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
  st?: number;
}

// Zod Schemas para validação de dados
export const NFDataSchema = z.object({
  CFOP: z.string().or(z.number()).optional(),
  Material: z.string().or(z.number()).optional(),
  Preço: z.preprocess((val) => {
    if (typeof val === 'string') {
      // Remove "R$", "." (milhar), and replace "," (decimal) with "."
      const sanitized = val.replace(/[R$\s.]/g, '').replace(',', '.');
      return Number(sanitized);
    }
    return Number(val);
  }, z.number({ message: "Preço inválido" })),
  Quantidade: z.preprocess((val) => {
    if (typeof val === 'string') {
      const sanitized = val.replace(/[.\s]/g, '').replace(',', '.');
      return Number(sanitized);
    }
    return Number(val);
  }, z.number({ message: "Quantidade inválida" })),
}).passthrough();

export const CKM3DataSchema = z.object({
  Material: z.string().or(z.number()),
  Descrição: z.string().optional().default(''),
  Quantidade: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'string') {
      const sanitized = val.replace(/[.\s]/g, '').replace(',', '.');
      const num = Number(sanitized);
      return isNaN(num) ? 0 : num;
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().default(0)),
  Centro: z.string().or(z.number()).optional().default(''),
  Custo: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'string') {
      const sanitized = val.replace(/[R$\s.]/g, '').replace(',', '.');
      const num = Number(sanitized);
      return isNaN(num) ? 0 : num;
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().default(0)),
  Categoria: z.string().optional().default(''),
  Processo: z.string().optional().default(''),
}).passthrough();

export type NFData = z.infer<typeof NFDataSchema>;
export type CKM3Data = z.infer<typeof CKM3DataSchema>;

export interface TaxCompliance {
  isCompliant: boolean;
  expectedRate: number;
  actualRate: number;
  message?: string;
}

export interface Divergencia {
  id: number | string;
  material: string;
  descricao: string;
  tipoMaterial?: string;
  categoriaNF?: string;
  origemMaterial?: string;
  cfop: string;
  fornecedor: string;
  empresa: string;
  descricaoEmpresa?: string;
  pedidoCompras?: string;
  numeroNF: string;
  notaFiscalFrete?: string;
  naturezaOperacao?: string;
  descricaoTipoMaterial?: string;
  itemPedidoCompras?: string;
  itemDocumento?: string;
  tipoReferencia?: string;
  tipoMaterialCKM3?: string;
  precoMedioCKM3?: number;
  matPrimaCKM3?: number;
  embalagemCKM3?: number;
  terceirosCKM3?: number;
  reparoCKM3?: number;
  modCKM3?: number;
  maquinaCKM3?: number;
  moiCKM3?: number;
  ggfCKM3?: number;
  ckm3Empresa?: string;
  ckm3CodMaterial?: string;
  ckm3UnidadeMedida?: string;
  ckm3CodTipoMaterial?: string;
  ckm3CategoriaDados?: string;
  ckm3Categoria?: string;
  ckm3DocReferencia?: string;
  ckm3NotaFiscal?: string;
  ckm3Ordem?: string;
  ckm3TipoMovimento?: string;
  ckm3Conta?: string;
  ckm3TaxaCambio?: number;
  ckm3QtdTransacao?: number;
  ckm3ValorEstoque?: number;
  ckm3DiferencaPreco?: number;
  ckm3DesvioTaxaCambio?: number;
  ckm3ValorReal?: number;
  ckm3PrecoMedioMovel?: number;
  ckm3Manutencao?: number;
  dataLancamento: string;
  dataDocumento?: string;
  precoSemFrete: number;
  precoComFrete?: number;
  valorLiqSemFrete?: number;
  valorLiqComFrete?: number;
  valorTotalSemFrete?: number;
  valorTotalComFrete?: number;
  precoEfetivo: number;
  custoPadrao: number;
  variacaoPerc: number;
  impactoFinanceiro: number;
  quantidade: number;
  data?: string;
  status?: string;
  comentarios?: string;
  arquivo?: string;
  linhaNF?: number;
  anexos?: { id: string; name: string; url: string; type: string; date: string }[];
  aprovacaoStatus?: 'Pendente' | 'Aprovado' | 'Rejeitado';
  impostos?: Partial<Impostos>;
  icmsEfetivoPerc?: number;
  ipiEfetivoPerc?: number;
  pisEfetivoPerc?: number;
  cofinsEfetivoPerc?: number;
  stEfetivoPerc?: number;
  totalImpostosPerc?: number;
  tipo?: 'acima do custo padrão' | 'abaixo do custo padrão' | 'Sem Divergência';
  taxCompliance?: TaxCompliance;
  suggestedStatus?: string;
  suggestedComment?: string;
  suggestedCause?: string;
  suggestedTCodes?: string[];
  suggestedTCodeAction?: string;
  appliedRecipes?: string[]; // IDs das receitas que foram disparadas para este item
  aprovadoPor?: { nome: string; email: string; data: string } | null;
  rejeitadoPor?: { nome: string; email: string; data: string; motivo: string } | null;
  auditLogs?: { timestamp: string; user: string; action: string; prevStatus?: string; currentStatus?: string }[];
  _search: string;
}

export interface AuditRule {
  id: string;
  field: keyof Divergencia | string;//usar os operadoes aritimenticos 
  operator: '>' | '<' | '==' | '!=' | 'contains' | 'in' | 'matches';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AuditRecipe {
  id: string;
  name: string;
  description: string;
  rules: AuditRule[];
  action: {
    type: 'highlight' | 'status' | 'comment' | 'sap_tcode';
    payload: string; // Cor hex, status name, texto do comentário ou T-Code
  };
  active: boolean;
}

export interface NotaNaoLancada {
  id: string;
  numeroNF: string;
  fornecedor: string;
  data: string;
  valorTotal: number;
  itens: { material: string; descricao: string; quantidade: number; preco: number }[];
  arquivo: string;
}

export interface ResultadoAuditoria {
  qtdDiv: number;
  totalPrejuizo: number;
  totalEconomia: number;
  qtdAusentes: number;
  divergencias: Divergencia[];
  todosOsItens: Divergencia[];
  notasNaoLancadas: NotaNaoLancada[];
  uniqueValues: {
    cfops: string[];
    suppliers: string[];
    tipoMaterial: string[];
    categoriaNF: string[];
    origemMaterial: string[];
    empresa: string[];
  };
  linhasNfProcessadas: number;
  linhasCkm3Processadas: number;
  materiaisNoCkm3: number;
  dataProcessamento: string;
  mesReferencia?: string;
}

export interface ShowColunas {
  empresa: boolean;
  descricaoEmpresa: boolean;
  pedidoCompras: boolean;
  numeroNF: boolean;
  notaFiscalFrete: boolean;
  naturezaOperacao: boolean;
  tipoMaterial: boolean;
  descricaoTipoMaterial: boolean;
  categoriaNF: boolean;
  itemPedidoCompras: boolean;
  itemDocumento: boolean;
  origemMaterial: boolean;
  tipoReferencia: boolean;
  dataLancamento: boolean;
  dataDocumento: boolean;
  precoSemFrete: boolean;
  precoComFrete: boolean;
  valorLiqSemFrete: boolean;
  valorLiqComFrete: boolean;
  valorTotalSemFrete: boolean;
  valorTotalComFrete: boolean;
  tipoMaterialCKM3: boolean;
  precoMedioCKM3: boolean;
  matPrimaCKM3: boolean;
  embalagemCKM3: boolean;
  terceirosCKM3: boolean;
  reparoCKM3: boolean;
  modCKM3: boolean;
  maquinaCKM3: boolean;
  moiCKM3: boolean;
  ggfCKM3: boolean;
  ckm3Empresa: boolean;
  ckm3CodMaterial: boolean;
  ckm3UnidadeMedida: boolean;
  ckm3CodTipoMaterial: boolean;
  ckm3CategoriaDados: boolean;
  ckm3Categoria: boolean;
  ckm3DocReferencia: boolean;
  ckm3NotaFiscal: boolean;
  ckm3Ordem: boolean;
  ckm3TipoMovimento: boolean;
  ckm3Conta: boolean;
  ckm3TaxaCambio: boolean;
  ckm3QtdTransacao: boolean;
  ckm3ValorEstoque: boolean;
  ckm3DiferencaPreco: boolean;
  ckm3DesvioTaxaCambio: boolean;
  ckm3ValorReal: boolean;
  ckm3PrecoMedioMovel: boolean;
  ckm3Manutencao: boolean;
}

export type MovementCategory = 
  | 'PRODUCTION_PURCHASE' 
  | 'RETURN_ENTRY_SALE'
  | 'RETURN_EXIT_PURCHASE'
  | 'ADJUSTMENT_ENTRY' 
  | 'ADJUSTMENT_EXIT' 
  | 'OTHER_EXIT' 
  | 'BONIFICATION' 
  | 'SALE' 
  | 'LOSS' 
  | 'REQUISITION'
  | 'INITIAL_STOCK'
  | 'FINAL_STOCK'
  | 'TRANSFER';

export interface SAPMovementType {
  code: string;
  description: string;
  direction: 'Entrada' | 'Saída' | 'Transferência';
  category?: MovementCategory;
  active: boolean;
}

export interface MaterialMovement {
  id: string;
  material: string;
  description: string;
  movementType: string;
  quantity: number;
  date: string;
  plant: string;
  storageLocation: string;
  batch?: string;
  user: string;
  docNumber: string;
  comment?: string;
  postingDate?: string;
  unit?: string;
  value?: number;
  reference?: string;
  order?: string;
}

export interface StockPosition {
  material: string;
  description: string;
  plant: string;
  quantity: number;
  rawData?: any[];
}

export interface MovementColumnMapping {
  movementType: number;
  material: number;
  description: number;
  batch: number;
  quantity: number;
  storageLocation: number;
  date: number;
  docNumber?: number;
  plant?: number;
  user?: number;
}

export interface AuditHistoryLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
