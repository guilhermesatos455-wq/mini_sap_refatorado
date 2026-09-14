import React from 'react';
import ExecutiveDossierHub from '../components/ExecutiveDossierHub';
import { useAudit } from '../context/AuditContext';

export const ExecutiveDossierPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <ExecutiveDossierHub darkMode={darkMode} addToast={addToast} />;
};

export default ExecutiveDossierPage;
