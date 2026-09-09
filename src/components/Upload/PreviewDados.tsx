import React from 'react';
import { X } from 'lucide-react';

interface PreviewDadosProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  darkMode: boolean;
}

const PreviewDados: React.FC<PreviewDadosProps> = ({ isOpen, onClose, title, data, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Visualização: {title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            <thead className={darkMode ? 'bg-slate-800' : 'bg-gray-100'}>
              <tr>
                {Object.keys(data[0] || {}).map((header) => (
                  <th key={header} className="px-4 py-2 text-left font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={`border-b ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-2">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreviewDados;
