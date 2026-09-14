import React from 'react';
import UnifiedEnterpriseSuite from '../components/UnifiedEnterpriseSuite';
import { useAudit } from '../context/AuditContext';

export const UnifiedEnterprisePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <UnifiedEnterpriseSuite darkMode={darkMode} addToast={addToast} />;
};

export default UnifiedEnterprisePage;
