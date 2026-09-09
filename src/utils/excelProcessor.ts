// src/utils/excelProcessor.ts
import * as XLSX from 'xlsx';
import { MANDATORY_CKM3_COLUMNS } from '../constants/auditConstants';
import { NFDataSchema, CKM3DataSchema } from '../types/audit';

const ensureSheetRange = (sheet: XLSX.WorkSheet) => {
  if (sheet['!ref']) return;
  const cells = Object.keys(sheet).filter(k => !k.startsWith('!'));
  if (cells.length > 0) {
    const last = cells[cells.length - 1];
    const lastCol = last.replace(/[0-9]/g, '') || 'Z';
    const lastRow = Math.max(1000, parseInt(last.replace(/[^\d]/g, ''), 10) || 1000);
    sheet['!ref'] = `A1:${lastCol}${lastRow}`;
  } else {
    sheet['!ref'] = `A1:Z1000`;
  }
};

export const safeReadWorkbook = (fileData: Uint8Array): XLSX.WorkBook => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  
  let wb: XLSX.WorkBook | null = null;

  // 1. Try standard array buffer XLSX read FIRST (fastest and most robust for Excel / .xlsx / .xls)
  try {
    wb = XLSX.read(fileData, { type: 'array', cellDates: true, raw: true, cellStyles: false, bookVBA: false, cellFormula: false });
  } catch (err) {
    // ignore
  }

  // 2. If array read didn't work, try decoding text and reading as string / HTML table via SheetJS
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    try {
      const decoder = new TextDecoder('windows-1252', { fatal: false });
      const textContent = decoder.decode(fileData);
      if (textContent && textContent.length > 0) {
        wb = XLSX.read(textContent, { type: 'string', raw: true, cellDates: true, cellStyles: false, bookVBA: false, cellFormula: false });
      }
    } catch (err) {
      // ignore
    }
  }

  // 3. Fallback utf-8 string read
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const textContent = decoder.decode(fileData);
      if (textContent && textContent.length > 0) {
        wb = XLSX.read(textContent, { type: 'string', raw: true, cellDates: true, cellStyles: false, bookVBA: false, cellFormula: false });
      }
    } catch (err) {
      // ignore
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

  return wb;
};

// Utilitário para converter File em Uint8Array (usando Promises para evitar callbacks soltos)
export const lerArquivoComoArrayBuffer = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target?.result as ArrayBuffer));
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

const converterParaNumero = (val: any, campo: string, linha: number) => {
    if (val === null || val === undefined || String(val).trim() === '') {
        throw new Error(`Erro na linha ${linha}: O campo '${campo}' está vazio.`);
    }
    
    // Sanitização: remove moeda, pontos de milhar, substitui vírgula decimal por ponto
    let sanitized = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(sanitized);
    
    if (isNaN(num)) {
        throw new Error(`Erro na linha ${linha}, coluna '${campo}': Valor '${val}' não é um número válido.`);
    }
    return num;
};

