import React from 'react';
import EnterpriseControlCenter from '../components/EnterpriseControlCenter';
import { useAudit } from '../context/AuditContext';

export const EnterpriseControlPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <EnterpriseControlCenter darkMode={darkMode} addToast={addToast} />;
};

export default EnterpriseControlPage;
