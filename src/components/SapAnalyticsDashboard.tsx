import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, PieChart as PieIcon } from 'lucide-react';

interface SapAnalyticsDashboardProps {
  darkMode: boolean;
}

const pmmCostData = [
  { month: 'Jan', pmm1909: 42000, pmm2022: 41500, benchmark: 40000 },
  { month: 'Fev', pmm1909: 45000, pmm2022: 43200, benchmark: 41000 },
  { month: 'Mar', pmm1909: 48500, pmm2022: 46000, benchmark: 42500 },
  { month: 'Abr', pmm1909: 51000, pmm2022: 48000, benchmark: 43000 },
  { month: 'Mai', pmm1909: 49000, pmm2022: 45500, benchmark: 42000 },
  { month: 'Jun', pmm1909: 53000, pmm2022: 49200, benchmark: 44000 },
];

const divergenceData = [
  { name: 'Estoque MM (MB51)', value: 45, color: '#8DC63F' },
  { name: 'Ledger Materiais (CKM3)', value: 30, color: '#3B82F6' },
  { name: 'Contábil Razão (FBL3N)', value: 15, color: '#F59E0B' },
  { name: 'Faturamento SD (VF05)', value: 10, color: '#EF4444' },
];

const sodRadarData = [
  { subject: 'Criação de Fornecedor', A: 120, B: 110, fullMark: 150 },
  { subject: 'Lançamento de Fatura', A: 98, B: 130, fullMark: 150 },
  { subject: 'Modificação de Razão', A: 86, B: 130, fullMark: 150 },
  { subject: 'Ajuste de Inventário', A: 99, B: 100, fullMark: 150 },
  { subject: 'Execução de Pagamento', A: 85, B: 90, fullMark: 150 },
  { subject: 'Ordens de Compra', A: 65, B: 85, fullMark: 150 },
];

export const SapAnalyticsDashboard: React.FC<SapAnalyticsDashboardProps> = ({ darkMode }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
          <BarChart3 className="w-6 h-6 text-[#8DC63F]" /> Dashboard Executivo de Analytics SAP (S/4HANA 1909 & 2022)
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Visualização avançada de custos de material (PMM), distribuição de divergências e análise de risco de Segregação de Funções (SoD).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: PMM Cost Evolution */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Evolução de Preço Médio Móvel (PMM) CKM3
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Mensal (BRL)</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pmmCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={12} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: '12px', color: darkMode ? '#FFFFFF' : '#000000', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="pmm1909" name="S/4HANA 1909" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pmm2022" name="S/4HANA 2022" fill="#8DC63F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmark" name="Benchmark Corporativo" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Divergence Distribution */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <PieIcon className="w-4 h-4 text-blue-500" /> Distribuição de Divergências por Módulo
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Total Auditado</span>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={divergenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {divergenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: '12px', color: darkMode ? '#FFFFFF' : '#000000', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: SoD Risk Radar */}
        <div className={`p-6 rounded-2xl border shadow-sm lg:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Radar de Riscos de Segregação de Funções (SoD / SOX)
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Análise de Conflitos Críticos</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={110} data={sodRadarData}>
                <PolarGrid stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <PolarAngleAxis dataKey="subject" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="Índice de Risco 1909" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                <Radar name="Índice de Risco 2022" dataKey="B" stroke="#8DC63F" fill="#8DC63F" fillOpacity={0.4} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: '12px', color: darkMode ? '#FFFFFF' : '#000000', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SapAnalyticsDashboard;
