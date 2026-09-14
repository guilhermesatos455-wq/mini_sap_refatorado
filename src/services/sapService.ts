export interface SapMenuItem {
  code: string;
  name: string;
  desc: string;
}

export interface SapMenuBranch {
  category: string;
  items: SapMenuItem[];
}

export interface SapTableField {
  name: string;
  type: string;
  length: number;
  key: boolean;
  desc: string;
}

export interface SapTableDefinition {
  desc: string;
  fields: SapTableField[];
}

export interface FioriApp {
  id: string;
  title: string;
  area: string;
  type: string;
  desc: string;
  version: '1909' | '2022';
}

/**
 * Unified SAP Service providing data for SAP1 tree, versioned Fiori apps (1909 & 2022), and SE11/SE16N catalog.
 */
export const sapService = {
  getSap1Tree(): SapMenuBranch[] {
    return [
      {
        category: 'Finanças (FI / CO)',
        items: [
          { code: 'FBL3N', name: 'Exibição de Partidas Individuais do Razão', desc: 'Relatório contábil de lançamentos por conta' },
          { code: 'S_ALR_87012357', name: 'Balanço / Demonstração de Resultados', desc: 'Relatório oficial financeiro SOX' },
          { code: 'F.01', name: 'Balanço Patrimonial SAP', desc: 'Posição financeira consolidada' }
        ]
      },
      {
        category: 'Logística & Estoques (MM / PP)',
        items: [
          { code: 'MB51', name: 'Lista de Movimentações de Material', desc: 'Histórico completo de entradas e saídas' },
          { code: 'CKM3', name: 'Cockpit do Ledger de Materiais (PMM)', desc: 'Análise detalhada de custos e desvios de preço' },
          { code: 'MMBE', name: 'Visão Geral de Estoque de Materiais', desc: 'Estoque por centro, depósito e lote' },
          { code: 'MB52', name: 'Lista de Estoque de Depósito', desc: 'Saldos atuais em tempo real' }
        ]
      },
      {
        category: 'Vendas & Distribuição (SD)',
        items: [
          { code: 'VA05', name: 'Lista de Ordens de Venda', desc: 'Acompanhamento de pedidos em aberto' },
          { code: 'VF05', name: 'Lista de Faturas de Cliente', desc: 'Faturamento e notas fiscais de saída' }
        ]
      }
    ];
  },

  getFioriApps(version?: '1909' | '2022' | 'all'): FioriApp[] {
    const apps: FioriApp[] = [
      // S/4HANA 1909 Apps
      { id: 'F0757', title: 'Gerenciar Movimentos de Mercadorias', area: 'Logística', type: 'Analytical App', desc: 'App Fiori 1909 para monitorar e auditar entradas e saídas em tempo real.', version: '1909' },
      { id: 'F1053', title: 'Cockpit de Custo de Material (ML)', area: 'Contabilidade de Custos', type: 'Fact Sheet', desc: 'Visualização clássica S/4HANA 1909 para Preço Médio Móvel.', version: '1909' },
      { id: 'F2489', title: 'Reconciliação de Contas Razão', area: 'Finanças', type: 'Transactional App', desc: 'Painel 1909 para conferência de partidas pendentes e balancete.', version: '1909' },
      { id: 'F0080', title: 'Monitor de Ordens de Compra', area: 'Suprimentos', type: 'Overview Page', desc: 'Dashboard analítico 1909 com gargalos e desvios de preços.', version: '1909' },

      // S/4HANA 2022 Apps (Advanced / Modern)
      { id: 'F5401', title: 'Advanced Material Ledger Analytics', area: 'Contabilidade de Custos', type: 'Analytical App', desc: 'Nova versão S/4HANA 2022 com machine learning para desvios de PMM.', version: '2022' },
      { id: 'F5890', title: 'Real-Time Inventory Management Cockpit', area: 'Logística', type: 'Overview Page', desc: 'Dashboard Fiori 2022 em tempo real para controle multi-planta de estoques.', version: '2022' },
      { id: 'F6120', title: 'Automated Financial Statement Closing', area: 'Finanças', type: 'Transactional App', desc: 'Fechamento contábil automatizado S/4HANA 2022 com IA preditiva.', version: '2022' },
      { id: 'F6432', title: 'Smart Procurement Spend Monitor', area: 'Suprimentos', type: 'Fact Sheet', desc: 'Análise preditiva de gastos e pedidos de compra na versão 2022.', version: '2022' }
    ];

    if (!version || version === 'all') return apps;
    return apps.filter(a => a.version === version);
  },

  getTableDefinition(tableName: string): SapTableDefinition {
    const tableDefinitions: Record<string, SapTableDefinition> = {
      MSEG: {
        desc: 'Segmento de Documento de Material (Histórico MB51 / CKM3)',
        fields: [
          { name: 'MBLNR', type: 'CHAR', length: 10, key: true, desc: 'Número do documento de material' },
          { name: 'MJAHR', type: 'NUMC', length: 4, key: true, desc: 'Ano do documento de material' },
          { name: 'ZEILE', type: 'NUMC', length: 4, key: true, desc: 'Item do documento de material' },
          { name: 'BWART', type: 'CHAR', length: 3, key: false, desc: 'Tipo de movimento (ex: 101, 201, 561)' },
          { name: 'MATNR', type: 'CHAR', length: 40, key: false, desc: 'Código do Material' },
          { name: 'WERKS', type: 'CHAR', length: 4, key: false, desc: 'Centro / Planta SAP' },
          { name: 'LGORT', type: 'CHAR', length: 4, key: false, desc: 'Depósito' },
          { name: 'SHKZG', type: 'CHAR', length: 1, key: false, desc: 'Indicador de estorno / Débito e Crédito (S/H)' },
          { name: 'DMBTR', type: 'CURR', length: 13, key: false, desc: 'Montante em moeda nacional (Valor BRL)' },
          { name: 'MENGE', type: 'QUAN', length: 13, key: false, desc: 'Quantidade movimentada' }
        ]
      },
      MARA: {
        desc: 'Dados Gerais do Material (Mestre de Materiais)',
        fields: [
          { name: 'MATNR', type: 'CHAR', length: 40, key: true, desc: 'Código do Material' },
          { name: 'ERSDA', type: 'DATS', length: 8, key: false, desc: 'Data de criação do registro' },
          { name: 'ERNAM', type: 'CHAR', length: 12, key: false, desc: 'Nome do responsável pela criação' },
          { name: 'MTART', type: 'CHAR', length: 4, key: false, desc: 'Tipo de material (FERT, HIBE, ROH)' },
          { name: 'MEINS', type: 'UNIT', length: 3, key: false, desc: 'Unidade de medida básica' },
          { name: 'BRGEW', type: 'QUAN', length: 13, key: false, desc: 'Peso bruto' }
        ]
      },
      EKKO: {
        desc: 'Cabeçalho de Pedidos de Compra (Purchasing Document Header)',
        fields: [
          { name: 'EBELN', type: 'CHAR', length: 10, key: true, desc: 'Número do documento de compras (Pedido)' },
          { name: 'BUKRS', type: 'CHAR', length: 4, key: false, desc: 'Empresa SAP' },
          { name: 'BSTYP', type: 'CHAR', length: 1, key: false, desc: 'Categoria do documento de compras' },
          { name: 'BSART', type: 'CHAR', length: 4, key: false, desc: 'Tipo de documento de compras (NB, UB)' },
          { name: 'LIFNR', type: 'CHAR', length: 10, key: false, desc: 'Código do Fornecedor' },
          { name: 'AEDAT', type: 'DATS', length: 8, key: false, desc: 'Data do registro' }
        ]
      }
    };
    return tableDefinitions[tableName] || tableDefinitions['MSEG'];
  }
};
