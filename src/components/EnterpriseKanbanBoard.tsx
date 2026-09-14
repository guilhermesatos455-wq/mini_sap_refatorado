import React, { useState } from 'react';
import { Divergencia } from '../types/audit';
import { CheckCircle2, AlertTriangle, Clock, Search, GripVertical } from 'lucide-react';

interface EnterpriseKanbanBoardProps {
  items: Divergencia[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  darkMode: boolean;
  formatoMoeda: { format: (val: number) => string } | ((val: number) => string);
}

export const EnterpriseKanbanBoard: React.FC<EnterpriseKanbanBoardProps> = ({ items, onUpdateStatus, darkMode, formatoMoeda }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const formatVal = (val: number) => {
    if (typeof formatoMoeda === 'function') {
      return formatoMoeda(val);
    }
    return formatoMoeda.format(val);
  };

  // Define the 4 Enterprise columns
  const columns = [
    { id: 'Pendente', title: 'Pendente', color: 'border-amber-500/40 bg-amber-500/5', headerColor: 'text-amber-400 bg-amber-500/10', icon: <Clock className="w-4 h-4 text-amber-400" /> },
    { id: 'Em Auditoria', title: 'Em Auditoria', color: 'border-blue-500/40 bg-blue-500/5', headerColor: 'text-blue-400 bg-blue-500/10', icon: <Search className="w-4 h-4 text-blue-400" /> },
    { id: 'Aprovado', title: 'Aprovado', color: 'border-emerald-500/40 bg-emerald-500/5', headerColor: 'text-emerald-400 bg-emerald-500/10', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'Com Divergência', title: 'Com Divergência', color: 'border-rose-500/40 bg-rose-500/5', headerColor: 'text-rose-400 bg-rose-500/10', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
  ];

  const getColumnForStatus = (item: Divergencia) => {
    const st = item.status || 'Pendente';
    if (st === 'Aprovado' || item.aprovacaoStatus === 'Aprovado') return 'Aprovado';
    if (st === 'Em Análise' || st === 'Em Auditoria') return 'Em Auditoria';
    if (st === 'Rejeitado' || st === 'Com Divergência' || item.tipo !== 'Sem Divergência') return 'Com Divergência';
    return 'Pendente';
  };

  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    const strId = String(id);
    setDraggedId(strId);
    e.dataTransfer.setData('text/plain', strId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (draggedId) {
      onUpdateStatus(draggedId, targetColumnId);
      setDraggedId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
      {columns.map(col => {
        const colItems = items.filter(item => getColumnForStatus(item) === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-2xl border ${col.color} p-4 flex flex-col h-[650px] shadow-sm`}
          >
            <div className={`flex items-center justify-between p-3 rounded-xl mb-3 ${col.headerColor}`}>
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="font-bold text-xs uppercase tracking-wider">{col.title}</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/20">
                {colItems.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {colItems.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-500 text-xs italic border border-dashed border-slate-700/50 rounded-xl">
                  Nenhum item nesta coluna
                </div>
              ) : (
                colItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-500/50 transition-all space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-purple-400">
                        {item.id || `ITEM-${idx}`}
                      </span>
                      <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    </div>

                    <div className="text-xs font-medium line-clamp-2">
                      {item.descricao || item.material || 'Item de Auditoria'}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[11px] font-mono">
                      <span className="text-slate-400">{item.empresa || item.fornecedor || 'Geral'}</span>
                      <span className="font-bold text-emerald-400">
                        {formatVal(Number(item.impactoFinanceiro || item.precoEfetivo || 0))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EnterpriseKanbanBoard;
