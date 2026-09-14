import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AuditProvider, useAudit } from './context/AuditContext';
import { DebugLogProvider } from './context/DebugLogContext';
import { DebugLogPanel } from './components/DebugLogPanel';
import Layout from './components/Layout';
import UploadPage from './pages/Upload';
import DashboardPage from './pages/Dashboard';
import AuditDetailsPage from './pages/AuditDetails';
import ErrorBoundary from './components/ErrorBoundary';
import HistoryPage from './pages/History';
import AuditHistoryPage from './pages/AuditHistory';
import SettingsPage from './pages/Settings';
import HelpPage from './pages/Help';
import PriceSimulatorPage from './pages/PriceSimulator';
import AIAnalyzerPage from './pages/AIAnalyzer';
import ApprovalSignPage from './pages/ApprovalSign';
import MovementsPage from './pages/Movements';
import MaterialDashboardPage from './pages/MaterialDashboard';
import RecipesPage from './pages/Recipes';
import AITermsPage from './pages/AITerms';
import BatchTraceabilityPage from './pages/BatchTraceability';
import SoxAuditTrailPage from './pages/SoxAuditTrail';
import AccountingSimulatorPage from './pages/AccountingSimulator';
import CkmMb51SimulatorPage from './pages/CkmMb51Simulator';
import WebhookAlertsPage from './pages/WebhookAlerts';
import OfficeIntegrationPage from './pages/OfficeIntegration';
import SapReportPage from './pages/SapReportPage';
import StrategicHubPage from './pages/StrategicHubPage';
import ProductionSuitePage from './pages/ProductionSuitePage';
import AdvancedCompliancePage from './pages/AdvancedCompliancePage';
import GlobalEnterprisePage from './pages/GlobalEnterprisePage';
import EnterpriseControlPage from './pages/EnterpriseControlPage';
import EnterpriseCompliancePage from './pages/EnterpriseCompliancePage';
import AdvancedEnterprisePage from './pages/AdvancedEnterprisePage';
import UnifiedEnterprisePage from './pages/UnifiedEnterprisePage';
import CloudErpPage from './pages/CloudErpPage';
import AuditCfoCopilotPage from './pages/AuditCfoCopilotPage';
import ExecutiveDossierPage from './pages/ExecutiveDossierPage';
import EnterpriseRiskMatrixPage from './pages/EnterpriseRiskMatrixPage';
import TaxReformPage from './pages/TaxReformPage';
import PharmaTraceabilityPage from './pages/PharmaTraceabilityPage';
import TransferPricingPage from './pages/TransferPricingPage';
import CostIntelligenceHubPage from './pages/CostIntelligenceHubPage';
import WarehouseSystemPage from './pages/WarehouseSystemPage';
import EnterpriseStudioPage from './pages/EnterpriseStudioPage';
import { getDeviceId } from './utils/deviceUtils';
import { ShieldAlert } from 'lucide-react';
import { charmander } from './constants/charmander';
import { farmaAura } from './constants/farmaAura';
import { egoMaisAura } from './constants/egoMaisAura';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};

const BanGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bannedDevices } = useAudit();
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  useEffect(() => {
    setCurrentDeviceId(getDeviceId());
  }, []);

  if (bannedDevices.includes(currentDeviceId)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-red-500/10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Bloqueado</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Este dispositivo foi bloqueado por um administrador. 
            Se você acredita que isso é um erro, entre em contato com o suporte técnico da Natulab.
          </p>
          <div className="p-3 bg-black/30 rounded-xl border border-slate-800 mb-6">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ID do Dispositivo</p>
            <code className="text-xs text-red-400 font-mono">{currentDeviceId}</code>
          </div>
          <p className="text-xs text-slate-500 italic">
            NatuAssist Security System v1.2
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  if (!charmander) throw new Error("Charmander is broken");
  if (!farmaAura) throw new Error("Farma Aura is broken");
  if (!egoMaisAura) throw new Error("Ego Mais Aura is broken");
  return (
    <DebugLogProvider>
      <AuthProvider>
        <AuthGate>
          <AuditProvider>
            <BanGuard>
              <Router>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<UploadPage />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="details" element={
                        <ErrorBoundary>
                          <AuditDetailsPage />
                        </ErrorBoundary>
                      } />
                      <Route path="history" element={<HistoryPage />} />
                      <Route path="audit-history" element={<AuditHistoryPage />} />
                      <Route path="movements" element={<MovementsPage />} />
                      <Route path="batch-traceability" element={<BatchTraceabilityPage />} />
                      <Route path="sox-audit" element={<SoxAuditTrailPage />} />
                      <Route path="accounting-simulator" element={<AccountingSimulatorPage />} />
                      <Route path="ckm-mb51-simulator" element={<CkmMb51SimulatorPage />} />
                      <Route path="webhook-alerts" element={<WebhookAlertsPage />} />
                      <Route path="office-integration" element={<OfficeIntegrationPage />} />
                      <Route path="sap-report" element={<SapReportPage />} />
                      <Route path="cost-intelligence" element={<CostIntelligenceHubPage />} />
                      <Route path="strategic-hub" element={<StrategicHubPage />} />
                      <Route path="production-suite" element={<ProductionSuitePage />} />
                      <Route path="advanced-compliance" element={<AdvancedCompliancePage />} />
                      <Route path="global-enterprise" element={<GlobalEnterprisePage />} />
                      <Route path="enterprise-control" element={<EnterpriseControlPage />} />
                      <Route path="enterprise-compliance" element={<EnterpriseCompliancePage />} />
                      <Route path="advanced-suite" element={<AdvancedEnterprisePage />} />
                      <Route path="unified-enterprise" element={<UnifiedEnterprisePage />} />
                      <Route path="cloud-erp" element={<CloudErpPage />} />
                      <Route path="audit-copilot" element={<AuditCfoCopilotPage />} />
                      <Route path="executive-dossier" element={<ExecutiveDossierPage />} />
                      <Route path="risk-matrix" element={<EnterpriseRiskMatrixPage />} />
                      <Route path="tax-reform" element={<TaxReformPage />} />
                      <Route path="traceability" element={<PharmaTraceabilityPage />} />
                      <Route path="transfer-pricing" element={<TransferPricingPage />} />
                      <Route path="warehouse-system" element={<WarehouseSystemPage />} />
                      <Route path="studio-mode" element={<EnterpriseStudioPage />} />
                      <Route path="material-dashboard" element={<MaterialDashboardPage />} />
                      <Route path="simulator" element={<PriceSimulatorPage />} />
                      <Route path="ai-analyzer" element={<AIAnalyzerPage />} />
                      <Route path="approval" element={<ApprovalSignPage />} />
                      <Route path="recipes" element={<RecipesPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="help" element={<HelpPage />} />
                      <Route path="ai-terms" element={<AITermsPage />} />
                    </Route>
                  </Routes>
                  <DebugLogPanel />
                </ErrorBoundary>
              </Router>
            </BanGuard>
          </AuditProvider>
        </AuthGate>
      </AuthProvider>
    </DebugLogProvider>
  );
};

export default App;
