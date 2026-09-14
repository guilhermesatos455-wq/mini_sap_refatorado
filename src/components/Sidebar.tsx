import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table as TableIcon, 
  History, 
  Settings, 
  Calculator,
  Box,
  Moon, 
  Sun,
  HelpCircle,
  RefreshCcw,
  ScrollText,
  Bot,
  FileSignature,
  Network,
  FileCode,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Sliders,
  TrendingUp,
  ShieldAlert,
  FileSearch,
  Database,
  GitPullRequest,
  Cpu,
  LayoutGrid,
  Warehouse,
  Wrench,
  Scale,
  QrCode,
  Globe2
} from 'lucide-react';
import Logo from './Logo';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = React.memo(() => {
  const { darkMode, setDarkMode, branding, showMaterialsPMM, showRecipes, showMovements, showPriceSimulator, showSapIdocGenerator, showSoxAudit, showAccountingSimulator, showWebhookAlerts, showOfficeIntegration, userLevel } = useAudit();
  const { user } = useAuth();

  const isDevAuthorized = userLevel === 0 || user?.email?.toLowerCase() === 'guilhermesatos455@gmail.com';

  const navigation = useMemo(() => [
    {
      title: 'Auditoria Principal',
      items: [
        { to: '/', icon: <UploadCloud className="w-4 h-4" />, label: 'Envio de Arquivos' },
        { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
        { to: '/details', icon: <TableIcon className="w-4 h-4" />, label: 'Tabela de Detalhes' },
        { to: '/history', icon: <History className="w-4 h-4" />, label: 'Histórico' },
        { to: '/audit-history', icon: <ScrollText className="w-4 h-4" />, label: 'Logs de Auditoria' },
        ...(userLevel === 0 ? [{ to: '/sox-audit', icon: <ShieldCheck className="w-4 h-4" />, label: 'Trilha SOX' }] : []),
      ]
    },
    ...(isDevAuthorized ? [{
      title: 'Inteligência de Custos (Beta)',
      items: [
        { 
          to: '/cost-intelligence', 
          icon: <TrendingUp className="w-4 h-4" />, 
          label: 'Hub Inteligência de Custos',
          badge: 'BETA'
        },
        { 
          to: '/audit-copilot', 
          icon: <Bot className="w-4 h-4" />, 
          label: 'Copilot de Auditoria & CFO',
          badge: 'IA'
        },
        { 
          to: '/executive-dossier', 
          icon: <FileSpreadsheet className="w-4 h-4" />, 
          label: 'Dossiê Executivo & SPED',
          badge: 'SOX'
        },
        { 
          to: '/risk-matrix', 
          icon: <ShieldAlert className="w-4 h-4" />, 
          label: 'Matriz de Risco ERM (COSO)',
          badge: 'ISO'
        },
        { 
          to: '/tax-reform', 
          icon: <Scale className="w-4 h-4" />, 
          label: 'Reforma Tributária (IBS/CBS)',
          badge: 'NOVO'
        },
        { 
          to: '/traceability', 
          icon: <QrCode className="w-4 h-4" />, 
          label: 'Rastreabilidade Serial (SNCM)',
          badge: 'ANVISA'
        },
        { 
          to: '/transfer-pricing', 
          icon: <Globe2 className="w-4 h-4" />, 
          label: 'Preços de Transferência',
          badge: 'OCDE'
        },
      ]
    }] : []),
    {
      title: 'Logística SAP',
      items: [
        ...(showMovements ? [{ to: '/movements', icon: <RefreshCcw className="w-4 h-4" />, label: 'Movimentações (MB51)' }] : []),
        { to: '/ckm-mb51-simulator', icon: <Calculator className="w-4 h-4" />, label: 'Central de Simuladores SAP' },
        { to: '/warehouse-system', icon: <Warehouse className="w-4 h-4" />, label: 'WMS & Armazém Moderno' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { to: '/studio-mode', icon: <Wrench className="w-4 h-4" />, label: 'Modo Estúdio (No-Code & IA)' },
        { to: '/settings', icon: <Settings className="w-4 h-4" />, label: 'Configurações' },
        { to: '/help', icon: <HelpCircle className="w-4 h-4" />, label: 'Suporte & Guia' },
      ]
    }
  ], [showMaterialsPMM, showMovements, showPriceSimulator, showSapIdocGenerator, showSoxAudit, showAccountingSimulator, showWebhookAlerts, showOfficeIntegration, userLevel, isDevAuthorized]);

  return (
    <aside className={`hidden md:flex w-64 flex-shrink-0 border-r transition-all duration-300 flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-xl'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-transparent">
        <div className={`p-2 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-[#8DC63F]' : 'bg-gradient-to-br from-slate-50 to-white text-[#78AF32] shadow-sm'}`}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
          ) : (
            <Logo className="w-6 h-6" />
          )}
        </div>
        <span className={`font-black text-lg tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900 uppercase'}`}>
          {branding.companyName}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
        {navigation.map((section) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.title} className="space-y-2">
              <h4 className={`px-4 text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                      ${isActive 
                        ? (darkMode ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20')
                        : (darkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {(item as any).badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        (item as any).badge === 'BETA'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {(item as any).badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/50">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
