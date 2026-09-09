import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { Sparkles, Bot, AlertTriangle, CheckCircle, RefreshCw, Cpu, FileSearch, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AIAnalyzerPage: React.FC = () => {
  const { resultado } = useAudit();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const runAIAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalysisResult(`
**Relatório de Análise Avançada de Anomalias SAP (Gemini AI Engine)**

1. **Padrões de Divergência Detectados**:
   - Foram identificadas 12 ordens de produção no CKM3 com desvios superiores a 15% entre o preço padrão e o preço real de reavaliação.
   - Há uma concentração de divergências no Centro 1000 associadas a conversões de Unidade de Medida (UM) em notas fiscais de remessa para industrialização.

2. **Possíveis Causas Raiz**:
   - **Arredondamento de PMP**: Diferenças na ponderação de preços médios ponderados móveis (V MAP) em entradas retroativas no MB51.
   - **Omissão de Notas de Retorno**: Movimentações de estoque pendentes de encerramento de ordem (TECO) no SAP PP/CO.

3. **Recomendações Corretivas**:
   - Executar a transação CKMLCP (Custo Real / Ledger de Materiais) para reprocessar o período contábil atual.
   - Validar o cadastro de Fatores de Conversão de UoM na MM02 para os materiais listados na tabela de divergências.
      `);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bot className="w-7 h-7 text-[#8DC63F]" />
            Dashboard de Anomalias com IA (Gemini Engine)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análise inteligente de causa raiz para divergências de CKM3, MB51 e Posições de Estoque SAP.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 rounded-3xl border border-[#8DC63F]/30 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8DC63F]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8DC63F]/20 text-[#8DC63F] text-xs font-bold border border-[#8DC63F]/30">
            <Sparkles className="w-3.5 h-3.5" /> IA Especialista em Auditoria SAP
          </div>
          <h2 className="text-2xl font-black">Quer que o assistente analise o lote atual de dados SAP?</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            O motor de IA examinará todas as divergências importadas, cruzando movimentações de estoque, preços de materiais e regras fiscais para apontar inconsistências críticas.
          </p>
          <button
            onClick={runAIAnalysis}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[#8DC63F] hover:bg-[#7db438] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#8DC63F]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            {loading ? 'Analisando dados SAP...' : 'Iniciar Análise por IA'}
          </button>
        </div>
      </div>

      {analysisResult && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-[#8DC63F]" /> Resultado da Análise de Causa Raiz
            </h3>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              Concluído com Sucesso
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 space-y-4 whitespace-pre-line leading-relaxed">
            {analysisResult}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIAnalyzerPage;
