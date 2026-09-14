import React from 'react';
import AdvancedComplianceSuite from '../components/AdvancedComplianceSuite';
import { useAudit } from '../context/AuditContext';

export const AdvancedCompliancePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <AdvancedComplianceSuite darkMode={darkMode} addToast={addToast} />;
};

export default AdvancedCompliancePage;
