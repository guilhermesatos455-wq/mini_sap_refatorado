import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, FileCheck, AlertTriangle, FileText, DollarSign } from 'lucide-react';
import StatCard from './StatCard';

interface SummaryCardsProps {
  resultado: any;
  darkMode: boolean;
  formatCurrency: (val: number) => string;
  showFinancialImpact: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  resultado,
  darkMode,
  formatCurrency,
  showFinancialImpact
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const totalNotas = useMemo(() => {
    if (!resultado || !resultado.divergencias) return 0;
    const notasSet = new Set(resultado.divergencias.map((d: any) => d.numeroNF));
    return notasSet.size;
  }, [resultado]);

  const totalDesvio = resultado?.totalPrejuizo || 0;
  const totalEconomia = resultado?.totalEconomia || 0;
  const itensAuditados = resultado?.linhasNfProcessadas || 0;
  const qtdDivergencias = resultado?.qtdDiv || 0;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <motion.div variants={item}>
        <StatCard 
          title="Total de Notas Fiscais" 
          value={totalNotas.toLocaleString()}
          icon={<FileText className="w-6 h-6" />}
          color="info"
          darkMode={darkMode}
          tooltip="Quantidade de notas fiscais únicas processadas na auditoria atual, obtida através do agrupamento dos números de NF encontrados nos registros."
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard 
          title="Valores de Desvio (Prejuízo)" 
          value={formatCurrency(totalDesvio)}
          icon={<TrendingDown className="w-6 h-6" />}
          trend="up"
          color="danger"
          darkMode={darkMode}
          tooltip="Soma total dos valores onde o preço faturado na nota superou o custo padrão de referência CKM3 (Preço Com Frete > Custo Médio CKM3)."
        />
      </motion.div>

      {showFinancialImpact ? (
        <motion.div variants={item}>
          <StatCard 
            title="Abaixo do Custo (Economia)" 
            value={formatCurrency(totalEconomia)}
            icon={<TrendingUp className="w-6 h-6" />}
            trend="up"
            color="success"
            darkMode={darkMode}
            tooltip="Soma dos valores onde a aquisição ocorreu abaixo do custo padrão de referência CKM3 (Preço Líquido < Custo CKM3)."
          />
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <StatCard 
            title="Qtd. Divergências" 
            value={qtdDivergencias.toLocaleString()}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="warning"
            darkMode={darkMode}
            tooltip="Número total de itens de notas fiscais identificados com divergências de preço, frete ou impostos pelas regras de auditoria."
          />
        </motion.div>
      )}

      <motion.div variants={item}>
        <StatCard 
          title="Itens Auditados" 
          value={itensAuditados.toLocaleString()}
          icon={<FileCheck className="w-6 h-6" />}
          color="primary"
          darkMode={darkMode}
          tooltip="Total de linhas e registros de notas fiscais (MB51 / NF) validados pelas regras de auditoria."
        />
      </motion.div>
    </motion.div>
  );
};

export default SummaryCards;

