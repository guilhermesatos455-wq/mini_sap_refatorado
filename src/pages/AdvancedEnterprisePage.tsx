import React from 'react';
import { AdvancedEnterpriseSuite } from '../components/AdvancedEnterpriseSuite';
import { useAudit } from '../context/AuditContext';

export const AdvancedEnterprisePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <AdvancedEnterpriseSuite darkMode={darkMode} addToast={addToast} />;
};

export default AdvancedEnterprisePage;
