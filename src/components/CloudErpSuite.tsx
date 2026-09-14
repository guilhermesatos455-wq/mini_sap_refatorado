import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, FileText, Package, CheckSquare, Plus, DollarSign, Users, ArrowRight,
  Cpu, Wrench, ShieldCheck, Factory, Settings, Layers, Activity, AlertCircle, CheckCircle2,
  Play, Pause, RefreshCw, Sliders, Truck, ShoppingCart, Building2, Shuffle, Clock, GitCompare, X, Bell,
  ChevronRight, Search, Download, Check, AlertTriangle, Hammer, Gauge, ShieldAlert, Sparkles, Box
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface CloudErpSuiteProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface ReplenishmentItem {
  id: string;
  sku: string;
  product: string;
  currentStock: number;
  safetyStock: number;
  forecastDemand: number;
  suggestedQty: number;
  strategy: 'Fabricar (Make)' | 'Comprar (Buy)' | 'Transferir';
  status: 'Pendente' | 'Aprovado' | 'Em Execução';
  generatedRef?: string;
}

interface WorkOrder {
  id: string;
  operation: string;
  workcenter: string;
  operator: string;
  durationMin: number;
  status: 'Em Produção' | 'Pausado' | 'Concluído';
  progress: number;
  scrappedQty: number;
  plannedQty: number;
}

interface PlmBOMItem {
  componentCode: string;
  name: string;
  qtyPerUnit: number;
  unit: string;
  unitCost: number;
}

interface PlmBOM {
  id: string;
  code: string;
  product: string;
  version: string;
  componentsCount: number;
  status: 'Ativo (Release)' | 'Em Revisão de Engenharia' | 'Obsoleto';
  standardBatchSize: number;
  items: PlmBOMItem[];
}

interface QualityCheck {
  id: string;
  workcenter: string;
  batch: string;
  testType: string;
  result: 'Aprovado' | 'Reprovado' | 'Em Inspeção';
  inspector: string;
  date: string;
  disintegrationTimeSec?: number;
  assayPurityPercent?: number;
  correctiveAction?: string;
}

interface MaintenanceTask {
  id: string;
  equipment: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva IOT';
  technician: string;
  scheduledDate: string;
  status: 'Agendado' | 'Em Andamento' | 'Concluído';
  mtbfHours: number;
  mttrHours: number;
}

interface SalesLead {
  id: string;
  company: string;
  contact: string;
  dealValue: number;
  stage: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Ganho';
  probability: string;
}

interface InvoiceItem {
  id: string;
  customer: string;
  dueDate: string;
  amount: number;
  status: 'Emitida' | 'Paga' | 'Vencida' | 'Faturada';
}

interface InventoryStock {
  sku: string;
  name: string;
  warehouse: string;
  zone: string;
  onHand: number;
  reserved: number;
  available: number;
}

interface ProjectTask {
  id: string;
  projectName: string;
  taskTitle: string;
  assignee: string;
  deadline: string;
  stage: 'A Fazer' | 'Em Andamento' | 'Concluído';
}

