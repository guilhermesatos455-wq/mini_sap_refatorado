import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle, Upload, LayoutDashboard, Table, Download } from 'lucide-react';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Mini SAP Auditoria',
    description: 'Este guia rápido vai te ensinar como carregar seus relatórios do SAP (CKM3, MB51, Posições de Estoque) e realizar auditorias completas de custos e movimentações.',
    icon: <Sparkles className="w-8 h-8 text-[#8DC63F]" />,
    badge: 'Introdução',
    tip: 'Você pode reabrir este tour a qualquer momento no menu de Ajuda.'
  },
  {
    title: 'Passo 1: Upload de Arquivos (CKM3 & MB51)',
    description: 'Vá até a aba "Envio de Arquivos". Arraste ou selecione suas planilhas SAP. O sistema reconhece automaticamente relatórios CKM3 (Preço Médio Móvel / Materiais) e MB51 (Movimentações de Estoque).',
    icon: <Upload className="w-8 h-8 text-blue-400" />,
    badge: 'Upload de Dados',
    tip: 'Formatos aceitos: .XLSX, .XLS, .CSV exportados diretamente do SAP.'
  },
  {
    title: 'Passo 2: Mapeamento e Configuração',
    description: 'Caso seu layout SAP possua colunas personalizadas, utilize a ferramenta de Mapeamento (em Configurações) para alinhar colunas de Material, Centro, Quantidade e Valor sem alterar sua base original.',
    icon: <Table className="w-8 h-8 text-purple-400" />,
    badge: 'Mapeamento Flexível',
    tip: 'O sistema valida automaticamente divergências e colunas obrigatórias.'
  },
  {
    title: 'Passo 3: Dashboard e Cruzamento de Estoque',
    description: 'Explore o Dashboard Executivo, a Tabela de Detalhes com filtros por coluna (Material, Centro, Data) e o resumo especial de reconciliação MB51 vs Estoques Inicial e Final.',
    icon: <LayoutDashboard className="w-8 h-8 text-amber-400" />,
    badge: 'Análise Inteligente',
    tip: 'Utilize o NatuAssist (assistente IA) para tirar dúvidas sobre as divergências encontradas.'
  },
  {
    title: 'Passo 4: Relatórios e Exportação',
    description: 'Finalize sua auditoria gerando apresentações profissionais em PowerPoint (.pptx), relatórios em PDF ou exportando logs detalhados para comprovação fiscal.',
    icon: <Download className="w-8 h-8 text-emerald-400" />,
    badge: 'Resultados',
    tip: 'Pronto! Agora você tem total autonomia para auditar seus estoques com precisão SAP.'
  }
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, darkMode }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#8DC63F]/20 text-[#8DC63F]">
              {step.badge}
            </span>
            <span className={`text-xs font-mono font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Passo {currentStep + 1} de {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-5">
            <div className={`p-4 rounded-2xl flex-shrink-0 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
              {step.icon}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight">{step.title}</h2>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {step.description}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'}`}>
            <Sparkles className="w-4 h-4 text-[#8DC63F] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Dica profissional:</strong> {step.tip}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-[#8DC63F]' : darkMode ? 'w-2 bg-slate-800' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#8DC63F] hover:bg-[#78AF32] text-white shadow-lg shadow-[#8DC63F]/20 transition-all flex items-center gap-2"
            >
              {isLast ? 'Concluir Tour' : 'Próximo'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
