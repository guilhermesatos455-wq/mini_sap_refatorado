import React from 'react';
import { useAudit } from '../context/AuditContext';
import EnterpriseStudioMode from '../components/EnterpriseStudioMode';

export const EnterpriseStudioPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <EnterpriseStudioMode darkMode={darkMode} addToast={addToast} />;
};

export default EnterpriseStudioPage;