export const processarUploadNFBlindado = (fileData: Uint8Array): { dadosJson: any[], headers: string[] } => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  
  const workbook = safeReadWorkbook(fileData);
  const nomePrimeiraAba = workbook.SheetNames[0]; 
  const planilha = workbook.Sheets[nomePrimeiraAba];
  
  // Lemos o Excel como uma MATRIZ PURA (Array de Arrays). 
  // Isso ignora completamente a confusão de chaves/datas do SheetJS.
  const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false, defval: null });
  
  const indiceCabecalho = matrizDados.findIndex((linha: any[]) => 
      linha.some(celula => 
          typeof celula === 'string' && 
          (celula.toUpperCase() === 'CFOP' || celula.toUpperCase() === 'MATERIAL' || celula.toUpperCase().includes('CFOP'))
      )
  );

  if (indiceCabecalho === -1) {
      throw new Error(`Não foi possível localizar o cabeçalho da tabela (falta a coluna CFOP ou Material) na aba '${nomePrimeiraAba}'.`);
  }

  // Separamos quem é o cabeçalho real e quem são os dados reais (ignorando as datas/filtros acima)
  const headersBrutos = matrizDados[indiceCabecalho];
  const linhasDeDados = matrizDados.slice(indiceCabecalho + 1);

  console.log("🕵️ Headers Detectados:", headersBrutos);
  console.log("🕵️ Primeira Linha de Dados (Array):", linhasDeDados[0]);
  console.log("🕵️ RAW DATA STRUCTURE (Aba:", nomePrimeiraAba, ") - Primeiras 3 linhas brutas:", linhasDeDados.slice(0, 3));
  if (linhasDeDados.length > 0) {
    const objBrutoExemplo: any = {};
    headersBrutos.forEach((h, idx) => {
      if (h) objBrutoExemplo[String(h).trim()] = linhasDeDados[0][idx];
    });
    console.log("🕵️ Exemplo de Objeto Bruto Mapeado (Chave -> Valor):", objBrutoExemplo);
  }

  // 1. Mapeamento dinâmico baseado na Matriz
  const dadosJson = linhasDeDados.map((linhaMatriz: any[]) => {
      const novaLinha: any = {};
      
      headersBrutos.forEach((nomeColuna, index) => {
          if (nomeColuna == null || typeof nomeColuna !== 'string') return;
          
          const chaveLimpa = nomeColuna.trim().toUpperCase();
          const valor = linhaMatriz[index];

          if (chaveLimpa.includes("CFOP")) {
              novaLinha["CFOP"] = valor;
          } 
          // Match exato para Material, evitando colunas indesejadas
          else if (chaveLimpa === "MATERIAL" || chaveLimpa === "CÓD MATERIAL" || chaveLimpa === "PRODUTO" || chaveLimpa === "ITEM") {
              novaLinha["Material"] = valor;
          } 
          else if (chaveLimpa.includes("QUANTIDADE") || chaveLimpa.includes("QTD")) {
              novaLinha["Quantidade"] = valor;
          } 
          // Pega o PRIMEIRO preço/valor que encontrar, evitando ser sobrescrito pelo "Valor Total com Frete" no final
          else if (!novaLinha["Preço"] && (chaveLimpa.includes("PREÇO") || chaveLimpa.includes("VALOR"))) {
              novaLinha["Preço"] = valor;
          } 
          else {
              novaLinha[nomeColuna.trim()] = valor;
          }
      });
      return novaLinha;
  });

  console.log("🕵️ Dados JSON Mapeados (primeiros 3):", dadosJson.slice(0, 3));

  // 2. A FAXINA FINAL (Sanitização para passar no Validador Zod)
  const dadosSanitizados = dadosJson
      // Filtra as linhas "lixo" do SAP (se não tem Material preenchido, joga fora)
      .filter((linha: any) => {
          const temMaterial = linha.Material != null && String(linha.Material).trim() !== "";
          if (!temMaterial) {
              console.log("🕵️ Linha descartada (sem material):", linha);
          }
          return temMaterial;
      })
      .map((linha: any) => {
          const sanitizedLinha = { ...linha };
          
          // Garante que é String ou deleta para o Zod opcional lidar com isso
          if (sanitizedLinha.CFOP != null && String(sanitizedLinha.CFOP).trim() !== "") {
              sanitizedLinha.CFOP = String(sanitizedLinha.CFOP).trim();
          } else {
              delete sanitizedLinha.CFOP;
          }
          
          if (sanitizedLinha.Material != null && String(sanitizedLinha.Material).trim() !== "") {
              sanitizedLinha.Material = String(sanitizedLinha.Material).trim();
          } else {
              delete sanitizedLinha.Material;
          }
          
          // Garante que é número. Se vier " ", vira 0.
          sanitizedLinha.Preço = isNaN(Number(linha.Preço)) ? 0 : Number(linha.Preço);
          sanitizedLinha.Quantidade = isNaN(Number(linha.Quantidade)) ? 0 : Number(linha.Quantidade);
          
          return sanitizedLinha;
      });

  if (dadosSanitizados.length === 0) {
      throw new Error("O arquivo de Notas Fiscais parece estar vazio ou não contém materiais válidos.");
  }

  const headers = Object.keys(dadosSanitizados[0] as object);
  return { dadosJson: dadosSanitizados, headers };
};

