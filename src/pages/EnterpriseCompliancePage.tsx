import React from 'react';
import EnterpriseComplianceEngine from '../components/EnterpriseComplianceEngine';
import { useAudit } from '../context/AuditContext';

export const EnterpriseCompliancePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <EnterpriseComplianceEngine darkMode={darkMode} addToast={addToast} />;
};

export default EnterpriseCompliancePage;
