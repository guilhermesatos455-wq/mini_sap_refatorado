import React, { useState, useEffect } from 'react';
import { Bell, Activity, Send, CheckCircle, Radio } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface RealTimeNotificationsCenterProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const RealTimeNotificationsCenter: React.FC<RealTimeNotificationsCenterProps> = ({ darkMode, addToast }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([
    { id: '1', sender: 'SAP Enterprise Bot', text: 'Conectado ao canal WebSocket corporativo.', time: '17:00' }
  ]);
  const [inputMsg, setInputMsg] = useState<string>('');

  useEffect(() => {
    const sock = io();
    setSocket(sock);

    sock.on('connect', () => {
      setIsConnected(true);
      addToast('Conectado ao servidor WebSocket em tempo real!', 'success');
    });

    sock.on('disconnect', () => {
      setIsConnected(false);
    });

    sock.on('cell-updated', (data: any) => {
      setMessages(prev => [
        { id: Date.now().toString(), sender: 'Colaborador', text: `Célula ${data.cellKey} atualizada para "${data.value}"`, time: new Date().toLocaleTimeString() },
        ...prev
      ]);
    });

    return () => {
      sock.disconnect();
    };
  }, []);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'Você (Admin)',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [newMsg, ...prev]);
    if (socket) {
      socket.emit('cell-edit', { cellKey: 'BROADCAST', value: inputMsg.trim() });
    }

    setInputMsg('');
    addToast('Mensagem transmitida via WebSocket!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Bell className="w-5 h-5 text-indigo-500" /> Central de Alertas & Notificações em Tempo Real (Socket.io)
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Comunicação bidirecional síncrona para auditoria colaborativa e alertas multi-tenant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
            <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} /> {isConnected ? 'WebSocket Online' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <form onSubmit={handleSendBroadcast} className="flex gap-3">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Digite um alerta ou notificação para broadcast aos usuários..."
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-sans ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Enviar Broadcast
          </button>
        </form>

        <div className="space-y-2 mt-4 max-h-80 overflow-y-auto pr-1">
          {messages.map(m => (
            <div key={m.id} className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-bold text-indigo-400 mr-2">[{m.sender}]</span>
                  <span>{m.text}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{m.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
