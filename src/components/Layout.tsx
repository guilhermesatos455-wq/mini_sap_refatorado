import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastContainer } from './ToastContainer';
import { NatuAssistChat } from './NatuAssistChat';
import { useAudit } from '../context/AuditContext';
import { SyncService } from '../services/SyncService';
import { Bot, Search, X } from 'lucide-react';
import DesktopIndicator from './DesktopIndicator';
import SyncStatus from './SyncStatus';
import { IdleAnimation } from './IdleAnimation';
import { GuidedTour } from './GuidedTour';
import { NotificationCenter } from './NotificationCenter';
import { BlindAuditToggle } from './BlindAuditToggle';

const Layout: React.FC = () => {
  const { darkMode, isTourOpen, setIsTourOpen, globalSearchQuery, setGlobalSearchQuery, isBlindMode, setIsBlindMode, addToast } = useAudit();
  const [showChat, setShowChat] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        addToast('Busca global ativada via atalho (Ctrl+K)', 'success');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  const resetIdleTimer = useCallback(() => {
    if (isIdle) {
      setIsIdle(false);
    }
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    // 60 seconds of inactivity
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 60000);
  }, [isIdle]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleOnline = () => {
      SyncService.syncAll();
    };
    window.addEventListener('online', handleOnline);
    // Run on mount if online
    if (navigator.onLine) {
      SyncService.syncAll();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden relative ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {isIdle && <IdleAnimation darkMode={darkMode} />}
      <DesktopIndicator />
      <SyncStatus />
      <Sidebar />
      <ToastContainer />
      <GuidedTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} darkMode={darkMode} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 flex flex-col">
        {/* Global Search Bar Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
            <input 
              ref={searchInputRef}
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Pesquisa global: Nota Fiscal, Fornecedor ou Material... (Ctrl+K)"
              className={`w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs md:text-sm font-medium border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8DC63F] ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-gray-200 text-slate-900 placeholder-gray-400'
              }`}
            />
            {globalSearchQuery && (
              <button 
                onClick={() => setGlobalSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <BlindAuditToggle isBlindMode={isBlindMode} setIsBlindMode={setIsBlindMode} darkMode={darkMode} />
            <NotificationCenter darkMode={darkMode} addToast={addToast} />
            {globalSearchQuery && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-[#8DC63F]' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  Filtro Global Ativo
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      {showChat ? (
        <NatuAssistChat onClose={() => setShowChat(false)} />
      ) : (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 md:bottom-6 right-6 z-[60] p-4 bg-[#8DC63F] text-slate-950 font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Layout;
