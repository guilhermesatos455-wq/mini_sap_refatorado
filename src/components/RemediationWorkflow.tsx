import React, { useState } from 'react';
import { CheckSquare, Clock, AlertCircle, Plus, CheckCircle2, User, ArrowRight, Shield } from 'lucide-react';

interface RemediationTask {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface RemediationWorkflowProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const RemediationWorkflow: React.FC<RemediationWorkflowProps> = ({ darkMode, addToast }) => {
  const [tasks, setTasks] = useState<RemediationTask[]>([
    { id: 'TASK-101', title: 'Ajustar Preço Padrão CKM3 - Material MAT-9921', assignee: 'Guilherme Santos', deadline: '2026-09-15', status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: 'TASK-102', title: 'Reconciliação MB51 vs Estoque Final - Filial BA', assignee: 'Controladoria SP', deadline: '2026-09-18', status: 'PENDING', severity: 'MEDIUM' },
    { id: 'TASK-103', title: 'Reprocessar Transação IDoc MATMAS05 com erro', assignee: 'SAP Basis Team', deadline: '2026-09-12', status: 'COMPLETED', severity: 'HIGH' }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newSeverity, setNewSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAssignee) {
      addToast('Preencha o título e o responsável pela tarefa.', 'error');
      return;
    }

    const newTask: RemediationTask = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      assignee: newAssignee,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'PENDING',
      severity: newSeverity
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewAssignee('');
    addToast('Plano de ação criado com sucesso!', 'success');
  };

  const handleStatusChange = (id: string, nextStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    addToast('Status da tarefa atualizado!', 'success');
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <CheckSquare className="w-4 h-4 text-emerald-500" /> Planos de Ação e Correção (Remediation Workflow)
          </h4>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gestão integrada de tarefas para resolução de anomalias e desvios contábeis detectados.
          </p>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Descrição do plano de ação..."
          className={`px-3.5 py-2.5 rounded-xl border text-xs md:col-span-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
        />
        <input
          type="text"
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          placeholder="Responsável / Equipe"
          className={`px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Criar Tarefa
        </button>
      </form>

      {/* Tasks Kanban / Table */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/40 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400">{task.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  task.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  Prioridade {task.severity}
                </span>
              </div>
              <p className="font-bold text-xs">{task.title}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assignee}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prazo: {task.deadline}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                  task.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' :
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="PENDING">Pendente</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="COMPLETED">Concluído</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
