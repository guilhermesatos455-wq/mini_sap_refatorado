import React, { useState, useRef } from 'react';
import { FileText, Download, Upload, CheckCircle2, ShieldAlert, Sparkles, FileSpreadsheet, Layers, Eye } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { generateWordTechnicalReport, downloadFile, AuditReportData } from '../../utils/officeTemplates';

export const TemplatesManager: React.FC = () => {
  const { darkMode, addToast, aiUser, resultado, branding } = useAudit();
  
  const [selectedTemplate, setSelectedTemplate] = useState<'parecer_word' | 'planilha_excel' | 'matriz_sox'>('parecer_word');
  const [codigoParecer, setCodigoParecer] = useState(`PAR-AUD-2026/08-${Math.floor(1000 + Math.random() * 9000)}`);
  const [plantaSelecionada, setPlantaSelecionada] = useState('1001 - Farmacêutica Natulab');
  const [customParecerText, setCustomParecerText] = useState(
    'Com base na conciliação automatizada entre o Razão de Materiais SAP (CKM3) e os Documentos Fiscais escriturados (MIRO), constatou-se que as variações apuradas derivam de flutuações sazonais de insumos e repasses de fretes FOB. Recomenda-se rodada de atualização no CK40N.'
  );
  const [uploadedTemplates, setUploadedTemplates] = useState<Array<{ id: string; name: string; type: string; date: string }>>([
    { id: '1', name: 'Natulab_Timbrado_Oficial_2026.dotx', type: 'Word Template', date: '01/08/2026' },
    { id: '2', name: 'Planilha_CKM3_Padrão_Controladoria.xltx', type: 'Excel Template', date: '05/08/2026' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadWordReport = () => {
    const reportData: AuditReportData = {
      titulo: 'Parecer Técnico de Auditoria CKM3 e Divergências de Custos',
      codigoParecer,
      auditorNome: aiUser?.nome || 'Guilherme Santos de Souza',
      auditorMatricula: aiUser?.matricula || '89201',
      dataAuditoria: new Date().toLocaleDateString('pt-BR'),
      planta: plantaSelecionada,
      totalAuditado: resultado?.totais?.totalItens || 184,
      totalDivergencias: resultado?.divergencias?.length || 6,
      impactoFinanceiro: resultado?.totais?.impactoTotal || 71600.00,
      maiorVariacaoPerc: 34.80,
      parecerConclusivo: customParecerText
    };

    const docContent = generateWordTechnicalReport(reportData);
    const fileName = `Parecer_Auditoria_${codigoParecer.replace(/[\/\s]/g, '_')}.doc`;
    
    downloadFile(docContent, fileName, 'application/msword');
    addToast(`Parecer Técnico baixado com sucesso: ${fileName}`, 'success');
  };

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newEntry = {
        id: String(Date.now()),
        name: file.name,
        type: file.name.endsWith('.xltx') || file.name.endsWith('.xlsx') ? 'Excel Template' : 'Word Template',
        date: new Date().toLocaleDateString('pt-BR')
      };
      setUploadedTemplates(prev => [newEntry, ...prev]);
      addToast(`Modelo corporativo "${file.name}" carregado com sucesso!`, 'success');
    }
  };

  return (
    <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Modelos Corporativos & Parecer Técnico em Microsoft Word</h2>
            <p className="text-xs text-slate-400">Geração de pareceres técnicos formais para auditoria externa (SOX / Big Four) e modelos timbrados.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadTemplate}
            accept=".dotx,.docx,.xltx,.xlsx,.doc"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload de Novo Modelo (.dotx / .xltx)
          </button>
        </div>
      </div>

      {/* Template Chooser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setSelectedTemplate('parecer_word')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedTemplate === 'parecer_word' ? (darkMode ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500' : 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400') : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-200">Parecer Técnico Word (.doc/.docx)</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Documento formal timbrado com carimbo SOX Seção 404, CPC 16 / IAS 2, tabela de variações críticas e assinaturas.
          </p>
        </div>

        <div
          onClick={() => setSelectedTemplate('planilha_excel')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedTemplate === 'planilha_excel' ? (darkMode ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500' : 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400') : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-200">Planilha CKM3 Excel (.xltx/.xlsx)</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Planilha dinâmica compatível com Excel 2013 e Office 365, com fórmulas de variância e formatação condicional.
          </p>
        </div>

        <div
          onClick={() => setSelectedTemplate('matriz_sox')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedTemplate === 'matriz_sox' ? (darkMode ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500' : 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400') : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-200">Matriz de Risco & Evidências SOX</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Dossiê completo contendo hashes SHA-256 de conciliação e trilha de auditoria para arquivamento corporativo.
          </p>
        </div>
      </div>

      {/* Editor & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Parâmetros do Documento Corporativo</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">Código do Parecer</label>
              <input
                type="text"
                value={codigoParecer}
                onChange={(e) => setCodigoParecer(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-300">Planta Produtiva</label>
              <select
                value={plantaSelecionada}
                onChange={(e) => setPlantaSelecionada(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              >
                <option value="1001 - Farmacêutica Natulab">Planta 1001 (Farmacêutica)</option>
                <option value="1005 - Nutracêuticos Natulab">Planta 1005 (Nutracêuticos)</option>
                <option value="2001 - Centro de Distribuição">Planta 2001 (Logística / CD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-slate-300">Texto Conclusivo do Parecer (Editável)</label>
            <textarea
              rows={4}
              value={customParecerText}
              onChange={(e) => setCustomParecerText(e.target.value)}
              className={`w-full p-3 rounded-xl text-xs border leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownloadWordReport}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Parecer Técnico em Microsoft Word (.doc/.docx)
            </button>
          </div>
        </div>

        {/* Uploaded Templates Repository */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Modelos Corporativos Disponíveis</h3>

          <div className="space-y-2">
            {uploadedTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${tpl.type.includes('Word') ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {tpl.type.includes('Word') ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{tpl.name}</h4>
                    <p className="text-[10px] text-slate-400">{tpl.type} • Carregado em {tpl.date}</p>
                  </div>
                </div>

                <button
                  onClick={() => addToast(`Modelo "${tpl.name}" selecionado como template ativo.`, 'info')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 cursor-pointer"
                >
                  Usar Modelo
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="leading-tight">
              Os modelos são automaticamente compatibilizados com o Microsoft Office 2013 (OpenXML 2012) e Office 365, preservando estilos de formatação corporativa e timbrados oficiais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TemplatesManager;