export const CloudErpSuite: React.FC<CloudErpSuiteProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [activeModule, setActiveModule] = useState<'simulacao' | 'mrp' | 'mes' | 'plm' | 'qualidade' | 'chaofabrica' | 'manutencao' | 'crm' | 'invoicing' | 'inventory' | 'projects'>('simulacao');
  const [searchQuery, setSearchQuery] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);

  // MRP State
  const [replenishmentItems, setReplenishmentItems] = useState<ReplenishmentItem[]>([
    { id: 'MRP-001', sku: 'MAT-101', product: 'Paracetamol 500mg (Granel Ativo)', currentStock: 1200, safetyStock: 2000, forecastDemand: 15000, suggestedQty: 15800, strategy: 'Fabricar (Make)', status: 'Pendente' },
    { id: 'MRP-002', sku: 'MAT-102', product: 'Dipirona Sódica 500mg (Insumo)', currentStock: 4500, safetyStock: 3000, forecastDemand: 25000, suggestedQty: 23500, strategy: 'Comprar (Buy)', status: 'Aprovado', generatedRef: 'REQ-COMP-9012' },
    { id: 'MRP-003', sku: 'MAT-205', product: 'Amoxicilina 500mg Suspensão', currentStock: 800, safetyStock: 1500, forecastDemand: 8500, suggestedQty: 9200, strategy: 'Fabricar (Make)', status: 'Pendente' },
  ]);

  // MES / Work Orders State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    { id: 'WO-8801', operation: 'Granulação & Mistura', workcenter: 'WC-Farmaco-01', operator: 'Carlos Mendes', durationMin: 240, status: 'Em Produção', progress: 68, plannedQty: 50000, scrappedQty: 120 },
    { id: 'WO-8802', operation: 'Compressão Blister A', workcenter: 'WC-Embalagem-02', operator: 'Ana Paula Souza', durationMin: 180, status: 'Pausado', progress: 40, plannedQty: 30000, scrappedQty: 85 },
    { id: 'WO-8803', operation: 'Rotulagem & Caixa Master', workcenter: 'WC-Expedicao-01', operator: 'Marcos Vinicius', durationMin: 120, status: 'Concluído', progress: 100, plannedQty: 25000, scrappedQty: 12 },
  ]);

  // PLM State
  const [boms, setBoms] = useState<PlmBOM[]>([
    { 
      id: 'BOM-101', 
      code: 'BOM-PAR-500', 
      product: 'Paracetamol 500mg (Cx 50 Comp)', 
      version: 'v3.2', 
      componentsCount: 5, 
      status: 'Ativo (Release)',
      standardBatchSize: 10000,
      items: [
        { componentCode: 'RAW-PAR-01', name: 'Paracetamol Cristalizado P.A.', qtyPerUnit: 0.50, unit: 'g', unitCost: 0.08 },
        { componentCode: 'RAW-EXC-02', name: 'Amido de Milho Pré-Gelatinizado', qtyPerUnit: 0.05, unit: 'g', unitCost: 0.01 },
        { componentCode: 'RAW-EXC-03', name: 'Povidona K-30 Aglutinante', qtyPerUnit: 0.02, unit: 'g', unitCost: 0.02 },
        { componentCode: 'PKG-ALU-01', name: 'Folha de Alumínio Selagem Blister', qtyPerUnit: 0.002, unit: 'm²', unitCost: 0.05 },
        { componentCode: 'PKG-BOX-01', name: 'Cartucho Papel Cartão 50 Comp', qtyPerUnit: 0.02, unit: 'un', unitCost: 0.12 }
      ]
    },
    { 
      id: 'BOM-102', 
      code: 'BOM-DIP-500', 
      product: 'Dipirona Sódica 500mg Gotas', 
      version: 'v2.0', 
      componentsCount: 4, 
      status: 'Em Revisão de Engenharia',
      standardBatchSize: 5000,
      items: [
        { componentCode: 'RAW-DIP-01', name: 'Dipirona Monoidratada P.A.', qtyPerUnit: 0.50, unit: 'g', unitCost: 0.09 },
        { componentCode: 'RAW-VEI-01', name: 'Água Purificada WFI USP', qtyPerUnit: 1.0, unit: 'ml', unitCost: 0.005 },
        { componentCode: 'PKG-FRASCO-01', name: 'Frasco Conta-Gotas Âmbar 20ml', qtyPerUnit: 1.0, unit: 'un', unitCost: 0.45 },
        { componentCode: 'PKG-TAMPA-01', name: 'Tampa Lacrada c/ Batoque', qtyPerUnit: 1.0, unit: 'un', unitCost: 0.15 }
      ]
    },
    { 
      id: 'BOM-103', 
      code: 'BOM-AMOX-SUS', 
      product: 'Amoxicilina 500mg Suspensão', 
      version: 'v1.4', 
      componentsCount: 4, 
      status: 'Ativo (Release)',
      standardBatchSize: 8000,
      items: [
        { componentCode: 'RAW-AMX-01', name: 'Amoxicilina Tri-hidratada P.A.', qtyPerUnit: 0.50, unit: 'g', unitCost: 0.18 },
        { componentCode: 'RAW-ARO-01', name: 'Aroma Artificial de Morango', qtyPerUnit: 0.01, unit: 'g', unitCost: 0.03 },
        { componentCode: 'PKG-FRASCO-02', name: 'Frasco PET 150ml Graduado', qtyPerUnit: 1.0, unit: 'un', unitCost: 0.60 },
        { componentCode: 'PKG-MED-01', name: 'Copo Dosador Graduado 10ml', qtyPerUnit: 1.0, unit: 'un', unitCost: 0.10 }
      ]
    },
  ]);

  const [selectedBomForModal, setSelectedBomForModal] = useState<PlmBOM | null>(null);

  // Quality Control State
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([
    { id: 'QC-991', workcenter: 'WC-Farmaco-01', batch: 'LOTE2026A', testType: 'Teor de Princípio Ativo (HPLC)', result: 'Aprovado', inspector: 'Dra. Beatriz Lima', date: '2026-09-11 08:30', assayPurityPercent: 99.4, disintegrationTimeSec: 240 },
    { id: 'QC-992', workcenter: 'WC-Embalagem-02', batch: 'LOTE9981B', testType: 'Inspeção Visual de Blister', result: 'Em Inspeção', inspector: 'Roberto Dias', date: '2026-09-11 09:15', assayPurityPercent: 98.1, disintegrationTimeSec: 290 },
    { id: 'QC-993', workcenter: 'WC-Farmaco-01', batch: 'LOTE5543C', testType: 'Teste de Desintegração Farmacopeica', result: 'Reprovado', inspector: 'Dra. Beatriz Lima', date: '2026-09-11 10:00', assayPurityPercent: 91.2, disintegrationTimeSec: 920, correctiveAction: 'Lote bloqueado no WMS. Aguardando laudo de re-ensaio da garantia da qualidade.' },
  ]);

  // Maintenance State
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    { id: 'MNT-401', equipment: 'Compressora Rotativa Industrial #04', type: 'Preventiva', technician: 'Equipe Mecânica Alfa', scheduledDate: '2026-09-12 06:00', status: 'Agendado', mtbfHours: 420, mttrHours: 2.5 },
    { id: 'MNT-402', equipment: 'Blisterizadora Ultrafast #02', type: 'Preditiva IOT', technician: 'Sistema Auto-Diagnóstico AI', scheduledDate: '2026-09-11 14:30', status: 'Em Andamento', mtbfHours: 310, mttrHours: 1.8 },
    { id: 'MNT-403', equipment: 'Autoclave Estéril #01', type: 'Corretiva', technician: 'João Batista', scheduledDate: '2026-09-10 18:00', status: 'Concluído', mtbfHours: 560, mttrHours: 3.2 },
  ]);

  // CRM State
  const [leads, setLeads] = useState<SalesLead[]>([
    { id: 'LEAD-01', company: 'Rede de Drogarias São Paulo S.A.', contact: 'Diretor de Suprimentos - Ricardo', dealValue: 450000.00, stage: 'Proposta', probability: '80%' },
    { id: 'LEAD-02', company: 'Drogaria Pacheco Rio', contact: 'Gerente de Compras - Mariana', dealValue: 180000.00, stage: 'Ganho', probability: '100%' },
    { id: 'LEAD-03', company: 'Farmácias Associadas Sul', contact: 'Comprador - Fernando', dealValue: 95000.00, stage: 'Qualificação', probability: '40%' },
  ]);

  // Invoicing State
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    { id: 'INV-9001', customer: 'Drogaria Pacheco Rio', dueDate: '2026-09-30', amount: 180000.00, status: 'Emitida' },
    { id: 'INV-9002', customer: 'Rede Farma Mais', dueDate: '2026-09-15', amount: 325000.50, status: 'Paga' },
    { id: 'INV-9003', customer: 'Hospital Santa Rita S.A.', dueDate: '2026-08-20', amount: 89000.00, status: 'Vencida' },
  ]);

  // Inventory Stock State
  const [stocks, setStocks] = useState<InventoryStock[]>([
    { sku: 'MAT-101', name: 'Paracetamol 500mg (Cx 50)', warehouse: 'CD SP - Cajamar (01)', zone: 'Zona Norte - Corredor A', onHand: 15400, reserved: 2000, available: 13400 },
    { sku: 'MAT-102', name: 'Dipirona Sódica 500mg', warehouse: 'CD SP - Cajamar (01)', zone: 'Zona Norte - Corredor B', onHand: 22100, reserved: 4500, available: 17600 },
    { sku: 'MAT-205', name: 'Amoxicilina 500mg Suspensão', warehouse: 'CD RJ - Duque de Caxias', zone: 'Zona Sul - Prateleira 04', onHand: 4800, reserved: 1200, available: 3600 },
  ]);

  // Projects State
  const [tasks, setTasks] = useState<ProjectTask[]>([
    { id: 'TSK-501', projectName: 'Expansão Planta Farmacêutica SP', taskTitle: 'Instalação de Nova Linha de Blister', assignee: 'Eng. Roberto Carlos', deadline: '2026-10-15', stage: 'Em Andamento' },
    { id: 'TSK-502', projectName: 'Auditoria Regulatória ANVISA 2026', taskTitle: 'Revisão de Validação de Limpeza', assignee: 'Dra. Beatriz Lima', deadline: '2026-09-25', stage: 'A Fazer' },
    { id: 'TSK-503', projectName: 'Migração Cloud ERP & SAP Connector', taskTitle: 'Homologação de Webhooks de Integração', assignee: 'DevOps Lead', deadline: '2026-09-12', stage: 'Concluído' },
  ]);

  // Real-Time Simulation State
  const [simulationActive, setSimulationActive] = useState(false);
  const [capacityLoad, setCapacityLoad] = useState(78.5);
  const [realTimeCost, setRealTimeCost] = useState(142500);

  // Chão de Fábrica OEE & WorkCenters
  const [workCentersOee, setWorkCentersOee] = useState([
    { id: 'WC-Farmaco-01', name: 'Granulação & Leito Fluidizado', oee: 94.2, availability: 97.0, performance: 98.2, quality: 98.9, status: 'Operando', operator: 'Carlos Mendes' },
    { id: 'WC-Embalagem-02', name: 'Compressora & Blisterizadora', oee: 76.5, availability: 82.0, performance: 94.5, quality: 98.8, status: 'Pausado (Setup)', operator: 'Ana Paula Souza' },
    { id: 'WC-Expedicao-01', name: 'Encaixotamento & Master Pack', oee: 98.1, availability: 99.0, performance: 99.5, quality: 99.6, status: 'Operando', operator: 'Marcos Vinicius' },
  ]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (simulationActive) {
      interval = setInterval(() => {
        setCapacityLoad(prev => +(prev + (Math.random() * 4 - 2)).toFixed(1));
        setRealTimeCost(prev => Math.round(prev + (Math.random() * 2000 - 1000)));
      }, 2000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [simulationActive]);

  const handleTogglePushNotifications = async () => {
    if (!('Notification' in window)) {
      addToast('Este navegador não suporta notificações desktop.', 'error');
      return;
    }
    if (Notification.permission === 'granted') {
      setPushEnabled(true);
      new Notification('Mini SAP ERP & Cloud', {
        body: 'Notificações push desktop ativas para alertas de chão de fábrica e auditoria.',
      });
      addToast('Notificações push desktop ativadas!', 'success');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        new Notification('Mini SAP ERP & Cloud', {
          body: 'Notificações push desktop ativadas com sucesso!',
        });
        addToast('Notificações push desktop ativadas com sucesso!', 'success');
      } else {
        addToast('Permissão para notificações negada pelo usuário.', 'error');
      }
    }
  };

  const handleRunFullAutomation = () => {
    setSimulationActive(true);
    setCapacityLoad(82.4);
    setRealTimeCost(139200);
    setReplenishmentItems(prev => prev.map(item => ({ ...item, status: 'Aprovado' })));
    setInvoices(prev => prev.map(inv => ({ ...inv, status: 'Paga' })));
    setLeads(prev => prev.map(l => ({ ...l, stage: 'Ganho', probability: '100%' })));
    setTasks(prev => prev.map(t => ({ ...t, stage: 'Concluído' })));
    setWorkOrders(prev => prev.map(wo => ({ ...wo, progress: Math.min(100, wo.progress + 20), status: 'Em Produção' })));
    addAuditLog('Automação Completa Cloud ERP', 'Executada automação integral: simulação, MRP, faturas, CRM, MES e tarefas.');
    addToast('🚀 Automação completa Cloud ERP executada com sucesso! Todos os módulos sincronizados.', 'success');
  };

  // MRP Actions
  const handleApproveMrp = (item: ReplenishmentItem) => {
    if (item.strategy === 'Fabricar (Make)') {
      const newWoId = `WO-${Math.floor(8800 + Math.random() * 1000)}`;
      const newWo: WorkOrder = {
        id: newWoId,
        operation: `Fabricação: ${item.product.split('(')[0]}`,
        workcenter: 'WC-Farmaco-01',
        operator: 'Equipe Operacional Turno A',
        durationMin: 180,
        status: 'Em Produção',
        progress: 10,
        plannedQty: item.suggestedQty,
        scrappedQty: 0
      };
      setWorkOrders(prev => [newWo, ...prev]);
      setReplenishmentItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Aprovado', generatedRef: newWoId } : i));
      addAuditLog('MRP -> Ordem de Produção Gerada', `Gerada Ordem de Produção ${newWoId} para ${item.product} (${item.suggestedQty} un).`);
      addToast(`Ordem de Produção ${newWoId} gerada no MES com sucesso!`, 'success');
    } else {
      const reqId = `REQ-COMP-${Math.floor(9000 + Math.random() * 999)}`;
      setReplenishmentItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Aprovado', generatedRef: reqId } : i));
      addAuditLog('MRP -> Requisição de Compra Gerada', `Gerada Requisição ${reqId} (SAP ME51N) para ${item.product} (${item.suggestedQty} un).`);
      addToast(`Requisição de Compras SAP ${reqId} aprovada com sucesso!`, 'success');
    }
  };

  // MES Actions
  const handleToggleWorkOrderStatus = (woId: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        let nextStatus: WorkOrder['status'] = 'Em Produção';
        if (wo.status === 'Em Produção') nextStatus = 'Pausado';
        else if (wo.status === 'Pausado') nextStatus = 'Em Produção';
        else nextStatus = 'Em Produção';
        addAuditLog('MES: Apontamento de Status', `Ordem ${wo.id} alterada para ${nextStatus}.`);
        return { ...wo, status: nextStatus };
      }
      return wo;
    }));
  };

  const handleAdvanceProgress = (woId: string, delta: number) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        const nextProgress = Math.min(100, Math.max(0, wo.progress + delta));
        const nextStatus = nextProgress >= 100 ? 'Concluído' : wo.status;
        return { ...wo, progress: nextProgress, status: nextStatus };
      }
      return wo;
    }));
    addToast('Progresso da Ordem de Produção atualizado!', 'success');
  };

  const handleRegisterScrap = (woId: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        const added = 25;
        addAuditLog('MES: Apontamento de Refugo', `Registrado refugo de +${added} unidades na ordem ${wo.id}.`);
        addToast(`Refugo de +${added} un registrado na ordem ${wo.id}.`, 'error');
        return { ...wo, scrappedQty: wo.scrappedQty + added };
      }
      return wo;
    }));
  };

  // Quality Actions
  const handleUpdateQcResult = (qcId: string, newResult: QualityCheck['result']) => {
    setQualityChecks(prev => prev.map(qc => {
      if (qc.id === qcId) {
        addAuditLog('Controle de Qualidade', `Lote ${qc.batch} atualizado para ${newResult} por Auditor de Qualidade.`);
        addToast(`Lote ${qc.batch} classificado como: ${newResult}!`, newResult === 'Aprovado' ? 'success' : 'error');
        return { 
          ...qc, 
          result: newResult,
          correctiveAction: newResult === 'Reprovado' ? 'Lote bloqueado no WMS. Notificação ANVISA RNC emitida.' : undefined
        };
      }
      return qc;
    }));
  };

  // Maintenance Actions
  const handleOpenEmergencyOrder = (equipmentName: string) => {
    const newId = `MNT-${Math.floor(404 + Math.random() * 90)}`;
    const newTask: MaintenanceTask = {
      id: newId,
      equipment: equipmentName,
      type: 'Corretiva',
      technician: 'Plantão Mecânico 24h',
      scheduledDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Em Andamento',
      mtbfHours: 280,
      mttrHours: 2.1
    };
    setMaintenanceTasks(prev => [newTask, ...prev]);
    addAuditLog('Manutenção Corretiva Emergencial', `Abertura de O.S. ${newId} para ${equipmentName}.`);
    addToast(`Ordem de Manutenção Corretiva ${newId} gerada com prioridade máxima!`, 'error');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5`}>
            <LayoutGrid className="w-6 h-6 text-purple-400" /> Cloud ERP Suite (MRP + MES + PLM + Qualidade + Chão de Fábrica + Manutenção)
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Módulos industriais síncronos e operacionais integrados para manufatura contínua e rastreabilidade total.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFullAutomation}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Executar Automação Completa
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex-wrap">
        {[
          { id: 'simulacao', label: 'Simulação Real-Time', icon: Activity },
          { id: 'mrp', label: 'MRP & Demanda', icon: Sliders },
          { id: 'mes', label: 'MES (Ordens)', icon: Factory },
          { id: 'chaofabrica', label: 'Chão de Fábrica (OEE)', icon: Gauge },
          { id: 'plm', label: 'PLM (Estrutura BOM)', icon: Layers },
          { id: 'qualidade', label: 'Qualidade & Lotes', icon: ShieldCheck },
          { id: 'manutencao', label: 'Manutenção TPM', icon: Wrench },
          { id: 'crm', label: 'CRM & Pipeline', icon: Users },
          { id: 'invoicing', label: 'Faturamento', icon: DollarSign },
          { id: 'inventory', label: 'Inventário WMS', icon: Box },
          { id: 'projects', label: 'Projetos & Tarefas', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === tab.id ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Module Content: Simulação Real-Time */}
      {activeModule === 'simulacao' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-2 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Status do Motor</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${simulationActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {simulationActive ? '● Ativo em Tempo Real' : '⏸ Pausado'}
                </span>
              </div>
              <h3 className="text-xl font-black font-mono">Cloud ERP Engine v4.2</h3>
              <p className="text-xs text-slate-400">Simulação síncrona com MRP, MES e contabilidade gerencial.</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setSimulationActive(!simulationActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${simulationActive ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
                >
                  {simulationActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {simulationActive ? 'Pausar Simulação' : 'Iniciar Simulação'}
                </button>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-2 shadow-sm`}>
              <span className="text-xs uppercase font-bold text-slate-400">Carga de Capacidade Fabril</span>
              <h3 className="text-2xl font-black font-mono text-purple-400">{capacityLoad}%</h3>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(capacityLoad, 100)}%` }}></div>
              </div>
              <p className="text-[11px] text-emerald-400">✓ Dentro do limite operacional seguro (≤ 90%)</p>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-2 shadow-sm`}>
              <span className="text-xs uppercase font-bold text-slate-400">Custo de Operação (Real-Time)</span>
              <h3 className="text-2xl font-black font-mono text-emerald-400">
                R$ {realTimeCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400">Atualizado via apontamentos MES & MRP.</p>
              <button
                onClick={handleTogglePushNotifications}
                className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Bell className="w-3 h-3" /> {pushEnabled ? 'Notificações Desktop Ativas' : 'Ativar Notificações Push'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Content: MRP & Demanda */}
      {activeModule === 'mrp' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Planejamento de Necessidade de Materiais (MRP Interativo)</h3>
              <p className="text-xs text-slate-400">Cálculo de cobertura com ponto de reposição e conversão instantânea em Ordem de Produção ou Compra.</p>
            </div>
            <span className="text-xs text-purple-400 font-mono font-bold bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20">
              Motor S/4HANA MRP Live
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {replenishmentItems.map((item) => (
              <div key={item.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{item.sku}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                      {item.strategy}
                    </span>
                    {item.generatedRef && (
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ref: {item.generatedRef}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">{item.product}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                    <span>Estoque: <strong className="text-white">{item.currentStock.toLocaleString('pt-BR')} un</strong></span>
                    <span>Segurança: <strong className="text-amber-400">{item.safetyStock.toLocaleString('pt-BR')} un</strong></span>
                    <span>Demanda: <strong className="text-white">{item.forecastDemand.toLocaleString('pt-BR')} un</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Qtd. Sugerida</span>
                    <strong className="font-mono text-base text-emerald-400">{item.suggestedQty.toLocaleString('pt-BR')} un</strong>
                  </div>

                  {item.status === 'Pendente' ? (
                    <button
                      onClick={() => handleApproveMrp(item)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> 
                      {item.strategy === 'Fabricar (Make)' ? 'Gerar O.P. no MES' : 'Gerar Pedido Compra'}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: MES (Ordens) */}
      {activeModule === 'mes' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Execução de Manufatura (MES) - Ordens de Produção Ativas</h3>
              <p className="text-xs text-slate-400">Controle de apontamento de paradas, refugo e avanço de bateladas.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Apontamentos em Tempo Real</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {workOrders.map((wo) => (
              <div key={wo.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{wo.id}</span>
                    <span className="text-xs text-slate-400 font-mono">📍 {wo.workcenter}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Meta: {wo.plannedQty.toLocaleString('pt-BR')} un</span>
                    {wo.scrappedQty > 0 && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Refugo: {wo.scrappedQty} un
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">{wo.operation}</h4>
                  <p className="text-xs text-slate-400 font-mono">Operador: <strong className="text-white">{wo.operator}</strong> | Duração estimada: {wo.durationMin} min</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-32">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progresso</span>
                      <span className="font-bold text-purple-300">{wo.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${wo.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWorkOrderStatus(wo.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        wo.status === 'Em Produção' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {wo.status === 'Em Produção' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {wo.status === 'Em Produção' ? 'Pausar' : 'Retomar'}
                    </button>

                    <button
                      onClick={() => handleAdvanceProgress(wo.id, 15)}
                      disabled={wo.progress >= 100}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer disabled:opacity-50"
                      title="Apontar +15% de produção"
                    >
                      +15%
                    </button>

                    <button
                      onClick={() => handleRegisterScrap(wo.id)}
                      className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold cursor-pointer"
                      title="Registrar refugo operacional"
                    >
                      Refugo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: Chão de Fábrica & OEE */}
      {activeModule === 'chaofabrica' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Chão de Fábrica & Monitoramento OEE (Overall Equipment Effectiveness)</h3>
              <p className="text-xs text-slate-400">Eficiência global combinando Disponibilidade × Performance × Qualidade em cada posto.</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              OEE Médio da Planta: 89.6%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workCentersOee.map((wc) => (
              <div key={wc.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-400">{wc.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${wc.status.includes('Operando') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {wc.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{wc.name}</h4>
                <p className="text-xs text-slate-400">Operador Atual: <strong className="text-white">{wc.operator}</strong></p>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300">Índice OEE Global:</span>
                    <span className="font-mono text-base font-black text-purple-400">{wc.oee}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1 font-mono">
                    <div className="p-1.5 rounded bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400 block">Disp.</span>
                      <strong className="text-emerald-400">{wc.availability}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400 block">Perf.</span>
                      <strong className="text-blue-400">{wc.performance}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400 block">Qual.</span>
                      <strong className="text-amber-400">{wc.quality}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenEmergencyOrder(wc.name)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3 h-3 text-amber-400" /> Acionar Manutenção O.S.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: PLM & BOM Explosion */}
      {activeModule === 'plm' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Gestão do Ciclo de Vida do Produto (PLM & Explosão de BOM)</h3>
              <p className="text-xs text-slate-400">Estrutura multinível de produtos, insumos ativos, excipientes e embalagens com custo unitário.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Versões de Engenharia</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {boms.map((bom) => (
              <div key={bom.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{bom.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">{bom.version}</span>
                    <span className="text-xs text-slate-400 font-mono">Tamanho Lote Padrão: {bom.standardBatchSize.toLocaleString('pt-BR')} un</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{bom.product}</h4>
                  <p className="text-xs text-slate-400 font-mono">Componentes na Estrutura: <strong className="text-white">{bom.componentsCount} itens ativos</strong></p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${bom.status.includes('Ativo') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {bom.status}
                  </span>
                  <button
                    onClick={() => setSelectedBomForModal(bom)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" /> Explorar Árvore BOM
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de Explosão de BOM */}
          {selectedBomForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
              <div className={`max-w-2xl w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'}`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                  <div>
                    <span className="font-mono text-xs text-purple-400 font-bold">{selectedBomForModal.code} - {selectedBomForModal.version}</span>
                    <h3 className="font-bold text-base text-white">{selectedBomForModal.product}</h3>
                  </div>
                  <button onClick={() => setSelectedBomForModal(null)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-600'}`}>
                      <tr>
                        <th className="pb-2">Cód. Insumo</th>
                        <th className="pb-2">Descrição do Componente</th>
                        <th className="pb-2">Qtd. / Unidade</th>
                        <th className="pb-2">Custo Unit. (R$)</th>
                        <th className="pb-2 text-right">Custo / Batelada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {selectedBomForModal.items.map((item, i) => {
                        const batchCost = item.qtyPerUnit * item.unitCost * selectedBomForModal.standardBatchSize;
                        return (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-2.5 font-mono text-purple-300 font-bold">{item.componentCode}</td>
                            <td className="py-2.5 text-slate-200">{item.name}</td>
                            <td className="py-2.5 font-mono">{item.qtyPerUnit} {item.unit}</td>
                            <td className="py-2.5 font-mono">R$ {item.unitCost.toFixed(3)}</td>
                            <td className="py-2.5 font-mono font-bold text-right text-emerald-400">
                              R$ {batchCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Total de componentes cadastrados: <strong>{selectedBomForModal.items.length} itens</strong></span>
                  <button
                    onClick={() => {
                      addToast(`Versão de engenharia homologada para ${selectedBomForModal.code}!`, 'success');
                      setSelectedBomForModal(null);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Homologar Revisão de Engenharia
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module Content: Qualidade */}
      {activeModule === 'qualidade' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Controle de Qualidade & Inspeção Laboratorial de Lotes</h3>
              <p className="text-xs text-slate-400">Testes de teor de pureza HPLC, desintegração e liberação para quarentena no WMS.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Conformidade e Laudos Laboratoriais</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {qualityChecks.map((qc) => (
              <div key={qc.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{qc.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">Lote: {qc.batch}</span>
                    <span className="text-xs text-slate-400 font-mono">{qc.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{qc.testType}</h4>
                  <p className="text-xs text-slate-400 font-mono">Inspetor: <strong className="text-white">{qc.inspector}</strong> | Posto: {qc.workcenter}</p>
                  
                  {qc.assayPurityPercent && (
                    <div className="flex items-center gap-3 text-[11px] font-mono pt-1 text-slate-300">
                      <span>Pureza HPLC: <strong className={qc.assayPurityPercent >= 98 ? 'text-emerald-400' : 'text-rose-400'}>{qc.assayPurityPercent}%</strong></span>
                      {qc.disintegrationTimeSec && (
                        <span>Tempo Desintegração: <strong className={qc.disintegrationTimeSec <= 600 ? 'text-emerald-400' : 'text-rose-400'}>{qc.disintegrationTimeSec}s</strong></span>
                      )}
                    </div>
                  )}

                  {qc.correctiveAction && (
                    <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50 mt-1">
                      ⚠️ {qc.correctiveAction}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {qc.result !== 'Aprovado' && (
                    <button
                      onClick={() => handleUpdateQcResult(qc.id, 'Aprovado')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      Aprovar Lote
                    </button>
                  )}
                  {qc.result !== 'Reprovado' && (
                    <button
                      onClick={() => handleUpdateQcResult(qc.id, 'Reprovado')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      Bloquear Lote
                    </button>
                  )}
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    qc.result === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-300' :
                    qc.result === 'Reprovado' ? 'bg-rose-500/20 text-rose-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {qc.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: Manutenção TPM */}
      {activeModule === 'manutencao' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Gestão de Manutenção Preventiva, Preditiva IoT & MTBF/MTTR</h3>
              <p className="text-xs text-slate-400">Indicadores de confiabilidade e agendamento de intervenções mecânicas industriais.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Disponibilidade de Ativos Industriais</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {maintenanceTasks.map((mnt) => (
              <div key={mnt.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{mnt.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">{mnt.type}</span>
                    <span className="text-xs text-slate-400 font-mono">📅 {mnt.scheduledDate}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{mnt.equipment}</h4>
                  <p className="text-xs text-slate-400 font-mono">Técnico responsável: <strong className="text-white">{mnt.technician}</strong></p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-0.5">
                    <span>MTBF (Tempo Médio Entre Falhas): <strong className="text-emerald-400">{mnt.mtbfHours}h</strong></span>
                    <span>MTTR (Tempo Médio Reparo): <strong className="text-amber-400">{mnt.mttrHours}h</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    mnt.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-300' :
                    mnt.status === 'Em Andamento' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {mnt.status}
                  </span>
                  {mnt.status !== 'Concluído' && (
                    <button
                      onClick={() => {
                        setMaintenanceTasks(prev => prev.map(m => m.id === mnt.id ? { ...m, status: 'Concluído' } : m));
                        addToast(`Ordem de serviço ${mnt.id} concluída com sucesso!`, 'success');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      Concluir O.S.
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: CRM */}
      {activeModule === 'crm' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Pipeline de Vendas & Oportunidades (CRM)</h3>
            <span className="text-xs text-slate-400 font-mono">Gestão Comercial Corporativa</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {leads.map((lead, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{lead.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Probabilidade: {lead.probability}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{lead.company}</h4>
                  <p className="text-xs text-slate-400 font-mono">Contato: <strong className="text-white">{lead.contact}</strong></p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Valor da Oportunidade</span>
                    <strong className="font-mono text-sm text-emerald-400">R$ {lead.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300">
                    {lead.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: Faturamento */}
      {activeModule === 'invoicing' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Faturamento & Cobranças SMB (Invoicing)</h3>
            <span className="text-xs text-slate-400 font-mono">Gestão de Faturas e Liquidação</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {invoices.map((inv, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{inv.id}</span>
                    <span className="text-xs text-slate-400 font-mono">Vencimento: {inv.dueDate}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Cliente: {inv.customer}</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Valor da Fatura</span>
                    <strong className="font-mono text-sm text-emerald-400">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${inv.status === 'Paga' ? 'bg-emerald-500/20 text-emerald-300' : inv.status === 'Vencida' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: Inventário WMS */}
      {activeModule === 'inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Gestão de Estoque & Armazém (Inventory WMS)</h3>
            <span className="text-xs text-slate-400 font-mono">Visibilidade Multi-Depósito</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {stocks.map((st, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{st.sku}</span>
                    <span className="text-xs text-slate-400 font-mono">📍 {st.warehouse} ({st.zone})</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{st.name}</h4>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Em Mãos</span>
                    <strong>{st.onHand.toLocaleString('pt-BR')} un</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Reservado</span>
                    <strong className="text-amber-400">{st.reserved.toLocaleString('pt-BR')} un</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Disponível</span>
                    <strong className="text-emerald-400">{st.available.toLocaleString('pt-BR')} un</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Content: Projetos & Tarefas */}
      {activeModule === 'projects' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Gestão de Projetos & Tarefas Industriais</h3>
            <span className="text-xs text-slate-400 font-mono">Acompanhamento de Marcos Regulatórios e Operacionais</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((tsk, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{tsk.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">{tsk.projectName}</span>
                    <span className="text-xs text-slate-400 font-mono">Prazo: {tsk.deadline}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{tsk.taskTitle}</h4>
                  <p className="text-xs text-slate-400 font-mono">Responsável: <strong className="text-white">{tsk.assignee}</strong></p>
                </div>
                <div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${tsk.stage === 'Concluído' ? 'bg-emerald-500/20 text-emerald-300' : tsk.stage === 'Em Andamento' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                    {tsk.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudErpSuite;
