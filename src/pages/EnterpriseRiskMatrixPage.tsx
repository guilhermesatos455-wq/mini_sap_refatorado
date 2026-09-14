import React from 'react';
import EnterpriseRiskMatrix from '../components/EnterpriseRiskMatrix';
import { useAudit } from '../context/AuditContext';

export const EnterpriseRiskMatrixPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <EnterpriseRiskMatrix darkMode={darkMode} addToast={addToast} />;
};

export default EnterpriseRiskMatrixPage;
