import * as XLSX from 'xlsx';

// Garantir que XLSX esteja disponível
if (typeof self !== 'undefined') {
  (self as any).XLSX = XLSX;
}

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
      if (wb.Sheets[name]) ensureSheetRange(wb.Sheets[name]);
    }
  }

  return wb;
};

const parseExcelDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    } catch (e) { return null; }
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return null;
};

// ==========================================
// CORREÇÃO: Leitura limpa de números com sinais do SAP
// ==========================================
const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '') return 0;
    
    // SAP envia "-" no final às vezes (ex: 1.500,00-)
    const isNegative = s.startsWith('-') || s.endsWith('-');
    
    let clean = '';
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if ((char >= '0' && char <= '9') || char === ',' || char === '.') {
        clean += char;
      }
    }
    if (clean.includes(',') && clean.includes('.')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    
    return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
  }
  return 0;
};

const isMaterialValido = (material: string | undefined | null) => {
    if (!material) return false;
    const matStr = String(material).trim().toLowerCase();
    if (matStr === '' || matStr.includes('total')) return false;
    if (matStr === '1001' || matStr === '1005') return false;
    if (matStr === '13400000' || matStr.startsWith('1340')) return false; 
    return true; 
};

const fuzzyDetect = (headers: any[], synonyms: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toUpperCase();
    if (!h) continue;
    if (synonyms.some(syn => h.includes(syn.toUpperCase()) || syn.toUpperCase().includes(h))) {
      return i;
    }
  }
  return -1;
};

