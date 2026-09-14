import React from 'react';
import PharmaTraceabilityHub from '../components/PharmaTraceabilityHub';
import { useAudit } from '../context/AuditContext';

export const PharmaTraceabilityPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  return <PharmaTraceabilityHub darkMode={darkMode} addToast={addToast} />;
};

export default PharmaTraceabilityPage;
