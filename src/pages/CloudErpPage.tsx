import React from 'react';
import CloudErpSuite from '../components/CloudErpSuite';
import { useAudit } from '../context/AuditContext';

export const CloudErpPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <CloudErpSuite darkMode={darkMode} addToast={addToast} />;
};

export default CloudErpPage;
