import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  read: boolean;
}

interface NotificationCenterProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ darkMode, addToast }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'Divergência CKM3 Detectada', message: 'Desvio de +38% no centro 1000 (Material MAT-9921).', time: 'Há 5 min', type: 'warning', read: false },
    { id: '2', title: 'Sincronização Google Sheets', message: 'Aba AuditoriaLogs sincronizada com sucesso.', time: 'Há 25 min', type: 'success', read: false },
    { id: '3', title: 'Manifesto RPA IDoc Executado', message: 'Transação MATMAS05 processada em modo dry-run.', time: 'Há 1 hora', type: 'info', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    addToast('Todas as notificações foram marcadas como lidas.', 'success');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        title="Central de Alertas"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <div className="p-4 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8DC63F]" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Notificações e Alertas</h4>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-inherit">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Nenhuma notificação nova.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 transition-colors ${!n.read ? (darkMode ? 'bg-slate-800/60' : 'bg-gray-50') : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-bold text-xs">{n.title}</p>
                        <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-inherit flex items-center justify-between bg-slate-800/20">
            <button onClick={markAllAsRead} className="text-[11px] font-bold text-[#8DC63F] hover:underline">
              Marcar todas como lidas
            </button>
            <span className="text-[10px] text-slate-400">Tempo real</span>
          </div>
        </div>
      )}
    </div>
  );
};
