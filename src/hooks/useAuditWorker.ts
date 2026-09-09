import { useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { applyAuditRecipes, suggestRootCause } from '../utils/auditRuleEngine';
import { safeLocalStorageGet, getLargeData } from '../utils/storageUtils';
import { extrairMesAnoDoArquivo } from '../utils/dateUtils';

interface WorkerOptions {
  tolerancia: number;
  cfops: string;
  dataInicio: string;
  dataFim: string;
  colunaData: string;
  mapColunas: any;
  ckm3ManualMapping?: Record<string, string>;
  nfManualMapping?: Record<string, string>;
  recipes?: any[];
  decisionHistory?: Record<string, string>;
  justificationBase?: Record<string, string>;
}

export const useAuditWorker = (options: WorkerOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const lerExcelBuffer = useCallback(async (file: File): Promise<Uint8Array> => {
    if (file.arrayBuffer) {
      const buf = await file.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target?.result as ArrayBuffer));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const executarWorker = useCallback((
    filesCkm3Data: Uint8Array[], 
    filesCkm3Names: string[],
    filesNfData: Uint8Array[], 
    filesNames: string[],
    mesReferencia: any,
    onDone: (res: any) => void,
    onError: (err: Error) => void
  ) => {
    setIsProcessing(true);
    setStatus('⏳ Preparando arquivos para processamento...');
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('../worker.ts', import.meta.url), { 
      type: 'module',
      name: 'AuditWorker'
    });

    workerRef.current.onerror = (err) => {
      console.error('Worker Error Event:', err);
      const errorMsg = `Erro crítico no Worker: ${err.message || 'Falha ao carregar o script do worker'}`;
      setStatus(`❌ ${errorMsg}`);
      setWarnings(prev => [...prev, errorMsg]);
      setIsProcessing(false);
      onError(new Error(errorMsg));
    };

    workerRef.current.onmessage = async (e) => {
      const { type, message, percent, current, total, resultado: res, fileName } = e.data;

      if (type === 'status') {
        setStatus(message);
      } else if (type === 'progress') {
        setProgressPercent(percent);
        if (fileName === 'CKM3') {
          setStatus(`⏳ Indexando CKM3 (${fileName}): ${percent}% (${current} de ${total} materiais)`);
        } else {
          setStatus(`⚙️ Processando NFs (${fileName}): ${percent}% (${current} de ${total} linhas totais)`);
        }
      } else if (type === 'warning') {
        setWarnings(prev => [...prev, message]);
      } else if (type === 'error') {
        console.error('Worker reported error:', message);
        setStatus(`❌ Erro no processamento: ${message}`);
        setWarnings(prev => [...prev, `Erro no Worker: ${message}`]);
        setIsProcessing(false);
        onError(new Error(message));
      } else if (type === 'done') {
        setProgressPercent(100);
        
        // Multi-stage processing: 
        // 1. Merge comments (Async)
        // 2. Apply business rules (Recipes)
        // 3. Simple root cause detection

        const recipesInUse = options.recipes || [];

        const processedDivergencias = await Promise.all(res.divergencias.map(async (d: any) => {
          let item = { ...d };
          
          // Comment merge from local persistent storage (IndexedDB)
          const commentKey = `miniSap_comment_${d.material}_${d.numeroNF}_${d.data}`;
          const saved = await getLargeData<any>(commentKey, null);
          if (saved) {
            item = { ...item, comentarios: saved.comentarios, status: saved.status || item.status };
          }

          // Simple AI Suggestion (Root Cause)
          const suggestion = suggestRootCause(item, options.decisionHistory, options.justificationBase);
          if (suggestion) {
            item.suggestedCause = suggestion.cause;
          }
          
          return item;
        }));

        // Apply Custom Recipes to the result set if any active
        let finalizedDivergencias = applyAuditRecipes(processedDivergencias, recipesInUse);
        
        // Prioritization logic: Items with AI suggestions first, then by impact
        finalizedDivergencias = finalizedDivergencias.sort((a: any, b: any) => {
          // 1. Suggested cause priority
          if (a.suggestedCause && !b.suggestedCause) return -1;
          if (!a.suggestedCause && b.suggestedCause) return 1;
          
          // 2. Financial impact priority (absolute value)
          return Math.abs(b.impactoFinanceiro) - Math.abs(a.impactoFinanceiro);
        });
        
        const mergedTodos = await Promise.all((res.todosOsItens || []).map(async (d: any) => {
          const commentKey = `miniSap_comment_${d.material}_${d.numeroNF}_${d.data}`;
          const saved = await getLargeData<any>(commentKey, null);
          if (saved) {
            return { ...d, comentarios: saved.comentarios, status: saved.status || d.status };
          }
          return d;
        }));

        const finalRes = { 
          ...res, 
          divergencias: finalizedDivergencias, 
          todosOsItens: mergedTodos 
        };

        setStatus(`✅ Auditoria Finalizada! (Processadas ${res.linhasNfProcessadas} linhas de NF e ${res.linhasCkm3Processadas} linhas de CKM3)`);
        setIsProcessing(false);
        onDone(finalRes);
      }
    };

    workerRef.current.postMessage({
      filesNfData,
      filesNames,
      filesCkm3Data,
      filesCkm3Names,
      mesReferencia,
      ...options
    });
  }, [options]);

  const iniciarProcessamento = useCallback(async (filesNF: File[], filesCKM3: File[]) => {
    if (filesNF.length === 0 || filesCKM3.length === 0) {
      const errMsg = 'Por favor, anexe pelo menos um arquivo de NF e um arquivo CKM3 primeiro!';
      setWarnings([errMsg]);
      return Promise.reject(new Error(errMsg));
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setWarnings([]);

    try {
      // Stage 1: Parsing (0% - 30%)
      setStatus('📁 [1/3 Parsing] Lendo e decodificando buffers dos arquivos...');
      setProgressPercent(10);

      const filesCkm3Data = await Promise.all(filesCKM3.map(async (file, idx) => {
        setProgressPercent(10 + Math.round((idx + 1) / filesCKM3.length * 10));
        return lerExcelBuffer(file);
      }));
      const filesCkm3Names = filesCKM3.map(file => file.name);
      
      const filesNfData = [];
      const filesNames = [];
      for (let i = 0; i < filesNF.length; i++) {
        const file = filesNF[i];
        setStatus(`📁 [1/3 Parsing] Lendo Notas Fiscais (${i + 1}/${filesNF.length}): ${file.name}`);
        filesNfData.push(await lerExcelBuffer(file));
        filesNames.push(file.name);
        setProgressPercent(20 + Math.round((i + 1) / filesNF.length * 10));
      }

      // Stage 2: Validation (30% - 50%)
      setStatus('🔍 [2/3 Validation] Validando schemas, integridade e cabeçalhos das planilhas...');
      setProgressPercent(35);

      for (const name of filesCkm3Names) {
        if (!name.match(/\.(xlsx|xls|csv|html|xml)$/i)) {
          throw new Error(`Erro de Schema: O arquivo CKM3 "${name}" possui extensão inválida ou formato incompatível.`);
        }
      }
      for (const name of filesNames) {
        if (!name.match(/\.(xlsx|xls|csv|html|xml)$/i)) {
          throw new Error(`Erro de Schema: O arquivo de Nota Fiscal "${name}" possui extensão inválida ou formato incompatível.`);
        }
      }

      setProgressPercent(50);
      const mesReferencia = extrairMesAnoDoArquivo(filesCKM3[0].name);

      // Stage 3: Integration & Processing (50% - 100%)
      setStatus('⚙️ [3/3 Integration] Iniciando motor de cruzamento e regras SAP...');
      
      return new Promise<any>((resolve, reject) => {
        executarWorker(filesCkm3Data, filesCkm3Names, filesNfData, filesNames, mesReferencia, resolve, (err) => {
          const schemaError = new Error(`Falha no Schema ou Execução: ${err.message}`);
          reject(schemaError);
        });
      });
    } catch (error: any) {
      const errorMsg = `❌ Erro estrutural no pipeline de upload: ${error.message || 'Falha desconhecida no schema'}`;
      setStatus(errorMsg);
      setWarnings(prev => [...prev, errorMsg]);
      setIsProcessing(false);
      throw new Error(errorMsg);
    }
  }, [lerExcelBuffer, executarWorker]);

  return {
    isProcessing,
    setIsProcessing,
    status,
    setStatus,
    progressPercent,
    setProgressPercent,
    warnings,
    setWarnings,
    iniciarProcessamento
  };
};
