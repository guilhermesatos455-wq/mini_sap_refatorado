import React, { useState } from 'react';
import { 
  Wrench, Layers, Plus, Sparkles, Code, Trash2, 
  ShieldCheck, Layout, CheckCircle2, Play, Database 
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface EnterpriseStudioModeProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface CustomField {
  id: string;
  name: string;
  type: 'Texto' | 'Número' | 'Moeda' | 'Data' | 'Seleção';
  required: boolean;
  defaultValue: string;
}

interface WorkflowBlock {
  id: string;
  title: string;
  category: 'Gatilho' | 'Condição' | 'Ação' | 'Notificação';
  description: string;
}

export const EnterpriseStudioMode: React.FC<EnterpriseStudioModeProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [activeTab, setActiveTab] = useState<'fields' | 'views' | 'workflows' | 'ai_builder'>('fields');

  // Custom Fields State
  const [fields, setFields] = useState<CustomField[]>([
    { id: 'f-1', name: 'Centro de Custo Adicional', type: 'Texto', required: false, defaultValue: 'CC-9020' },
    { id: 'f-2', name: 'Aprovação de Diretoria', type: 'Seleção', required: true, defaultValue: 'Pendente' },
    { id: 'f-3', name: 'Desconto Concedido (%)', type: 'Número', required: false, defaultValue: '0.0' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'Texto' | 'Número' | 'Moeda' | 'Data' | 'Seleção'>('Texto');

  // Workflow Blocks State
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlock[]>([
    { id: 'w-1', title: 'Gatilho: Nova Nota Fiscal Importada', category: 'Gatilho', description: 'Acionado quando uma planilha MB51 ou CKM3 é carregada.' },
    { id: 'w-2', title: 'Condição: Impacto Financeiro > R$ 10.000', category: 'Condição', description: 'Filtra itens com alta exposição de preço ou frete.' },
    { id: 'w-3', title: 'Ação: Exigir Dupla Alçada de Aprovação SOX', category: 'Ação', description: 'Bloqueia o status até que o gestor financeiro aprove.' },
    { id: 'w-4', title: 'Notificação: Enviar Alerta via Webhook / Slack', category: 'Notificação', description: 'Dispara mensagem instantânea no canal de governança.' }
  ]);

  // Rule Validation Expression State
  const [ruleExpression, setRuleExpression] = useState('IF (impactoFinanceiro > 10000) THEN (marcarComoCritico = true)');

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedCode, setAiGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper for live rule translation preview
  const getRulePreviewTranslation = (expr: string) => {
    if (!expr.trim()) return 'Nenhuma regra lógica definida.';
    let translated = expr
      .replace(/IF/gi, 'SE')
      .replace(/THEN/gi, 'ENTÃO')
      .replace(/impactoFinanceiro/g, 'o impacto financeiro')
      .replace(/>/g, 'for maior que')
      .replace(/</g, 'for menor que')
      .replace(/==/g, 'for igual a')
      .replace(/!=/g, 'for diferente de')
      .replace(/marcarComoCritico\s*=\s*true/gi, 'marcar o item como crítico para auditoria SOX')
      .replace(/contemErro\s*=\s*true/gi, 'sinalizar erro nos dados contábeis CKM3');
    return `Tradução em Linguagem Natural: ${translated}`;
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      addToast('Digite o nome do novo campo.', 'error');
      return;
    }
    const newField: CustomField = {
      id: `f-${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      required: false,
      defaultValue: ''
    };
    setFields([...fields, newField]);
    setNewFieldName('');
    addToast(`Campo "${newFieldName}" criado com sucesso!`, 'success');
    addAuditLog('Studio Mode', `Criado novo campo personalizado: ${newFieldName}`);
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    addToast('Campo removido com sucesso.', 'success');
  };

  const handleAddWorkflowBlock = (category: 'Gatilho' | 'Condição' | 'Ação' | 'Notificação') => {
    const titles = {
      Gatilho: 'Gatilho: Atualização de Status em Lote',
      Condição: `Condição Baseada em Regra: ${ruleExpression.slice(0, 30)}...`,
      Ação: 'Ação: Gerar IDOC SAP Automático',
      Notificação: 'Notificação: E-mail Diário para Auditoria'
    };
    const block: WorkflowBlock = {
      id: `w-${Date.now()}`,
      title: titles[category],
      category,
      description: `Bloco gerado com expressão lógica: ${ruleExpression}`
    };
    setWorkflowBlocks([...workflowBlocks, block]);
    addToast(`Bloco de ${category} adicionado ao fluxo!`, 'success');
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) {
      addToast('Digite uma instrução para a IA gerar o fluxo ou regra.', 'error');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setAiGeneratedCode(`// Código gerado por IA para: "${aiPrompt}"
// Expressão de Regra Aplicada: ${ruleExpression}
function customAuditRule(item) {
  const threshold = 15000;
  if (item.impactoFinanceiro > threshold && item.aprovacaoStatus !== 'Aprovado') {
    return {
      flagged: true,
      reason: 'Excede limiar SOX gerado via Estúdio IA',
      recommendedAction: 'Solicitar dupla alçada'
    };
  }
  return { flagged: false };
}`);
      addToast('Regra de automação gerada com sucesso pela IA!', 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Wrench className="w-6 h-6 text-purple-400" /> Modo Estúdio Enterprise (No-Code & Construtor de Fluxos)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Crie novos campos, personalize visualizações e monte fluxos de trabalho como blocos de construção, com auxílio opcional de IA.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
        <button
          onClick={() => setActiveTab('fields')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'fields' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          <Database className="w-4 h-4" /> Construtor de Campos
        </button>
        <button
          onClick={() => setActiveTab('views')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'views' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          <Layout className="w-4 h-4" /> Personalização de Views
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'workflows' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          <Layers className="w-4 h-4" /> Fluxos em Blocos (No-Code)
        </button>
        <button
          onClick={() => setActiveTab('ai_builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'ai_builder' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Tradutor LLM & IA
        </button>
      </div>

      {/* Tab 1: Custom Fields */}
      {activeTab === 'fields' && (
        <div className="space-y-6 animate-in fade-in">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" /> Adicionar Novo Campo ao Modelo de Dados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome do Campo</label>
                <input
                  type="text"
                  placeholder="Ex: Justificativa Gerencial"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tipo de Dado</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                >
                  <option value="Texto">Texto</option>
                  <option value="Número">Número</option>
                  <option value="Moeda">Moeda (R$)</option>
                  <option value="Data">Data</option>
                  <option value="Seleção">Seleção (Dropdown)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddField}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                >
                  Criar Campo Personalizado
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm">Campos Atuais no Sistema ({fields.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fields.map(field => (
                <div key={field.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex items-center justify-between shadow-sm`}>
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">{field.type}</span>
                    <h4 className="font-bold text-sm mt-1">{field.name}</h4>
                    <p className="text-xs text-slate-400">Padrão: {field.defaultValue || 'Vazio'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Views Customization */}
      {activeTab === 'views' && (
        <div className="space-y-6 animate-in fade-in">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-400" /> Personalizador de Layouts e Gráficos
            </h3>
            <p className="text-xs text-slate-400">
              Arraste e reordene os componentes visuais do dashboard principal ou configure quais visões devem aparecer no menu lateral.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-2`}>
                <span className="font-bold text-xs text-purple-400 block">📊 Gráfico de Rosca de Status</span>
                <p className="text-[11px] text-slate-400">Exibição interativa de fatias para Aprovados, Pendentes e Rejeitados.</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold inline-block">Ativo no Dashboard</span>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-2`}>
                <span className="font-bold text-xs text-purple-400 block">📈 Curva de Variação CKM3</span>
                <p className="text-[11px] text-slate-400">Comparativo visual entre custo padrão e preço efetivo com frete.</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold inline-block">Ativo no Dashboard</span>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-2`}>
                <span className="font-bold text-xs text-purple-400 block">📋 Kanban Enterprise de Auditoria</span>
                <p className="text-[11px] text-slate-400">Quadro de colunas arrastáveis para triagem rápida de divergências.</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold inline-block">Ativo em Detalhes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Workflow Building Blocks */}
      {activeTab === 'workflows' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm">Construtor de Fluxos por Blocos (No-Code)</h3>
              <p className="text-xs text-slate-400">Monte automações combinando Gatilhos, Condições, Ações e Notificações.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => handleAddWorkflowBlock('Gatilho')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer">+ Gatilho</button>
              <button onClick={() => handleAddWorkflowBlock('Condição')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer">+ Condição</button>
              <button onClick={() => handleAddWorkflowBlock('Ação')} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer">+ Ação</button>
              <button onClick={() => handleAddWorkflowBlock('Notificação')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer">+ Notificação</button>
            </div>
          </div>

          {/* Natural Language AI Block Generator & Rule Validation Container */}
          <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <h4 className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Criar Novo Bloco de Auditoria com IA & Validação de Regras
            </h4>
            <p className="text-xs text-slate-400">
              Descreva em linguagem natural ou defina a expressão lógica (IF/THEN) para o novo bloco de auditoria:
            </p>

            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ex: Validar se o valor excede R$ 25.000 e marcar como pendência gerencial..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                />
                <button
                  onClick={() => {
                    if (!aiPrompt.trim()) {
                      addToast('Digite uma descrição para o bloco.', 'error');
                      return;
                    }
                    handleAddWorkflowBlock('Condição');
                    setAiPrompt('');
                    addToast('Novo bloco gerado e integrado com sucesso via IA!', 'success');
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4" /> Gerar Lógica
                </button>
              </div>

              {/* Rule Validation Expression Builder */}
              <div className={`p-3.5 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Validação de Regras (Expressão IF / THEN)</span>
                  <span className="text-[10px] text-amber-400 font-medium">Sugestões de Operadores IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ruleExpression}
                    onChange={(e) => setRuleExpression(e.target.value)}
                    placeholder="IF (impactoFinanceiro > 10000) THEN (marcarComoCritico = true)"
                    className={`flex-1 px-3 py-2 rounded-lg border font-mono text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-purple-300' : 'bg-white border-gray-300 text-purple-900'}`}
                  />
                  <button
                    onClick={() => addToast('Expressão lógica validada e aplicada ao motor de regras!', 'success')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex-shrink-0"
                  >
                    Validar Regra
                  </button>
                </div>

                {/* Live Preview Translation Area */}
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-medium ${darkMode ? 'bg-purple-950/30 border-purple-900/50 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>{getRulePreviewTranslation(ruleExpression)}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                  <button onClick={() => setRuleExpression(prev => prev + ' AND (impactoFinanceiro > 25000)')} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-medium hover:bg-purple-500/20 cursor-pointer">+ Maior que</button>
                  <button onClick={() => setRuleExpression(prev => prev + ' AND (status != "APROVADO")')} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-medium hover:bg-purple-500/20 cursor-pointer">+ Diferente de</button>
                  <button onClick={() => setRuleExpression(prev => prev + ' AND (contemErro == true)')} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-medium hover:bg-purple-500/20 cursor-pointer">+ Contém erro</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {workflowBlocks.map((block, idx) => (
              <div key={block.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-xs">
                    0{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${block.category === 'Gatilho' ? 'bg-blue-500/20 text-blue-300' : block.category === 'Condição' ? 'bg-amber-500/20 text-amber-300' : block.category === 'Ação' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {block.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mt-1">{block.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{block.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWorkflowBlocks(workflowBlocks.filter(b => b.id !== block.id));
                    addToast('Bloco removido do fluxo.', 'success');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AI Builder & Natural Language to Code */}
      {activeTab === 'ai_builder' && (
        <div className="space-y-6 animate-in fade-in">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Tradutor de Linguagem Natural para Regras & Código (IA)
            </h3>
            <p className="text-xs text-slate-400">
              Descreva em português o que você deseja automatizar ou validar nas notas fiscais, e nossa IA traduzirá em código executável instantaneamente.
            </p>

            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Ex: Crie uma regra que verifique se o valor da nota fiscal é superior a R$ 50.000 e se o fornecedor possui divergência de ICMS superior a 10%..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Traduzindo com IA...' : 'Gerar Regra com IA'}
              </button>
            </div>

            {aiGeneratedCode && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Code className="w-4 h-4" /> Código Gerado Automaticamente:
                </span>
                <pre className={`p-4 rounded-xl font-mono text-xs overflow-x-auto ${darkMode ? 'bg-slate-950 text-purple-300 border border-slate-800' : 'bg-gray-900 text-purple-200'}`}>
                  {aiGeneratedCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseStudioMode;
