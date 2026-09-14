import React, { useState, useMemo } from 'react';
import { 
  Package, Truck, Search, Layers, QrCode, ArrowRight, ArrowLeftRight, CheckCircle2, 
  AlertTriangle, RefreshCw, Filter, Download, BarChart2, ShieldCheck, Zap, 
  Sliders, Warehouse, MapPin, Tag, Box, Play, Check, ChevronRight, Eye
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface Shipment {
  id: string;
  code: string;
  type: 'Inbound (Push)' | 'Outbound (Pull)' | 'Cross-Dock';
  supplierOrClient: string;
  items: number;
  status: 'Recebimento' | 'Controle de Qualidade' | 'Armazenamento' | 'Concluído';
  gs1Barcode: string;
  destinationWarehouse: string;
  date: string;
}

interface InventoryItem {
  sku: string;
  name: string;
  category: 'A (Alta Rotação)' | 'B (Média Rotação)' | 'C (Baixa Rotação)';
  warehouse: string;
  location: string;
  stock: number;
  lot: string;
  serialNumber: string;
  status: 'Disponível' | 'Reservado' | 'Em Trânsito' | 'Cross-Docking';
}

interface PickingWave {
  id: string;
  type: 'Onda (Wave)' | 'Cluster' | 'Lote (Batch)' | 'Única (Single)';
  zone: string;
  ordersCount: number;
  efficiencyGain: string;
  status: 'Pendente' | 'Em Separação' | 'Embalado e Consolidado';
}

export const WarehouseManagementSystem: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  const [activeTab, setActiveTab] = useState<'overview' | 'inbound_outbound' | 'putaway' | 'inventory' | 'picking'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');

  // Initial Mock Data for WMS
  const [shipments, setShipments] = useState<Shipment[]>([
    { id: 'SHP-001', code: 'GS1-7891023451234', type: 'Inbound (Push)', supplierOrClient: 'Farme Laboratórios S.A.', items: 1250, status: 'Controle de Qualidade', gs1Barcode: '(01) 7891023451234 (10) LOTE2026A', destinationWarehouse: 'CD SP - Cajamar (01)', date: '2026-09-11 08:30' },
    { id: 'SHP-002', code: 'GS1-7891023455678', type: 'Outbound (Pull)', supplierOrClient: 'Drogarias Pacheco RJ', items: 450, status: 'Armazenamento', gs1Barcode: '(01) 7891023455678 (10) LOTE9981B', destinationWarehouse: 'CD RJ - Duque de Caxias', date: '2026-09-11 09:15' },
    { id: 'SHP-003', code: 'GS1-7891023459990', type: 'Cross-Dock', supplierOrClient: 'Natulab Farmacêutica', items: 3200, status: 'Recebimento', gs1Barcode: '(01) 7891023459990 (10) CROSS2026', destinationWarehouse: 'CD MG - Betim', date: '2026-09-11 10:00' },
  ]);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { sku: 'MAT-101', name: 'Paracetamol 500mg (Cx 50)', category: 'A (Alta Rotação)', warehouse: 'CD SP - Cajamar (01)', location: 'Corredor A - Prateleira 04', stock: 15400, lot: 'LOTE2026A', serialNumber: 'SN-998231', status: 'Disponível' },
    { sku: 'MAT-102', name: 'Dipirona Sódica 500mg', category: 'A (Alta Rotação)', warehouse: 'CD SP - Cajamar (01)', location: 'Corredor A - Prateleira 06', stock: 22100, lot: 'LOTE2026B', serialNumber: 'SN-998232', status: 'Disponível' },
    { sku: 'MAT-205', name: 'Amoxicilina 500mg Suspensão', category: 'B (Média Rotação)', warehouse: 'CD RJ - Duque de Caxias', location: 'Corredor B - Prateleira 02', stock: 4800, lot: 'LOTE9981B', serialNumber: 'SN-774102', status: 'Reservado' },
    { sku: 'MAT-309', name: 'Omeprazol 20mg Cápsulas', category: 'A (Alta Rotação)', warehouse: 'CD MG - Betim', location: 'Corredor C - Prateleira 01', stock: 18900, lot: 'LOTE5543C', serialNumber: 'SN-112093', status: 'Cross-Docking' },
    { sku: 'MAT-412', name: 'Vitamina C 1g Efervescente', category: 'C (Baixa Rotação)', warehouse: 'CD SP - Cajamar (01)', location: 'Corredor D - Prateleira 09', stock: 1250, lot: 'LOTE1123D', serialNumber: 'SN-443219', status: 'Disponível' },
  ]);

  const [pickingWaves, setPickingWaves] = useState<PickingWave[]>([
    { id: 'WAV-881', type: 'Onda (Wave)', zone: 'Corredor A & B (Zona Norte)', ordersCount: 24, efficiencyGain: '+32% Produtividade', status: 'Em Separação' },
    { id: 'WAV-882', type: 'Cluster', zone: 'Zona Farmacêutica Pequena (Rack 2)', ordersCount: 45, efficiencyGain: '+38% Velocidade', status: 'Pendente' },
    { id: 'WAV-883', type: 'Lote (Batch)', zone: 'Zona Cross-Docking Sul', ordersCount: 12, efficiencyGain: '+25% Economia Distância', status: 'Embalado e Consolidado' },
  ]);

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWarehouse = selectedWarehouseFilter === 'ALL' || item.warehouse === selectedWarehouseFilter;
      return matchesSearch && matchesWarehouse;
    });
  }, [inventoryItems, searchTerm, selectedWarehouseFilter]);

  const handleCreateShipment = () => {
    const newShip: Shipment = {
      id: `SHP-00${shipments.length + 1}`,
      code: `GS1-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      type: Math.random() > 0.5 ? 'Inbound (Push)' : 'Outbound (Pull)',
      supplierOrClient: 'Parceiro Logístico ' + (shipments.length + 1),
      items: Math.floor(200 + Math.random() * 2000),
      status: 'Recebimento',
      gs1Barcode: `(01) 78910234${Math.floor(10000 + Math.random() * 90000)} (10) LOTE2026X`,
      destinationWarehouse: 'CD SP - Cajamar (01)',
      date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setShipments([newShip, ...shipments]);
    addToast('Nova remessa GS-1 cadastrada com sucesso!', 'success');
  };

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-slate-900'} pb-12`}>
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border-slate-800' : 'bg-gradient-to-r from-purple-50 via-white to-purple-50 border-purple-200'} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              WMS Cloud Enterprise v3.4
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ⚡ Otimização 30%+ Ativa
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Sistema Moderno de Armazém & Inventário (WMS)</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Reduza a falta de estoque, acelere operações, otimize rotas com regras Push/Pull, códigos GS-1 e estratégias avançadas de separação (Wave, Cluster, Lote).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateShipment}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Truck className="w-4 h-4" /> Nova Remessa GS-1
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Visibilidade em Tempo Real</p>
            <h3 className="text-xl font-black mt-1 text-purple-400">99.8% Acurácia</h3>
            <p className="text-[10px] text-emerald-400 mt-1">✓ Sem divergências de estoque</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Eficiência de Separação</p>
            <h3 className="text-xl font-black mt-1 text-emerald-400">+32.5% Itens/Hora</h3>
            <p className="text-[10px] text-slate-400 mt-1">Estratégias Wave & Cluster</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distância Percorrida</p>
            <h3 className="text-xl font-black mt-1 text-indigo-400">-41% Redução</h3>
            <p className="text-[10px] text-indigo-400 mt-1">Otimização de rotas ABC</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Remessas GS-1 Ativas</p>
            <h3 className="text-xl font-black mt-1 text-amber-400">{shipments.length} Lotes</h3>
            <p className="text-[10px] text-amber-400 mt-1">Push/Pull automatizado</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          📊 Visão Geral & Otimização
        </button>
        <button
          onClick={() => setActiveTab('inbound_outbound')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'inbound_outbound' ? 'bg-purple-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          🚚 Inbound & Outbound (GS-1 & Push/Pull)
        </button>
        <button
          onClick={() => setActiveTab('putaway')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'putaway' ? 'bg-purple-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          📦 Putaway & Análise ABC
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'inventory' ? 'bg-purple-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          ⚡ Pesquisa Rápida de Inventário
        </button>
        <button
          onClick={() => setActiveTab('picking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'picking' ? 'bg-purple-600 text-white shadow-md' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          🎯 Separação (Wave, Cluster, Lote)
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Arquitetura de Fluxo de Armazém</h3>
                <p className="text-[11px] text-slate-400">Regras automáticas de Push e Pull integradas com código de barras GS-1.</p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/20 border border-slate-800 flex items-center justify-between">
                <span>Recebimento & Cais de Descarga</span>
                <span className="text-emerald-400 font-bold">Ativo (Cross-Docking Ready)</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-slate-800 flex items-center justify-between">
                <span>Controle de Qualidade (WMS Inspector)</span>
                <span className="text-purple-400 font-bold">Inspeção Automática Lote</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-slate-800 flex items-center justify-between">
                <span>Putaway Inteligente por Curva ABC</span>
                <span className="text-indigo-400 font-bold">Otimizado (-41% Distância)</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-4 shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Estratégias de Separação (Picking Avançado)</h3>
                <p className="text-[11px] text-slate-400">Selecione e embale 30% a mais com a mesma equipe.</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <strong>Separação em Onda (Wave)</strong>
                  <p className="text-[10px] text-slate-400">Pedidos por corredor ou área, reagrupados na zona de embalagem.</p>
                </div>
                <span className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] font-bold">Ideal Grandes CDs</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <strong>Separação em Cluster</strong>
                  <p className="text-[10px] text-slate-400">Colete vários pedidos em uma única viagem para itens pequenos.</p>
                </div>
                <span className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">Alta Velocidade</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <strong>Separação em Lote (Batch)</strong>
                  <p className="text-[10px] text-slate-400">Reagrupe pedidos idênticos em uma única separação consolidada.</p>
                </div>
                <span className="px-2 py-1 bg-amber-600 text-white rounded text-[10px] font-bold">Eficiência Máxima</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Inbound & Outbound */}
      {activeTab === 'inbound_outbound' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Controle de Remessas (Inbound / Outbound com GS-1)</h3>
            <span className="text-xs text-slate-400 font-mono">Total: {shipments.length} remessas registradas</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {shipments.map((shp) => (
              <div key={shp.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{shp.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shp.type.includes('Inbound') ? 'bg-emerald-500/20 text-emerald-300' : shp.type.includes('Outbound') ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {shp.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{shp.date}</span>
                  </div>
                  <h4 className="font-bold text-sm">{shp.supplierOrClient}</h4>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 text-purple-400" /> {shp.gs1Barcode} | Destino: {shp.destinationWarehouse}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Volume de Itens</span>
                    <strong className="font-mono text-sm">{shp.items.toLocaleString('pt-BR')} un</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold">
                    {shp.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Putaway & ABC Analysis */}
      {activeTab === 'putaway' && (
        <div className="space-y-6 animate-in fade-in">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} space-y-3`}>
            <h3 className="font-bold text-sm">Estratégias de Armazenamento & Análise ABC</h3>
            <p className="text-xs text-slate-400">
              O sistema calcula automaticamente a posição ideal de armazenamento baseada no giro (Curva ABC) e cross-docking para minimizar o número de peças movimentadas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">Classe A (Alta Rotação)</span>
                <p className="text-xs text-slate-300">Alocados próximo aos portões de expedição e docas (Corredor A). Reduz em 50% o tempo de transbordo.</p>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded block text-center">70% do Giro do Armazém</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Classe B (Média Rotação)</span>
                <p className="text-xs text-slate-300">Alocados nos corredores intermediários (Corredor B e C). Equilíbrio perfeito entre acesso e densidade.</p>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded block text-center">20% do Giro do Armazém</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase">Classe C (Baixa Rotação)</span>
                <p className="text-xs text-slate-300">Alocados nas prateleiras superiores e fundos do armazém (Corredor D). Maximiza espaço cúbico.</p>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded block text-center">10% do Giro do Armazém</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Real-Time Inventory Fast Search */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Pesquisa extremamente rápida por SKU, nome, lote ou número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'}`}
              />
            </div>
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="ALL">Todos os Depósitos (CDs)</option>
              <option value="CD SP - Cajamar (01)">CD SP - Cajamar (01)</option>
              <option value="CD RJ - Duque de Caxias">CD RJ - Duque de Caxias</option>
              <option value="CD MG - Betim">CD MG - Betim</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredInventory.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{item.sku}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">📍 {item.warehouse} ({item.location})</span>
                  </div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <p className="text-[11px] font-mono text-slate-400">
                    Lote: <strong className="text-white">{item.lot}</strong> | Série: <strong className="text-white">{item.serialNumber}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Estoque Disponível</span>
                    <strong className="font-mono text-sm text-emerald-400">{item.stock.toLocaleString('pt-BR')} un</strong>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${item.status === 'Disponível' ? 'bg-emerald-500/20 text-emerald-300' : item.status === 'Reservado' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Picking Strategies */}
      {activeTab === 'picking' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Ondas de Separação & Estratégias de Reserva</h3>
              <p className="text-xs text-slate-400">Minimize movimentações e aumente a produtividade da equipe em até 30%.</p>
            </div>
            <button
              onClick={() => {
                const newWave: PickingWave = {
                  id: `WAV-${Math.floor(890 + Math.random() * 100)}`,
                  type: Math.random() > 0.5 ? 'Onda (Wave)' : 'Cluster',
                  zone: 'Zona Automática Sul',
                  ordersCount: Math.floor(15 + Math.random() * 30),
                  efficiencyGain: '+35% Produtividade',
                  status: 'Pendente'
                };
                setPickingWaves([newWave, ...pickingWaves]);
                addToast('Nova onda de separação acionada com sucesso!', 'success');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
            >
              ⚡ Acionar Nova Onda
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pickingWaves.map((wave) => (
              <div key={wave.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 text-xs">{wave.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {wave.type}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">{wave.efficiencyGain}</span>
                  </div>
                  <h4 className="font-bold text-sm">Área de Separação: {wave.zone}</h4>
                  <p className="text-xs text-slate-400">
                    Volume: <strong className="text-white">{wave.ordersCount} pedidos</strong> consolidados para expedição rápida.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${wave.status === 'Em Separação' ? 'bg-amber-500/20 text-amber-300' : wave.status === 'Pendente' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {wave.status}
                  </span>
                  <button
                    onClick={() => {
                      setPickingWaves(pickingWaves.map(w => w.id === wave.id ? { ...w, status: 'Embalado e Consolidado' } : w));
                      addToast(`Onda ${wave.id} consolidada e embalada com sucesso!`, 'success');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow"
                  >
                    Concluir & Embalar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
