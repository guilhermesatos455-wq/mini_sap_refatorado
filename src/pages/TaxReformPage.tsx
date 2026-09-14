import React from 'react';
import TaxReformSimulator from '../components/TaxReformSimulator';
import { useAudit } from '../context/AuditContext';

export const TaxReformPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <TaxReformSimulator darkMode={darkMode} addToast={addToast} />;
};

export default TaxReformPage;