self.onmessage = async (e) => {
  const { filesData, filesNames, fileTypes, plant, mapping } = e.data;

  try {
    const allMovements: any[] = [];
    const allInitial: any[] = [];
    const allFinal: any[] = [];
    const initialHeaders: any[] = [];
    const finalHeaders: any[] = [];
    
    for (let f = 0; f < filesData.length; f++) {
      const fileName = filesNames[f];
      const fileType = fileTypes ? fileTypes[f] : 'movements';
      
      try {
        self.postMessage({ type: 'status', message: `⏳ Lendo arquivo: ${fileName} (${f + 1}/${filesData.length})...` });
        
        const wb = safeReadWorkbook(new Uint8Array(filesData[f]));
        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
          console.warn(`Arquivo ${fileName} sem planilhas válidas.`);
          continue;
        }

        let sheetName = '';
        let sheet: any = null;

        if (fileType === 'initial' || fileType === 'final') {
          const targetName = "AM_PP_POSICAO_ESTOQUE_01";
          const foundSheet = wb.SheetNames.find((name: string) => name === targetName || name.toUpperCase() === targetName || name.toUpperCase().includes(targetName));
          if (foundSheet) {
            sheetName = foundSheet;
          } else if (wb.SheetNames.length >= 2) {
            sheetName = wb.SheetNames[1];
          } else {
            sheetName = wb.SheetNames[0];
          }
          sheet = wb.Sheets[sheetName];
        } else {
          sheetName = wb.SheetNames.find((name: string) => name.includes('REL')) || wb.SheetNames[0];
          sheet = wb.Sheets[sheetName];
          if (!sheet) {
            sheet = wb.Sheets[wb.SheetNames[0]];
          }
        }

        if (!sheet) {
          console.warn(`Planilha não encontrada no arquivo ${fileName}`);
          continue;
        }

        const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (!data || data.length === 0) {
          console.warn(`Arquivo ${fileName} está vazio.`);
          continue;
        }

        if (fileType === 'movements') {
          let headerIdx = -1;
          let idxDoc = -1, idxDate = -1, idxType = -1, idxMat = -1, idxDesc = -1, idxQtd = -1, idxPlant = -1, idxLoc = -1, idxUser = -1;

          if (mapping) {
            headerIdx = 0; 
            if (data[0] && data[0].some(cell => typeof cell === 'string' && (cell.toUpperCase().includes('MATERIAL') || cell.toUpperCase().includes('MOVIMENTO')))) {
              headerIdx = 1;
            }
            idxType = mapping.movementType;
            idxMat = mapping.material;
            idxDesc = mapping.description;
            idxQtd = mapping.quantity;
            idxLoc = mapping.storageLocation;
            idxDate = mapping.date;
            idxDoc = mapping.docNumber ?? -1;
            idxPlant = mapping.plant ?? -1;
            idxUser = mapping.user ?? -1;
            
            const headers = data[headerIdx - 1] || [];
            if (idxDoc === -1) idxDoc = fuzzyDetect(headers, ['Documento', 'Doc. Mat', 'Doc.Material', 'Número doc.']);
            if (idxPlant === -1) idxPlant = fuzzyDetect(headers, ['Centro', 'Plnt', 'Plant']);
            if (idxUser === -1) idxUser = fuzzyDetect(headers, ['Usuário', 'User', 'User Name']);
          } else {
            for (let i = 0; i < Math.min(data.length, 25); i++) {
              const row = data[i];
              if (row && row.some(cell => String(cell).toUpperCase().includes('MATERIAL') || String(cell).toUpperCase().includes('DOCUMENTO') || String(cell).toUpperCase().includes('TIPO'))) {
                headerIdx = i;
                break;
              }
            }

            if (headerIdx === -1) {
              headerIdx = 0; // Fallback to first row
            }

            const headers = data[headerIdx] || [];
            idxDoc = fuzzyDetect(headers, ['Documento', 'Doc. Mat', 'Doc.Material', 'Número doc.']);
            idxDate = fuzzyDetect(headers, ['Data', 'Data Lançamento', 'Dt. Lançamento', 'Pstng Date']);
            idxType = fuzzyDetect(headers, ['Tipo Movimento', 'Tp. Mov', 'MvT', 'Movement Type']);
            idxMat = fuzzyDetect(headers, ['Material', 'Cod. Material', 'Produto']);
            idxDesc = fuzzyDetect(headers, ['Descrição', 'Texto Breve', 'Material Description']);
            idxQtd = fuzzyDetect(headers, ['Quantidade', 'Qtd', 'Quantity']);
            idxPlant = fuzzyDetect(headers, ['Centro', 'Plnt', 'Plant']);
            idxLoc = fuzzyDetect(headers, ['Depósito', 'SLoc', 'Storage Location']);
            idxUser = fuzzyDetect(headers, ['Usuário', 'User', 'User Name']);
            headerIdx = headerIdx + 1;
          }

          for (let i = headerIdx; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const material = idxMat >= 0 ? String(row[idxMat] || '').trim().replace(/^0+/, '') : String(row[1] || '').trim().replace(/^0+/, '');
            if (!material) continue;

            if (material.startsWith('10') || material.startsWith('49')) continue;

            const movementType = idxType >= 0 ? String(row[idxType] || '').trim() : String(row[0] || '').trim();
            
            const locVal = idxLoc >= 0 ? String(row[idxLoc] || '').trim() : String(row[11] || '').trim();
            if (movementType === '101' && !locVal) continue;

            const currentPlant = idxPlant >= 0 ? String(row[idxPlant] || '').trim() : '';
            if (plant && currentPlant && currentPlant !== plant) continue;

            const docNumber = idxDoc >= 0 ? String(row[idxDoc] || '').trim() : '';
            const date = idxDate >= 0 ? parseExcelDate(row[idxDate]) : null;
            
            allMovements.push({
              id: `${docNumber || 'NODOC'}_${i}_${f}`,
              docNumber: docNumber || 'N/A',
              date: date ? date.toISOString() : new Date().toISOString(),
              movementType,
              material,
              description: idxDesc >= 0 ? String(row[idxDesc] || '').trim() : '',
              quantity: idxQtd >= 0 ? parseNumber(row[idxQtd]) : 0,
              plant: currentPlant,
              storageLocation: locVal,
              user: idxUser >= 0 ? String(row[idxUser] || '').trim() : ''
            });

            // Chunking & yielding every 2000 rows to prevent main thread/worker freeze on huge datasets
            if (i % 2000 === 0) {
              const rowProgress = (i - headerIdx) / (data.length - headerIdx || 1);
              const percent = Math.round(((f + rowProgress) / filesData.length) * 100);
              self.postMessage({
                type: 'progress',
                percent: Math.min(99, Math.max(1, percent)),
                message: `⏳ Processando MB51: linha ${i.toLocaleString()} de ${data.length.toLocaleString()} (${fileName})...`
              });
              await new Promise(r => setTimeout(r, 0));
            }
          }
        } else {
          let dataStartIdx = 0;
          let idxMat = 0;
          let idxDesc = 1;
          let idxPlant = 4;
          let idxQtd = 11;

          for (let i = 0; i < Math.min(data.length, 25); i++) {
            const row = data[i];
            if (row && row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes('MATERIAL'))) {
              dataStartIdx = i + 1;
              const headers = row;
              if (fileType === 'initial' && initialHeaders.length === 0) initialHeaders.push(...headers);
              if (fileType === 'final' && finalHeaders.length === 0) finalHeaders.push(...headers);

              const fMat = fuzzyDetect(headers, ['Material', 'Cód.', 'Cód Material']);
              const fDesc = fuzzyDetect(headers, ['Descrição', 'Texto Breve']);
              const fPlant = fuzzyDetect(headers, ['Centro', 'Plant', 'Plnt', 'Cód Centro']);
              const fQtd = fuzzyDetect(headers, ['Utilização livre', 'Livre', 'Estoque', 'Quantidade', 'Qtd', 'Final', 'Estoque Final', 'Estoque Atual', 'Total', 'Qtd.Livre']);
              
              if (fMat >= 0) idxMat = fMat;
              if (fDesc >= 0) idxDesc = fDesc;
              if (fPlant >= 0) idxPlant = fPlant;
              if (fQtd >= 0) idxQtd = fQtd;
              break;
            }
          }

          if (initialHeaders.length === 0 && fileType === 'initial' && data[0]) {
            initialHeaders.push(...data[0]);
          }
          if (finalHeaders.length === 0 && fileType === 'final' && data[0]) {
            finalHeaders.push(...data[0]);
          }

          for (let i = dataStartIdx; i < data.length; i++) {
            const row = data[i];
            if (!row || !isMaterialValido(row[idxMat])) continue;

            const currentPlant = String(row[idxPlant] || '').trim();
            if (plant && currentPlant && currentPlant !== plant) {
               continue;
            }

            const item = {
              material: String(row[idxMat] || '').trim().replace(/^0+/, ''),
              description: String(row[idxDesc] || '').trim(),
              plant: currentPlant,
              quantity: parseNumber(row[idxQtd]),
              rawData: row
            };

            if (fileType === 'initial') allInitial.push(item);
            else allFinal.push(item);

            if (i % 2000 === 0) {
              await new Promise(r => setTimeout(r, 0));
            }
          }
        }
      } catch (fileErr: any) {
        console.warn(`⚠️ Aviso ao processar arquivo ${fileName}:`, fileErr);
      }

      self.postMessage({ 
        type: 'progress', 
        percent: Math.round(((f + 1) / filesData.length) * 100),
        message: `Arquivo ${f + 1}/${filesData.length} processado com sucesso.`
      });
    }

    self.postMessage({ 
      type: 'done', 
      movements: allMovements,
      initial: allInitial,
      final: allFinal,
      initialHeaders,
      finalHeaders
    });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Erro desconhecido no processamento' });
  }
};
