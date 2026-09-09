import React, { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { useDebugLogs } from '../context/DebugLogContext';

export function DesktopIndicator() {
  const { addLog } = useDebugLogs();
  const [isOpen] = useState(false);

  const logDebugMessage = (msg: string) => {
    addLog('info', msg);
  };

  useEffect(() => {
    logDebugMessage("DesktopIndicator mounted");
  }, []);

  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI__);

  if (!isTauri && !isOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-[70] flex items-center gap-2 px-3 py-1.5 bg-emerald-600/90 text-white text-xs font-medium rounded-full shadow-lg border border-emerald-500/20 backdrop-blur-sm">
      <Monitor className="w-3.5 h-3.5" />
      Modo Desktop Ativo
    </div>
  );
}

export default DesktopIndicator;
