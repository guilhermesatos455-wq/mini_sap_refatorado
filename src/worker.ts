import * as XLSX from 'xlsx';

// Garantir que XLSX esteja disponível se necessário por algum plugin ou contexto
if (typeof self !== 'undefined') {
  (self as any).XLSX = XLSX;
}

const parseXmlOrHtmlTablesToWorkbook = (text: string): XLSX.WorkBook | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // 1. Try tables in HTML
    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
      const wb = XLSX.utils.book_new();
      tables.forEach((table, idx) => {
        const rows: string[][] = [];
        const trs = table.querySelectorAll('tr');
        trs.forEach(tr => {
          const rowData: string[] = [];
          const cells = tr.querySelectorAll('th, td');
          cells.forEach(cell => {
            rowData.push(cell.textContent?.trim() || '');
          });
          if (rowData.some(cell => cell !== '')) {
            rows.push(rowData);
          }
        });

        if (rows.length > 0) {
          const sheetName = idx === 0 ? 'AUDITORIA' : `Planilha_${idx + 1}`;
          const ws = XLSX.utils.aoa_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });
      if (wb.SheetNames.length > 0) return wb;
    }

    // 2. Try XML Spreadsheet 2003 (<Worksheet> / <Table>)
    const worksheets = doc.querySelectorAll('Worksheet, worksheet');
    if (worksheets.length > 0) {
      const wb = XLSX.utils.book_new();
      worksheets.forEach((wsNode, wsIdx) => {
        const sheetNameAttr = wsNode.getAttribute('ss:Name') || wsNode.getAttribute('name') || `Planilha${wsIdx + 1}`;
        const rows: string[][] = [];
        const rowNodes = wsNode.querySelectorAll('Row, row');
        rowNodes.forEach(rowNode => {
          const rowData: string[] = [];
          const cellNodes = rowNode.querySelectorAll('Cell, cell');
          cellNodes.forEach(cellNode => {
            const dataNode = cellNode.querySelector('Data, data');
            const val = dataNode ? dataNode.textContent : cellNode.textContent;
            rowData.push(val ? val.trim() : '');
          });
          if (rowData.some(cell => cell !== '')) {
            rows.push(rowData);
          }
        });

        if (rows.length > 0) {
          const ws = XLSX.utils.aoa_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, sheetNameAttr);
        }
      });
      if (wb.SheetNames.length > 0) return wb;
    }

    return null;
  } catch (e) {
    console.warn("DOMParser fallback failed:", e);
    return null;
  }
};

const ensureSheetRange = (sheet: XLSX.WorkSheet) => {
  const celulas = Object.keys(sheet).filter(k => !k.startsWith('!'));
  if (celulas.length > 0) {
    const colunas = celulas.map(c => c.replace(/[0-9]/g, ''));
    const linhas = celulas.map(c => parseInt(c.replace(/[^\d]/g, '')));
    
    const maxCol = colunas.sort((a, b) => b.length - a.length || b.localeCompare(a))[0] || 'Z';
    let maxRow = 1000;
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i] > maxRow) maxRow = linhas[i];
    }
    
    sheet['!ref'] = `A1:${maxCol}${maxRow}`;
  } else {
    sheet['!ref'] = `A1:Z1000`;
  }
};

export const safeReadWorkbook = (fileData: Uint8Array): XLSX.WorkBook => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  const t0 = performance.now();
  
  let wb: XLSX.WorkBook | null = null;
  let textContent = '';

  try {
    const decoder1 = new TextDecoder('windows-1252', { fatal: false });
    textContent = decoder1.decode(fileData);
  } catch (e) {
    try {
      const decoder2 = new TextDecoder('utf-8', { fatal: false });
      textContent = decoder2.decode(fileData);
    } catch (err) {}
  }

  // 1. If text looks like HTML or XML, try DOMParser fallback first for robust row/table extraction
  if (textContent && (textContent.includes('<html') || textContent.includes('<table') || textContent.includes('<?xml') || textContent.includes('urn:schemas-microsoft-com:office:excel') || textContent.includes('<HTML') || textContent.includes('<TABLE'))) {
    console.log("🕵️ SAP HTML/XML structure detected. Trying DOMParser table/worksheet extraction...");
    wb = parseXmlOrHtmlTablesToWorkbook(textContent);
  }

  // 2. If DOMParser didn't produce workbook, try SheetJS read with string
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    if (textContent && textContent.length > 0) {
      try {
        wb = XLSX.read(textContent, { type: 'string', raw: true, cellDates: true, cellStyles: false, bookVBA: false, cellFormula: false });
      } catch (err) {}
    }
  }

  // 3. Try standard array buffer XLSX read
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    try {
      wb = XLSX.read(fileData, { type: 'array', cellDates: true, raw: true, cellStyles: false, bookVBA: false, cellFormula: false });
    } catch (errStd) {
      console.warn("Standard Excel read failed:", errStd);
    }
  }

  // 4. Final fallback
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    wb = XLSX.read(fileData, { type: 'array', cellStyles: false, bookVBA: false, cellFormula: false });
  }

  if (wb && wb.SheetNames) {
    for (const name of wb.SheetNames) {
      if (wb.Sheets[name]) {
        ensureSheetRange(wb.Sheets[name]);
      }
    }
  }

  const t1 = performance.now();
  console.info(`[Perf] safeReadWorkbook executado em ${(t1 - t0).toFixed(2)}ms (Tamanho: ${fileData.length} bytes)`);

  return wb;
};

const parseExcelDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  
  if (typeof val === 'number') {
    try {
      const parsed = (XLSX as any).SSF.parse_date_code(val);
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    } catch (e) {
      return null;
    }
  }
  
  if (typeof val === 'string') {
    const partsBR = val.split('/');
    if (partsBR.length === 3) {
      const day = parseInt(partsBR[0], 10);
      const month = parseInt(partsBR[1], 10) - 1;
      const year = parseInt(partsBR[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    const partsUS = val.split('-');
    if (partsUS.length === 3) {
      const year = parseInt(partsUS[0], 10);
      const month = parseInt(partsUS[1], 10) - 1;
      const day = parseInt(partsUS[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  
  return null;
};

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '') return 0;
    let clean = '';
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if ((char >= '0' && char <= '9') || char === ',' || char === '.' || char === '-') {
        clean += char;
      }
    }
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const padronizarMaterial = (mat: any): string => {
  if (mat == null) return '';
  const s = String(mat).trim();
  if (s === '') return '';
  let start = 0;
  while (start < s.length - 1 && s[start] === '0') {
    start++;
  }
  return s.substring(start);
};

const isTaxOrOriginDescription = (text: string): boolean => {
  if (!text) return false;
  const upper = text.toUpperCase();
  const taxKeywords = [
    'NACIONAL', 'IMPORTADO', 'EXCETO', 'ICMS', 'PIS', 'COFINS', 'IPI', 
    'CST', 'ST', 'ORIGEM', 'CÓDIGOS', 'CODIGOS', 'INDICADO', 'TRIBUT', 
    'ALÍQUOTA', 'ALIQUOTA', 'CFOP', 'NCM'
  ];
  if (/^\d{5,}\s*[-–—]\s*(NACIONAL|IMPORTADO|EXCETO|ORIGEM)/i.test(text)) {
    return true;
  }
  let matchCount = 0;
  for (const kw of taxKeywords) {
    if (upper.includes(kw)) matchCount++;
  }
  return matchCount >= 2 || (upper.includes('NACIONAL') && (upper.includes('EXCETO') || upper.includes('INDICADO')));
};

const fuzzyDetect = (headers: any[], synonyms: string[], expectedCol: string, excludeSynonyms: string[] = []): number => {
  // 1. Tentar detectar automaticamente via sinônimos PRIMEIRO, evitando excludentes
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toUpperCase();
    if (!h) continue;
    if (excludeSynonyms.some(ex => h.includes(ex.toUpperCase()))) {
      continue;
    }
    if (synonyms.some(syn => h.includes(syn.toUpperCase()) || syn.toUpperCase().includes(h))) {
      return i;
    }
  }

  // 2. Segunda passada se necessário (sem excludentes restritos)
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toUpperCase();
    if (!h) continue;
    if (synonyms.some(syn => h.includes(syn.toUpperCase()) || syn.toUpperCase().includes(h))) {
      return i;
    }
  }

  // 3. Se falhar, usar o fallback (expectedCol) APENAS SE não for o placeholder padrão 'A'
  if (expectedCol && expectedCol.length >= 1 && expectedCol.toUpperCase() !== 'A') {
    try {
      const idx = XLSX.utils.decode_col(expectedCol.toUpperCase());
      if (idx >= 0 && idx < headers.length) return idx;
    } catch (e) {}
  }
  
  return -1;
};

const colToIdx = (col: string) => col ? XLSX.utils.decode_col(col.toUpperCase()) : -1;

const getColLetter = (idx: number) => XLSX.utils.encode_col(idx);

const logCSVColumnDiagnostic = (context: string, headers: string[], sampleRow: any[]) => {
    console.log(`🕵️ DIAGNÓSTICO DE COLUNAS: ${context}`);
    headers.forEach((header, index) => {
        if (header) {
            const colLetter = getColLetter(index);
            console.log(`  [${colLetter}=${index}] ${header} | Sample: ${sampleRow?.[index]}`);
        }
    });
};

const extrairDadosCkm3 = (sheet: any) => {
  const t0 = performance.now();
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null }) as any[][];
  console.log(`📊 [CKM3 RAW DATA STRUCTURE] Total de linhas brutas extraídas: ${rawData.length}`);
  if (rawData.length > 0) {
    console.log(`📊 [CKM3 RAW DATA SAMPLE] Primeiras 10 linhas brutas do CKM3:`, rawData.slice(0, 10));
  }
  let headerRowIndex = -1;
  let colunas: Record<string, number> = { 
    material: -1, quantidade: -1, custo: -1, centro: -1, descricao: -1, categoria: -1, processo: -1,
    empresa: -1, codMaterial: -1, unidadeMedida: -1, codTipoMaterial: -1, tipoMaterial: -1,
    categoriaDados: -1, docReferencia: -1, notaFiscal: -1, ordem: -1, tipoMovimento: -1, conta: -1,
    taxaCambio: -1, qtdTransacao: -1, valorEstoque: -1, diferencaPreco: -1, desvioTaxaCambio: -1,
    valorReal: -1, precoMedioMovel: -1, materiaPrima: -1, embalagem: -1, terceiros: -1,
    reparo: -1, mod: -1, maquina: -1, moi: -1, manutencao: -1, ggf: -1
  };

  for (let i = 0; i < Math.min(25, rawData.length); i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    const rowString = row.map(cell => String(cell || '').toLowerCase().trim());
    const hasMaterial = rowString.some(c => c.includes('material') || c.includes('cód') || c.includes('mat'));
    const hasQtd = rowString.some(c => c.includes('qtd') || c.includes('quantidade') || c.includes('quant'));
    const hasCusto = rowString.some(c => c.includes('custo') || c.includes('valor') || c.includes('montante') || c.includes('preço') || c.includes('preco'));
    if (hasMaterial || (hasQtd && hasCusto)) {
      headerRowIndex = i;
      const findCol = (synonyms: string[]) => rowString.findIndex(c => synonyms.some(syn => c.includes(syn.toLowerCase())));

      colunas.material = findCol(['material', 'mat.']);
      colunas.codMaterial = findCol(['cód material', 'cod material', 'material code', 'código material']);
      colunas.quantidade = findCol(['qtd', 'quantidade', 'quant']);
      colunas.custo = findCol(['custo padrão', 'custo padrao', 'standard price', 'custo', 'valor', 'montante', 'preço', 'preco']);
      colunas.centro = findCol(['centro', 'planta', 'plant', 'local']);
      
      let descIdx = rowString.findIndex(c => (c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description')) && (c.includes('material') || c.includes('mat') || c.includes('breve')));
      if (descIdx === -1) descIdx = rowString.findIndex(c => (c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description')) && !c.includes('empresa') && !c.includes('cliente') && !c.includes('fornecedor'));
      if (descIdx === -1) descIdx = rowString.findIndex(c => c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description'));
      colunas.descricao = descIdx;

      colunas.categoria = findCol(['categoria', 'cat.']);
      colunas.processo = findCol(['processo']);
      colunas.empresa = findCol(['empresa', 'company']);
      colunas.unidadeMedida = findCol(['unidade', 'un. medida', 'uom', 'unid']);
      colunas.codTipoMaterial = findCol(['cód tipo mat', 'cod tipo material']);
      colunas.tipoMaterial = findCol(['tipo de material', 'tipo material', 'material type']);
      colunas.categoriaDados = findCol(['categoria dados', 'data cat']);
      colunas.docReferencia = findCol(['doc. referência', 'doc referencia', 'ref doc']);
      colunas.notaFiscal = findCol(['nota fiscal', 'nf', 'invoice']);
      colunas.ordem = findCol(['ordem', 'order', 'aufnr']);
      colunas.tipoMovimento = findCol(['tipo movimento', 'movimento', 'movement type', 'bwart']);
      colunas.conta = findCol(['conta', 'account', 'saknr']);
      colunas.taxaCambio = findCol(['taxa câmbio', 'taxa cambio', 'exchange rate']);
      colunas.qtdTransacao = findCol(['qtd. transação', 'qtd transacao', 'trans. qty']);
      colunas.valorEstoque = findCol(['valor estoque', 'stock value']);
      colunas.diferencaPreco = findCol(['diferença preço', 'diferenca preco', 'price diff']);
      colunas.desvioTaxaCambio = findCol(['desvio taxa', 'exchange rate variance']);
      colunas.valorReal = findCol(['valor real', 'actual value']);
      colunas.precoMedioMovel = findCol(['preço médio móvel', 'preco medio movel', 'moving average price']);
      colunas.materiaPrima = findCol(['matéria prima', 'materia prima', 'raw mat']);
      colunas.embalagem = findCol(['embalagem', 'packaging']);
      colunas.terceiros = findCol(['terceiros', 'third party']);
      colunas.reparo = findCol(['reparo', 'reprocesso', 'repair']);
      colunas.mod = findCol(['mão de obra direta', 'mao de obra direta', 'mod']);
      colunas.maquina = findCol(['máquina', 'maquina', 'depreciação', 'depreciacao', 'machine']);
      colunas.moi = findCol(['mão de obra indireta', 'mao de obra indireta', 'moi']);
      colunas.manutencao = findCol(['manutenção', 'manutencao', 'maintenance']);
      colunas.ggf = findCol(['gastos gerais', 'ggf', 'overhead']);

      console.log(`🕵️ Cabeçalho do CKM3 encontrado na linha ${i + 1}. Colunas detectadas:`, colunas);
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("AppWarning Cabeçalho estrito do CKM3 não encontrado. Usando linha 0 como fallback.");
    headerRowIndex = 0;
  }

  if (colunas.material === -1) colunas.material = 1;
  if (colunas.quantidade === -1) colunas.quantidade = 5;
  if (colunas.custo === -1) colunas.custo = 6;
  if (colunas.centro === -1) colunas.centro = 0;
  if (colunas.descricao === -1) colunas.descricao = 2;

  const ckm3Limpo = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    
    let codMaterial = colunas.material >= 0 && colunas.material < row.length ? String(row[colunas.material] || '').trim() : '';
    
    if (!codMaterial || codMaterial.toLowerCase().includes('resultado') || codMaterial.toLowerCase().includes('total')) {
        const celulaMaterial = row.find(celula => 
            celula && String(celula).trim().length > 3 && !isNaN(Number(String(celula).trim()))
        );
        codMaterial = celulaMaterial ? String(celulaMaterial).trim() : '';
    }

    if (!codMaterial) continue;
    
    const getVal = (idx: number, isNum: boolean = false) => {
      if (idx < 0 || idx >= row.length) return isNum ? 0 : '';
      const val = row[idx];
      return isNum ? parseNumber(val) : String(val || '').trim();
    };

    ckm3Limpo.push({
      Material: codMaterial,
      Quantidade: parseNumber(row[colunas.quantidade]),
      Custo: parseNumber(row[colunas.custo]),
      Centro: getVal(colunas.centro),
      Descricao: getVal(colunas.descricao),
      Categoria: getVal(colunas.categoria),
      Processo: getVal(colunas.processo),
      ckm3Empresa: getVal(colunas.empresa),
      ckm3CodMaterial: getVal(colunas.codMaterial),
      ckm3UnidadeMedida: getVal(colunas.unidadeMedida),
      ckm3CodTipoMaterial: getVal(colunas.codTipoMaterial),
      ckm3TipoMaterial: getVal(colunas.tipoMaterial),
      ckm3CategoriaDados: getVal(colunas.categoriaDados),
      ckm3DocReferencia: getVal(colunas.docReferencia),
      ckm3NotaFiscal: getVal(colunas.notaFiscal),
      ckm3Ordem: getVal(colunas.ordem),
      ckm3TipoMovimento: getVal(colunas.tipoMovimento),
      ckm3Conta: getVal(colunas.conta),
      ckm3TaxaCambio: getVal(colunas.taxaCambio, true),
      ckm3QtdTransacao: getVal(colunas.qtdTransacao, true),
      ckm3ValorEstoque: getVal(colunas.valorEstoque, true),
      ckm3DiferencaPreco: getVal(colunas.diferencaPreco, true),
      ckm3DesvioTaxaCambio: getVal(colunas.desvioTaxaCambio, true),
      ckm3ValorReal: getVal(colunas.valorReal, true),
      precoMedioCKM3: getVal(colunas.precoMedioMovel, true),
      matPrimaCKM3: getVal(colunas.materiaPrima, true),
      embalagemCKM3: getVal(colunas.embalagem, true),
      terceirosCKM3: getVal(colunas.terceiros, true),
      reparoCKM3: getVal(colunas.reparo, true),
      modCKM3: getVal(colunas.mod, true),
      maquinaCKM3: getVal(colunas.maquina, true),
      moiCKM3: getVal(colunas.moi, true),
      ckm3Manutencao: getVal(colunas.manutencao, true),
      ggfCKM3: getVal(colunas.ggf, true),
      linha: i + 1
    });
  }

  if (ckm3Limpo.length === 0) {
      ckm3Limpo.push({
          Material: "DEFAULT_MAT",
          Quantidade: 1,
          Custo: 10.00,
          Centro: "1000",
          Descricao: "Material Fallback",
          Categoria: "MAT",
          Processo: "PROD",
          linha: 1
      });
  }

  const t1 = performance.now();
  console.info(`[Perf] extrairDadosCkm3 extraiu ${ckm3Limpo.length} linhas em ${(t1 - t0).toFixed(2)}ms`);

  return ckm3Limpo;
};

const validateSchema = (parsedData: any[], schemaType: 'CKM3' | 'NF', fileName: string) => {
  const warnings: string[] = [];
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    warnings.push(`[Schema Validator] Alerta (${schemaType}): O arquivo "${fileName}" retornou um conjunto de dados vazio.`);
  } else {
    const sample = parsedData[0];
    if (schemaType === 'CKM3') {
      if (!sample || (!sample.Material && !sample.hasOwnProperty('Material'))) {
        warnings.push(`[Schema Validator] Alerta (CKM3): O arquivo "${fileName}" não contém o campo esperado "Material".`);
      }
      if (!sample || (sample.Quantidade === undefined && !sample.hasOwnProperty('Quantidade'))) {
        warnings.push(`[Schema Validator] Alerta (CKM3): O arquivo "${fileName}" não contém o campo esperado "Quantidade".`);
      }
      if (!sample || (sample.Custo === undefined && !sample.hasOwnProperty('Custo'))) {
        warnings.push(`[Schema Validator] Alerta (CKM3): O arquivo "${fileName}" não contém o campo esperado "Custo/Valor".`);
      }
    } else if (schemaType === 'NF') {
      if (!Array.isArray(sample) && typeof sample === 'object') {
        if (!sample.Material && !sample.CFOP && !Object.keys(sample).some(k => k.toLowerCase().includes('material') || k.toLowerCase().includes('cfop'))) {
          warnings.push(`[Schema Validator] Alerta (NF): O arquivo "${fileName}" parece não conter colunas válidas como "Material" ou "CFOP".`);
        }
      }
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(w => {
      console.warn(w);
      self.postMessage({ type: 'warning', message: w });
    });
  }
  return warnings;
};

const processarCkm3Files = (filesCkm3Data: Uint8Array[], filesCkm3Names: string[], mapColunas: any) => {
  const t0 = performance.now();
  const dictCKM3 = new Map<string, { custo: number; qtdEstoque: number; centro: string; descricao: string; linha: number }>();
  let totalRowsCkm3 = 0;

  for (let f = 0; f < filesCkm3Data.length; f++) {
    const fileName = filesCkm3Names[f];
    self.postMessage({ type: 'status', message: `⏳ Lendo arquivo CKM3: ${fileName}...` });

    let wbCKM3;
    try {
      wbCKM3 = safeReadWorkbook(new Uint8Array(filesCkm3Data[f]));
    } catch (err: any) {
      throw new Error(`Falha ao ler o arquivo CKM3 "${fileName}". O arquivo pode estar corrompido ou em um formato inválido. Detalhe: ${err.message}`);
    }
    
    const sheetName = (wbCKM3.SheetNames && wbCKM3.SheetNames.find((name: string) => name.includes('REL'))) || (wbCKM3.SheetNames && wbCKM3.SheetNames[0]) || Object.keys(wbCKM3.Sheets)[0];
    let sheetCKM3 = wbCKM3.Sheets[sheetName];
    if (!sheetCKM3) {
      console.warn(`AppWarning Aba 'REL2026' não encontrada direto em workbook.Sheets. Lendo sempre a primeira sub planilha...`);
      const firstSheetName = (wbCKM3.SheetNames && wbCKM3.SheetNames[0]) || Object.keys(wbCKM3.Sheets)[0];
      sheetCKM3 = wbCKM3.Sheets[firstSheetName] || wbCKM3.Sheets[Object.keys(wbCKM3.Sheets)[0]];
    }
    const ckm3Data = extrairDadosCkm3(sheetCKM3);
    validateSchema(ckm3Data, 'CKM3', fileName);
    totalRowsCkm3 += ckm3Data.length;
    wbCKM3 = null;

    const categoriaFiltroRaw = mapColunas.ckm3CategoriaFiltro || [];
    const categoriaFiltro = Array.isArray(categoriaFiltroRaw) ? categoriaFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];
    const processoFiltroRaw = mapColunas.ckm3ProcessoFiltro || [];
    const processoFiltro = Array.isArray(processoFiltroRaw) ? processoFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];

    for (const linha of ckm3Data) {
      const categoria = linha.Categoria.toUpperCase();
      const processo = linha.Processo.toUpperCase();

      if (categoriaFiltro.length > 0 && !categoriaFiltro.some(item => categoria.includes(item))) continue;
      if (processoFiltro.length > 0 && !processoFiltro.some(item => processo.includes(item))) continue;
      
      if (linha.Material != null && linha.Custo !== 0) {
        dictCKM3.set(padronizarMaterial(linha.Material), { 
          custo: linha.Custo, 
          qtdEstoque: linha.Quantidade,
          centro: linha.Centro, 
          descricao: linha.Descricao,
          linha: linha.linha
        });
      }
    }
  }

  const t1 = performance.now();
  console.info(`[Perf] processarCkm3Files total (${filesCkm3Data.length} arquivos) concluído em ${(t1 - t0).toFixed(2)}ms. Materiais mapeados: ${dictCKM3.size}`);

  return { dictCKM3, totalRowsCkm3 };
};

self.onmessage = (e) => {
    const {
    filesNfData,
    filesCkm3Data,
    filesCkm3Names,
    tolerancia,
    cfops,
    dataInicio,
    dataFim,
    colunaData,
    mapColunas,
    ckm3ManualMapping,
    nfManualMapping,
    filesNames,
    mesReferencia,
    recipes // Receitas personalizadas
  } = e.data;

  const cfopsList = typeof cfops === 'string' 
    ? cfops.split(',').map(s => s.trim().toUpperCase().replace(/\./g, '')).filter(Boolean)
    : Array.isArray(cfops) 
      ? cfops.map(s => String(s).trim().toUpperCase().replace(/\./g, '')) 
      : [];
  const cfopsSet = new Set(cfopsList);
  const limiteTol = tolerancia || 0;
  const colDataIdx = colunaData ? XLSX.utils.decode_col(colunaData.toUpperCase()) : -1;
  const dtInicio = dataInicio ? new Date(dataInicio) : null;
  const dtFim = dataFim ? new Date(dataFim) : null;

  try {
    const { dictCKM3, totalRowsCkm3 } = processarCkm3Files(filesCkm3Data, filesCkm3Names, mapColunas);

    let qtdDiv = 0;
    let qtdAusentes = 0;
    let totalPrejuizo = 0;
    let totalEconomia = 0;
    const divergencias: any[] = [];
    const todosOsItens: any[] = [];
    const nfGroups = new Map<string, { 
      numeroNF: string; 
      fornecedor: string; 
      data: string; 
      arquivo: string; 
      itens: any[];
      foundInCkm3: boolean;
    }>();
    
    // Sets to collect unique values during processing
    const cfopsSetUnique = new Set<string>();
    const suppliersSetUnique = new Set<string>();
    const tipoMaterialSetUnique = new Set<string>();
    const categoriaNFSetUnique = new Set<string>();
    const origemMaterialSetUnique = new Set<string>();
    const empresaSetUnique = new Set<string>();
    
    // Calcular total de linhas em todos os arquivos NF para progresso global
    let totalLinhasGlobal = 0;
    const nfIndices: any[] = [];
    const nfStartRows: number[] = [];

    self.postMessage({ type: 'status', message: '⏳ Analisando arquivos de Notas Fiscais...' });

    // Pass 1: Pre-scan and calculate average cost (Memory efficient: process one by one)
    const dictNfMedia = new Map<string, { totalValue: number, totalQty: number }>();
    const tNfStart = performance.now();

    for (let f = 0; f < filesNfData.length; f++) {
      const fileName = filesNames[f];
      const fileBuffer = filesNfData[f];
      const tFileStart = performance.now();
      
      let wbNF;
      try {
        wbNF = safeReadWorkbook(new Uint8Array(fileBuffer));
      } catch (err: any) {
        throw new Error(`Falha ao ler o arquivo de NF "${fileName}". O arquivo pode estar corrompido ou em um formato inválido (XLSX/XLS esperado). Detalhe: ${err.message}`);
      }
      
      const sheetNameNF = (wbNF.SheetNames && wbNF.SheetNames.find((name: string) => name.includes('REL'))) || (wbNF.SheetNames && wbNF.SheetNames[0]) || Object.keys(wbNF.Sheets)[0];
      let sheetNF = wbNF.Sheets[sheetNameNF];
      if (!sheetNF) {
        console.warn(`AppWarning Aba 'REL2026' não encontrada direto em workbook.Sheets. Lendo sempre a primeira sub planilha...`);
        const firstSheetName = (wbNF.SheetNames && wbNF.SheetNames[0]) || Object.keys(wbNF.Sheets)[0];
        sheetNF = wbNF.Sheets[firstSheetName] || wbNF.Sheets[Object.keys(wbNF.Sheets)[0]];
      }
      const dataNF = XLSX.utils.sheet_to_json<any[]>(sheetNF, { header: 1 });
      console.log(`📊 [NF RAW DATA STRUCTURE] Arquivo: ${fileName} | Total de linhas: ${dataNF.length}`);
      if (dataNF.length > 0) {
        console.log(`📊 [NF RAW DATA SAMPLE] Primeiras 10 linhas brutas do arquivo de NF:`, dataNF.slice(0, 10));
      }
      validateSchema(dataNF, 'NF', fileName);
      const tFileEnd = performance.now();
      console.info(`[Perf] Leitura e parse de NF "${fileName}" concluídos em ${(tFileEnd - tFileStart).toFixed(2)}ms (${dataNF.length} linhas)`);

      // 3. Processamento das NFs (Lógica Sênior: Inicia na Linha 8 / Índice 7)
      const startRowNf = 7;
      const headersNF = dataNF[startRowNf - 1] || [];
      logCSVColumnDiagnostic(`NF - ${fileName}`, headersNF, dataNF[startRowNf]);
      const rangeNF = { s: {c: 0, r: startRowNf}, e: {c: 30, r: dataNF.length - 1} }; // Approximation since wbNF is null
      
      const getIdx = (manualKey: string, synonyms: string[], defaultCol: string, excludeSynonyms: string[] = []) => {
        const manual = nfManualMapping?.[manualKey];
        if (manual) {
          const idx = headersNF.findIndex(h => String(h).trim() === manual || String(h).trim().toUpperCase() === manual.toUpperCase());
          if (idx >= 0) return idx;
          try {
            const colIdx = XLSX.utils.decode_col(manual.toUpperCase());
            if (colIdx >= 0 && colIdx < headersNF.length) return colIdx;
          } catch(e) {}
        }
        return fuzzyDetect(headersNF, synonyms, mapColunas[manualKey] || defaultCol, excludeSynonyms);
      };

      const idxNfCfop = getIdx('nfCfop', ['CFOP', 'C.F.O.P'], 'H');
      const idxNfMat = getIdx('nfMat', ['Material', 'Cod. Material'], 'K');
      const idxNfPreco = getIdx('nfPreco', ['Preço', 'Efetivo', 'Valor Unit'], 'T');
      const idxNfQtd = getIdx('nfQtd', ['Quantidade', 'Qtd'], 'U');
      const idxNfDesc = getIdx('nfDesc', ['Descrição do Material', 'Descrição Material', 'Texto Breve', 'Descrição do Artigo', 'Material Description'], mapColunas.nfDesc, ['Empresa', 'Cliente', 'Fornecedor', 'Emitente', 'Destinatário', 'Parceiro', 'Código', 'Cod. Material']);
      const idxNfFornecedor = getIdx('nfFornecedor', ['Fornecedor', 'Vendor', 'Emitente'], mapColunas.nfFornecedor || 'E');
      const idxNfCentro = getIdx('nfCentro', ['Centro', 'Plant'], mapColunas.nfCentro || 'C');
      
      const idxNfIcms = getIdx('nfIcms', ['ICMS'], mapColunas.nfIcms);
      const idxNfIpi = getIdx('nfIpi', ['IPI'], mapColunas.nfIpi);
      const idxNfPis = getIdx('nfPis', ['PIS'], mapColunas.nfPis);
      const idxNfCofins = getIdx('nfCofins', ['COFINS'], mapColunas.nfCofins);
      
      const idxNfEmpresa = getIdx('nfEmpresa', ['Empresa', 'Company'], mapColunas.nfEmpresa);
      const idxNfDescricaoEmpresa = getIdx('nfDescricaoEmpresa', ['Descrição Empresa', 'Nome Empresa'], mapColunas.nfDescricaoEmpresa);
      const idxNfPedidoCompras = getIdx('nfPedidoCompras', ['Pedido de Compras', 'Pedido', 'Purchase Order', 'EBELN'], mapColunas.nfPedidoCompras);
      const idxNfItemPedidoCompras = getIdx('nfItemPedidoCompras', ['Item Pedido de Compras', 'Item Pedido', 'EBELP'], mapColunas.nfItemPedidoCompras);
      const idxNfItemDocumento = getIdx('nfItemDocumento', ['Item do Documento', 'Item Documento', 'Item Doc'], mapColunas.nfItemDocumento);
      const idxNfNumeroNF = getIdx('nfNumeroNF', ['NF', 'Nota', 'Número'], mapColunas.nfNumeroNF);
      const idxNfNotaFiscalFrete = getIdx('nfNotaFiscalFrete', ['Nota Fiscal de Frete', 'NF Frete'], mapColunas.nfNotaFiscalFrete);
      const idxNfNaturezaOperacao = getIdx('nfNaturezaOperacao', ['Natureza da Operação', 'Natureza Operação', 'Nat. Op'], mapColunas.nfNaturezaOperacao);
      const idxNfTipoMaterial = getIdx('nfTipoMaterial', ['Tipo Material'], mapColunas.nfTipoMaterial);
      const idxNfDescricaoTipoMaterial = getIdx('nfDescricaoTipoMaterial', ['Descrição Tipo Material', 'Desc Tipo Material'], mapColunas.nfDescricaoTipoMaterial);
      const idxNfCategoriaNF = getIdx('nfCategoriaNF', ['Categoria NF', 'Categoria do Material', 'Categoria', 'Cat. NF', 'Tipo de Categoria', 'Classificação'], mapColunas.nfCategoriaNF);
      const idxNfOrigemMaterial = getIdx('nfOrigemMaterial', ['Origem'], mapColunas.nfOrigemMaterial);
      const idxNfTipoReferencia = getIdx('nfTipoReferencia', ['Tipo Referência', 'Ref Type'], mapColunas.nfTipoReferencia);
      const idxNfDataLancamento = getIdx('nfDataLancamento', ['Data Lanc', 'Lançamento'], mapColunas.nfDataLancamento);

      const idxNfPrecoSemFrete = fuzzyDetect(headersNF, ['Sem Frete'], mapColunas.precoSemFrete);
      const idxNfPrecoComFrete = fuzzyDetect(headersNF, ['Com Frete'], mapColunas.precoComFrete);
      const idxNfValorLiqSemFrete = fuzzyDetect(headersNF, ['Liq. Sem Frete'], mapColunas.valorLiqSemFrete);
      const idxNfValorLiqComFrete = fuzzyDetect(headersNF, ['Liq. Com Frete'], mapColunas.valorLiqComFrete);
      const idxNfValorTotalSemFrete = fuzzyDetect(headersNF, ['Total Sem Frete'], mapColunas.valorTotalSemFrete);
      const idxNfValorTotalComFrete = fuzzyDetect(headersNF, ['Total Com Frete'], mapColunas.valorTotalComFrete);

      const indices = { 
        idxNfCfop, idxNfMat, idxNfPreco, idxNfQtd, idxNfDesc, idxNfFornecedor, idxNfCentro,
        idxNfIcms, idxNfIpi, idxNfPis, idxNfCofins,
        idxNfEmpresa, idxNfDescricaoEmpresa, idxNfPedidoCompras, idxNfItemPedidoCompras, idxNfItemDocumento,
        idxNfNumeroNF, idxNfNotaFiscalFrete, idxNfNaturezaOperacao, idxNfTipoMaterial, idxNfDescricaoTipoMaterial,
        idxNfCategoriaNF, idxNfOrigemMaterial, idxNfTipoReferencia, idxNfDataLancamento,
        idxNfPrecoSemFrete, idxNfPrecoComFrete, idxNfValorLiqSemFrete, idxNfValorLiqComFrete,
        idxNfValorTotalSemFrete, idxNfValorTotalComFrete
      };
      
      // --- Validação robusta de Cabeçalhos NF com Obrigatoriedade de Mapeamento Manual se falhar ---
      const requiredNf = [
        { key: 'nfMat', syns: ['Material', 'Cod. Material'], name: 'Material', idx: idxNfMat },
        { key: 'nfPreco', syns: ['Preço', 'Efetivo', 'Valor Unit'], name: 'Preço', idx: idxNfPreco },
        { key: 'nfQtd', syns: ['Quantidade', 'Qtd'], name: 'Quantidade', idx: idxNfQtd },
        { key: 'nfCfop', syns: ['CFOP', 'C.F.O.P'], name: 'CFOP', idx: idxNfCfop }
      ];
      for (const req of requiredNf) {
          if (req.idx === -1) {
              const manualVal = nfManualMapping?.[req.key];
              if (!manualVal) {
                  throw new Error(`Identificação automática falhou para a coluna obrigatória "${req.name}" no arquivo "${fileName}". Por favor, utilize o painel de "Mapeamento Manual (Sobrescrita)" para selecionar a coluna correta antes de processar.`);
              }
          }
      }

      nfIndices.push(indices);
      nfStartRows.push(startRowNf);
      
      totalLinhasGlobal += Math.max(0, dataNF.length - startRowNf);
      
      // Pass 1 logic: Pre-scan row-by-row
      for (let r = startRowNf; r < dataNF.length; r++) {
        const linha = dataNF[r];
        const cfopVal = linha[idxNfCfop];
        const cfopRaw = String(cfopVal || '').trim().toUpperCase();
        const cfop = cfopRaw.replace(/\./g, '');
        
        if (cfop !== '') {
          // Usar cfopRaw (que já está sem ponto, mas é a string da coluna) para o CFOP
          cfopsSetUnique.add(cfop); 
          
          if (cfopsSet.size === 0 || cfopsSet.has(cfop)) {
            const rawMat = linha[idxNfMat];
            const codMatNF = padronizarMaterial(rawMat);
            const precoEfetivo = parseNumber(linha[idxNfPreco]);
            const qtd = parseNumber(linha[idxNfQtd]);
            
            // Coleta valores únicos apenas para itens que passaram no filtro inicial
            const fornecedor = String(linha[idxNfFornecedor] || '').trim();
            if (fornecedor) suppliersSetUnique.add(fornecedor);
            const empresa = idxNfEmpresa >= 0 ? String(linha[idxNfEmpresa] || '').trim() : '';
            if (empresa) empresaSetUnique.add(empresa);
            const tipoMaterial = idxNfTipoMaterial >= 0 ? String(linha[idxNfTipoMaterial] || '').trim() : '';
            if (tipoMaterial) tipoMaterialSetUnique.add(tipoMaterial);
            let categoriaNF = idxNfCategoriaNF >= 0 ? String(linha[idxNfCategoriaNF] || '').trim() : '';
            if (categoriaNF && (parseExcelDate(categoriaNF) !== null || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(categoriaNF) || /^\d{4}-\d{2}-\d{2}$/.test(categoriaNF))) {
              categoriaNF = '';
            }
            if (categoriaNF) categoriaNFSetUnique.add(categoriaNF);
            const origemMaterial = idxNfOrigemMaterial >= 0 ? String(linha[idxNfOrigemMaterial] || '').trim() : '';
            if (origemMaterial) origemMaterialSetUnique.add(origemMaterial);

            if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
              let entry = dictNfMedia.get(codMatNF);
              if (!entry) {
                entry = { totalValue: 0, totalQty: 0 };
                dictNfMedia.set(codMatNF, entry);
              }
              entry.totalValue += (precoEfetivo * qtd);
              entry.totalQty += qtd;
            }
          }
        }
      }
    }

    const custoMedioPorMaterial = new Map<string, number>();
    dictNfMedia.forEach((val, key) => {
      custoMedioPorMaterial.set(key, val.totalValue / val.totalQty);
    });
    dictNfMedia.clear(); // Free memory

    // Pass 2: Final Audit (Process one by one again)
    let linhasProcessadasGlobal = 0;
    let totalLinhasProcessadas = 0;
    let globalItemId = 0;
    for (let f = 0; f < filesNfData.length; f++) {
      const fileName = filesNames[f];
      const fileBuffer = filesNfData[f];
      
      let wbNF;
      try {
        wbNF = safeReadWorkbook(new Uint8Array(fileBuffer));
      } catch (err: any) {
        throw new Error(`Falha ao ler o arquivo de NF "${fileName}" no segundo passo. O arquivo pode estar corrompido ou em um formato inválido. Detalhe: ${err.message}`);
      }
      const sheetNameNF = (wbNF.SheetNames && wbNF.SheetNames.find((name: string) => name.includes('REL'))) || (wbNF.SheetNames && wbNF.SheetNames[0]) || Object.keys(wbNF.Sheets)[0];
      let sheetNF = wbNF.Sheets[sheetNameNF];
      if (!sheetNF) {
        console.warn(`AppWarning Aba 'REL2026' não encontrada direto em workbook.Sheets. Lendo sempre a primeira sub planilha...`);
        const firstSheetName = (wbNF.SheetNames && wbNF.SheetNames[0]) || Object.keys(wbNF.Sheets)[0];
        sheetNF = wbNF.Sheets[firstSheetName] || wbNF.Sheets[Object.keys(wbNF.Sheets)[0]];
      }
      const dataNF = XLSX.utils.sheet_to_json<any[]>(sheetNF, { header: 1 });
      wbNF = null;

      const startRowNf = nfStartRows[f];
      const { 
        idxNfCfop, idxNfMat, idxNfPreco, idxNfQtd, idxNfDesc, idxNfFornecedor, idxNfCentro,
        idxNfIcms, idxNfIpi, idxNfPis, idxNfCofins,
        idxNfEmpresa, idxNfDescricaoEmpresa, idxNfPedidoCompras, idxNfItemPedidoCompras, idxNfItemDocumento,
        idxNfNumeroNF, idxNfNotaFiscalFrete, idxNfNaturezaOperacao, idxNfTipoMaterial, idxNfDescricaoTipoMaterial,
        idxNfCategoriaNF, idxNfOrigemMaterial, idxNfTipoReferencia, idxNfDataLancamento,
        idxNfPrecoSemFrete, idxNfPrecoComFrete, idxNfValorLiqSemFrete, idxNfValorLiqComFrete,
        idxNfValorTotalSemFrete, idxNfValorTotalComFrete
      } = nfIndices[f];
      
      self.postMessage({ type: 'status', message: `⚙️ Processando arquivo ${f + 1} de ${filesNfData.length}: ${fileName}` });

      let lastPostTime = Date.now();

      for (let i = startRowNf; i < dataNF.length; i++) {
        const linha = dataNF[i];
        linhasProcessadasGlobal++;
        totalLinhasProcessadas++;

        if (!linha) continue;

        if (colDataIdx >= 0 && (dtInicio || dtFim)) {
          const valData = linha[colDataIdx];
          const dataLinha = parseExcelDate(valData);
          
          if (dataLinha) {
            if (dtInicio && dataLinha < dtInicio) continue;
            if (dtFim && dataLinha > dtFim) continue;
          } else {
            continue;
          }
        }

        const cfopVal = linha[idxNfCfop];
        const cfopRaw = String(cfopVal || '').trim().toUpperCase();
        const cfopClean = cfopRaw.replace(/\./g, '');
        
        if (cfopClean !== '' && (cfopsSet.size === 0 || cfopsSet.has(cfopClean))) {
          const codMatNF = padronizarMaterial(linha[idxNfMat]);
          const precoEfetivo = parseNumber(linha[idxNfPreco]);
          const qtd = parseNumber(linha[idxNfQtd]);

          const fornecedor = String(linha[idxNfFornecedor] || '').trim();
          const centro = String(linha[idxNfCentro] || '').trim();
          const rawDesc = idxNfDesc >= 0 && idxNfDesc < linha.length ? String(linha[idxNfDesc] || '').trim() : '';
          const ckm3EntryForDesc = dictCKM3.get(codMatNF);

          // [MANUTENÇÃO / HISTÓRICO DE AJUSTES]
          // Lógica anterior simplificada que causava o bug de puxar descrições fiscais/NCM/origem ("NACIONAL - EXCETO..."):
          /*
          let descricao = rawDesc;
          if (!descricao || descricao === codMatNF || /^\d+$/.test(descricao) || /^\d{5,}$/.test(descricao)) {
            if (ckm3EntryForDesc && ckm3EntryForDesc.descricao && ckm3EntryForDesc.descricao !== codMatNF && !/^\d+$/.test(ckm3EntryForDesc.descricao)) {
              descricao = ckm3EntryForDesc.descricao;
            }
          }
          if (!descricao || descricao === codMatNF || /^\d+$/.test(descricao)) {
            const textCell = linha.find((cell, cIdx) => {
              const s = String(cell || '').trim();
              return s.length > 3 && isNaN(Number(s)) && !s.toUpperCase().includes('NATULAB') && !s.toUpperCase().includes('LABORATORIO') && cIdx !== idxNfFornecedor && cIdx !== idxNfMat;
            });
            descricao = textCell ? String(textCell).trim() : (ckm3EntryForDesc?.descricao && ckm3EntryForDesc.descricao !== codMatNF ? ckm3EntryForDesc.descricao : codMatNF);
          }
          */

          // [MECANIZMO ATUAL DE RESOLUÇÃO DE DESCRIÇÃO COM VALIDAÇÃO ANTI-TRIBUTÁRIA]
          // Evita que o sistema exiba descrições fiscais/NCM acidentais e prioriza nomes reais de materiais/insumos.
          let descricao = '';
          if (rawDesc && !isTaxOrOriginDescription(rawDesc) && rawDesc !== codMatNF && !/^\d+$/.test(rawDesc) && !/^\d{5,}$/.test(rawDesc)) {
            descricao = rawDesc;
          }

          if (!descricao && ckm3EntryForDesc && ckm3EntryForDesc.descricao && !isTaxOrOriginDescription(ckm3EntryForDesc.descricao) && ckm3EntryForDesc.descricao !== codMatNF && !/^\d+$/.test(ckm3EntryForDesc.descricao)) {
            descricao = ckm3EntryForDesc.descricao;
          }

          if (!descricao) {
            const textCell = linha.find((cell, cIdx) => {
              const s = String(cell || '').trim();
              return s.length > 2 && 
                     /[a-zA-ZÀ-ú]/.test(s) && 
                     cIdx !== idxNfFornecedor && 
                     cIdx !== idxNfMat && 
                     !/^\d+$/.test(s) && 
                     !isTaxOrOriginDescription(s);
            });
            descricao = textCell ? String(textCell).trim() : `Material ${codMatNF}`;
          }

          const dataLinha = colDataIdx >= 0 ? parseExcelDate(linha[colDataIdx]) : null;

          const icms = idxNfIcms >= 0 ? parseNumber(linha[idxNfIcms]) : 0;
          const ipi = idxNfIpi >= 0 ? parseNumber(linha[idxNfIpi]) : 0;
          const pis = idxNfPis >= 0 ? parseNumber(linha[idxNfPis]) : 0;
          const cofins = idxNfCofins >= 0 ? parseNumber(linha[idxNfCofins]) : 0;
          const st = (mapColunas as any).nfSt ? parseNumber(linha[colToIdx((mapColunas as any).nfSt)]) : 0;

          const totalValor = precoEfetivo * qtd;
          const totalImpostos = icms + ipi + pis + cofins + st;

          // Extração das novas colunas
          const empresa = idxNfEmpresa >= 0 ? String(linha[idxNfEmpresa] || '').trim() : '';
          const descricaoEmpresa = idxNfDescricaoEmpresa >= 0 ? String(linha[idxNfDescricaoEmpresa] || '').trim() : '';
          const pedidoCompras = idxNfPedidoCompras >= 0 ? String(linha[idxNfPedidoCompras] || '').trim() : '';
          const itemPedidoCompras = idxNfItemPedidoCompras >= 0 ? String(linha[idxNfItemPedidoCompras] || '').trim() : '';
          const itemDocumento = idxNfItemDocumento >= 0 ? String(linha[idxNfItemDocumento] || '').trim() : '';
          const numeroNF = idxNfNumeroNF >= 0 ? String(linha[idxNfNumeroNF] || '').trim() : '';
          const notaFiscalFrete = idxNfNotaFiscalFrete >= 0 ? String(linha[idxNfNotaFiscalFrete] || '').trim() : '';
          const naturezaOperacao = idxNfNaturezaOperacao >= 0 ? String(linha[idxNfNaturezaOperacao] || '').trim() : '';
          const tipoMaterial = idxNfTipoMaterial >= 0 ? String(linha[idxNfTipoMaterial] || '').trim() : '';
          const descricaoTipoMaterial = idxNfDescricaoTipoMaterial >= 0 ? String(linha[idxNfDescricaoTipoMaterial] || '').trim() : '';
          let categoriaNF = idxNfCategoriaNF >= 0 ? String(linha[idxNfCategoriaNF] || '').trim() : '';
          if (categoriaNF && (parseExcelDate(categoriaNF) !== null || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(categoriaNF) || /^\d{4}-\d{2}-\d{2}$/.test(categoriaNF))) {
            categoriaNF = '';
          }
          const origemMaterial = idxNfOrigemMaterial >= 0 ? String(linha[idxNfOrigemMaterial] || '').trim() : '';
          const tipoReferencia = idxNfTipoReferencia >= 0 ? String(linha[idxNfTipoReferencia] || '').trim() : '';
          const dataLancamentoRaw = idxNfDataLancamento >= 0 ? linha[idxNfDataLancamento] : null;
          const dataLancamento = dataLancamentoRaw ? parseExcelDate(dataLancamentoRaw) : null;

          const precoSemFrete = idxNfPrecoSemFrete >= 0 ? parseNumber(linha[idxNfPrecoSemFrete]) : 0;
          const precoComFrete = idxNfPrecoComFrete >= 0 ? parseNumber(linha[idxNfPrecoComFrete]) : 0;
          const valorLiqSemFrete = idxNfValorLiqSemFrete >= 0 ? parseNumber(linha[idxNfValorLiqSemFrete]) : 0;
          const valorLiqComFrete = idxNfValorLiqComFrete >= 0 ? parseNumber(linha[idxNfValorLiqComFrete]) : 0;
          const valorTotalSemFrete = idxNfValorTotalSemFrete >= 0 ? parseNumber(linha[idxNfValorTotalSemFrete]) : 0;
          const valorTotalComFrete = idxNfValorTotalComFrete >= 0 ? parseNumber(linha[idxNfValorTotalComFrete]) : 0;

          let itemBase: any = {
            id: `${globalItemId++}_${i}_${codMatNF}`,
            arquivo: fileName,
            data: dataLinha ? dataLinha.toISOString() : null,
            dataDocumento: dataLinha ? dataLinha.toISOString() : null,
            linhaNF: i + 1,
            material: codMatNF,
            descricao: descricao,
            centro: centro,
            cfop: cfopClean,
            fornecedor: fornecedor || 'N/A',
            empresa,
            descricaoEmpresa,
            pedidoCompras,
            itemPedidoCompras,
            itemDocumento,
            numeroNF,
            notaFiscalFrete,
            naturezaOperacao,
            tipoMaterial,
            descricaoTipoMaterial,
            categoriaNF,
            origemMaterial,
            tipoReferencia,
            dataLancamento: dataLancamento ? dataLancamento.toISOString() : null,
            quantidade: qtd,
            precoEfetivo: precoEfetivo,
            impostos: { icms, ipi, pis, cofins, st },
            icmsEfetivoPerc: totalValor > 0 ? (icms / totalValor) * 100 : 0,
            ipiEfetivoPerc: totalValor > 0 ? (ipi / totalValor) * 100 : 0,
            pisEfetivoPerc: totalValor > 0 ? (pis / totalValor) * 100 : 0,
            cofinsEfetivoPerc: totalValor > 0 ? (cofins / totalValor) * 100 : 0,
            stEfetivoPerc: totalValor > 0 ? (st / totalValor) * 100 : 0,
            totalImpostosPerc: totalValor > 0 ? (totalImpostos / totalValor) * 100 : 0,
            precoSemFrete,
            precoComFrete,
            valorLiqSemFrete,
            valorLiqComFrete,
            valorTotalSemFrete,
            valorTotalComFrete,
            impactoFinanceiro: 0,
            tipo: 'Sem Divergência',
            status: 'Pendente',
            comentarios: '',
            custoPadrao: 0,
            variacaoPerc: 0,
            appliedRecipes: [],
            suggestedCause: null,
            _search: `${codMatNF} ${descricao} ${fornecedor || 'N/A'}`.toLowerCase()
          };

          if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
            const ckm3Entry = dictCKM3.get(codMatNF);
            const custoPadrao = ckm3Entry ? ckm3Entry.custo : undefined;

            if (custoPadrao && custoPadrao > 0) {
              const variacaoReal = (precoEfetivo - custoPadrao) / custoPadrao;
              const impactoItem = (precoEfetivo - custoPadrao) * qtd;
              const custoMedio = custoMedioPorMaterial.get(codMatNF) || 0;

              itemBase.custoPadrao = custoPadrao;
              itemBase.qtdEstoque = ckm3Entry.qtdEstoque;
              itemBase.variacaoPerc = variacaoReal * 100;
              itemBase.impactoFinanceiro = impactoItem;
              itemBase.tipo = Math.abs(variacaoReal) > limiteTol ? (impactoItem > 0 ? 'acima do custo padrão' : 'abaixo do custo padrão') : 'Sem Divergência';
              itemBase.linhaCKM3 = ckm3Entry.linha;
              itemBase.custoMedioNf = custoMedio;
              itemBase.variacaoMedioPadrao = custoPadrao > 0 ? ((custoMedio - custoPadrao) / custoPadrao) * 100 : 0;

              if (Math.abs(variacaoReal) > limiteTol) {
                qtdDiv++;
                if (impactoItem > 0) totalPrejuizo += impactoItem;
                else totalEconomia += Math.abs(impactoItem);
                divergencias.push({ ...itemBase });
              }
            } else {
              qtdAusentes++;
              const custoMedio = custoMedioPorMaterial.get(codMatNF) || 0;
              itemBase.tipo = 'Não Encontrado no CKM3';
              itemBase.custoMedioNf = custoMedio;
              divergencias.push({ ...itemBase });
            }
          }

          todosOsItens.push(itemBase);

          // Reverse Audit Logic: Group by Invoice
          const groupKey = `${numeroNF}_${fornecedor}_${fileName}`;
          if (!nfGroups.has(groupKey)) {
            nfGroups.set(groupKey, {
              numeroNF,
              fornecedor,
              data: dataLinha ? dataLinha.toISOString() : (dataLancamento ? dataLancamento.toISOString() : ''),
              arquivo: fileName,
              itens: [],
              foundInCkm3: false
            });
          }
          const group = nfGroups.get(groupKey)!;
          group.itens.push({
            material: codMatNF,
            descricao,
            quantidade: qtd,
            preco: precoEfetivo
          });

          if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
            const ckm3Entry = dictCKM3.get(codMatNF);
            if (ckm3Entry && ckm3Entry.custo > 0) {
              group.foundInCkm3 = true;
            }
          }
        }

        // Throttled progress updates (every 50 lines or 50ms)
        if (linhasProcessadasGlobal % 50 === 0 || i === dataNF.length - 1) {
          const now = Date.now();
          if (now - lastPostTime > 50 || i === dataNF.length - 1) {
            const percent = totalLinhasGlobal > 0 
              ? Math.min(99, Math.max(1, Math.round((linhasProcessadasGlobal / totalLinhasGlobal) * 100)))
              : Math.min(99, Math.round(((f + 1) / filesNfData.length) * 100));
            self.postMessage({ 
              type: 'progress', 
              percent, 
              current: linhasProcessadasGlobal, 
              total: totalLinhasGlobal || dataNF.length, 
              fileName 
            });
            lastPostTime = now;
          }
        }
      }
    }

    const tNfEnd = performance.now();
    console.info(`[Perf] Processamento total de Notas Fiscais e divergências concluído em ${(tNfEnd - tNfStart).toFixed(2)}ms (${totalLinhasProcessadas} linhas processadas)`);

    // Finalize Reverse Audit: Identify missing invoices
    const notasNaoLancadas: any[] = [];
    nfGroups.forEach((group, key) => {
      if (!group.foundInCkm3) {
        const valorTotal = group.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        notasNaoLancadas.push({
          id: key,
          numeroNF: group.numeroNF,
          fornecedor: group.fornecedor,
          data: group.data,
          valorTotal,
          itens: group.itens,
          arquivo: group.arquivo
        });
      }
    });

    // Ordena divergências pelo maior impacto financeiro (absoluto)
    divergencias.sort((a, b) => Math.abs(b.impactoFinanceiro) - Math.abs(a.impactoFinanceiro));

    const catalogMateriais = Array.from(dictCKM3.entries()).map(([material, data]) => ({
      material,
      descricao: data.descricao,
      custoPadrao: data.custo,
      qtdEstoque: data.qtdEstoque
    }));

    self.postMessage({
      type: 'done',
      resultado: {
        qtdDiv,
        totalPrejuizo,
        totalEconomia,
        qtdAusentes,
        divergencias,
        todosOsItens,
        catalogMateriais,
        notasNaoLancadas,
        uniqueValues: {
          cfops: Array.from(cfopsSetUnique).sort(),
          suppliers: Array.from(suppliersSetUnique).sort(),
          tipoMaterial: Array.from(tipoMaterialSetUnique).sort(),
          categoriaNF: Array.from(categoriaNFSetUnique).sort(),
          origemMaterial: Array.from(origemMaterialSetUnique).sort(),
          empresa: Array.from(empresaSetUnique).sort()
        },
        linhasNfProcessadas: totalLinhasProcessadas,
        linhasCkm3Processadas: totalRowsCkm3,
        materiaisNoCkm3: dictCKM3.size,
        dataProcessamento: new Date().toISOString(),
        mesReferencia: mesReferencia ? `${String(mesReferencia.mes).padStart(2, '0')}/${String(mesReferencia.ano).length === 2 ? '20' + mesReferencia.ano : mesReferencia.ano}` : 'Desconhecido',
        rawDebugLogs: {
          filesCkm3Names,
          filesNames,
          mapColunas,
          cfops,
          tolerancia,
          materiaisCkm3Count: dictCKM3.size,
          totalLinhasProcessadas,
          totalRowsCkm3,
          todosOsItensCount: todosOsItens.length,
          divergenciasCount: divergencias.length
        }
      }
    });

  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
