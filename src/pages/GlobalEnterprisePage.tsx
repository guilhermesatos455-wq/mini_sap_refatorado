import React from 'react';
import GlobalEnterpriseSuite from '../components/GlobalEnterpriseSuite';
import { useAudit } from '../context/AuditContext';

export const GlobalEnterprisePage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <GlobalEnterpriseSuite darkMode={darkMode} addToast={addToast} />;
};

export default GlobalEnterprisePage;
