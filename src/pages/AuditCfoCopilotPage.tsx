import React from 'react';
import AuditCfoCopilot from '../components/AuditCfoCopilot';
import { useAudit } from '../context/AuditContext';

export const AuditCfoCopilotPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <AuditCfoCopilot darkMode={darkMode} addToast={addToast} />;
};

export default AuditCfoCopilotPage;
