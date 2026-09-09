import React, { useMemo } from 'react';
import { MaterialMovement, StockPosition, SAPMovementType } from '../types/audit';
import { Layers, AlertTriangle, CheckCircle2, ArrowRightLeft, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface MB51StockReconciliationSummaryProps {
  movements: MaterialMovement[];
  initialStockPositions: StockPosition[];
  finalStockPositions: StockPosition[];
  movementTypes: SAPMovementType[];
  darkMode: boolean;
}

export const MB51StockReconciliationSummary: React.FC<MB51StockReconciliationSummaryProps> = ({
  movements,
  initialStockPositions,
  finalStockPositions,
  movementTypes,
  darkMode
}) => {
  // 1. Unique movement types in MB51
  const mb51MovementCodes = useMemo(() => {
    const set = new Set<string>();
    movements.forEach(m => { if (m.movementType) set.add(m.movementType.trim()); });
    return Array.from(set).sort();
  }, [movements]);

  // 2. Missing movement types (configured vs present in MB51)
  const missingInMb51 = useMemo(() => {
    const activeConfigs = movementTypes.filter(t => t.active);
    return activeConfigs.filter(t => !mb51MovementCodes.includes(t.code.trim()));
  }, [movementTypes, mb51MovementCodes]);

  // 3. Zeroed / Consumed materials (Initial > 0, Final == 0 or missing in Final)
  const zeroedMaterials = useMemo(() => {
    const finalMap = new Map<string, number>();
    finalStockPositions.forEach(p => {
      finalMap.set(p.material.trim(), p.quantity);
    });

    const zeroed: { material: string; description: string; initialQty: number }[] = [];
    initialStockPositions.forEach(init => {
      const mat = init.material.trim();
      const finalQty = finalMap.get(mat) ?? 0;
      if (init.quantity > 0 && finalQty === 0) {
        zeroed.push({
          material: mat,
          description: init.description || 'Sem descrição',
          initialQty: init.quantity
        });
      }
    });
    return zeroed;
  }, [initialStockPositions, finalStockPositions]);

  // 4. Newly created materials (Initial == 0, Final > 0)
  const newlyCreatedMaterials = useMemo(() => {
    const initialMap = new Map<string, number>();
    initialStockPositions.forEach(p => {
      initialMap.set(p.material.trim(), p.quantity);
    });

    const created: { material: string; description: string; finalQty: number }[] = [];
    finalStockPositions.forEach(fin => {
      const mat = fin.material.trim();
      const initQty = initialMap.get(mat) ?? 0;
      if (initQty === 0 && fin.quantity > 0) {
        created.push({
          material: mat,
          description: fin.description || 'Sem descrição',
          finalQty: fin.quantity
        });
      }
    });
    return created;
  }, [initialStockPositions, finalStockPositions]);

  // 5. Total metrics
  const totalMovementsCount = movements.length;
  const totalInitialItems = initialStockPositions.length;
  const totalFinalItems = finalStockPositions.length;

  // Dynamic movement codes for text reporting
  const consumptionCodesList = useMemo(() => {
    const codes = movementTypes
      .filter(t => t.active && ['REQUISITION', 'LOSS', 'OTHER_EXIT', 'ADJUSTMENT_EXIT', 'SALE', 'BONIFICATION'].includes(t.category || ''))
      .map(t => t.code);
    return codes.length > 0 ? codes.slice(0, 4).join(', ') : '201, 261';
  }, [movementTypes]);

  const entryCodesList = useMemo(() => {
    const codes = movementTypes
      .filter(t => t.active && ['PRODUCTION_PURCHASE', 'ADJUSTMENT_ENTRY', 'RETURN_ENTRY_SALE'].includes(t.category || ''))
      .map(t => t.code);
    return codes.length > 0 ? codes.slice(0, 3).join(', ') : '101';
  }, [movementTypes]);

  if (totalMovementsCount === 0 && totalInitialItems === 0 && totalFinalItems === 0) {
    return (
      <div className={`p-8 rounded-3xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
        <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-bold">Faça o upload dos arquivos MB51 e das Posições de Estoque Inicial/Final para visualizar o Resumo Executivo de Conciliação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Movimentos MB51</span>
            <ArrowRightLeft className="w-4 h-4 text-[#8DC63F]" />
          </div>
          <p className="text-2xl font-black">{totalMovementsCount.toLocaleString()}</p>
          <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{mb51MovementCodes.length} tipos distintos detectados</p>
        </div>

        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Estoque Inicial (E8)</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black">{totalInitialItems.toLocaleString()}</p>
          <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Itens no período anterior</p>
        </div>

        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Estoque Final (S8)</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black">{totalFinalItems.toLocaleString()}</p>
          <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Itens no mês atual</p>
        </div>

        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Itens Zerados / Consumidos</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{zeroedMaterials.length}</p>
          <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Eram &gt; 0 e encerraram em 0</p>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Movement Types */}
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Tipos de Movimento Ausentes no MB51</h3>
                <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configurados no sistema mas sem registros no MB51 carregado</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400">
              {missingInMb51.length} ausentes
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {missingInMb51.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                Todos os tipos de movimento ativos possuem ocorrências no MB51.
              </div>
            ) : (
              missingInMb51.map((t, idx) => (
                <div key={`${t.code}-${idx}`} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#8DC63F]">{t.code}</span>
                    <span className="font-medium truncate max-w-[220px]">{t.description}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase ${t.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-400' : t.direction === 'Saída' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {t.direction}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zeroed Materials */}
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Materiais com Estoque Zerado (Inicial &gt; Final = 0)</h3>
                <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Itens consumidos totalmente no período</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400">
              {zeroedMaterials.length} itens
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {zeroedMaterials.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                Nenhum material teve seu estoque totalmente zerado entre o início e o fim.
              </div>
            ) : (
              zeroedMaterials.slice(0, 50).map((item, idx) => (
                <div key={`${item.material}-${idx}`} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono font-bold text-rose-400">{item.material}</span>
                    <span className="font-medium truncate max-w-[200px]">{item.description}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Qtd Init: {item.initialQty.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overall Impact & Influence Summary */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#8DC63F]/20 text-[#8DC63F]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#8DC63F]">Influência na Movimentação e Auditoria Global</h3>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Análise de consistência e impacto dos fluxos MB51</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs leading-relaxed space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <p>
            • <strong className="text-white">Fluxo de Entradas e Saídas:</strong> O cruzamento entre os {totalMovementsCount.toLocaleString()} registros MB51 e as posições de estoque (E8: {totalInitialItems} / S8: {totalFinalItems}) demonstra o balanceamento do ciclo produtivo. A ausência de {missingInMb51.length} tipos de movimento indica que operações específicas (como devoluções ou ajustes manuais) não ocorreram neste ciclo ou requerem verificação de t-codes.
          </p>
          <p>
            • <strong className="text-white">Impacto dos Itens Zerados:</strong> Os {zeroedMaterials.length} materiais que zeraram o estoque indicam consumo total por ordens de produção ou requisições internas (como tipos {consumptionCodesList}), devendo ser auditados para evitar ruptura de insumos críticos.
          </p>
          <p>
            • <strong className="text-white">Itens Recém-Criados:</strong> Foram identificados {newlyCreatedMaterials.length} novos materiais sem estoque inicial mas com saldo positivo no estoque final, evidenciando entradas por compras ou produção (tipos {entryCodesList}) ou recebimentos fiscais recentes.
          </p>
        </div>
      </div>
    </div>
  );
};
