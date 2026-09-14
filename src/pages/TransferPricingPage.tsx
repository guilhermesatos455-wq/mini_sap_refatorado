import React from 'react';
import TransferPricingHub from '../components/TransferPricingHub';
import { useAudit } from '../context/AuditContext';

export const TransferPricingPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <TransferPricingHub darkMode={darkMode} addToast={addToast} />;
};

export default TransferPricingPage;
