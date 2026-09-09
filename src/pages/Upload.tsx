import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, AlertCircle, Play, Calendar,
  Percent, Hash, Settings, Trash2, Eye
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { ordenarArquivosPorData } from '../utils/dateUtils';
import { MANDATORY_CKM3_COLUMNS } from '../constants/auditConstants';
import { validateHeaders } from '../utils/auditUtils';
import { lerArquivoComoArrayBuffer, processarUploadNFBlindado, processarPlanilhaCKM3 } from '../utils/excelProcessor';
import { validateFilePreUpload, validateContentHeaders, FileValidationResult } from '../utils/fileValidator';
import { FileValidationReport } from '../components/Upload/FileValidationReport';

import FileUploadZone from '../components/Upload/FileUploadZone';
import ColumnMapping from '../components/Upload/ColumnMapping';
import Logo from '../components/Logo';
import { OCRUpload } from '../components/Upload/OCRUpload';
import { PainelConciliacao } from '../components/Upload/PainelConciliacao';
import PreviewDados from '../components/Upload/PreviewDados';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    darkMode, filesNF, setFilesNF, filesCKM3, setFilesCKM3,
    status, warnings, progressPercent, isProcessing,
    tolerancia, setTolerancia, cfops, setCfops,
    dataInicio, setDataInicio, dataFim, setDataFim,
    mapColunas, setMapColunas, ckm3ManualMapping, setCkm3ManualMapping,
    nfManualMapping, setNfManualMapping,
    iniciarProcessamento, filterHideZeroes, setFilterHideZeroes, addToast
  } = useAudit();

  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [ocrResultados, setOcrResultados] = useState<any[]>([]);
  const [isDraggingNF, setIsDraggingNF] = useState(false);
  const [isDraggingCKM3, setIsDraggingCKM3] = useState(false);
  
  const [parsedCKM3Header, setParsedCKM3Header] = useState<string[] | null>(null);
  const [parsedNFHeader, setParsedNFHeader] = useState<string[] | null>(null);
  const [lastDetectedCKM3Headers, setLastDetectedCKM3Headers] = useState<string[] | null>(null);
  const [lastDetectedNFHeaders, setLastDetectedNFHeaders] = useState<string[] | null>(null);

  const [nfValidation, setNfValidation] = useState<FileValidationResult | null>(null);
  const [ckm3Validation, setCkm3Validation] = useState<FileValidationResult | null>(null);

  const [nfPreviewData, setNfPreviewData] = useState<any[] | null>(null);
  const [ckm3PreviewData, setCkm3PreviewData] = useState<any[] | null>(null);
  const [modalData, setModalData] = useState<{title: string, data: any[]} | null>(null);

  const handleFileNF = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Validação pré-upload robusta
    const validation = validateFilePreUpload(file, 'nf');
    setNfValidation(validation);
    if (!validation.isValid) {
      addToast(validation.errors[0], 'error');
      return;
    }
    if (validation.warnings.length > 0) {
      addToast(validation.warnings[0], 'info');
    }

    const newFiles = Array.from(files);
    const existingNames = new Set(filesNF.map(f => f.name));
    const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      
    if (filteredNewFiles.length > 0) {
      try {
        const fileData = await lerArquivoComoArrayBuffer(filteredNewFiles[0]);
        const { dadosJson, headers } = processarUploadNFBlindado(fileData);

        if (dadosJson && dadosJson.length > 0) {
          setNfPreviewData(dadosJson.slice(0, 5));
          const detectedHeaders = Object.keys(dadosJson[0] as object);
          setParsedNFHeader(detectedHeaders);
          setLastDetectedNFHeaders(headers);
          setFilesNF([...filesNF, ...filteredNewFiles]);
          addToast('Arquivo de Notas Fiscais validado e carregado com sucesso!', 'success');
        }
      } catch (erro: any) {
        console.error("Falha no processamento da NF:", erro);
        addToast(`Erro ao ler arquivo NF: ${erro.message}`, 'error');
      }
    }
  }, [filesNF, setFilesNF, addToast]);

  const handleRemoveFileNF = useCallback((fileName: string) => {
    setFilesNF(filesNF.filter(f => f.name !== fileName));
    if (filesNF.length <= 1) {
      setNfValidation(null);
      setParsedNFHeader(null);
      setNfPreviewData(null);
    }
  }, [filesNF, setFilesNF]);

  const handleFileCKM3 = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validação pré-upload robusta
    const validation = validateFilePreUpload(file, 'ckm3');
    setCkm3Validation(validation);
    if (!validation.isValid) {
      addToast(validation.errors[0], 'error');
      return;
    }
    if (validation.warnings.length > 0) {
      addToast(validation.warnings[0], 'info');
    }

    const newFiles = Array.from(files);
    const existingNames = new Set(filesCKM3.map(f => f.name));
    const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
    
    if (filteredNewFiles.length > 0) {
      try {
        const fileData = await lerArquivoComoArrayBuffer(filteredNewFiles[0]);
        const { dadosJson, headers } = processarPlanilhaCKM3(fileData);

        if (dadosJson && dadosJson.length > 0) {
          setCkm3PreviewData(dadosJson.slice(0, 5));
          setLastDetectedCKM3Headers(headers);
          const detectedHeaders = Object.keys(dadosJson[0] as object);
          setParsedCKM3Header(detectedHeaders);
          setFilesCKM3(ordenarArquivosPorData([...filesCKM3, ...filteredNewFiles]));
          addToast('Relatório CKM3 validado e carregado com sucesso!', 'success');
        }
      } catch (erro: any) {
        console.error("Falha no processamento do CKM3:", erro);
        addToast(`Erro ao ler CKM3: ${erro.message}`, 'error');
      }
    }
  }, [filesCKM3, setFilesCKM3, addToast]);

  const handleRemoveFileCKM3 = useCallback((fileName: string) => {
    const next = filesCKM3.filter(f => f.name !== fileName);
    setFilesCKM3(next);
    if (next.length === 0) {
      setParsedCKM3Header(null);
      setLastDetectedCKM3Headers(null);
      setCkm3Validation(null);
    }
  }, [filesCKM3, setFilesCKM3]);

  const handleClearAll = useCallback(() => {
    if (confirm("Tem certeza que deseja limpar todos os arquivos e dados carregados?")) {
      setFilesNF([]);
      setFilesCKM3([]);
      setNfPreviewData(null);
      setCkm3PreviewData(null);
      setParsedNFHeader(null);
      setParsedCKM3Header(null);
      setLastDetectedCKM3Headers(null);
      setLastDetectedNFHeaders(null);
      setNfValidation(null);
      setCkm3Validation(null);
      setOcrResultados([]);
      addToast('Dados limpos com sucesso!', 'success');
    }
  }, [setFilesNF, setFilesCKM3, addToast]);

  const handleProcess = useCallback(async () => {
    try {
      if (filesNF.length === 0) {
        throw new Error('Nenhum arquivo de Notas Fiscais foi carregado. Por favor, adicione pelo menos um arquivo Excel.');
      }
      if (filesCKM3.length === 0) {
        throw new Error('Nenhum arquivo CKM3 foi carregado. Por favor, adicione pelo menos um arquivo de Custo Padrão/Ledger.');
      }

      if (parsedNFHeader) {
        const requiredNf = ['Material', 'Preço', 'Quantidade', 'CFOP'];
        const keyMapNf: Record<string, string> = {
          'Material': 'nfMat',
          'Preço': 'nfPreco',
          'Quantidade': 'nfQtd',
          'CFOP': 'nfCfop'
        };
        const missingNf = requiredNf.filter(req => {
          const manualKey = keyMapNf[req];
          const hasManual = manualKey && nfManualMapping[manualKey];
          if (hasManual) return false;
          return !parsedNFHeader.some(h => String(h).toUpperCase().includes(req.toUpperCase()));
        });

        if (missingNf.length > 0) {
          throw new Error(`Validação de Esquema (Notas Fiscais): Colunas obrigatórias ausentes ou não mapeadas: [${missingNf.join(', ')}]. Utilize o painel de Mapeamento Manual (Sobrescrita) para associar as colunas corretamente antes de iniciar a auditoria.`);
        }
      }
      
      if (parsedCKM3Header) {
        const requiredCkm3 = ['Material', 'Quantidade', 'Centro', 'Descrição'];
        const keyMapCkm3: Record<string, string> = {
          'Material': 'ckm3Mat',
          'Quantidade': 'ckm3Qtd',
          'Centro': 'ckm3Centro',
          'Descrição': 'ckm3Desc'
        };
        const missingCkm3 = requiredCkm3.filter(req => {
          const manualKey = keyMapCkm3[req];
          const hasManual = manualKey && ckm3ManualMapping[manualKey];
          if (hasManual) return false;
          return !parsedCKM3Header.some(h => String(h).toUpperCase().includes(req.toUpperCase()));
        });

        if (missingCkm3.length > 0) {
          throw new Error(`Validação de Esquema (CKM3): Colunas obrigatórias ausentes ou não mapeadas: [${missingCkm3.join(', ')}]. Utilize o painel de Mapeamento Manual para associar as colunas corretamente.`);
        }
      }

      await iniciarProcessamento();
      
      try {
        await fetch('/api/powerbi/refresh', { method: 'POST' });
      } catch (e) {
        console.error('Falha ao disparar refresh do Power BI:', e);
      }
      
      addToast('Auditoria concluída com sucesso!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      addToast(`Falha na Validação/Auditoria: ${error.message || 'Erro inesperado'}`, 'error');
    }
  }, [iniciarProcessamento, addToast, navigate, filesNF, filesCKM3, parsedNFHeader, parsedCKM3Header, nfManualMapping, ckm3ManualMapping]);

  // Renderização (UI) - Mantida idêntica à original para não quebrar seu layout
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <Logo className="w-8 h-8" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Nova Auditoria
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Carregue seus arquivos e configure os parâmetros para iniciar a análise.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessão de Upload */}
        <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <FileSpreadsheet className="w-5 h-5" />
            Bases de Dados (Excel)
          </h3>
          
          <div className="space-y-6">
            <FileUploadZone 
              label="Notas Fiscais"
              files={filesNF}
              isDragging={isDraggingNF}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingNF(true); }}
              onDragLeave={() => setIsDraggingNF(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingNF(false); handleFileNF(e.dataTransfer.files); }}
              onFileSelect={handleFileNF}
              onRemoveFile={handleRemoveFileNF}
              multiple
              darkMode={darkMode}
              id="fileNF"
            />
            
            {nfValidation && filesNF.length > 0 && (
              <FileValidationReport 
                fileName={filesNF[filesNF.length - 1]?.name || 'Notas Fiscais'}
                validation={nfValidation}
                headerValidation={parsedNFHeader ? validateContentHeaders(parsedNFHeader, ['Material', 'Preço', 'Quantidade']) : undefined}
                requiredCount={3}
                onRemove={() => handleRemoveFileNF(filesNF[filesNF.length - 1]?.name)}
                darkMode={darkMode}
              />
            )}

            {nfPreviewData && (
              <button 
                onClick={() => setModalData({title: 'Notas Fiscais', data: nfPreviewData})}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Eye className="w-3 h-3" /> Visualizar Preview
              </button>
            )}

            {parsedNFHeader && (
              <>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-green-800'}`}>Visualização de Cabeçalhos (NF)</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsedNFHeader.map((h, i) => (
                    <span key={i} className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-green-700 border border-green-200'}`}>
                      {String(h)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-blue-800'}`}>Mapeamento Manual (Sobrescrita) - Notas Fiscais</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'nfMat', label: 'Material' },
                    { key: 'nfPreco', label: 'Preço' },
                    { key: 'nfQtd', label: 'Quantidade' },
                    { key: 'nfCfop', label: 'CFOP' },
                    { key: 'nfDesc', label: 'Descrição' },
                    { key: 'nfFornecedor', label: 'Fornecedor' },
                    { key: 'nfCentro', label: 'Centro' }
                  ].map(item => (
                    <div key={item.key}>
                      <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-blue-600'} mb-1 block`}>{item.label}</label>
                      <select 
                        value={nfManualMapping[item.key] || ''} 
                        onChange={(e) => setNfManualMapping({...nfManualMapping, [item.key]: e.target.value})}
                        className={`w-full p-2 border rounded-lg text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-blue-200 text-slate-800'}`}
                      >
                         <option value="">Automático</option>
                         {[...parsedNFHeader].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true })).map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}

            <FileUploadZone 
              label="Relatório CKM3"
              files={filesCKM3}
              multiple
              isDragging={isDraggingCKM3}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingCKM3(true); }}
              onDragLeave={() => setIsDraggingCKM3(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingCKM3(false); handleFileCKM3(e.dataTransfer.files); }}
              onFileSelect={handleFileCKM3}
              onRemoveFile={handleRemoveFileCKM3}
              darkMode={darkMode}
              id="fileCKM3"
            />

            {ckm3Validation && filesCKM3.length > 0 && (
              <FileValidationReport 
                fileName={filesCKM3[filesCKM3.length - 1]?.name || 'Relatório CKM3'}
                validation={ckm3Validation}
                headerValidation={parsedCKM3Header ? validateContentHeaders(parsedCKM3Header, ['Material', 'Quantidade', 'Centro', 'Descrição']) : undefined}
                requiredCount={4}
                onRemove={() => handleRemoveFileCKM3(filesCKM3[filesCKM3.length - 1]?.name)}
                darkMode={darkMode}
              />
            )}

            {ckm3PreviewData && (
              <button 
                onClick={() => setModalData({title: 'Relatório CKM3', data: ckm3PreviewData})}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Eye className="w-3 h-3" /> Visualizar Preview
              </button>
            )}
            
            {parsedCKM3Header && (
              <>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-green-800'}`}>Visualização de Cabeçalhos (CKM3)</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsedCKM3Header.map((h, i) => (
                    <span key={i} className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-green-700 border border-green-200'}`}>
                      {String(h)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-blue-800'}`}>Mapeamento Manual (Sobrescrita)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['ckm3Mat', 'ckm3Qtd', 'ckm3Centro', 'ckm3Desc'].map(key => (
                    <div key={key}>
                      <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-blue-600'} mb-1 block`}>Coluna para {key.replace('ckm3', '')}</label>
                      <select 
                        value={ckm3ManualMapping[key] || ''} 
                        onChange={(e) => setCkm3ManualMapping({...ckm3ManualMapping, [key]: e.target.value})}
                        className={`w-full p-2 border rounded-lg text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-blue-200 text-slate-800'}`}
                      >
                         <option value="">Automático</option>
                         {parsedCKM3Header.map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        </section>

        {/* Sessão de Parâmetros */}
        <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <Settings className="w-5 h-5" />
            Filtros e Parâmetros
            <button 
              onClick={handleClearAll}
              className={`ml-auto p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-700'}`}
              title="Limpar todos os dados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div title="Define o percentual máximo de variação tolerado entre o preço efetivo da nota fiscal e o custo padrão do SAP CKM3 antes de sinalizar uma divergência.">
              <label htmlFor="tolerancia" className={`flex items-center gap-2 text-xs font-bold mb-2 cursor-help ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Percent className="w-3 h-3" /> Tolerância de Variação (%) ℹ️
              </label>
              <input 
                id="tolerancia" type="number" value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div title="Filtra quais códigos CFOP de entrada de notas fiscais serão incluídos na auditoria (ex: 1102, 1202, 1353). Separe por vírgulas.">
              <label htmlFor="cfops" className={`flex items-center gap-2 text-xs font-bold mb-2 cursor-help ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Hash className="w-3 h-3" /> CFOPs Permitidos ℹ️
              </label>
              <input 
                id="cfops" type="text" value={cfops}
                onChange={(e) => setCfops(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div title="Define a data inicial de corte para filtrar as notas fiscais consideradas na auditoria.">
              <label htmlFor="dataInicio" className={`flex items-center gap-2 text-xs font-bold mb-2 cursor-help ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Início ℹ️
              </label>
              <input 
                id="dataInicio" type="date" value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div title="Define a data final de corte para filtrar as notas fiscais consideradas na auditoria.">
              <label htmlFor="dataFim" className={`flex items-center gap-2 text-xs font-bold mb-2 cursor-help ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Fim ℹ️
              </label>
              <input 
                id="dataFim" type="date" value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div className="flex items-center gap-2" title="Quando habilitado, oculta da tabela de auditoria os itens que possuem variação zero ou impacto financeiro nulo, facilitando a visualização de divergências ativas.">
              <label htmlFor="filterHideZeroes" className={`flex items-center gap-2 text-xs font-bold cursor-help ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <input 
                  id="filterHideZeroes" type="checkbox" checked={filterHideZeroes}
                  onChange={(e) => setFilterHideZeroes(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8DC63F] focus:ring-[#8DC63F]"
                />
                Ocultar Zeros automáticos ℹ️
              </label>
            </div>
          </div>

          <ColumnMapping 
            isOpen={isMappingOpen} onToggle={() => setIsMappingOpen(!isMappingOpen)}
            darkMode={darkMode} mapColunas={mapColunas} setMapColunas={setMapColunas}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OCRUpload 
          darkMode={darkMode} primaryColor="#8DC63F" 
          onExtractData={(data) => {
            setOcrResultados(data);
            addToast(`${data.length} arquivos processados!`, 'success');
          }} 
        />
        <PainelConciliacao darkMode={darkMode} primaryColor="#8DC63F" dados={ocrResultados} />
        <div className={`p-6 rounded-[2rem] border flex flex-col justify-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-[#8DC63F] mb-2">Dica de Produtividade</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Use o OCR para digitalizar notas fiscais físicas rapidamente. O NatuAssist identifica campos chave como número da NF e fornecedor automaticamente.
          </p>
        </div>
      </div>

      {/* Sessão de Ação */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleProcess} disabled={isProcessing}
          className={`w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all shadow-xl disabled:opacity-50 ${darkMode ? 'bg-[#8DC63F] hover:bg-[#78AF32] text-slate-900' : 'bg-[#8DC63F] hover:bg-[#78AF32] text-white'}`}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : ( <Play className="w-6 h-6" /> )}
          {isProcessing ? 'Processando...' : 'Iniciar Auditoria'}
        </button>

        {modalData && (
          <PreviewDados 
            isOpen={!!modalData}
            onClose={() => setModalData(null)}
            title={modalData.title}
            data={modalData.data}
            darkMode={darkMode}
          />
        )}

        {isProcessing && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>{status}</span>
              <span className="text-[#8DC63F]">{progressPercent}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
              <div 
                className="bg-[#8DC63F] h-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className={`w-full max-w-2xl p-4 rounded-xl border ${darkMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="w-5 h-5" /> Avisos
            </div>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
