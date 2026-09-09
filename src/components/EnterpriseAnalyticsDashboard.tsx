import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

interface EnterpriseAnalyticsDashboardProps {
  darkMode: boolean;
}

const auditVolumeData = [
  { month: 'Jan', audits: 120, discrepancies: 12, idocs: 95 },
  { month: 'Fev', audits: 145, discrepancies: 8, idocs: 130 },
  { month: 'Mar', audits: 190, discrepancies: 15, idocs: 175 },
  { month: 'Abr', audits: 210, discrepancies: 5, idocs: 200 },
  { month: 'Mai', audits: 280, discrepancies: 22, idocs: 250 },
  { month: 'Jun', audits: 310, discrepancies: 14, idocs: 290 },
];

const discrepancyDistribution = [
  { name: 'Preço CKM3', value: 45, color: '#8DC63F' },
  { name: 'Divergência MB51', value: 30, color: '#3B82F6' },
  { name: 'Erro IDoc BAPI', value: 15, color: '#F59E0B' },
  { name: 'Outros Desvios', value: 10, color: '#EF4444' },
];

const idocStatusTrend = [
  { week: 'Sem 1', success: 85, error: 3 },
  { week: 'Sem 2', success: 92, error: 2 },
  { week: 'Sem 3', success: 110, error: 1 },
  { week: 'Sem 4', success: 140, error: 4 },
];

export const EnterpriseAnalyticsDashboard: React.FC<EnterpriseAnalyticsDashboardProps> = ({ darkMode }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <BarChart3 className="w-5 h-5 text-indigo-500" /> Enterprise Analytics & BI Dashboard
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Métricas em tempo real de auditorias contábeis, desvios CKM3/MB51 e volumetria de IDocs SAP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
            <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Auditado (Ano)</div>
          <div className={`text-2xl font-black mt-2 font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>1.255 Lotes</div>
          <div className="text-[11px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs mês anterior
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Divergências Contábeis</div>
          <div className={`text-2xl font-black mt-2 font-mono text-amber-500`}>76 Ocorrências</div>
          <div className="text-[11px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 98.2% taxa de resolução
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">IDocs Transmitidos</div>
          <div className={`text-2xl font-black mt-2 font-mono text-indigo-400`}>1.140 BAPIs</div>
          <div className="text-[11px] text-indigo-400 font-bold mt-1">
            SAP ECC & S/4HANA Sync
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Conformidade SOX</div>
          <div className={`text-2xl font-black mt-2 font-mono text-emerald-500`}>99.4%</div>
          <div className="text-[11px] text-emerald-500 font-bold mt-1">
            Auditoria Imutável Ativa
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volumetria de Auditorias */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm space-y-4`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Volumetria de Lotes Auditados & IDocs</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }} 
                />
                <Legend />
                <Bar dataKey="audits" name="Auditorias Realizadas" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="idocs" name="IDocs SAP Gerados" fill="#8DC63F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendência de Sucesso IDoc */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm space-y-4`}>
          <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tendência de Transmissões IDoc (Sucesso vs Erro)</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={idocStatusTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="week" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }} 
                />
                <Legend />
                <Line type="monotone" dataKey="success" name="Transmitidos com Sucesso" stroke="#8DC63F" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="error" name="Erros de Validação" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
