import React from 'react';
import ProductionEnterpriseSuite from '../components/ProductionEnterpriseSuite';
import { useAudit } from '../context/AuditContext';

export const ProductionSuitePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <ProductionEnterpriseSuite darkMode={darkMode} addToast={addToast} />;
};

export default ProductionSuitePage;
