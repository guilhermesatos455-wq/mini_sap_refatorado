import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WaterfallChartProps {
  data: { name: string; value: number; type: 'positive' | 'negative' | 'total' }[];
  darkMode: boolean;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, darkMode }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
        <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
        <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
        <Tooltip
          contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0' }}
        />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.type === 'positive'
                  ? '#ef4444' // red
                  : entry.type === 'negative'
                  ? '#22c55e' // green
                  : '#3b82f6' // blue
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
