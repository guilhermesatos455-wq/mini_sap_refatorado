export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileSizeMB: number;
  extension: string;
}

export const validateFilePreUpload = (file: File, expectedType: 'nf' | 'ckm3'): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileSizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  const allowedExtensions = ['xlsx', 'xls', 'csv', 'txt', 'xml', 'html', 'htm'];

  if (file.size === 0) {
    errors.push('O arquivo está vazio (0 bytes). Verifique se o arquivo foi exportado corretamente.');
  }

  if (fileSizeMB > 150) {
    errors.push(`O arquivo é muito grande (${fileSizeMB}MB). O limite recomendado é 150MB.`);
  } else if (fileSizeMB > 50) {
    warnings.push(`Arquivo grande (${fileSizeMB}MB). O processamento em background poderá levar alguns segundos.`);
  }

  if (!allowedExtensions.includes(extension)) {
    errors.push(`Extensão '.${extension}' não suportada. Use arquivos Excel (.xlsx, .xls), CSV, TXT ou relatórios SAP (XML/HTML).`);
  }

  if (expectedType === 'nf' && file.name.toLowerCase().includes('ckm3')) {
    warnings.push('Aviso: O arquivo possui "CKM3" no nome, mas está sendo carregado na seção de Notas Fiscais.');
  }

  if (expectedType === 'ckm3' && (file.name.toLowerCase().includes('nf') || file.name.toLowerCase().includes('nota'))) {
    warnings.push('Aviso: O arquivo possui "NF" ou "Nota" no nome, mas está sendo carregado na seção CKM3.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileSizeMB,
    extension,
  };
};

export const validateContentHeaders = (detectedHeaders: string[], requiredHeaders: string[]): { isValid: boolean; missing: string[]; matchedCount: number } => {
  const normalizedDetected = detectedHeaders.map(h => String(h).trim().toUpperCase());
  const missing: string[] = [];
  let matchedCount = 0;

  requiredHeaders.forEach(req => {
    const found = normalizedDetected.some(h => h.includes(req.toUpperCase()) || req.toUpperCase().includes(h));
    if (found) {
      matchedCount++;
    } else {
      missing.push(req);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    matchedCount,
  };
};
