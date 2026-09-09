import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calendar,
  BarChart3,
  Table as TableIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MousePointer2,
  FileText,
  AlertTriangle,
  PieChart,
  Sliders
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';
import XLSX from 'xlsx-js-style';
import { safeLocalStorageSet } from '../utils/storageUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { SAPMovementType, MaterialMovement } from '../types/audit';
import MappingConfig from '../components/MappingConfig';
import { MB51StockReconciliationSummary } from '../components/MB51StockReconciliationSummary';
import { AuditChecklist } from '../components/AuditChecklist';

const MovementsPage: React.FC = () => {
  const { 
    darkMode, 
    movementTypes, 
    setMovementTypes, 
    movements, 
    setMovements,
    addToast,
    movementFiles,
    setMovementFiles,
    initialStockFiles,
    setInitialStockFiles,
    finalStockFiles,
    setFinalStockFiles,
    initialStockPositions,
    finalStockPositions,
    initialStockHeaders,
    finalStockHeaders,
    selectedPlant,
    setSelectedPlant,
    movementColumnMapping,
    setMovementColumnMapping,
    isProcessingMovements,
    movementProcessingStatus,
    movementProgressPercent,
    processarMovimentacoes
  } = useAudit();

  const [activeTab, setActiveTab] = useState<'list' | 'types' | 'upload' | 'reconciliation' | 'discrepancies' | 'abc'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [discFilterType, setDiscFilterType] = useState<'all' | 'divergent' | 'match'>('all');
  const [discSearchTerm, setDiscSearchTerm] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newType, setNewType] = useState<Partial<SAPMovementType>>({ direction: 'Entrada', active: true });
  const [showAddType, setShowAddType] = useState(false);
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [showInitialMappingConfig, setShowInitialMappingConfig] = useState(false);
  const [showFinalMappingConfig, setShowFinalMappingConfig] = useState(false);

  const [filterDirection, setFilterDirection] = useState<'all' | 'Entrada' | 'Saída'>('all');
  const [filterMovementType, setFilterMovementType] = useState<string>('all');
  const [filterStorageLocation, setFilterStorageLocation] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [includeEmptyStorage, setIncludeEmptyStorage] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMovementDetail, setSelectedMovementDetail] = useState<MaterialMovement | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState<boolean>(false);
  const [showDiscrepanciesModal, setShowDiscrepanciesModal] = useState<boolean>(false);
  const [activeDiscTab, setActiveDiscTab] = useState<'missingMovements' | 'missingStock' | 'divergent'>('missingMovements');
  const [selectedReconciliationItem, setSelectedReconciliationItem] = useState<any | null>(null);
  const [selectedReconCategoryFilter, setSelectedReconCategoryFilter] = useState<string | string[] | null>(null);

  // Curva ABC State & Logic
  const [abcFilterCurve, setAbcFilterCurve] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [abcSearchTerm, setAbcSearchTerm] = useState('');



  const handleExportAbcExcel = () => {
    const wsData = [
      ['RELATÓRIO DE CLASSIFICAÇÃO CURVA ABC - MB51'],
      ['Material', 'Descrição', 'Volume Total (Entrada + Saída)', '% Acumulado', 'Curva ABC', 'Estoque Físico SAP'],
      ...abcData.map(item => [
        item.material,
        item.description,
        item.volume,
        `${item.cumulativePct.toFixed(2)}%`,
        item.curve,
        item.finalStockReal
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Curva ABC');
    XLSX.writeFile(wb, 'curva_abc_estoque.xlsx');
  };

  const typesMap = useMemo(() => {
    return movementTypes.reduce((acc, type) => {
      acc[type.code] = type;
      return acc;
    }, {} as Record<string, SAPMovementType>);
  }, [movementTypes]);

  const selectedItemMovements = useMemo(() => {
    if (!selectedReconciliationItem) return [];
    const matKey = String(selectedReconciliationItem.material || '').trim().replace(/^0+/, '');
    const matMovements = movements.filter(m => String(m.material || '').trim().replace(/^0+/, '') === matKey);

    if (selectedReconCategoryFilter !== null && selectedReconCategoryFilter !== undefined) {
      const allowedCategories = Array.isArray(selectedReconCategoryFilter) 
        ? selectedReconCategoryFilter 
        : [selectedReconCategoryFilter];

      if (allowedCategories.length === 0) return matMovements;

      return matMovements.filter(m => {
        const type = typesMap[m.movementType];
        if (!type || !type.category) return false;
        const isTransfer = type.category === 'TRANSFER' || type.direction === 'Transferência' || m.movementType.startsWith('3') || ['301', '303', '305', '309', '311', '312', '321', '322', '323', '325', '411'].includes(m.movementType);
        const qty = Number(m.quantity) || 0;
        if (isTransfer && qty === 0) return false;
        let cat = type.category;
        if (isTransfer) {
          cat = qty > 0 ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT';
        } else if (cat === 'ADJUSTMENT_ENTRY' && qty < 0) {
          cat = 'ADJUSTMENT_EXIT';
        }
        return allowedCategories.includes(cat);
      });
    }

    return matMovements;
  }, [selectedReconciliationItem, movements, selectedReconCategoryFilter, typesMap]);

  const selectedItemLots = useMemo(() => {
    if (!selectedReconciliationItem) return [];
    const matKey = String(selectedReconciliationItem.material || '').trim().replace(/^0+/, '');
    const lotsSet = new Set<string>();
    
    selectedItemMovements.forEach(m => {
      if (m.batch && String(m.batch).trim() !== '') {
        lotsSet.add(String(m.batch).trim());
      }
    });

    initialStockPositions.forEach(p => {
      if (String(p.material || '').trim().replace(/^0+/, '') === matKey && (p as any).batch && String((p as any).batch).trim() !== '') {
        lotsSet.add(String((p as any).batch).trim());
      }
    });

    finalStockPositions.forEach(p => {
      if (String(p.material || '').trim().replace(/^0+/, '') === matKey && (p as any).batch && String((p as any).batch).trim() !== '') {
        lotsSet.add(String((p as any).batch).trim());
      }
    });

    return Array.from(lotsSet);
  }, [selectedReconciliationItem, selectedItemMovements, initialStockPositions, finalStockPositions]);

  // Reconciliation Advanced Filters State
  const [reconFilterStatus, setReconFilterStatus] = useState<string>('all');
  const [reconMinDifference, setReconMinDifference] = useState<string>('');
  const [reconFilterHasInitial, setReconFilterHasInitial] = useState<boolean>(false);
  const [reconFilterHasMovement, setReconFilterHasMovement] = useState<boolean>(false);
  const [showReconAdvancedFilters, setShowReconAdvancedFilters] = useState<boolean>(true);

  // Table Column Filters
  const [colDocFilter, setColDocFilter] = useState('');
  const [colDateFilter, setColDateFilter] = useState('');
  const [colTypeFilter, setColTypeFilter] = useState('');
  const [colMaterialFilter, setColMaterialFilter] = useState('');
  const [colPlantFilter, setColPlantFilter] = useState('');

  const availableStorageLocations = useMemo(() => {
    const setLocs = new Set<string>();
    movements.forEach(m => { if (m.storageLocation) setLocs.add(m.storageLocation); });
    return Array.from(setLocs).sort();
  }, [movements]);

  const availableMovementCodes = useMemo(() => {
    const setCodes = new Set<string>();
    movements.forEach(m => { if (m.movementType) setCodes.add(m.movementType); });
    return Array.from(setCodes).sort();
  }, [movements]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    movementTypes.forEach(t => { if (t.category) cats.add(t.category); });
    return Array.from(cats);
  }, [movementTypes]);

  const categoryDisplayNames: Record<string, string> = {
    PRODUCTION_PURCHASE: 'Produção / Compras',
    SALE: 'Venda',
    RETURN_ENTRY_SALE: 'Devolução Entrada',
    RETURN_EXIT_PURCHASE: 'Devolução Compras',
    BONIFICATION: 'Bonificação',
    OTHER_EXIT: 'Outras Saídas',
    ADJUSTMENT_ENTRY: 'Ajuste Entrada',
    ADJUSTMENT_EXIT: 'Ajuste Saída',
    LOSS: 'Perda',
    REQUISITION: 'Requisição',
    INITIAL_STOCK: 'Estoque Inicial',
    TRANSFER: 'Transferência'
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageRecon, setCurrentPageRecon] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);

  // Drag to Scroll Hook
  const listTableRef = useRef<HTMLDivElement>(null);
  const reconciliationTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupDragScroll = (ref: React.RefObject<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      let isDown = false;
      let startX: number;
      let startY: number;
      let scrollLeft: number;
      let scrollTop: number;

      const onMouseDown = (e: MouseEvent) => {
        // Only trigger if clicking directly on table container or cells, not interactive elements
        const target = e.target as HTMLElement;
        if (['BUTTON', 'INPUT', 'SELECT', 'A', 'LABEL'].includes(target.tagName) || target.closest('button, input, select, a, label')) return;
        
        isDown = true;
        el.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = el.scrollLeft;
        scrollTop = el.scrollTop;
      };

      const onMouseLeave = () => {
        if (!isDown) return;
        isDown = false;
        el.style.cursor = 'grab';
      };

      const onMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        el.style.cursor = 'grab';
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        const walkX = x - startX;
        const walkY = y - startY;
        el.scrollLeft = scrollLeft - walkX;
        el.scrollTop = scrollTop - walkY;
      };

      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mousemove', onMouseMove);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mousemove', onMouseMove);
      };
    };

    const cleanupList = setupDragScroll(listTableRef);
    const cleanupRecon = setupDragScroll(reconciliationTableRef);

    return () => {
      cleanupList?.();
      cleanupRecon?.();
    };
  }, [activeTab]); // Re-setup when tabs change since refs might change visibility

  // Analytics Logic: Monthly Movement
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string, entrada: number, saida: number, total: number }> = {};
    
    movements.forEach(m => {
      const date = new Date(m.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!data[monthKey]) {
        data[monthKey] = { month: monthName, entrada: 0, saida: 0, total: 0 };
      }
      
      const type = movementTypes.find(t => t.code === m.movementType);
      if (!type || !type.active || String(m.movementType).toUpperCase() === 'Z15') return;
      if (type) {
        if (type.direction === 'Entrada') {
          data[monthKey].entrada += m.quantity;
          data[monthKey].total += m.quantity;
        } else if (type.direction === 'Saída') {
          data[monthKey].saida += m.quantity;
          data[monthKey].total -= m.quantity;
        }
      }
    });

    return Object.values(data).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements, movementTypes]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const hasEmptyLoc = !m.storageLocation || String(m.storageLocation).trim() === '' || String(m.storageLocation).trim() === '0';
      if (!includeEmptyStorage && hasEmptyLoc) return false;

      const matchesSearch = 
        m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.docNumber.includes(searchTerm);

      const type = movementTypes.find(t => t.code === m.movementType);
      const isTransfer = (type?.category === 'TRANSFER') || type?.direction === 'Transferência' || m.movementType.startsWith('3') || ['301', '303', '305', '309', '311', '312', '321', '322', '323', '325', '411'].includes(m.movementType);
      const qty = Number(m.quantity) || 0;
      if (isTransfer && qty === 0) return false;

      let effectiveCategory = isTransfer 
        ? (qty > 0 ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT')
        : type?.category;

      if (effectiveCategory === 'ADJUSTMENT_ENTRY' && qty < 0) {
        effectiveCategory = 'ADJUSTMENT_EXIT';
      }

      const matchesDirection = filterDirection === 'all' || (type && type.direction === filterDirection);
      const matchesType = filterMovementType === 'all' || m.movementType === filterMovementType;
      const matchesLoc = filterStorageLocation === 'all' || m.storageLocation === filterStorageLocation;
      
      const matchesCategory = selectedCategories.length === 0 || (() => {
        if (!effectiveCategory) return false;
        return selectedCategories.includes(effectiveCategory);
      })();

      let matchesDate = true;
      if (filterDateStart || filterDateEnd) {
        const mDate = new Date(m.date).getTime();
        if (filterDateStart && mDate < new Date(filterDateStart).getTime()) matchesDate = false;
        if (filterDateEnd && mDate > new Date(filterDateEnd + 'T23:59:59').getTime()) matchesDate = false;
      }

      const matchesColDoc = !colDocFilter || m.docNumber.toLowerCase().includes(colDocFilter.toLowerCase());
      const matchesColDate = !colDateFilter || m.date.toLowerCase().includes(colDateFilter.toLowerCase());
      const matchesColType = !colTypeFilter || m.movementType.toLowerCase().includes(colTypeFilter.toLowerCase());
      const matchesColMaterial = !colMaterialFilter || m.material.toLowerCase().includes(colMaterialFilter.toLowerCase()) || m.description.toLowerCase().includes(colMaterialFilter.toLowerCase());
      const matchesColPlant = !colPlantFilter || m.plant.toLowerCase().includes(colPlantFilter.toLowerCase()) || (m.storageLocation && m.storageLocation.toLowerCase().includes(colPlantFilter.toLowerCase()));

      return matchesSearch && matchesDirection && matchesType && matchesLoc && matchesCategory && matchesDate &&
             matchesColDoc && matchesColDate && matchesColType && matchesColMaterial && matchesColPlant;
    });
  }, [movements, searchTerm, filterDirection, filterMovementType, filterStorageLocation, selectedCategories, filterDateStart, filterDateEnd, movementTypes, colDocFilter, colDateFilter, colTypeFilter, colMaterialFilter, colPlantFilter, includeEmptyStorage]);

  const handleUpdateType = (code: string, updates: Partial<SAPMovementType>) => {
    setMovementTypes(movementTypes.map(t => t.code === code ? { ...t, ...updates } : t));
    setEditingType(null);
    addToast('Tipo de movimentação atualizado!', 'success');
  };

  const handleAddType = () => {
    if (!newType.code || !newType.description) {
      addToast('Preencha todos os campos!', 'error');
      return;
    }
    if (movementTypes.find(t => t.code === newType.code)) {
      addToast('Código já existe!', 'error');
      return;
    }
    setMovementTypes([...movementTypes, newType as SAPMovementType]);
    setShowAddType(false);
    setNewType({ direction: 'Entrada', active: true });
    addToast('Novo tipo de movimentação adicionado!', 'success');
  };

  const handleDeleteType = (code: string) => {
    setMovementTypes(movementTypes.filter(t => t.code !== code));
    addToast('Tipo de movimentação removido!', 'info');
  };

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMovements.slice(start, start + rowsPerPage);
  }, [filteredMovements, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1); // Reset to first page on search
    setCurrentPageRecon(1);
  };

  const reconciliationData = useMemo(() => {
    const materials: Record<string, any> = {};
    
    // Regra 1: Sanitização estrita
    const isMaterialValido = (material: string | undefined | null) => {
      if (!material) return false;
      const matStr = String(material).trim().toLowerCase();
      if (matStr === '' || matStr.includes('total')) return false;
      if (matStr === '1001' || matStr === '1005') return false;
      if (matStr === '13400000' || matStr.startsWith('1340')) return false;
      return true;
    };

    // Regra 2: Chave única do material
    const getMatKey = (m: string | undefined | null) => String(m || '').trim().replace(/^0+/, '');
    
    const getBase = (material: string, description: string) => ({
      material,
      description: description || '',
      initial: 0, prod: 0, dev: 0, adjIn: 0, adjOut: 0, otherOut: 0, bonif: 0, sale: 0, loss: 0, req: 0, finalStockReal: 0
    });

    // 1. Processa Estoque Inicial
    initialStockPositions.forEach(p => {
      if (!isMaterialValido(p.material)) return;
      const materialKey = getMatKey(p.material);
      if (!materials[materialKey]) materials[materialKey] = getBase(materialKey, p.description);
      materials[materialKey].initial += Number(p.quantity) || 0;
      if (!materials[materialKey].description && p.description) materials[materialKey].description = p.description;
    });

    // 2. Processa Estoque Final
    finalStockPositions.forEach(p => {
      if (!isMaterialValido(p.material)) return;
      const materialKey = getMatKey(p.material);
      if (!materials[materialKey]) materials[materialKey] = getBase(materialKey, p.description);
      materials[materialKey].finalStockReal += Number(p.quantity) || 0;
      if (!materials[materialKey].description && p.description) materials[materialKey].description = p.description;
    });

    // 3. Processa Movimentações MB51
    movements.forEach(m => {
      if (!isMaterialValido(m.material)) return;

      const hasEmptyLoc = !m.storageLocation || String(m.storageLocation).trim() === '' || String(m.storageLocation).trim() === '0';
      if (!includeEmptyStorage && hasEmptyLoc) return;

      const type = typesMap[m.movementType];
      if (!type || !type.active || String(m.movementType).toUpperCase() === 'Z15') return;
      const matchesDirection = filterDirection === 'all' || (type && type.direction === filterDirection);
      const matchesType = filterMovementType === 'all' || m.movementType === filterMovementType;
      const matchesLoc = filterStorageLocation === 'all' || m.storageLocation === filterStorageLocation;
      const matchesCategory = selectedCategories.length === 0 || (() => {
        if (!type || !type.category) return false;
        return selectedCategories.includes(type.category);
      })();

      let matchesDate = true;
      if (filterDateStart || filterDateEnd) {
        const mDate = new Date(m.date).getTime();
        if (filterDateStart && mDate < new Date(filterDateStart).getTime()) matchesDate = false;
        if (filterDateEnd && mDate > new Date(filterDateEnd + 'T23:59:59').getTime()) matchesDate = false;
      }

      if (!matchesDirection || !matchesType || !matchesLoc || !matchesCategory || !matchesDate) {
        return;
      }

      const materialKey = getMatKey(m.material);
      if (!materials[materialKey]) materials[materialKey] = getBase(materialKey, m.description);
      if (!materials[materialKey].description && m.description) materials[materialKey].description = m.description;

      if (type) {
        let category = type.category;
        const isTransfer = category === 'TRANSFER' || type?.direction === 'Transferência' || m.movementType.startsWith('3') || ['301', '303', '305', '309', '311', '312', '321', '322', '323', '325', '411'].includes(m.movementType);
        const qty = Number(m.quantity) || 0;
        if (isTransfer && qty === 0) return;
        let isReversal = false;

        // Categorização Dinâmica para Transferências com base no sinal da quantidade
        if (isTransfer) {
          category = qty > 0 ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT';
          isReversal = false; 
        } else {
          if (category === 'ADJUSTMENT_ENTRY' && qty < 0) {
            category = 'ADJUSTMENT_EXIT';
          }
          if (category) {
            const isEntradaCat = ['PRODUCTION_PURCHASE', 'RETURN_ENTRY_SALE', 'RETURN_EXIT_PURCHASE', 'ADJUSTMENT_ENTRY', 'INITIAL_STOCK'].includes(category);
            
            // MÁGICA: Define se o movimento é um estorno comparando a Categoria vs Direção Configuradas
            if (isEntradaCat) {
              isReversal = type.direction === 'Saída'; // Ex: Entrada com direção de saída = Estorno
            } else {
              isReversal = type.direction === 'Entrada'; // Ex: Venda com direção de entrada = Estorno
            }
          }
        }

        if (category) {
          // Força o valor absoluto (sempre positivo). O sinal será ditado APENAS pela regra de estorno.
          const absQty = Math.abs(Number(m.quantity) || 0);
          
          // Se for estorno, subtrai. Se for fluxo normal, soma (mantendo a tabela visualmente positiva).
          const impact = isReversal ? -absQty : absQty;

          const isEntradaCat = ['PRODUCTION_PURCHASE', 'RETURN_ENTRY_SALE', 'RETURN_EXIT_PURCHASE', 'ADJUSTMENT_ENTRY', 'INITIAL_STOCK'].includes(category);
          
          if (isEntradaCat) {
            switch (category) {
              case 'INITIAL_STOCK': materials[materialKey].initial += impact; break;
              case 'PRODUCTION_PURCHASE': materials[materialKey].prod += impact; break;
              case 'RETURN_ENTRY_SALE':
              case 'RETURN_EXIT_PURCHASE': materials[materialKey].dev += impact; break;
              case 'ADJUSTMENT_ENTRY': materials[materialKey].adjIn += impact; break;
            }
          } else {
            switch (category) {
              case 'ADJUSTMENT_EXIT': materials[materialKey].adjOut += impact; break;
              case 'OTHER_EXIT': materials[materialKey].otherOut += impact; break;
              case 'BONIFICATION': materials[materialKey].bonif += impact; break;
              case 'SALE': materials[materialKey].sale += impact; break;
              case 'LOSS': materials[materialKey].loss += impact; break;
              case 'REQUISITION': materials[materialKey].req += impact; break;
            }
          }
        }
      }
    });

    // 4. Consolida Resultados e Aplica Filtro
    const searchLower = String(searchTerm || '').toLowerCase();

    return Object.values(materials).map((m: any) => {
      const prod = Number(m.prod) || 0;
      const dev = Number(m.dev) || 0;
      const adjIn = Number(m.adjIn) || 0;
      
      const adjOut = Number(m.adjOut) || 0;
      const otherOut = Number(m.otherOut) || 0;
      const bonif = Number(m.bonif) || 0;
      const sale = Number(m.sale) || 0;
      const loss = Number(m.loss) || 0;
      const req = Number(m.req) || 0;

      const totalInputsPeriod = prod + dev + adjIn;
      const totalOut = adjOut + otherOut + bonif + sale + loss + req;
      
      const initial = Number(m.initial) || 0;
      const finalStockReal = Number(m.finalStockReal) || 0;
      
      const totalInVal = initial + totalInputsPeriod;
      const finalSubtotal = totalInVal - totalOut; 
      const difference = finalSubtotal - finalStockReal;
      
      return { 
        ...m, 
        prod,
        dev,
        adjIn,
        adjOut,
        otherOut,
        bonif,
        sale,
        loss,
        req,
        totalIn: totalInVal, 
        totalOut, 
        subtotal: finalSubtotal, 
        difference 
      };
    }).filter((m: any) => {
      const matchSearch = !searchLower || String(m.material || '').toLowerCase().includes(searchLower) || String(m.description || '').toLowerCase().includes(searchLower);
      if (!matchSearch) return false;

      if (reconFilterStatus === 'divergent' && Math.abs(m.difference) <= 0.01) return false;
      if (reconFilterStatus === 'ok' && Math.abs(m.difference) > 0.01) return false;

      if (reconFilterHasInitial && Number(m.initial) <= 0) return false;
      if (reconFilterHasMovement && (Number(m.totalIn) === 0 && Number(m.totalOut) === 0)) return false;

      if (reconMinDifference && Math.abs(m.difference) < Number(reconMinDifference)) return false;

      return true;
    });
  }, [movements, movementTypes, searchTerm, initialStockPositions, finalStockPositions, reconFilterStatus, reconMinDifference, reconFilterHasInitial, reconFilterHasMovement, filterDirection, filterMovementType, filterStorageLocation, selectedCategories, filterDateStart, filterDateEnd, includeEmptyStorage]);

  // Totais Gerais para a listagem de conciliação (soma todas as colunas no final)
  const reconciliationTotals = useMemo(() => {
    return reconciliationData.reduce((acc, m) => {
      acc.initial += m.initial || 0;
      acc.prod += m.prod || 0;
      acc.dev += m.dev || 0;
      acc.adjIn += m.adjIn || 0;
      acc.totalIn += m.totalIn || 0;
      acc.adjOut += m.adjOut || 0;
      acc.otherOut += m.otherOut || 0;
      acc.bonif += m.bonif || 0;
      acc.sale += m.sale || 0;
      acc.loss += m.loss || 0;
      acc.req += m.req || 0;
      acc.totalOut += m.totalOut || 0;
      acc.subtotal += m.subtotal || 0;
      acc.finalStockReal += m.finalStockReal || 0;
      acc.difference += m.difference || 0;
      return acc;
    }, {
      initial: 0, prod: 0, dev: 0, adjIn: 0, totalIn: 0,
      adjOut: 0, otherOut: 0, bonif: 0, sale: 0, loss: 0, req: 0, totalOut: 0,
      subtotal: 0, finalStockReal: 0, difference: 0
    });
  }, [reconciliationData]);

  const missingMovementsItems = useMemo(() => {
    return reconciliationData.filter(m => (m.initial > 0 || m.finalStockReal > 0) && m.totalIn === 0 && m.totalOut === 0);
  }, [reconciliationData]);

  const missingStockItems = useMemo(() => {
    return reconciliationData.filter(m => (m.totalIn > 0 || m.totalOut > 0) && m.initial === 0 && m.finalStockReal === 0);
  }, [reconciliationData]);

  const divergentItems = useMemo(() => {
    return reconciliationData.filter(m => Math.abs(m.difference) > 0.01);
  }, [reconciliationData]);

  const abcData = useMemo(() => {
    const itemsWithVolume = reconciliationData.map(item => {
      const volume = (Number(item.totalIn) || 0) + (Number(item.totalOut) || 0);
      return { ...item, volume: volume };
    });

    itemsWithVolume.sort((a, b) => b.volume - a.volume);
    const totalGlobalVolume = itemsWithVolume.reduce((acc, curr) => acc + curr.volume, 0);

    let cumulativeVolume = 0;
    return itemsWithVolume.map((item, index) => {
      cumulativeVolume += item.volume;
      const cumulativePct = totalGlobalVolume > 0 ? (cumulativeVolume / totalGlobalVolume) * 100 : 0;
      
      let curve: 'A' | 'B' | 'C' = 'C';
      if (cumulativePct <= 80 || (itemsWithVolume.length > 0 && (index / itemsWithVolume.length) <= 0.2)) {
        curve = 'A';
      } else if (cumulativePct <= 95 || (itemsWithVolume.length > 0 && (index / itemsWithVolume.length) <= 0.5)) {
        curve = 'B';
      } else {
        curve = 'C';
      }

      return {
        ...item,
        volume: item.volume,
        cumulativePct,
        curve
      };
    });
  }, [reconciliationData]);



  const paginatedReconciliation = useMemo(() => {
    const start = (currentPageRecon - 1) * rowsPerPage;
    return reconciliationData.slice(start, start + rowsPerPage);
  }, [reconciliationData, currentPageRecon, rowsPerPage]);

  const totalPagesRecon = Math.ceil(reconciliationData.length / rowsPerPage);

  const handleExportMB51Excel = () => {
    const dataToExport = activeTab === 'list' ? filteredMovements : movements;
    if (dataToExport.length === 0) {
      addToast('Não há movimentos para exportar.', 'info');
      return;
    }

    const wb = XLSX.utils.book_new();
    const headerStyle = {
      fill: { fgColor: { rgb: "78AF32" } },
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "3F5D1A" } },
        bottom: { style: "thin", color: { rgb: "3F5D1A" } },
        left: { style: "thin", color: { rgb: "3F5D1A" } },
        right: { style: "thin", color: { rgb: "3F5D1A" } }
      }
    };

    const dataStyle = { font: { sz: 10 }, alignment: { vertical: "center" } };

    const headers = [
      "Material", "Texto Breve", "Tipo Mov", "Depósito", "Data Lanc", 
      "Lote", "Quantidade", "UM", "Valor", "Nf-e", "Pedido"
    ];

    const rows = dataToExport.map(m => [
      m.material, m.description, m.movementType, m.storageLocation, m.postingDate,
      m.batch, m.quantity, m.unit, m.value, m.reference, m.order
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Apply header style
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[cell]) ws[cell].s = headerStyle;
    }

    XLSX.utils.book_append_sheet(wb, ws, "Movimentos MB51");
    XLSX.writeFile(wb, `Movimentos_MB51_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Lista de movimentos exportada!', 'success');
  };

  const handleExportReconciliationExcel = () => {
    if (reconciliationData.length === 0) {
      addToast('Não há dados de conciliação para exportar.', 'info');
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // --- Styles Definition ---
    const headerStyle = {
      fill: { fgColor: { rgb: "78AF32" } },
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "3F5D1A" } },
        bottom: { style: "thin", color: { rgb: "3F5D1A" } },
        left: { style: "thin", color: { rgb: "3F5D1A" } },
        right: { style: "thin", color: { rgb: "3F5D1A" } }
      }
    };

    // --- NEW: SHEET 0: ESTOQUE INICIAL ---
    if (initialStockPositions.length > 0) {
      const rowsInitialRaw = initialStockPositions.map(p => p.rawData || [p.material, p.description, p.plant, p.quantity]);
      const headerList = initialStockHeaders.length > 0 ? initialStockHeaders : ["Material", "Descrição", "Centro", "Quantidade"];
      const wsInitial = XLSX.utils.aoa_to_sheet([headerList, ...rowsInitialRaw]);
      XLSX.utils.book_append_sheet(wb, wsInitial, "ESTOQUE INICIAL");
    }

    // --- NEW: SHEET 0.1: ESTOQUE FINAL ---
    if (finalStockPositions.length > 0) {
      const rowsFinalRaw = finalStockPositions.map(p => p.rawData || [p.material, p.description, p.plant, p.quantity]);
      const headerList = finalStockHeaders.length > 0 ? finalStockHeaders : ["Material", "Descrição", "Centro", "Quantidade"];
      const wsFinal = XLSX.utils.aoa_to_sheet([headerList, ...rowsFinalRaw]);
      XLSX.utils.book_append_sheet(wb, wsFinal, "ESTOQUE FINAL");
    }

    const dataStyle = {
      font: { sz: 10 },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "EEEEEE" } },
        bottom: { style: "thin", color: { rgb: "EEEEEE" } },
        left: { style: "thin", color: { rgb: "EEEEEE" } },
        right: { style: "thin", color: { rgb: "EEEEEE" } }
      }
    };

    const numberStyle = {
      ...dataStyle,
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00"
    };

    const highlightStyle = {
      ...numberStyle,
      fill: { fgColor: { rgb: "F0F9EB" } },
      font: { bold: true, sz: 10, color: { rgb: "2D5A27" } }
    };

    const diffStyle = (val: number) => ({
      ...numberStyle,
      fill: { fgColor: { rgb: Math.abs(val) > 0.01 ? "FEE2ED" : "ECFDF5" } },
      font: { bold: true, color: { rgb: Math.abs(val) > 0.01 ? "991B1B" : "065F46" } }
    });

    // --- SHEET 1: CONCILIAÇÃO (RESUMO) ---
    const headers = [
      "Material", "Descrição", "Est. Inicial (E8)", "Prod. (G8)", "Dev. (H8)", 
      "Aju. Ent (I8)", "Tot. Ent (J8)", "Aju. Saí (K8)", "Out. Saí (L8)", 
      "Bonif. (M8)", "Venda (N8)", "Perda (O8)", "Req. (P8)", "Tot. Saí (Q8)", 
      "Subtotal (R8)", "Est. Real (S8)", "Diferença (T8)"
    ];

    const rows = reconciliationData.map(m => [
      m.material, 
      m.description, 
      m.initial, m.prod, m.dev, m.adjIn, m.totalIn,
      m.adjOut, m.otherOut, m.bonif, m.sale, m.loss, m.req, m.totalOut,
      m.subtotal, m.finalStockReal, m.difference
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const rangeSummary = XLSX.utils.decode_range(wsSummary['!ref']!);

    for (let R = rangeSummary.s.r; R <= rangeSummary.e.r; ++R) {
      for (let C = rangeSummary.s.c; C <= rangeSummary.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!wsSummary[cellRef]) continue;

        if (R === 0) {
          wsSummary[cellRef].s = headerStyle;
        } else {
          const excelRow = R + 1;
          const val = wsSummary[cellRef].v;
          const isNum = typeof val === 'number';

          // Adicionar fórmulas dinâmicas
          if (C === 6) wsSummary[cellRef].f = `SUM(D${excelRow}:F${excelRow})`;
          if (C === 13) wsSummary[cellRef].f = `SUM(H${excelRow}:M${excelRow})`;
          if (C === 14) wsSummary[cellRef].f = `C${excelRow}+G${excelRow}+N${excelRow}`;
          if (C === 16) wsSummary[cellRef].f = `O${excelRow}-P${excelRow}`;

          if (isNum || wsSummary[cellRef].f) {
            if (C === 16) {
              wsSummary[cellRef].s = diffStyle(val);
            } else if ([6, 13, 14, 15].includes(C)) {
              wsSummary[cellRef].s = highlightStyle;
            } else {
              wsSummary[cellRef].s = numberStyle;
            }
          } else {
            wsSummary[cellRef].s = dataStyle;
          }
        }
      }
    }

    wsSummary['!cols'] = [
      { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "CONCILIAÇÃO");

    // --- DETAILED SHEETS ---
    const categories = [
      { name: "1_PRODUÇÃO_COMPRAS", id: 'PRODUCTION_PURCHASE' },
      { name: "2_DEVOLUÇÃO_ENTRADA", id: 'RETURN_ENTRY_SALE' },
      { name: "3_DEVOLUÇÃO_SAÍDA", id: 'RETURN_EXIT_PURCHASE' },
      { name: "AJUSTE_ENTRADA", id: 'ADJUSTMENT_ENTRY' },
      { name: "AJUSTE_SAÍDA", id: 'ADJUSTMENT_EXIT' },
      { name: "OUTRAS_SAÍDAS_SAC", id: 'OTHER_EXIT' },
      { name: "BONIFICAÇÃO", id: 'BONIFICATION' },
      { name: "VENDA", id: 'SALE' },
      { name: "PERDA", id: 'LOSS' },
      { name: "REQUISIÇÃO", id: 'REQUISITION' },
      { name: "BASE_DADOS_COMPLETO", id: 'ALL' }
    ];

    const mb51Headers = ["Material", "Texto Breve", "Tipo Mov", "Depósito", "Data Lanc", "Lote", "Quantidade", "UM", "Valor", "Nf-e"];

    categories.forEach(cat => {
      let filtered: any[] = [];
      
      if (cat.id === 'ALL') {
        filtered = movements.filter(m => {
          const type = movementTypes.find(t => t.code === m.movementType);
          const isTransfer = (type?.category === 'TRANSFER') || type?.direction === 'Transferência' || ['301', '303', '305', '309', '311', '312', '321', '323', '325', '411'].includes(m.movementType);
          if (isTransfer && Number(m.quantity) === 0) return false;
          return true;
        });
      } else {
        filtered = movements.filter(m => {
          const type = movementTypes.find(t => t.code === m.movementType);
          if (!type) return false;
          
          let mCat = type.category;
          // Dynamic logic for transfers
          const isTransfer = mCat === 'TRANSFER' || type?.direction === 'Transferência' || m.movementType.startsWith('3') || ['301', '303', '305', '309', '311', '312', '321', '322', '323', '325', '411'].includes(m.movementType);
          const qty = Number(m.quantity) || 0;
          if (isTransfer) {
            if (qty === 0) return false;
            mCat = qty > 0 ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT';
          } else if (mCat === 'ADJUSTMENT_ENTRY' && qty < 0) {
            mCat = 'ADJUSTMENT_EXIT';
          }
          
          return mCat === cat.id;
        });
      }

      if (filtered.length > 0) {
        const catRows = filtered.map(m => [
          m.material, m.description, m.movementType, m.storageLocation, m.postingDate, m.batch, m.quantity, m.unit, m.value, m.reference
        ]);
        const wsCat = XLSX.utils.aoa_to_sheet([mb51Headers, ...catRows]);
        const rangeCat = XLSX.utils.decode_range(wsCat['!ref']!);

        for (let R = rangeCat.s.r; R <= rangeCat.e.r; ++R) {
          for (let C = rangeCat.s.c; C <= rangeCat.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsCat[cellRef]) continue;

            if (R === 0) {
              wsCat[cellRef].s = headerStyle;
            } else {
              const val = wsCat[cellRef].v;
              if (typeof val === 'number') {
                if (C === 6 || C === 8) {
                  wsCat[cellRef].s = numberStyle;
                } else {
                  wsCat[cellRef].s = dataStyle;
                }
              } else {
                wsCat[cellRef].s = dataStyle;
              }
            }
          }
        }

        wsCat['!cols'] = [
          { wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCat, cat.name.substring(0, 31));
      }
    });

    XLSX.writeFile(wb, `CONCILIACAO_ESTOQUE_DETALHADA_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Excel de Conciliação Completo exportado com sucesso!', 'success');
  };

  const handleExportDiscrepanciesExcel = () => {
    try {
      const dataToExport = reconciliationData
        .filter(m => Math.abs(m.difference) > 0.01)
        .map(m => ({
          'Material': m.material,
          'Descrição': m.description,
          'Estoque Inicial': m.initial,
          'Total Entradas': m.totalIn,
          'Total Saídas': m.totalOut,
          'Estoque Calculado': m.subtotal,
          'Estoque Físico Real (SAP)': m.finalStockReal,
          'Divergência': m.difference,
          'Status': m.difference > 0 ? 'Excesso / Sobra' : 'Falta / Quebra'
        }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Divergencias_Estoque");
      XLSX.writeFile(workbook, `DIVERGENCIAS_ESTOQUE_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('Relatório de Divergências exportado com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao exportar divergências:", error);
      addToast('Erro ao exportar divergências', 'error');
    }
  };

  const goToPageRecon = (page: number) => {
    setCurrentPageRecon(Math.max(1, Math.min(page, totalPagesRecon)));
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
              <Box className="w-6 h-6" />
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Movimentações de Estoque
            </h1>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestão de movimentos MB51 e configuração de tipos de movimentação SAP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportMB51Excel}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
          >
            <Download className="w-4 h-4" /> Exportar MB51
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all shadow-lg shadow-[#8DC63F]/20">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/50 w-fit">
        {[
          { id: 'upload', label: 'Upload MB51', icon: <Download className="w-4 h-4" /> },
          { id: 'list', label: 'Movimentos', icon: <TableIcon className="w-4 h-4" /> },
          { id: 'reconciliation', label: 'Conciliação', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'abc', label: 'Curva ABC', icon: <PieChart className="w-4 h-4 text-emerald-500" /> },
          { id: 'discrepancies', label: 'Divergências de Estoque', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
          { id: 'types', label: 'Configuração de Tipos', icon: <Settings className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? (darkMode ? 'bg-slate-700 text-[#8DC63F] shadow-lg' : 'bg-white text-[#78AF32] shadow-sm') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Info Message */}
            <div className={`p-6 rounded-3xl border-2 border-[#8DC63F]/20 ${darkMode ? 'bg-[#8DC63F]/5' : 'bg-[#8DC63F]/5'} flex items-start gap-4`}>
              <div className="p-2 rounded-xl bg-[#8DC63F] text-white">
                <Box className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Layout Padrão: Guilherme Souza
                </p>
                <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Por padrão, o programa utiliza o layout SAP de movimentação de estoque de Guilherme Souza (Colunas A-G). 
                  Você pode personalizar o mapeamento das colunas caso sua planilha siga um padrão diferente.
                </p>
                <button 
                  onClick={() => setShowMappingConfig(!showMappingConfig)}
                  className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8DC63F] hover:text-[#78AF32] transition-all"
                >
                  <Settings className={`w-3 h-3 transition-transform ${showMappingConfig ? 'rotate-90' : ''}`} />
                  {showMappingConfig ? 'Ocultar Personalização' : 'Personalizar Mapeamento de Coluna'}
                </button>
              </div>
            </div>

            {/* Custom Mapping UI */}
            <AnimatePresence>
              {showMappingConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
                    {[
                      { key: 'movementType', label: 'Tipo Mov. (Ex: A=0)', icon: <ArrowUpRight className="w-3 h-3" /> },
                      { key: 'material', label: 'Material (Ex: B=1)', icon: <Box className="w-3 h-3" /> },
                      { key: 'description', label: 'Texto Breve (Ex: C=2)', icon: <Edit2 className="w-3 h-3" /> },
                      { key: 'batch', label: 'Lote (Ex: D=3)', icon: <Box className="w-3 h-3" /> },
                      { key: 'quantity', label: 'Quantidade (Ex: E=4)', icon: <Plus className="w-3 h-3" /> },
                      { key: 'storageLocation', label: 'Depósito (Ex: F=5)', icon: <ArrowDownLeft className="w-3 h-3" /> },
                      { key: 'date', label: 'Data Lanç. (Ex: G=6)', icon: <Calendar className="w-3 h-3" /> },
                      { key: 'docNumber', label: 'Doc. Material', icon: <TableIcon className="w-3 h-3" /> },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {field.icon}
                          {field.label}
                        </label>
                        <input 
                          type="number"
                          value={(movementColumnMapping as any)[field.key] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? -1 : parseInt(e.target.value);
                            const updated = { ...movementColumnMapping, [field.key]: val };
                            setMovementColumnMapping(updated);
                            safeLocalStorageSet('miniSapMovementMapping', updated);
                          }}
                          className={`w-full px-4 py-2 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#78AF32]'}`}
                        />
                      </div>
                    ))}
                    <div className="col-span-full flex justify-end">
                      <button 
                        onClick={() => {
                          const def = { movementType: 0, material: 1, description: 2, batch: 3, quantity: 4, storageLocation: 5, date: 6 };
                          setMovementColumnMapping(def);
                          safeLocalStorageSet('miniSapMovementMapping', def);
                        }}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                      >
                        Resetar para Guilherme Souza
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Plant Selection */}
              <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#8DC63F]">Seleção de Centro (Obrigatório)</h3>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione o centro para filtrar os dados das planilhas de posição de estoque.</p>
                  </div>
                  <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <button 
                      onClick={() => setSelectedPlant('1001')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlant === '1001' ? (darkMode ? 'bg-slate-700 text-[#8DC63F]' : 'bg-white text-[#78AF32] shadow-sm') : 'text-slate-500'}`}
                    >
                      1001 (LAB)
                    </button>
                    <button 
                      onClick={() => setSelectedPlant('1005')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlant === '1005' ? (darkMode ? 'bg-slate-700 text-[#8DC63F]' : 'bg-white text-[#78AF32] shadow-sm') : 'text-slate-500'}`}
                    >
                      1005 (LIFE)
                    </button>
                  </div>
                </div>
              </div>

              {/* MB51 Movements */}
              <div className={`p-8 rounded-[40px] border-4 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} text-center`}>
                <div className="max-w-md mx-auto space-y-4">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
                    <Download className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Movimentações MB51</h2>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Arquivos MB51 (.xlsx)</p>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      multiple
                      accept=".xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files) {
                          setMovementFiles(Array.from(e.target.files));
                        }
                        e.target.value = '';
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`px-6 py-3 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} text-xs font-bold`}>
                      {movementFiles.length > 0 ? `${movementFiles.length} arquivos selecionados` : 'Clique para selecionar MB51'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Positions */}
              <div className="space-y-4">
                {/* Initial Stock */}
                <div className={`p-6 rounded-[30px] border-2 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-widest">Estoque Inicial (E8)</h3>
                      <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Planilha "ESTOQUE INICIAL-Anterior"</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" multiple accept=".xlsx, .xls"
                        onChange={(e) => {
                          if (e.target.files) {
                            setInitialStockFiles(Array.from(e.target.files));
                          }
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`px-4 py-2 rounded-xl border ${initialStockFiles.length > 0 ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'} text-[10px] font-black uppercase`}>
                        {initialStockFiles.length > 0 ? 'OK' : 'Selecionar'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Stock */}
                <div className={`p-6 rounded-[30px] border-2 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-widest">Estoque Final (S8)</h3>
                      <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Planilha "ESTOQUE FINAL-MES ATUAL"</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" multiple accept=".xlsx, .xls"
                        onChange={(e) => {
                          if (e.target.files) {
                            setFinalStockFiles(Array.from(e.target.files));
                          }
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`px-4 py-2 rounded-xl border ${finalStockFiles.length > 0 ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'} text-[10px] font-black uppercase`}>
                        {finalStockFiles.length > 0 ? 'OK' : 'Selecionar'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                onClick={processarMovimentacoes}
                disabled={isProcessingMovements || (movementFiles.length === 0 && initialStockFiles.length === 0 && finalStockFiles.length === 0)}
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#8DC63F] text-white text-sm font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all shadow-xl shadow-[#8DC63F]/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingMovements ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Processando... {movementProgressPercent}%
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Iniciar Processamento Consolidado
                  </>
                )}
              </button>
            </div>

            {isProcessingMovements && (
              <div className="max-w-md mx-auto space-y-3 font-black">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#8DC63F]"
                    initial={{ width: 0 }}
                    animate={{ width: `${movementProgressPercent}%` }}
                  />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {movementProcessingStatus}
                </p>
              </div>
            )}
            
            {/* MB51 vs Stock Reconciliation & Missing Movements Summary */}
            <div className="space-y-6 pt-4">
              <AuditChecklist darkMode={darkMode} />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight">Resumo e Cruzamento de Estoque (MB51 vs Estoques)</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-100 text-[#78AF32]'}`}>
                  Análise Cruzada Ativa
                </span>
              </div>
              <MB51StockReconciliationSummary 
                movements={movements}
                initialStockPositions={initialStockPositions}
                finalStockPositions={finalStockPositions}
                movementTypes={movementTypes}
                darkMode={darkMode}
              />
            </div>

            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-[#8DC63F]" />
                Instruções de Importação
              </h3>
              <ul className={`text-xs space-y-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  O arquivo deve ser extraído diretamente do SAP através da transação MB51.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  Não altere os nomes das colunas originais para garantir o mapeamento automático.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  Você pode subir múltiplos arquivos de períodos diferentes ao mesmo tempo.
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search and Advanced Filters */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    type="text"
                    placeholder="Pesquisar por material, descrição ou documento..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${showAdvancedFilters ? 'bg-[#8DC63F] text-white border-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')}`}
                  >
                    <Filter className="w-4 h-4" /> Filtros Avançados
                    {(() => {
                      const count = [filterDirection !== 'all', filterMovementType !== 'all', filterStorageLocation !== 'all', Boolean(filterDateStart), Boolean(filterDateEnd), selectedCategories.length > 0].filter(Boolean).length;
                      return count > 0 ? (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                          {count}
                        </span>
                      ) : null;
                    })()}
                  </button>
                  <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    <MousePointer2 className="w-4 h-4" /> Arraste
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
                  >
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Direção</label>
                      <select
                        value={filterDirection}
                        onChange={(e) => setFilterDirection(e.target.value as any)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      >
                        <option value="all">Todas as Direções</option>
                        <option value="Entrada">Entrada</option>
                        <option value="Saída">Saída</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tipo de Movimento</label>
                      <select
                        value={filterMovementType}
                        onChange={(e) => setFilterMovementType(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      >
                        <option value="all">Todos os Tipos</option>
                        {availableMovementCodes.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Depósito (SLoc)</label>
                      <select
                        value={filterStorageLocation}
                        onChange={(e) => setFilterStorageLocation(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      >
                        <option value="all">Todos os Depósitos</option>
                        {availableStorageLocations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data Inicial</label>
                      <input 
                        type="date"
                        value={filterDateStart}
                        onChange={(e) => setFilterDateStart(e.target.value)}
                        className={`w-full px-4 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data Final</label>
                      <input 
                        type="date"
                        value={filterDateEnd}
                        onChange={(e) => setFilterDateEnd(e.target.value)}
                        className={`w-full px-4 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${includeEmptyStorage ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                        <input
                          type="checkbox"
                          checked={includeEmptyStorage}
                          onChange={(e) => setIncludeEmptyStorage(e.target.checked)}
                          className="rounded accent-[#8DC63F]"
                        />
                        Carregar Sem Depósito
                      </label>
                    </div>

                    {/* Multi-select Category Filter */}
                    <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-800">
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Categorias de Movimento (Múltipla Seleção)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableCategories.map(cat => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                } else {
                                  setSelectedCategories([...selectedCategories, cat]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected 
                                  ? 'bg-[#8DC63F] text-white border-[#8DC63F]' 
                                  : (darkMode ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300')
                              }`}
                            >
                              {categoryDisplayNames[cat] || cat}
                            </button>
                          );
                        })}
                        {selectedCategories.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategories([])}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/30"
                          >
                            Limpar Categorias ({selectedCategories.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Date Presets */}
                    <div className="col-span-full flex items-center gap-2 pt-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Período Rápido:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const end = d.toISOString().split('T')[0];
                          d.setDate(d.getDate() - 7);
                          const start = d.toISOString().split('T')[0];
                          setFilterDateStart(start);
                          setFilterDateEnd(end);
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Últimos 7 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const end = d.toISOString().split('T')[0];
                          d.setDate(d.getDate() - 30);
                          const start = d.toISOString().split('T')[0];
                          setFilterDateStart(start);
                          setFilterDateEnd(end);
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Últimos 30 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
                          const end = d.toISOString().split('T')[0];
                          setFilterDateStart(start);
                          setFilterDateEnd(end);
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Este Mês
                      </button>
                      {(filterDateStart || filterDateEnd) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDateStart('');
                            setFilterDateEnd('');
                          }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/30`}
                        >
                          Limpar Datas
                        </button>
                      )}
                    </div>

                    <div className="col-span-full flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setFilterDirection('all');
                          setFilterMovementType('all');
                          setFilterStorageLocation('all');
                          setSelectedCategories([]);
                          setFilterDateStart('');
                          setFilterDateEnd('');
                          setSearchTerm('');
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Exibindo {paginatedMovements.length} de {filteredMovements.length} registros
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      setCurrentPageRecon(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                  >
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                    PÁGINA {currentPage} DE {totalPages}
                  </div>

                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div 
              ref={listTableRef}
              className={`rounded-3xl border overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="overflow-x-auto select-none pointer-events-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Documento</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Material</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Quantidade</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Centro/Dep</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuário</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Comentário</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</th>
                    </tr>
                    <tr className={darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-slate-100/90 border-b border-slate-200'}>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filtrar doc..."
                          value={colDocFilter}
                          onChange={(e) => setColDocFilter(e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#8DC63F]'}`}
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filtrar data..."
                          value={colDateFilter}
                          onChange={(e) => setColDateFilter(e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#8DC63F]'}`}
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filtrar tipo..."
                          value={colTypeFilter}
                          onChange={(e) => setColTypeFilter(e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#8DC63F]'}`}
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filtrar material..."
                          value={colMaterialFilter}
                          onChange={(e) => setColMaterialFilter(e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#8DC63F]'}`}
                        />
                      </th>
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filtrar centro..."
                          value={colPlantFilter}
                          onChange={(e) => setColPlantFilter(e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#8DC63F]'}`}
                        />
                      </th>
                      <th className="px-4 py-2" colSpan={3}>
                        {(colDocFilter || colDateFilter || colTypeFilter || colMaterialFilter || colPlantFilter) && (
                          <button
                            onClick={() => {
                              setColDocFilter('');
                              setColDateFilter('');
                              setColTypeFilter('');
                              setColMaterialFilter('');
                              setColPlantFilter('');
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:underline px-2 py-1"
                          >
                            Limpar Colunas
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedMovements.length > 0 ? (
                      paginatedMovements.map(m => {
                        const type = movementTypes.find(t => t.code === m.movementType);
                        
                        const cloneMovement = (movement: MaterialMovement) => {
                          const newMovement = {
                            ...movement,
                            id: Math.random().toString(36).substring(2, 9),
                            docNumber: `${movement.docNumber}-CLONE`,
                            comment: `Clone de ${movement.docNumber}`
                          };
                          setMovements([...movements, newMovement]);
                          addToast('Movimento clonado!', 'success');
                        };

                        return (
                          <tr key={m.id} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black font-mono">{m.docNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-lg ${type?.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type?.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {type?.direction === 'Entrada' ? <ArrowDownLeft className="w-3 h-3" /> : type?.direction === 'Saída' ? <ArrowUpRight className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-black">{m.movementType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black">{m.material}</span>
                                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{m.description}</span>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right text-xs font-black ${type?.direction === 'Entrada' ? 'text-emerald-500' : type?.direction === 'Saída' ? 'text-rose-500' : ''}`}>
                              {type?.direction === 'Saída' ? '-' : ''}{m.quantity.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.plant} / {m.storageLocation}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{m.user}</span>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                value={m.comment || ''}
                                onChange={(e) => {
                                  const updated = movements.map(mov => mov.id === m.id ? { ...mov, comment: e.target.value } : mov);
                                  setMovements(updated);
                                }}
                                className={`w-full px-2 py-1 bg-transparent border-b ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} text-xs focus:border-[#8DC63F] outline-none`}
                                placeholder="Adicionar comentário..."
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedMovementDetail(m)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                                  title="Ver detalhes e logs completos"
                                >
                                  <Search className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => cloneMovement(m)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-[#8DC63F] hover:bg-slate-800' : 'text-slate-400 hover:text-[#78AF32] hover:bg-slate-50'}`}
                                  title="Clonar movimento"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Box className="w-12 h-12" />
                            <span className="text-sm font-black uppercase tracking-widest">Nenhum movimento encontrado</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Movement Detail / Log Modal */}
            {selectedMovementDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#8DC63F]/20 text-[#8DC63F]">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Detalhes Completos do Movimento MB51</h3>
                        <p className="text-xs text-slate-400 font-mono">ID: {selectedMovementDetail.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedMovementDetail(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-mono text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Documento SAP</span>
                        <p className="text-sm font-bold">{selectedMovementDetail.docNumber}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Data de Lançamento</span>
                        <p className="text-sm font-bold">{new Date(selectedMovementDetail.date).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Tipo de Movimento</span>
                        <p className="text-sm font-bold text-[#8DC63F]">{selectedMovementDetail.movementType}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Quantidade</span>
                        <p className="text-sm font-bold">{selectedMovementDetail.quantity.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1 col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Material & Descrição</span>
                        <p className="text-sm font-bold">{selectedMovementDetail.material} - {selectedMovementDetail.description}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Centro / Depósito</span>
                        <p className="text-sm font-bold">{selectedMovementDetail.plant} / {selectedMovementDetail.storageLocation || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Usuário Responsável</span>
                        <p className="text-sm font-bold">{selectedMovementDetail.user || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                      <span className="text-[10px] text-[#8DC63F] uppercase font-black tracking-widest">Logs de Processamento e Auditoria</span>
                      <p className="text-xs font-sans text-slate-300">
                        Este registro passou com sucesso pelas validações de schema da transação MB51, ignorando materiais de serviço (10/49) e aplicando regras de depósito para o tipo 101.
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setSelectedMovementDetail(null)}
                      className="px-6 py-2.5 rounded-xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Orphaned Materials / Missing Items Section */}
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-6 mt-8`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Utilitário de Itens Órfãos</span>
                  <h3 className={`text-xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Materiais Órfãos / Ausentes no Histórico MB51 ({missingMovementsItems.length})
                  </h3>
                  <p className={`text-xs font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Materiais presentes nas planilhas de estoque inicial ou físico real, mas com 0 movimentações registradas no MB51.
                  </p>
                </div>
              </div>

              {missingMovementsItems.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Material</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4 text-center">Estoque Inicial</th>
                        <th className="p-4 text-center">Entradas</th>
                        <th className="p-4 text-center">Saídas</th>
                        <th className="p-4 text-center">Estoque Físico Real</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {missingMovementsItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                          <td className="p-4 font-mono font-bold text-amber-500">{item.material}</td>
                          <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                          <td className="p-4 text-center font-bold">{item.initial.toLocaleString()}</td>
                          <td className="p-4 text-center font-bold text-emerald-500">0</td>
                          <td className="p-4 text-center font-bold text-rose-500">0</td>
                          <td className="p-4 text-center font-bold text-blue-500">{item.finalStockReal.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase">
                              <AlertTriangle className="w-3 h-3" /> Sem Movimentos
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Nenhum material órfão encontrado (todos os itens com estoque possuem movimentações no MB51).
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'reconciliation' && (
          <motion.div
            key="reconciliation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col md:flex-row gap-4`}>
              <div className="relative flex-1">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text"
                  placeholder="Filtrar por material ou descrição..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl text-base font-semibold outline-none border-2 transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#78AF32]'}`}
                />
              </div>
              <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <MousePointer2 className="w-4 h-4" /> Arraste para rolar
              </div>
              <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <BarChart3 className="w-4 h-4" /> 
                {reconciliationData.length} Materiais
              </div>
              <button 
                onClick={() => setShowReconAdvancedFilters(!showReconAdvancedFilters)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${showReconAdvancedFilters ? 'bg-[#8DC63F] text-white border-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')}`}
              >
                <Filter className="w-4 h-4" /> Filtros Avançados
                {(() => {
                  const count = [reconFilterStatus !== 'all', Boolean(reconMinDifference), reconFilterHasInitial, reconFilterHasMovement].filter(Boolean).length;
                  return count > 0 ? (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {count}
                    </span>
                  ) : null;
                })()}
              </button>
              <button 
                onClick={handleExportReconciliationExcel}
                className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 shadow-sm'}`}
              >
                <Download className="w-4 h-4" /> Exportar Conciliação
              </button>
              <button 
                onClick={() => setShowExecutiveReportModal(true)}
                className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-[#8DC63F] hover:border-[#8DC63F]/50 hover:bg-[#8DC63F]/5' : 'bg-lime-50 border-lime-200 text-[#78AF32] hover:bg-lime-100 shadow-sm'}`}
              >
                <FileText className="w-4 h-4" /> Relatório Executivo
              </button>
              <button 
                onClick={() => setShowDiscrepanciesModal(true)}
                className={`relative px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5' : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-sm'}`}
              >
                <AlertTriangle className="w-4 h-4" /> Movimentos Ausentes / Divergências
                {(missingMovementsItems.length + missingStockItems.length + divergentItems.length) > 0 && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                    {missingMovementsItems.length + missingStockItems.length + divergentItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* Reconciliation Advanced Filters Panel */}
            {showReconAdvancedFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`}
              >
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Status da Conciliação
                  </label>
                  <select
                    value={reconFilterStatus}
                    onChange={(e) => setReconFilterStatus(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="all">Todos os Materiais</option>
                    <option value="divergent">Apenas com Divergência (Dif ≠ 0)</option>
                    <option value="ok">Apenas Conciliados (OK)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Diferença Mínima Absoluta
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 10"
                    value={reconMinDifference}
                    onChange={(e) => setReconMinDifference(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Direção</label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value as any)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="all">Todas as Direções</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tipo de Movimento</label>
                  <select
                    value={filterMovementType}
                    onChange={(e) => setFilterMovementType(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="all">Todos os Tipos</option>
                    {availableMovementCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Depósito (SLoc)</label>
                  <select
                    value={filterStorageLocation}
                    onChange={(e) => setFilterStorageLocation(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="all">Todos os Depósitos</option>
                    {availableStorageLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data Inicial</label>
                  <input 
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data Final</label>
                  <input 
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${reconFilterHasInitial ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                    <input
                      type="checkbox"
                      checked={reconFilterHasInitial}
                      onChange={(e) => setReconFilterHasInitial(e.target.checked)}
                      className="rounded accent-[#8DC63F]"
                    />
                    Estoque Inicial &gt; 0
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${reconFilterHasMovement ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                    <input
                      type="checkbox"
                      checked={reconFilterHasMovement}
                      onChange={(e) => setReconFilterHasMovement(e.target.checked)}
                      className="rounded accent-[#8DC63F]"
                    />
                    Movimentações Ativas
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${includeEmptyStorage ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                    <input
                      type="checkbox"
                      checked={includeEmptyStorage}
                      onChange={(e) => setIncludeEmptyStorage(e.target.checked)}
                      className="rounded accent-[#8DC63F]"
                    />
                    Carregar Sem Depósito
                  </label>
                </div>

                {/* Multi-select Category Filter */}
                <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Categorias de Movimento (Múltipla Seleção)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            } else {
                              setSelectedCategories([...selectedCategories, cat]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                              ? 'bg-[#8DC63F] text-white border-[#8DC63F]' 
                              : (darkMode ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300')
                          }`}
                        >
                          {categoryDisplayNames[cat] || cat}
                        </button>
                      );
                    })}
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/30"
                      >
                        Limpar Categorias ({selectedCategories.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="col-span-full flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Período Rápido:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const end = d.toISOString().split('T')[0];
                      d.setDate(d.getDate() - 7);
                      const start = d.toISOString().split('T')[0];
                      setFilterDateStart(start);
                      setFilterDateEnd(end);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const end = d.toISOString().split('T')[0];
                      d.setDate(d.getDate() - 30);
                      const start = d.toISOString().split('T')[0];
                      setFilterDateStart(start);
                      setFilterDateEnd(end);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Últimos 30 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
                      const end = d.toISOString().split('T')[0];
                      setFilterDateStart(start);
                      setFilterDateEnd(end);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Este Mês
                  </button>
                  {(filterDateStart || filterDateEnd) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDateStart('');
                        setFilterDateEnd('');
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/30`}
                    >
                      Limpar Datas
                    </button>
                  )}
                </div>

                <div className="col-span-full flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setReconFilterStatus('all');
                      setReconMinDifference('');
                      setReconFilterHasInitial(false);
                      setReconFilterHasMovement(false);
                      setFilterDirection('all');
                      setFilterMovementType('all');
                      setFilterStorageLocation('all');
                      setSelectedCategories([]);
                      setFilterDateStart('');
                      setFilterDateEnd('');
                      setSearchTerm('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/30`}
                  >
                    Limpar Todos os Filtros
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pagination for Reconciliation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Exibindo {paginatedReconciliation.length} de {reconciliationData.length} materiais
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      setCurrentPageRecon(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                  >
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>
              </div>
              
              {totalPagesRecon > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => goToPageRecon(1)}
                    disabled={currentPageRecon === 1}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPageRecon(currentPageRecon - 1)}
                    disabled={currentPageRecon === 1}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                    PÁGINA {currentPageRecon} DE {totalPagesRecon}
                  </div>

                  <button 
                    onClick={() => goToPageRecon(currentPageRecon + 1)}
                    disabled={currentPageRecon === totalPagesRecon}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === totalPagesRecon ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPageRecon(totalPagesRecon)}
                    disabled={currentPageRecon === totalPagesRecon}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === totalPagesRecon ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div 
              ref={reconciliationTableRef}
              className={`rounded-3xl border overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="overflow-x-auto select-none">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50/50 text-slate-500'}>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest sticky left-0 z-10 bg-inherit min-w-[200px]">Material</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center border-l bg-blue-500/5">Est. Inicial (E8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Prod. (G8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Dev. (H8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Aju. Ent (I8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/10 font-bold border-r">Tot. Ent (J8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Aju. Saí (K8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Out. Saí (L8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Bonif. (M8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Venda (N8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Perda (O8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Req. (P8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/10 font-bold border-r">Tot. Saí (Q8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-amber-500/10 font-bold">Subtotal (R8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-emerald-500/10 font-bold">Est. Real (S8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-red-500/10 font-bold">Diferença (T8)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedReconciliation.map((m, idx) => (
                      <tr 
                        key={`${m.material}-${idx}`} 
                        onClick={() => setSelectedReconciliationItem(m)}
                        className={`group cursor-pointer transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-blue-50/50'}`}
                        title="Clique para ver detalhes, movimentações e lotes deste item"
                      >
                        <td className="px-4 py-4 sticky left-0 z-10 transition-colors bg-white dark:bg-slate-900 group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black group-hover:text-blue-500 transition-colors flex items-center gap-1">
                              {m.material} <span className="text-[9px] font-normal text-slate-400 opacity-0 group-hover:opacity-100">🔍 Detalhes</span>
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{m.description}</span>
                          </div>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter(['INITIAL_STOCK']);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold border-l cursor-pointer hover:bg-blue-500/20 text-slate-700 dark:text-slate-200 transition-colors group/cell"
                          title="Clique para ver o Estoque Inicial"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.initial.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter(['PRODUCTION_PURCHASE']);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold cursor-pointer hover:bg-blue-500/20 text-slate-700 dark:text-slate-200 transition-colors group/cell"
                          title="Clique para ver Produção / Compra"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.prod.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter(['RETURN_ENTRY_SALE', 'RETURN_EXIT_PURCHASE']);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold cursor-pointer hover:bg-blue-500/20 text-slate-700 dark:text-slate-200 transition-colors group/cell"
                          title="Clique para ver Devoluções"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.dev.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('ADJUSTMENT_ENTRY');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold cursor-pointer hover:bg-emerald-500/20 text-emerald-600 transition-colors group/cell"
                          title="Clique para ver Ajuste de Entrada"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.adjIn.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter(['INITIAL_STOCK', 'PRODUCTION_PURCHASE', 'RETURN_ENTRY_SALE', 'RETURN_EXIT_PURCHASE', 'ADJUSTMENT_ENTRY']);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-black text-blue-500 bg-blue-500/5 border-r cursor-pointer hover:bg-blue-500/20 transition-colors group/cell"
                          title="Clique para ver Total de Entradas"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.totalIn.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('ADJUSTMENT_EXIT');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Ajuste de Saída"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.adjOut.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('OTHER_EXIT');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Outras Saídas"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.otherOut.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('BONIFICATION');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Bonificação"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.bonif.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('SALE');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Vendas"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.sale.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('LOSS');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Perdas / Sucatas"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.loss.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter('REQUISITION');
                          }}
                          className="px-4 py-4 text-center text-[11px] font-bold text-rose-500 cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Requisições"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.req.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter(['ADJUSTMENT_EXIT', 'OTHER_EXIT', 'BONIFICATION', 'SALE', 'LOSS', 'REQUISITION']);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-black text-rose-600 bg-rose-500/10 border-r cursor-pointer hover:bg-rose-500/20 transition-colors group/cell"
                          title="Clique para ver Total de Saídas"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.totalOut.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter([]);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-black text-amber-600 bg-amber-500/5 cursor-pointer hover:bg-amber-500/20 transition-colors group/cell"
                          title="Clique para ver todas as movimentações do Subtotal"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.subtotal.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter([]);
                          }}
                          className="px-4 py-4 text-center text-[11px] font-black text-emerald-600 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/20 transition-colors group/cell"
                          title="Clique para ver o histórico completo do material"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.finalStockReal.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReconciliationItem(m);
                            setSelectedReconCategoryFilter([]);
                          }}
                          className={`px-4 py-4 text-center text-[11px] font-black cursor-pointer hover:bg-opacity-80 transition-colors group/cell ${Math.abs(m.difference) > 0.01 ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'}`}
                          title="Clique para ver movimentações e auditar a divergência"
                        >
                          <span className="group-hover/cell:underline flex items-center justify-center gap-1">
                            {m.difference.toLocaleString()} <span className="text-[9px] opacity-0 group-hover/cell:opacity-100">🔍</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className={darkMode ? 'bg-slate-800/90 text-white font-black' : 'bg-slate-100 text-slate-900 font-black'}>
                    <tr>
                      <td className="px-4 py-4 sticky left-0 z-10 bg-inherit border-t text-[11px]">
                        TOTAIS GERAIS ({reconciliationData.length} materiais)
                      </td>
                      <td className="px-4 py-4 text-center text-[11px] border-l border-t">{reconciliationTotals.initial.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] border-t">{reconciliationTotals.prod.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] border-t">{reconciliationTotals.dev.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] border-t">{reconciliationTotals.adjIn.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-blue-500 bg-blue-500/10 border-r border-t">{reconciliationTotals.totalIn.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.adjOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.otherOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.bonif.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.sale.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.loss.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500 border-t">{reconciliationTotals.req.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-600 bg-rose-500/15 border-r border-t">{reconciliationTotals.totalOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-amber-600 bg-amber-500/10 border-t">{reconciliationTotals.subtotal.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-emerald-600 bg-emerald-500/10 border-t">{reconciliationTotals.finalStockReal.toLocaleString()}</td>
                      <td className={`px-4 py-4 text-center text-[11px] border-t ${Math.abs(reconciliationTotals.difference) > 0.01 ? 'text-red-500 bg-red-500/20' : 'text-emerald-500 bg-emerald-500/20'}`}>
                        {reconciliationTotals.difference.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        )}

             {/* Modal de Detalhes do Material na Conciliação */}
             <AnimatePresence>
               {selectedReconciliationItem && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
                   onClick={() => { setSelectedReconciliationItem(null); setSelectedReconCategoryFilter(null); }}
                 >
                   <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     onClick={e => e.stopPropagation()}
                     className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-8 space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                   >
                     <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                       <div>
                         <div className="flex items-center gap-3">
                           <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-500">
                             Material: {selectedReconciliationItem.material}
                           </span>
                           {Math.abs(selectedReconciliationItem.difference) > 0.01 ? (
                             <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-500/10 text-rose-500">
                               Divergente ({selectedReconciliationItem.difference.toLocaleString()})
                             </span>
                           ) : (
                             <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                               OK (Sem Divergência)
                             </span>
                           )}
                         </div>
                         <h2 className="text-xl font-black mt-1">{selectedReconciliationItem.description || 'Sem Descrição'}</h2>
                       </div>
                       <button 
                         onClick={() => { setSelectedReconciliationItem(null); setSelectedReconCategoryFilter(null); }}
                         className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>

                     {/* Valores / Quantidades Resumidas */}
                     <div className="space-y-3">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Resumo de Valores e Quantidades</h3>
                       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                         <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Inicial (E8)</span>
                           <p className="text-lg font-black mt-1">{selectedReconciliationItem.initial.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produção (G8)</span>
                           <p className="text-lg font-black mt-1 text-emerald-500">{selectedReconciliationItem.prod.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Devolução (H8)</span>
                           <p className="text-lg font-black mt-1 text-emerald-500">{selectedReconciliationItem.dev.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aju. Entrada (I8)</span>
                           <p className="text-lg font-black mt-1 text-emerald-500">{selectedReconciliationItem.adjIn.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border bg-blue-500/5 border-blue-500/20`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total Entradas (J8)</span>
                           <p className="text-lg font-black mt-1 text-blue-500">{selectedReconciliationItem.totalIn.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border bg-rose-500/5 border-rose-500/20`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Total Saídas (Q8)</span>
                           <p className="text-lg font-black mt-1 text-rose-500">{selectedReconciliationItem.totalOut.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border bg-amber-500/5 border-amber-500/20`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Subtotal (R8)</span>
                           <p className="text-lg font-black mt-1 text-amber-600">{selectedReconciliationItem.subtotal.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border bg-emerald-500/5 border-emerald-500/20`}>
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Estoque Real (S8)</span>
                           <p className="text-lg font-black mt-1 text-emerald-600">{selectedReconciliationItem.finalStockReal.toLocaleString()}</p>
                         </div>
                         <div className={`p-4 rounded-2xl border col-span-2 sm:col-span-2 ${Math.abs(selectedReconciliationItem.difference) > 0.01 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                           <span className="text-[10px] font-black uppercase tracking-widest">Diferença (T8)</span>
                           <p className="text-xl font-black mt-1">{selectedReconciliationItem.difference.toLocaleString()}</p>
                         </div>
                       </div>
                     </div>

                     {/* Lotes Encontrados */}
                     <div className="space-y-3">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Lotes Associados ({selectedItemLots.length})</h3>
                       {selectedItemLots.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                           {selectedItemLots.map((lote, lIdx) => (
                             <span key={lIdx} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 font-mono font-bold text-xs border border-indigo-500/20">
                               📦 {lote}
                             </span>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-slate-400 italic">Nenhum lote registrado para este material nas movimentações ou estoques.</p>
                       )}
                     </div>

                     {/* Movimentações Respectivas (MB51) */}
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Movimentações MB51 Respectivas ({selectedItemMovements.length})</h3>
                       </div>
                       <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
                         <table className="w-full text-left border-collapse">
                           <thead>
                             <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                               <th className="p-3">Mov.</th>
                               <th className="p-3">Data</th>
                               <th className="p-3">Lote</th>
                               <th className="p-3">Depósito</th>
                               <th className="p-3">Documento</th>
                               <th className="p-3 text-right">Qtd</th>
                               <th className="p-3 text-right">Valor (R$)</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                             {selectedItemMovements.map((mov, mIdx) => (
                               <tr key={mov.id || mIdx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                                 <td className="p-3 font-bold font-mono">{mov.movementType}</td>
                                 <td className="p-3">{mov.date}</td>
                                 <td className="p-3 font-mono text-indigo-500">{mov.batch || '-'}</td>
                                 <td className="p-3 font-mono">{mov.storageLocation || '-'}</td>
                                 <td className="p-3 font-mono">{mov.docNumber || '-'}</td>
                                 <td className={`p-3 text-right font-black ${Number(mov.quantity) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                   {Number(mov.quantity).toLocaleString()} {mov.unit || ''}
                                 </td>
                                 <td className="p-3 text-right font-bold">
                                   {mov.value ? Number(mov.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                 </td>
                               </tr>
                             ))}
                             {selectedItemMovements.length === 0 && (
                               <tr>
                                 <td colSpan={7} className="p-6 text-center text-slate-400">Nenhuma movimentação registrada para este material.</td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>

                     <div className="flex justify-end pt-2">
                       <button
                         onClick={() => setSelectedReconciliationItem(null)}
                         className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                       >
                         Fechar Detalhes
                       </button>
                     </div>
                   </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>

        {activeTab === 'discrepancies' && (
          <motion.div
            key="discrepancies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Banner & Explanation */}
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-6`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8DC63F]">Análise Avançada de Estoque</span>
                  <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
                    Divergências de Estoque (Inicial + Entradas - Saídas vs Físico Real)
                  </h3>
                  <p className={`text-xs font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Compara o saldo teórico calculado pelas movimentações MB51 com o inventário físico real reportado no SAP, destacando desvios e quebras.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportDiscrepanciesExcel}
                    className={`px-5 py-3 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-sm'}`}
                  >
                    <Download className="w-4 h-4" /> Exportar Divergências
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Analisado</span>
                  <p className="text-2xl font-black">{reconciliationData.length} itens</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Com Divergência</span>
                  <p className="text-2xl font-black text-rose-500">
                    {reconciliationData.filter(m => Math.abs(m.difference) > 0.01).length} itens
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem Divergência (OK)</span>
                  <p className="text-2xl font-black text-emerald-500">
                    {reconciliationData.filter(m => Math.abs(m.difference) <= 0.01).length} itens
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volume Total Desviado</span>
                  <p className="text-2xl font-black text-amber-500">
                    {reconciliationData.reduce((acc, m) => acc + Math.abs(m.difference), 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                <div className="relative w-full md:w-96">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="Buscar material ou descrição..."
                    value={discSearchTerm}
                    onChange={(e) => setDiscSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setDiscFilterType('all')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${discFilterType === 'all' ? 'bg-[#8DC63F] text-white' : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                  >
                    Todos ({reconciliationData.length})
                  </button>
                  <button
                    onClick={() => setDiscFilterType('divergent')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${discFilterType === 'divergent' ? 'bg-rose-500 text-white' : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                  >
                    Divergentes ({reconciliationData.filter(m => Math.abs(m.difference) > 0.01).length})
                  </button>
                  <button
                    onClick={() => setDiscFilterType('match')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${discFilterType === 'match' ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                  >
                    OK ({reconciliationData.filter(m => Math.abs(m.difference) <= 0.01).length})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Material</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4 text-center">Inicial</th>
                      <th className="p-4 text-center">Entradas (+)</th>
                      <th className="p-4 text-center">Saídas (-)</th>
                      <th className="p-4 text-center">Calculado</th>
                      <th className="p-4 text-center">Físico Real SAP</th>
                      <th className="p-4 text-center">Divergência</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {reconciliationData
                      .filter(m => {
                        const matchesSearch = !discSearchTerm || 
                          String(m.material).toLowerCase().includes(discSearchTerm.toLowerCase()) || 
                          String(m.description).toLowerCase().includes(discSearchTerm.toLowerCase());
                        if (!matchesSearch) return false;
                        const isDiv = Math.abs(m.difference) > 0.01;
                        if (discFilterType === 'divergent') return isDiv;
                        if (discFilterType === 'match') return !isDiv;
                        return true;
                      })
                      .map((m, idx) => {
                        const isDiv = Math.abs(m.difference) > 0.01;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-950/50 ${isDiv ? 'bg-rose-500/5' : ''}`}>
                            <td className="p-4 font-mono font-bold text-[#8DC63F]">{m.material}</td>
                            <td className="p-4 font-medium truncate max-w-xs">{m.description}</td>
                            <td className="p-4 text-center font-bold">{m.initial.toLocaleString()}</td>
                            <td className="p-4 text-center font-bold text-emerald-500">{m.totalIn.toLocaleString()}</td>
                            <td className="p-4 text-center font-bold text-rose-500">{m.totalOut.toLocaleString()}</td>
                            <td className="p-4 text-center font-black text-amber-500">{m.subtotal.toLocaleString()}</td>
                            <td className="p-4 text-center font-black text-blue-500">{m.finalStockReal.toLocaleString()}</td>
                            <td className={`p-4 text-center font-black ${isDiv ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {m.difference > 0 ? `+${m.difference.toLocaleString()}` : m.difference.toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {isDiv ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase">
                                  <AlertTriangle className="w-3 h-3" /> Divergente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}







        {activeTab === 'abc' && (
          <motion.div
            key="abc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8DC63F]">Análise de Inventário</span>
                <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
                  Curva ABC de Materiais (Por Volume de Movimentação)
                </h3>
                <p className={`text-xs font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Classificação baseada no princípio de Pareto (Curva A: 80% do volume, Curva B: 15%, Curva C: 5% restante).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportAbcExcel}
                  className={`px-5 py-3 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-sm'}`}
                >
                  <Download className="w-4 h-4" /> Exportar Curva ABC
                </button>
              </div>
            </div>

            {/* Summary Cards ABC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-300">Curva A (Alta Relevância)</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black text-[10px]">A</span>
                </div>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300">
                  {abcData.filter(i => i.curve === 'A').length} <span className="text-xs font-bold text-slate-500 dark:text-slate-300">itens</span>
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Representa 80% do volume movimentado</p>
              </div>

              <div className="p-6 rounded-3xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">Curva B (Média Relevância)</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white font-black text-[10px]">B</span>
                </div>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-300">
                  {abcData.filter(i => i.curve === 'B').length} <span className="text-xs font-bold text-slate-500 dark:text-slate-300">itens</span>
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Representa 15% do volume movimentado</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-500/5 dark:bg-slate-800 border border-slate-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Curva C (Baixa Relevância)</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-500 text-white font-black text-[10px]">C</span>
                </div>
                <p className="text-3xl font-black text-slate-700 dark:text-slate-200">
                  {abcData.filter(i => i.curve === 'C').length} <span className="text-xs font-bold text-slate-500 dark:text-slate-300">itens</span>
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Representa 5% restante (cauda longa)</p>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar material ou descrição..."
                  value={abcSearchTerm}
                  onChange={(e) => setAbcSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {['all', 'A', 'B', 'C'].map(curve => (
                  <button
                    key={curve}
                    onClick={() => setAbcFilterCurve(curve as any)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${abcFilterCurve === curve ? 'bg-[#8DC63F] text-white' : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                  >
                    {curve === 'all' ? 'Todas as Curvas' : `Curva ${curve}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Material</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 text-center">Volume Total (Entrada+Saída)</th>
                    <th className="p-4 text-center">% Acumulado</th>
                    <th className="p-4 text-center">Estoque Físico SAP</th>
                    <th className="p-4 text-center">Classificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {abcData
                    .filter(item => {
                      if (abcFilterCurve !== 'all' && item.curve !== abcFilterCurve) return false;
                      if (abcSearchTerm && !String(item.material).toLowerCase().includes(abcSearchTerm.toLowerCase()) && !String(item.description).toLowerCase().includes(abcSearchTerm.toLowerCase())) return false;
                      return true;
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                        <td className="p-4 font-mono font-bold text-[#8DC63F]">{item.material}</td>
                        <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                        <td className="p-4 text-center font-bold">{item.volume.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-slate-500">{item.cumulativePct.toFixed(2)}%</td>
                        <td className="p-4 text-center font-bold text-blue-500">{item.finalStockReal.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full font-black text-[10px] uppercase ${item.curve === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : item.curve === 'B' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'}`}>
                            Curva {item.curve}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'types' && (
          <motion.div
            key="types"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tipos de Movimentação SAP</h3>
              <button 
                onClick={() => setShowAddType(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8DC63F]/10 text-[#8DC63F] text-xs font-black uppercase tracking-widest hover:bg-[#8DC63F]/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar Tipo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {showAddType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-6 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</label>
                        <input 
                          type="text" 
                          value={newType.code || ''}
                          onChange={e => setNewType({ ...newType, code: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                          placeholder="Ex: 101"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Direção</label>
                        <select 
                          value={newType.direction}
                          onChange={e => setNewType({ ...newType, direction: e.target.value as any })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="Entrada">Entrada</option>
                          <option value="Saída">Saída</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria de Conciliação</label>
                        <select 
                          value={newType.category || ''}
                          onChange={e => setNewType({ ...newType, category: e.target.value as any })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="">Nenhuma</option>
                          <option value="INITIAL_STOCK">Estoque Inicial (E8)</option>
                          <option value="PRODUCTION_PURCHASE">Produção/Compras (G8)</option>
                          <option value="RETURN_ENTRY_SALE">Devolução Entrada (Venda)</option>
                          <option value="RETURN_EXIT_PURCHASE">Devolução Saída (Compras)</option>
                          <option value="ADJUSTMENT_ENTRY">Ajuste Entrada (I8)</option>
                          <option value="ADJUSTMENT_EXIT">Ajuste Saída (K8)</option>
                          <option value="OTHER_EXIT">Outras Saídas (L8)</option>
                          <option value="BONIFICATION">Bonificação (M8)</option>
                          <option value="SALE">Venda (N8)</option>
                          <option value="LOSS">Perda (O8)</option>
                          <option value="REQUISITION">Requisição (P8)</option>
                          <option value="FINAL_STOCK">Estoque Final (S8)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</label>
                      <input 
                        type="text" 
                        value={newType.description || ''}
                        onChange={e => setNewType({ ...newType, description: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        placeholder="Descrição do movimento..."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddType} className="flex-1 py-2 rounded-xl bg-[#8DC63F] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all">Salvar</button>
                      <button onClick={() => setShowAddType(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Cancelar</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            {/* Configuração de Tipos Agrupada */}
            <div className="space-y-8">
              {Object.entries(movementTypes.reduce((acc, t) => {
                const cat = t.category || 'Nenhuma Categoria';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(t);
                return acc;
              }, {} as Record<string, SAPMovementType[]>)).map(([category, types]) => (
                <div key={category} className="space-y-4">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {types.map(type => (
                      <div 
                        key={type.code}
                        className={`p-6 rounded-3xl border transition-all group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#8DC63F]/50' : 'bg-white border-slate-100 hover:border-[#8DC63F]/50 shadow-sm'}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${type.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {type.direction === 'Entrada' ? <ArrowDownLeft className="w-5 h-5" /> : type.direction === 'Saída' ? <ArrowUpRight className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-xl font-black">{type.code}</div>
                              <div className={`text-[10px] font-black uppercase tracking-widest ${type.direction === 'Entrada' ? 'text-emerald-500' : type.direction === 'Saída' ? 'text-rose-500' : 'text-blue-500'}`}>
                                {type.direction}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingType(type.code)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteType(type.code)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-red-50 text-red-500'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {editingType === type.code ? (
                          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <input 
                              type="text" 
                              defaultValue={type.description}
                              onBlur={(e) => handleUpdateType(type.code, { description: e.target.value })}
                              autoFocus
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            />
                            <select 
                              defaultValue={type.category || ''}
                              onChange={(e) => handleUpdateType(type.code, { category: e.target.value as any })}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            >
                              <option value="">Nenhuma Categoria</option>
                              <option value="INITIAL_STOCK">Estoque Inicial (E8)</option>
                              <option value="PRODUCTION_PURCHASE">Produção/Compras (G8)</option>
                              <option value="RETURN_ENTRY_SALE">Devolução Entrada (Venda)</option>
                              <option value="RETURN_EXIT_PURCHASE">Devolução Saída (Compras)</option>
                              <option value="ADJUSTMENT_ENTRY">Ajuste Entrada (I8)</option>
                              <option value="ADJUSTMENT_EXIT">Ajuste Saída (K8)</option>
                              <option value="OTHER_EXIT">Outras Saídas (L8)</option>
                              <option value="BONIFICATION">Bonificação (M8)</option>
                              <option value="SALE">Venda (N8)</option>
                              <option value="LOSS">Perda (O8)</option>
                              <option value="REQUISITION">Requisição (P8)</option>
                              <option value="FINAL_STOCK">Estoque Final (S8)</option>
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingType(null)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {type.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTIVE REPORT MODAL */}
      {showExecutiveReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8DC63F]">Auditoria SAP MB51 & Estoque</span>
                <h3 className="text-xl font-black mt-1">Relatório Executivo de Conciliação</h3>
              </div>
              <button 
                onClick={() => setShowExecutiveReportModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estoque Inicial</span>
                  <p className="text-xl font-black text-blue-500">{reconciliationTotals.initial.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Entradas</span>
                  <p className="text-xl font-black text-emerald-500">{reconciliationTotals.totalIn.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Saídas</span>
                  <p className="text-xl font-black text-rose-500">{reconciliationTotals.totalOut.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Divergências</span>
                  <p className={`text-xl font-black ${Math.abs(reconciliationTotals.difference) > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {reconciliationData.filter(d => Math.abs(d.difference) > 0.01).length} itens
                  </p>
                </div>
              </div>

              {/* Insights */}
              <div className="p-6 rounded-2xl bg-[#8DC63F]/10 border border-[#8DC63F]/20 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#8DC63F]">Conclusão da Auditoria</h4>
                <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  O período analisado abrange {reconciliationData.length} materiais com giro de estoque médio de {reconciliationTotals.initial > 0 ? (reconciliationTotals.totalOut / reconciliationTotals.initial).toFixed(2) : '0.00'}x. 
                  {Math.abs(reconciliationTotals.difference) > 0.01 ? ' Foram encontradas divergências entre o estoque calculado e o estoque físico real que requerem atenção nas movimentações (Ajustes/Transferências).' : ' Todos os estoques conferem perfeitamente sem divergências críticas no saldo final.'}
                </p>
              </div>

              {/* Top Divergent Items */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Principais Materiais com Divergência</h4>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Material</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4 text-center">Teórico</th>
                        <th className="p-4 text-center">Físico Real</th>
                        <th className="p-4 text-center">Divergência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {reconciliationData.filter(d => Math.abs(d.difference) > 0.01).slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                          <td className="p-4 font-mono font-bold text-[#8DC63F]">{item.material}</td>
                          <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                          <td className="p-4 text-center font-bold">{item.subtotal.toLocaleString()}</td>
                          <td className="p-4 text-center font-bold">{item.finalStockReal.toLocaleString()}</td>
                          <td className="p-4 text-center font-black text-rose-500">{item.difference.toLocaleString()}</td>
                        </tr>
                      ))}
                      {reconciliationData.filter(d => Math.abs(d.difference) > 0.01).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Nenhum item com divergência cadastrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mini SAP Auditoria © 2026</span>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setShowExecutiveReportModal(false)}
                  className="px-6 py-3 rounded-xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition shadow-lg shadow-[#8DC63F]/20"
                >
                  Fechar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISCREPANCIES & MISSING MOVEMENTS MODAL */}
      {showDiscrepanciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Auditoria MB51 & Relatórios de Estoque</span>
                <h3 className="text-xl font-black mt-1">Análise de Movimentos Ausentes e Divergências</h3>
              </div>
              <button 
                onClick={() => setShowDiscrepanciesModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Tabs for discrepancy types */}
              <div className="flex flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button
                  onClick={() => setActiveDiscTab('missingMovements')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeDiscTab === 'missingMovements' ? 'bg-amber-500 text-white shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                >
                  Itens sem Movimentos ({missingMovementsItems.length})
                </button>
                <button
                  onClick={() => setActiveDiscTab('missingStock')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeDiscTab === 'missingStock' ? 'bg-amber-500 text-white shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                >
                  Movimentos sem Estoque Cadastro ({missingStockItems.length})
                </button>
                <button
                  onClick={() => setActiveDiscTab('divergent')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeDiscTab === 'divergent' ? 'bg-amber-500 text-white shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                >
                  Divergência de Saldo ({divergentItems.length})
                </button>
              </div>

              {/* Description helper */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-300">
                {activeDiscTab === 'missingMovements' && 'Estes materiais constam nas planilhas de Estoque Inicial ou Estoque Real, mas não possuem nenhuma linha de movimentação registrada (MB51) no período selecionado.'}
                {activeDiscTab === 'missingStock' && 'Estes materiais possuem movimentações registradas no MB51, porém estão ausentes nas planilhas de Estoque Inicial ou Estoque Real.'}
                {activeDiscTab === 'divergent' && 'Estes materiais apresentam discrepância entre o saldo calculado (Estoque Inicial + Entradas - Saídas) e o Estoque Físico Real informado.'}
              </div>

              {/* Tables */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Material</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4 text-center">Est. Inicial</th>
                      <th className="p-4 text-center">Total Entradas</th>
                      <th className="p-4 text-center">Total Saídas</th>
                      <th className="p-4 text-center">Est. Físico Real</th>
                      <th className="p-4 text-center">Divergência / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {activeDiscTab === 'missingMovements' && missingMovementsItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                        <td className="p-4 font-mono font-bold text-amber-500">{item.material}</td>
                        <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                        <td className="p-4 text-center font-bold">{item.initial.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-emerald-500">0</td>
                        <td className="p-4 text-center font-bold text-rose-500">0</td>
                        <td className="p-4 text-center font-bold">{item.finalStockReal.toLocaleString()}</td>
                        <td className="p-4 text-center font-black text-amber-500">Sem Movimentos</td>
                      </tr>
                    ))}

                    {activeDiscTab === 'missingStock' && missingStockItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                        <td className="p-4 font-mono font-bold text-amber-500">{item.material}</td>
                        <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                        <td className="p-4 text-center font-bold text-rose-500">0 (Ausente)</td>
                        <td className="p-4 text-center font-bold text-emerald-500">{item.totalIn.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-rose-500">{item.totalOut.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-rose-500">0 (Ausente)</td>
                        <td className="p-4 text-center font-black text-rose-500">Sem Estoque Base</td>
                      </tr>
                    ))}

                    {activeDiscTab === 'divergent' && divergentItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                        <td className="p-4 font-mono font-bold text-amber-500">{item.material}</td>
                        <td className="p-4 font-medium truncate max-w-xs">{item.description}</td>
                        <td className="p-4 text-center font-bold">{item.initial.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-emerald-500">{item.totalIn.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-rose-500">{item.totalOut.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold">{item.finalStockReal.toLocaleString()}</td>
                        <td className="p-4 text-center font-black text-rose-500">{item.difference.toLocaleString()}</td>
                      </tr>
                    ))}

                    {activeDiscTab === 'missingMovements' && missingMovementsItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Nenhum item encontrado sem movimentos.</td>
                      </tr>
                    )}
                    {activeDiscTab === 'missingStock' && missingStockItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Nenhum item com movimentos ausente no cadastro de estoque.</td>
                      </tr>
                    )}
                    {activeDiscTab === 'divergent' && divergentItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Nenhum item com divergência de saldo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mini SAP Auditoria © 2026</span>
              <button
                onClick={() => setShowDiscrepanciesModal(false)}
                className="px-6 py-3 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-500/20"
              >
                Fechar Análise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementsPage;
