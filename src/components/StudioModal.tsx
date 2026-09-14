import React, { useState } from 'react';
import { X, Wrench, Sparkles, Plus, Layers, CheckCircle2, GripVertical, Code, Cpu, ShieldCheck, Lock, Download } from 'lucide-react';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface BlockItem {
  id: string;
  title: string;
  type: string;
  category: 'Campo' | 'Filtro' | 'Regra' | 'Ação';
}

export const StudioModal: React.FC<StudioModalProps> = ({ isOpen, onClose, darkMode, addToast }) => {
  const [availableBlocks] = useState<BlockItem[]>([
    { id: 'b-1', title: 'Campo: Centro de Custo SAP', type: 'Texto', category: 'Campo' },
    { id: 'b-2', title: 'Campo: Alçada Gerencial SOX', type: 'Seleção', category: 'Campo' },
    { id: 'b-3', title: 'Filtro: Desvio de Preço > 5%', type: 'Condição', category: 'Filtro' },
    { id: 'b-4', title: 'Regra: Dupla Aprovação Obrigatória', type: 'Validação', category: 'Regra' },
    { id: 'b-5', title: 'Ação: Disparar Webhook SAP IDOC', type: 'Integração', category: 'Ação' }
  ]);

  const [canvasBlocks, setCanvasBlocks] = useState<BlockItem[]>([
    { id: 'b-0', title: 'Campo: Status de Auditoria', type: 'Seleção', category: 'Campo' }
  ]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendCode, setBackendCode] = useState<string | null>(null);

  // Enterprise Security Tags & Flags
  const [tagBubblewrap, setTagBubblewrap] = useState(true); // Linux sandbox
  const [tagSandboxesec, setTagSandboxesec] = useState(true); // Mac sandbox
  const [tagLockdown, setTagLockdown] = useState(false);
  const [tagBootstrap, setTagBootstrap] = useState(true);
  const [tagDuyRun, setTagDuyRun] = useState(true);
  const [dangerouslyDisableSandbox, setDangerouslyDisableSandbox] = useState(false);

  if (!isOpen) return null;

  const handleAddBlockToCanvas = (block: BlockItem) => {
    setCanvasBlocks([...canvasBlocks, { ...block, id: `canvas-${Date.now()}` }]);
    addToast(`Bloco "${block.title}" adicionado ao fluxo de estúdio!`, 'success');
  };

  const handleGenerateLLMBackend = () => {
    if (!aiPrompt.trim() && canvasBlocks.length === 0) {
      if (!dangerouslyDisableSandbox) {
        addToast('Erro de Restrição do Sandbox: Falha na execução da LLM por segurança. Ative "dangerouslyDisableSandbox" se desejar.', 'error');
        return;
      }
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setBackendCode(`// [Enterprise Studio] Backend Gerado via LLM
// Sandbox Linux: ${tagBubblewrap ? 'Bubblewrap Enabled' : 'Disabled'} | Mac: ${tagSandboxesec ? 'Sandboxesec Active' : 'Disabled'}
// Tags Ativas: duyRun=${tagDuyRun}, lockdown=${tagLockdown}, bootstrap=${tagBootstrap}
// dangerouslyDisableSandbox: ${dangerouslyDisableSandbox ? 'WARNING: ACTIVE' : 'OFF'}

export async function processEnterpriseStudioWorkflow(item) {
  const result = {
    validatedBy: 'LLM Studio Engine',
    sandboxMode: '${dangerouslyDisableSandbox ? 'UNRESTRICTED' : 'SECURE'}',
    timestamp: new Date().toISOString()
  };
  return result;
}`);
      addToast('Lógica de backend gerada com sucesso pela LLM com suporte a comitabilidade!', 'success');
    }, 1200);
  };

  const handleBootstrapExportJSON = () => {
    const bootstrapConfig = {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      securityPolicy: {
        bubblewrap: tagBubblewrap,
        sandboxesec: tagSandboxesec,
        duyRun: tagDuyRun,
        lockdown: tagLockdown,
        bootstrap: tagBootstrap,
        dangerouslyDisableSandbox
      },
      blocks: canvasBlocks,
      aiInstructions: aiPrompt || 'Standard audit pipeline initialization',
      backendLogicTemplate: backendCode || '// Default template'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bootstrapConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-block-bootstrap-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast('Arquivo JSON de Bootstrap gerado e baixado com sucesso para inicialização em outros ambientes!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Modo Estúdio Enterprise com Bootstrap & Sandbox de IA
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Projetado para repositórios clonáveis com herança de políticas, regras SOX e inicialização rápida via JSON.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Sidebar: Blocks Palette */}
          <div className={`md:col-span-3 p-4 border-r border-inherit overflow-y-auto space-y-4 ${darkMode ? 'bg-slate-950/50' : 'bg-gray-50/50'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Blocos Comitáveis
            </h4>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Blocos herdados no repositório git para qualquer dev clonar e rodar:
            </p>

            <div className="space-y-2 pt-1">
              {availableBlocks.map(block => (
                <div
                  key={block.id}
                  onClick={() => handleAddBlockToCanvas(block)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80' : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold inline-block mb-0.5">
                        {block.category}
                      </span>
                      <p className="font-bold text-xs">{block.title}</p>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Center Area: Canvas & Security Tags Configuration */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-5 border-r border-inherit">
            
            {/* Canvas Dropzone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Canvas do Fluxo ({canvasBlocks.length} blocos)
                </h4>
                <button
                  onClick={() => setCanvasBlocks([])}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl border min-h-[120px] flex flex-wrap gap-2 items-center ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                {canvasBlocks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic w-full text-center py-4">
                    Nenhum bloco no canvas.
                  </p>
                ) : (
                  canvasBlocks.map((b, i) => (
                    <div 
                      key={b.id}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-sm ${darkMode ? 'bg-slate-900 border-purple-500/40 text-purple-200' : 'bg-white border-purple-200 text-purple-900'}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[9px] font-mono">
                        {i + 1}
                      </span>
                      {b.title}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Enterprise Security Tags Config */}
            <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Tags de Execução & Sandbox (Enterprise)
              </h4>
              <p className="text-[11px] text-slate-400">
                Configure as tags de isolamento de processos (Bubblewrap / Sandboxesec) e fluxo seguro:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={tagBubblewrap}
                    onChange={(e) => setTagBubblewrap(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span>bubblewrap (Linux)</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={tagSandboxesec}
                    onChange={(e) => setTagSandboxesec(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span>sandboxesec (Mac)</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={tagDuyRun}
                    onChange={(e) => setTagDuyRun(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="font-mono text-purple-300">duy run</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={tagLockdown}
                    onChange={(e) => setTagLockdown(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="font-mono text-rose-300">lockdown</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer col-span-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={tagBootstrap}
                    onChange={(e) => setTagBootstrap(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="font-mono text-emerald-300">bootstrap</span>
                </label>
              </div>

              {/* Dangerously Disable Sandbox Flag */}
              <div className={`p-3 rounded-xl border border-rose-500/30 ${darkMode ? 'bg-rose-950/20' : 'bg-rose-50'}`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dangerouslyDisableSandbox}
                    onChange={(e) => setDangerouslyDisableSandbox(e.target.checked)}
                    className="accent-rose-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-rose-400 block font-mono">dangerouslyDisableSandbox</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Desativa restrições do sandbox se a LLM falhar por bloqueio do sistema, redirecionando para o fluxo normal (desativado por padrão).
                    </p>
                  </div>
                </label>
              </div>

            </div>

          </div>

          {/* Right Area: LLM Generator & Code Output */}
          <div className="md:col-span-4 p-5 overflow-y-auto space-y-4">
            
            <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-purple-50/50 border-purple-100'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                <Sparkles className="w-4 h-4 text-amber-400" /> Tradutor LLM & Execução
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Digite o comando em linguagem natural para gerar o código executável validado pelas políticas do repositório:
              </p>

              <textarea
                rows={2}
                placeholder="Ex: Validar regras de preço CKM3 com isolamento..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />

              <button
                onClick={handleGenerateLLMBackend}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Processando LLM...' : 'Gerar com LLM & Sandbox'}
              </button>
            </div>

            {backendCode && (
              <div className="space-y-2 animate-in fade-in">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Code className="w-4 h-4" /> Código Comitável Gerado:
                </span>
                <pre className={`p-3 rounded-xl font-mono text-[11px] overflow-x-auto ${darkMode ? 'bg-slate-950 text-purple-300 border border-slate-800' : 'bg-gray-900 text-purple-200'}`}>
                  {backendCode}
                </pre>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-inherit flex items-center justify-between bg-inherit">
          <button
            onClick={handleBootstrapExportJSON}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar JSON de Bootstrap
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Fechar
            </button>
            <button
              onClick={() => {
                addToast('Configuração de Estúdio e tags de sandbox salvas com sucesso!', 'success');
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Salvar e Commitável no Projeto
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudioModal;
