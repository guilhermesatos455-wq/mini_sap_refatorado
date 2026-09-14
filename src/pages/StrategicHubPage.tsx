import React from 'react';
import EnterpriseStrategicHub from '../components/EnterpriseStrategicHub';
import { useAudit } from '../context/AuditContext';

export const StrategicHubPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <EnterpriseStrategicHub darkMode={darkMode} addToast={addToast} />;
};

export default StrategicHubPage;
