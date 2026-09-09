import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Sparkles, ShieldAlert, FileText, Download, CheckCircle2 } from 'lucide-react';

interface AuditChecklistProps {
  darkMode: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'MB51' | 'Estoque' | 'PMM' | 'Fiscal';
  completed: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: '1',
    title: 'Validar Layout e Colunas do MB51',
    description: 'Garantir que as colunas obrigatórias (Material, Centro, Quantidade, Tipo de Movimento, Data) estejam mapeadas corretamente.',
    category: 'MB51',
    completed: true,
  },
  {
    id: '2',
    title: 'Conferir Tipos de Movimento Ausentes',
    description: 'Verificar se há t-codes configurados que não possuem ocorrências no relatório MB51 enviado.',
    category: 'MB51',
    completed: true,
  },
  {
    id: '3',
    title: 'Analisar Estoques Inicial e Final (E8 / S8)',
    description: 'Cruzamento de saldos para identificar materiais que zeraram ou foram recém-criados no período.',
    category: 'Estoque',
    completed: true,
  },
  {
    id: '4',
    title: 'Auditoria de Preço Médio Móvel (PMM)',
    description: 'Simular reavaliações de estoque e verificar impacto financeiro de entradas atípicas.',
    category: 'PMM',
    completed: false,
  },
  {
    id: '5',
    title: 'Exportar Relatório Executivo',
    description: 'Gerar PowerPoint ou PDF consolidado para apresentação à diretoria ou auditoria externa.',
    category: 'Fiscal',
    completed: false,
  },
];

export const AuditChecklist: React.FC<AuditChecklistProps> = ({ darkMode }) => {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('natu_audit_checklist');
    if (saved) {
      try {
        const parsed: ChecklistItem[] = JSON.parse(saved);
        // ensure items 1, 2, 3 are completed if requested
        return parsed.map(i => ['1', '2', '3'].includes(i.id) ? { ...i, completed: true } : i);
      } catch (e) { /* ignore */ }
    }
    return INITIAL_CHECKLIST;
  });

  useEffect(() => {
    localStorage.setItem('natu_audit_checklist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#8DC63F]/20 text-[#8DC63F]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Checklist de Melhores Práticas de Auditoria SAP</h3>
            <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Progresso da auditoria: {completedCount} de {items.length} etapas concluídas ({progressPercent}%)
            </p>
          </div>
        </div>
        <div className="w-32 h-2.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
          <div className="h-full bg-[#8DC63F] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              item.completed 
                ? darkMode ? 'bg-slate-950/80 border-[#8DC63F]/30 opacity-75' : 'bg-emerald-50/50 border-emerald-200 opacity-75'
                : darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <button className="mt-0.5 text-[#8DC63F] focus:outline-none flex-shrink-0">
              {item.completed ? <CheckCircle2 className="w-5 h-5 text-[#8DC63F]" /> : <Square className="w-5 h-5 text-slate-500" />}
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  item.category === 'MB51' ? 'bg-blue-500/20 text-blue-400' :
                  item.category === 'Estoque' ? 'bg-purple-500/20 text-purple-400' :
                  item.category === 'PMM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {item.category}
                </span>
                <h4 className={`text-xs font-black ${item.completed ? 'line-through text-slate-400' : darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {item.title}
                </h4>
              </div>
              <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
