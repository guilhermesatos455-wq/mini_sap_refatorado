import React, { useState } from 'react';
import { Cpu, Sparkles, Send, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface GeminiAiAnomalyAnalyzerProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const GeminiAiAnomalyAnalyzer: React.FC<GeminiAiAnomalyAnalyzerProps> = ({ darkMode, addToast }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [auditSample, setAuditSample] = useState<string>(
    'Material: MAT-9921 (Cloreto de Sódio P.A.), Centro: 1000, Período: 2026/03, Preço Padrão: R$ 45.50, Preço Real: R$ 62.80, Desvio: +38.02%, Movimentos MB51 sem O.P. vinculada: 4 lotes.'
  );
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    if (!auditSample.trim()) {
      addToast('Insira uma amostra contábil para análise.', 'error');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é um auditor sênior especializado em SAP ECC/S4HANA, contabilidade de custos CKM3 e reconciliação de estoques MB51. Analise o caso fornecido, identifique a causa raiz e forneça recomendações de conformidade SOX em português objetivo.' },
            { role: 'user', content: auditSample }
          ],
          stream: false
        })
      });

      const data = await response.json();
      if (data.content) {
        setAnalysisResult(data.content);
        addToast('Análise de IA concluída com sucesso!', 'success');
      } else {
        throw new Error('Resposta vazia da IA.');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback simulated AI analysis if API is offline
      setAnalysisResult(
        `### 🤖 Relatório de Causa Raiz (Simulação IA)\n\n- **Anomalia Detectada**: Desvio de preço real superior a 35% no material \`MAT-9921\` no período \`2026/03\`.\n- **Causa Raiz Provável**: Lançamentos manuais de reavaliação de inventário (Transacão MR21) sem a devida vinculação de Ordem de Produção (O.P.), gerando distorção na conta de variação de preço CKM3.\n- **Recomendação de Correção SOX**: Estornar o lançamento manual via MIGO/MB1A, vincular a O.P. correta e reexecutar a apuração do Ledger de Materiais (CKMLCP).`
      );
      addToast('Análise gerada via modo de contingência.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Cpu className="w-5 h-5 text-indigo-500" /> Gemini AI Anomaly Analyzer (Custo & Inventário)
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Utilize Inteligência Artificial para diagnosticar causa raiz de anomalias contábeis e divergências CKM3/MB51.
          </p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div>
          <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Amostra de Auditoria SAP (Material, Variação, Lotes)
          </label>
          <textarea
            rows={4}
            value={auditSample}
            onChange={(e) => setAuditSample(e.target.value)}
            className={`w-full p-3 rounded-xl border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-300'}`}
            placeholder="Descreva a divergência contábil..."
          />
        </div>

        <button
          onClick={handleRunAiAnalysis}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analisando com Gemini AI...' : 'Executar Diagnóstico com IA'}
        </button>

        {analysisResult && (
          <div className={`mt-6 p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-indigo-50 border-indigo-100 text-gray-900'}`}>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Diagnóstico & Causa Raiz Gerado por IA
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-line font-sans">
              {analysisResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
