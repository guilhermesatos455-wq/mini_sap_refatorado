import React from 'react';
import { SapReportBuilder } from '../components/SapReportBuilder';
import { useAudit } from '../context/AuditContext';

export const SapReportPage: React.FC = () => {
  const { darkMode, addToast, resultado } = useAudit();
  const allFilteredItems = resultado?.allFilteredItems || [];

  return <SapReportBuilder darkMode={darkMode} addToast={addToast} allData={allFilteredItems} />;
};
export default SapReportPage;
