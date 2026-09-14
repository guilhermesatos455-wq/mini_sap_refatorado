import React, { useState } from 'react';
import { Settings, Check, Wrench, Sparkles } from 'lucide-react';
import { ShowColunas } from '../../types/audit';
import StudioModal from '../StudioModal';

interface ColumnToggleDropdownProps {
  showColunas: ShowColunas;
  setShowColunas: (cols: ShowColunas) => void;
  darkMode: boolean;
  addToast?: (msg: string, type: 'success' | 'error') => void;
}

export const ColumnToggleDropdown: React.FC<ColumnToggleDropdownProps> = ({ showColunas, setShowColunas, darkMode, addToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const toggleColumn = (key: keyof ShowColunas) => {
    setShowColunas({ ...showColunas, [key]: !showColunas[key] });
  };

  const handleToast = (msg: string, type: 'success' | 'error') => {
    if (addToast) {
      addToast(msg, type);
    }
  };

  const columnsDef = [
      { id: 'empresa', label: 'Empresa' },
      { id: 'descricaoEmpresa', label: 'Descrição Empresa' },
      { id: 'pedidoCompras', label: 'Pedido de Compras' },
      { id: 'itemPedidoCompras', label: 'Item Pedido de Compras' },
      { id: 'itemDocumento', label: 'Item Documento' },
      { id: 'numeroNF', label: 'Número NF' },
      { id: 'notaFiscalFrete', label: 'Nota Fiscal de Frete' },
      { id: 'naturezaOperacao', label: 'Natureza da Operação' },
      { id: 'tipoMaterial', label: 'Tipo Material' },
      { id: 'descricaoTipoMaterial', label: 'Descrição Tipo Material' },
      { id: 'categoriaNF', label: 'Categoria NF' },
      { id: 'origemMaterial', label: 'Origem Material' },
      { id: 'tipoReferencia', label: 'Tipo Referência' },
      { id: 'dataLancamento', label: 'Data Lançamento' },
      { id: 'dataDocumento', label: 'Data Documento' },
      { id: 'precoSemFrete', label: 'Preço Unit. s/ Frete' },
      { id: 'precoComFrete', label: 'Preço Unit. c/ Frete' },
      { id: 'valorLiqSemFrete', label: 'V. Liq s/ Frete' },
      { id: 'valorLiqComFrete', label: 'V. Liq c/ Frete' },
      { id: 'valorTotalSemFrete', label: 'Total s/ Frete' },
      { id: 'valorTotalComFrete', label: 'Total c/ Frete' },
      { id: 'ckm3Empresa', label: 'CKM3 Empresa' },
      { id: 'ckm3CodMaterial', label: 'CKM3 Cód Material' },
      { id: 'ckm3UnidadeMedida', label: 'CKM3 Unidade Medida' },
      { id: 'ckm3CodTipoMaterial', label: 'CKM3 Cód Tipo Material' },
      { id: 'ckm3CategoriaDados', label: 'CKM3 Categoria Dados' },
      { id: 'ckm3Categoria', label: 'CKM3 Categoria' },
      { id: 'ckm3DocReferencia', label: 'CKM3 Doc. Referência' },
      { id: 'ckm3NotaFiscal', label: 'CKM3 Nota Fiscal' },
      { id: 'ckm3Ordem', label: 'CKM3 Ordem' },
      { id: 'ckm3TipoMovimento', label: 'CKM3 Tipo Movimento' },
      { id: 'ckm3Conta', label: 'CKM3 Conta' },
      { id: 'ckm3TaxaCambio', label: 'CKM3 Taxa Câmbio' },
      { id: 'ckm3QtdTransacao', label: 'CKM3 Qtd. Transação' },
      { id: 'ckm3ValorEstoque', label: 'CKM3 Valor Estoque' },
      { id: 'ckm3DiferencaPreco', label: 'CKM3 Diferença Preço' },
      { id: 'ckm3DesvioTaxaCambio', label: 'CKM3 Desvio Taxa Câmbio' },
      { id: 'ckm3ValorReal', label: 'CKM3 Valor Real' },
      { id: 'ckm3PrecoMedioMovel', label: 'CKM3 Preço Médio Móvel' },
      { id: 'ckm3Manutencao', label: 'CKM3 Manutenção' },
  ] as { id: keyof ShowColunas, label: string }[];

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setIsStudioOpen(true)}
        className={`p-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border-purple-500/30 text-purple-400 hover:from-purple-600/20 hover:to-indigo-600/20 shadow-sm cursor-pointer`}
      >
        <Wrench className="w-4 h-4 text-purple-400" /> Abrir Estúdio
      </button>

      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-gray-300 shadow-sm'}`}
        >
          <Settings className="w-4 h-4" /> Colunas
        </button>

        {isOpen && (
          <div className={`absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto rounded-xl border shadow-lg z-50 p-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-600'}`}>Visibilidade de Colunas</h4>
            {columnsDef.map(col => (
              <button
                key={col.id}
                onClick={() => toggleColumn(col.id)}
                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  showColunas[col.id] 
                    ? (darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]') 
                    : (darkMode ? 'text-slate-500' : 'text-gray-700')
                } hover:bg-slate-800/10`}
              >
                {col.label}
                {showColunas[col.id] && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
        {isOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        )}
      </div>

      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        darkMode={darkMode}
        addToast={handleToast}
      />
    </div>
  );
};

export default ColumnToggleDropdown;
