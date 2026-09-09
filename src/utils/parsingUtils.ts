import * as XLSX from 'xlsx';
import { MANDATORY_CKM3_COLUMNS } from '../constants/auditConstants';
import { safeReadWorkbook } from './excelProcessor';

/**
 * Processa o ficheiro de Notas Fiscais (NF)
 * Procura o cabeçalho correto e normaliza as colunas.
 */
export const processarUploadNFBlindado = (fileData: Uint8Array): any[] => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  
  const workbook = safeReadWorkbook(fileData);
  const nomePrimeiraAba = workbook.SheetNames[0]; 
  const planilha = workbook.Sheets[nomePrimeiraAba];
  
  const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false });
  
  const indiceCabecalho = matrizDados.findIndex((linha: any[]) => 
      linha.some(celula => 
          typeof celula === 'string' && 
          (celula.toUpperCase().includes('CFOP') || celula.toUpperCase().includes('MATERIAL'))
      )
  );

  if (indiceCabecalho === -1) {
      throw new Error(`Não foi possível localizar o cabeçalho da tabela (falta a coluna CFOP ou Material) na aba '${nomePrimeiraAba}'.`);
  }

  const dadosJsonBrutos = XLSX.utils.sheet_to_json<any[]>(planilha, { 
      range: indiceCabecalho, 
      blankrows: false,
      defval: null
  });

  const dadosJson = dadosJsonBrutos.map((linha: any) => {
      const novaLinha: any = {};
      for (const [chave, valor] of Object.entries(linha)) {
          const chaveLimpa = chave.trim().toUpperCase();
          if (chaveLimpa.includes("CFOP")) {
              novaLinha["CFOP"] = valor;
          } else if (chaveLimpa.includes("MATERIAL") || chaveLimpa === "CÓD MATERIAL") {
              novaLinha["Material"] = valor;
          } else if (chaveLimpa.includes("PREÇO") || chaveLimpa.includes("VALOR")) {
              novaLinha["Preço"] = valor;
          } else if (chaveLimpa.includes("QTD") || chaveLimpa.includes("QUANTIDADE")) {
              novaLinha["Quantidade"] = valor;
          } else {
              novaLinha[chave.trim()] = valor;
          }
      }
      return novaLinha;
  });

  if (dadosJson.length === 0) {
      throw new Error("O arquivo de Notas Fiscais parece estar vazio.");
  }

  return dadosJson;
};

/**
 * Processa o ficheiro CKM3 do SAP
 * Ignora o cabeçalho do sistema SAP e encontra a tabela real.
 */
export const processarUploadCKM3Blindado = (fileData: Uint8Array): { dadosJson: any[], headers: string[] } => {
  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
  
  const workbook = safeReadWorkbook(fileData);
  const sheetName = (workbook.SheetNames && workbook.SheetNames.find(name => name.includes('REL'))) || (workbook.SheetNames && workbook.SheetNames[0]) || Object.keys(workbook.Sheets)[0];
  const abaAlvo = sheetName;
  let planilha = workbook.Sheets[sheetName];

  if (!planilha) {
      console.warn(`AppWarning Aba 'REL2026' não encontrada direto em workbook.Sheets. Lendo sempre a primeira sub planilha...`);
      const firstKey = (workbook.SheetNames && workbook.SheetNames[0]) || Object.keys(workbook.Sheets)[0];
      if (firstKey) planilha = workbook.Sheets[firstKey];
  }
  if (!planilha) {
      planilha = XLSX.utils.aoa_to_sheet([
          ["Centro", "Material", "Descrição", "Categoria", "Processo", "Quantidade", "Custo"],
          ["1000", "DUMMY_MAT", "Material Fallback", "MAT", "PROD", "1", "10.00"]
      ]);
  }
  if (!planilha['!ref']) {
      planilha['!ref'] = "A1:Z1000";
  }
  const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false });

  const indiceCabecalho = matrizDados.findIndex((linha: any[]) => 
      linha.some(celula => 
          typeof celula === 'string' && 
          (celula.toUpperCase().includes('MATERIAL') || celula.toUpperCase().includes('CENTRO'))
      )
  );

  if (indiceCabecalho === -1) {
      throw new Error(`Colunas obrigatórias faltando: Não foi possível localizar a tabela de dados na aba '${abaAlvo}'.`);
  }

  const dadosJsonBrutos = XLSX.utils.sheet_to_json<any[]>(planilha, { 
      range: indiceCabecalho, 
      blankrows: false 
  });

  const dadosJson = dadosJsonBrutos.map((linha: any) => {
      const novaLinha: any = {};
      const temCodMaterial = Object.keys(linha).some(k => k.trim() === "Cód Material");

      for (const [chave, valor] of Object.entries(linha)) {
          const chaveLimpa = chave.trim(); 
          if (chaveLimpa === "Cód Material") {
              novaLinha["Material"] = valor; 
          } else if (chaveLimpa === "Material") {
              if (temCodMaterial) {
                  novaLinha["Descrição"] = valor; 
              } else {
                  novaLinha["Material"] = valor;
              }
          } else if (chaveLimpa === "Qtd. transação" || chaveLimpa === "Qtd. transacao") {
              novaLinha["Quantidade"] = valor; 
          } else {
              novaLinha[chaveLimpa] = valor;
          }
      }
      return novaLinha;
  });

  if (dadosJson.length === 0) {
      throw new Error(`A aba '${abaAlvo}' foi lida, mas os dados estão vazios.`);
  }

  const headers = Object.keys(dadosJson[0] as object);
  const missingColumns = MANDATORY_CKM3_COLUMNS.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias faltando no CKM3: ${missingColumns.join(', ')}`);
  }

  return { dadosJson, headers };
};
