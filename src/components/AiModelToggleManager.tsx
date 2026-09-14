import React from 'react';
import { Cpu, CheckCircle2, ShieldAlert, Sparkles, Bot } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface AiModelToggleManagerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const AiModelToggleManager: React.FC<AiModelToggleManagerProps> = ({ darkMode, addToast }) => {
  const { enabledLlms, setEnabledLlms } = useAudit();

  const models = [
    {
      id: 'gemini_flash_latest',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'Google DeepMind',
      description: 'Modelo ultrarrápido para resumos executivos, triagem de notas fiscais e análise relacional em tempo real.',
      badge: 'Padrão / Recomendado',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    },
    {
      id: 'gemini_pro',
      name: 'Gemini 2.5 Pro (Deep Reasoning)',
      provider: 'Google DeepMind',
      description: 'Motor avançado de raciocínio profundo para detecção de anomalias tributárias complexas e auditoria SOX.',
      badge: 'Alta Precisão',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
      id: 'claude_sonnet',
      name: 'Claude 3.5 Sonnet (Enterprise Bridge)',
      provider: 'Anthropic',
      description: 'Modelo auxiliar de linguagem para geração de relatórios regulatórios e interpretação de cláusulas contratuais.',
      badge: 'Enterprise',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      id: 'gpt_4o',
      name: 'GPT-4o Omnichannel',
      provider: 'OpenAI Ecosystem',
      description: 'Processamento multimodal para extração de dados de PDFs de notas fiscais e balancetes contábeis escaneados.',
      badge: 'Multimodal',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    }
  ];

  const handleToggle = (id: string) => {
    const next = { ...enabledLlms, [id]: !enabledLlms[id] };
    setEnabledLlms(next);
    addToast(`Configuração de IA atualizada para o modelo ${id}`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <Cpu className="w-6 h-6 text-purple-400" /> Gestão de Modelos LLM & Roteamento Inteligente
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Ative ou desative quais motores de inteligência artificial estão disponíveis para o Copilot de Auditoria e Extração SAP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((m) => {
          const isEnabled = enabledLlms[m.id] ?? true;
          return (
            <div 
              key={m.id} 
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
              } ${isEnabled ? 'ring-1 ring-purple-500/30' : 'opacity-60 grayscale-[30%]'}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className={`w-5 h-5 ${isEnabled ? 'text-purple-400' : 'text-slate-500'}`} />
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.name}</h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${m.color}`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.description}
                </p>
                <div className="text-[10px] font-mono text-slate-500">
                  Provedor: {m.provider}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Status: {isEnabled ? <span className="text-emerald-400">Ativo no Sistema</span> : <span className="text-rose-400">Desativado</span>}
                </span>
                <button
                  onClick={() => handleToggle(m.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow ${
                    isEnabled 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isEnabled ? 'Desativar LLM' : 'Ativar LLM'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