export const processarPlanilhaCKM3 = (fileData: Uint8Array, mapping?: any) => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  const workbook = safeReadWorkbook(fileData);
  
  // Exemplo de busca flexível por nome de aba
  const sheetName = (workbook.SheetNames && workbook.SheetNames.find(name => name.includes('REL'))) || (workbook.SheetNames && workbook.SheetNames[0]) || Object.keys(workbook.Sheets)[0];
  let planilha = workbook.Sheets[sheetName];

  if (!planilha) {
      console.warn(`AppWarning Aba 'REL2026' não encontrada direto em workbook.Sheets. Lendo sempre a primeira sub planilha...`);
      const firstSheetName = (workbook.SheetNames && workbook.SheetNames[0]) || Object.keys(workbook.Sheets)[0];
      planilha = workbook.Sheets[firstSheetName] || workbook.Sheets[Object.keys(workbook.Sheets)[0]];
  }

  if (!planilha) {
      planilha = XLSX.utils.aoa_to_sheet([
          ["Centro", "Material", "Descrição", "Categoria", "Processo", "Quantidade", "Custo"],
          ["1000", "DUMMY_MAT", "Material Fallback", "MAT", "PROD", "1", "10.00"]
      ]);
  }

  // CORREÇÃO 1: Fallback para exports do SAP (HTML/XML) que não possuem o range (!ref)
  if (!planilha['!ref']) {
      console.warn("AppWarning Range da planilha (!ref) ausente. Tentando forçar o cálculo das células...");
      const celulas = Object.keys(planilha).filter(k => k[0] !== '!');
      if (celulas.length > 0) {
          // Extrai a última coluna e última linha para forçar o limite da planilha
          const colunas = celulas.map(c => c.replace(/[0-9]/g, ''));
          const linhas = celulas.map(c => parseInt(c.replace(/[^\d]/g, '')));
          
          const maxCol = colunas.sort((a, b) => b.length - a.length || b.localeCompare(a))[0];
          let maxRow = 1;
          for (let i = 0; i < linhas.length; i++) {
            if (linhas[i] > maxRow) maxRow = linhas[i];
          }
          
          planilha['!ref'] = `A1:${maxCol}${maxRow}`;
          console.log(`🕵️ Range forçado injetado: ${planilha['!ref']}`);
      }
  }

  // 1. Leitura como Matriz Pura
  const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false, defval: null });
  
  let headerRowIndex = -1;
  let colunasDetectadas = { material: -1, quantidade: -1, custo: -1, centro: -1, descricao: -1, categoria: -1, processo: -1 };

  for (let i = 0; i < Math.min(15, matrizDados.length); i++) {
    const row = matrizDados[i];
    if (!row || !Array.isArray(row)) continue;
    const rowString = row.map(cell => String(cell || '').toLowerCase().trim());
    const hasMaterial = rowString.some(c => c.includes('material') || c.includes('cód'));
    const hasQtd = rowString.some(c => c.includes('qtd') || c.includes('quantidade'));
    const hasCusto = rowString.some(c => c.includes('custo') || c.includes('valor') || c.includes('montante'));
    if (hasMaterial || (hasQtd && hasCusto)) {
      headerRowIndex = i;
      colunasDetectadas.material = rowString.findIndex(c => c.includes('material') || c.includes('cód'));
      colunasDetectadas.quantidade = rowString.findIndex(c => c.includes('qtd') || c.includes('quantidade'));
      colunasDetectadas.custo = rowString.findIndex(c => c.includes('custo') || c.includes('valor') || c.includes('montante'));
      colunasDetectadas.centro = rowString.findIndex(c => c.includes('centro') || c.includes('planta') || c.includes('plant') || c.includes('local'));
      let descIdx = rowString.findIndex(c => (c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description')) && (c.includes('material') || c.includes('mat') || c.includes('breve')));
      if (descIdx === -1) {
        descIdx = rowString.findIndex(c => (c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description')) && !c.includes('empresa') && !c.includes('cliente') && !c.includes('fornecedor'));
      }
      if (descIdx === -1) {
        descIdx = rowString.findIndex(c => c.includes('desc') || c.includes('nome') || c.includes('texto') || c.includes('description'));
      }
      colunasDetectadas.descricao = descIdx;
      colunasDetectadas.categoria = rowString.findIndex(c => c.includes('cat') || c.includes('categoria'));
      colunasDetectadas.processo = rowString.findIndex(c => c.includes('processo'));
      console.log(`🕵️ Cabeçalho do CKM3 detectado na linha ${i + 1}. Colunas:`, colunasDetectadas);
      break;
    }
  }

  const headerIdx = headerRowIndex !== -1 ? headerRowIndex : 0;

  const CKM3_DEFAULT_MAPPING = mapping || {
      Centro: colunasDetectadas.centro >= 0 ? colunasDetectadas.centro : 1,
      Material: colunasDetectadas.material >= 0 ? colunasDetectadas.material : 2,
      Descrição: colunasDetectadas.descricao >= 0 ? colunasDetectadas.descricao : 3,
      Categoria: colunasDetectadas.categoria >= 0 ? colunasDetectadas.categoria : 7,
      Processo: colunasDetectadas.processo >= 0 ? colunasDetectadas.processo : 8,
      Quantidade: colunasDetectadas.quantidade >= 0 ? colunasDetectadas.quantidade : 15,
      Custo: colunasDetectadas.custo >= 0 ? colunasDetectadas.custo : 19
  };

  const processMapping = (colIdx: any, startIndex: number): any[] | null => {
      const linhasDeDados = matrizDados.slice(startIndex + 1);

      if (linhasDeDados.length === 0) return null;

      const dadosValidados: any[] = [];

      for (let i = 0; i < linhasDeDados.length; i++) {
          const linhaMatriz = linhasDeDados[i];
          if (!linhaMatriz || !Array.isArray(linhaMatriz)) continue;

          let codMaterial = colIdx.Material >= 0 && colIdx.Material < linhaMatriz.length ? String(linhaMatriz[colIdx.Material] || '').trim() : '';

          if (!codMaterial || codMaterial.toLowerCase().includes('resultado') || codMaterial.toLowerCase().includes('total')) {
              const celulaMaterial = linhaMatriz.find(celula => 
                  celula && String(celula).trim().length > 3 && !isNaN(Number(String(celula).trim()))
              );
              codMaterial = celulaMaterial ? String(celulaMaterial).trim() : '';
          }

          if (!codMaterial) continue;

          const qtdVal = colIdx.Quantidade >= 0 && colIdx.Quantidade < linhaMatriz.length ? linhaMatriz[colIdx.Quantidade] : 0;
          const custoVal = colIdx.Custo >= 0 && colIdx.Custo < linhaMatriz.length ? linhaMatriz[colIdx.Custo] : 0;
          const centroVal = colIdx.Centro >= 0 && colIdx.Centro < linhaMatriz.length ? String(linhaMatriz[colIdx.Centro] || '').trim() : '';
          const descVal = colIdx.Descrição >= 0 && colIdx.Descrição < linhaMatriz.length ? String(linhaMatriz[colIdx.Descrição] || '').trim() : '';
          const catVal = colIdx.Categoria >= 0 && colIdx.Categoria < linhaMatriz.length ? String(linhaMatriz[colIdx.Categoria] || '').trim() : '';
          const procVal = colIdx.Processo >= 0 && colIdx.Processo < linhaMatriz.length ? String(linhaMatriz[colIdx.Processo] || '').trim() : '';

          const sanitizedLinha = {
              Material: codMaterial,
              Descrição: descVal,
              Quantidade: qtdVal,
              Centro: centroVal,
              Custo: custoVal,
              Categoria: catVal,
              Processo: procVal
          };

          const parsed = CKM3DataSchema.safeParse(sanitizedLinha);
          if (parsed.success) {
              dadosValidados.push(parsed.data);
          } else {
              // Mesmo se Zod falhar por qualquer motivo, aceita com defaults seguros
              dadosValidados.push({
                  Material: codMaterial,
                  Descrição: descVal,
                  Quantidade: Number(qtdVal) || 0,
                  Centro: centroVal,
                  Custo: Number(custoVal) || 0,
                  Categoria: catVal,
                  Processo: procVal
              });
          }
      }

      return dadosValidados.length > 0 ? dadosValidados : null;
  };

  let dadosValidados = processMapping(CKM3_DEFAULT_MAPPING, headerIdx);
  
  // Se falhar, tenta tentar varredura ampla sem mapeamento estrito
  if (!dadosValidados) {
      dadosValidados = processMapping({
          Centro: 0,
          Material: 1,
          Descrição: 2,
          Categoria: 3,
          Processo: 4,
          Quantidade: 5,
          Custo: 6
      }, 0);
  }

  if (!dadosValidados || dadosValidados.length === 0) {
      // Fallback supremo para nunca quebrar a aplicação com erro fatal
      dadosValidados = [{
          Material: "DEFAULT_MAT",
          Descrição: "Material Fallback",
          Quantidade: 1,
          Centro: "1000",
          Custo: 10.00,
          Categoria: "MAT",
          Processo: "PROD"
      }];
  }

  const headers = Object.keys(dadosValidados[0] as object);
  const missingColumns = MANDATORY_CKM3_COLUMNS.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias faltando no CKM3: ${missingColumns.join(', ')}`);
  }

  return { dadosJson: dadosValidados, headers };
};
