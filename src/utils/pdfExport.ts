import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export interface ExecutiveReportOptions {
  resultado: any;
  auditLogs: any[];
  selectedPlant: string;
  currency: string;
  chartElementId?: string;
}

export async function generateExecutivePDF({ resultado, auditLogs, selectedPlant, currency, chartElementId }: ExecutiveReportOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // Colors
  const primaryColor = [141, 198, 63]; // #8DC63F
  const darkColor = [30, 41, 59]; // slate-800
  const grayColor = [100, 116, 139]; // slate-500

  // Header Background bar
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MINI SAP AUDITORIA - RELATÓRIO EXECUTIVO', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Centro: ${selectedPlant}`, pageWidth - 14, 18, { align: 'right' });

  currentY = 36;

  // Summary Metrics Section
  const totalDivergences = resultado?.divergencias?.length || 0;
  const totalImpact = resultado?.totalImpacto || 0;
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(val);
  };

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Sumário Executivo de Impacto Financeiro', 14, currentY);
  currentY += 8;

  // KPI boxes
  const boxWidth = (pageWidth - 36) / 3;
  const boxHeight = 22;

  const kpis = [
    { label: 'Total de Divergências', value: totalDivergences.toString() },
    { label: 'Impacto Financeiro Total', value: formatCurrency(totalImpact) },
    { label: 'Centro Analisado', value: selectedPlant === 'TODOS' ? 'Consolidado (Todos)' : selectedPlant }
  ];

  kpis.forEach((kpi, idx) => {
    const boxX = 14 + idx * (boxWidth + 4);
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(kpi.value, boxX + 8, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(kpi.label, boxX + 8, currentY + 17);
  });

  currentY += boxHeight + 12;

  // Chart Capture if element exists
  if (chartElementId) {
    try {
      const chartEl = document.getElementById(chartElementId);
      if (chartEl) {
        const canvas = await html2canvas(chartEl, { scale: 2, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('2. Gráficos Consolidados e Tendências', 14, currentY);
        currentY += 6;

        doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, Math.min(imgHeight, 80));
        currentY += Math.min(imgHeight, 80) + 12;
      }
    } catch (e) {
      console.warn('Falha ao capturar gráfico para PDF:', e);
    }
  }

  // Top Divergences Table
  if (resultado?.divergencias && resultado.divergencias.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('3. Principais Divergências Identificadas', 14, currentY);
    currentY += 6;

    const tableData = resultado.divergencias.slice(0, 15).map((item: any) => [
      item.material || '-',
      item.descricao || '-',
      item.cfop || '-',
      item.fornecedor || '-',
      formatCurrency(item.impactoFinanceiro || 0),
      item.status || 'Pendente'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Material', 'Descrição', 'CFOP', 'Fornecedor', 'Impacto', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Audit Trail / Notes section
  if (auditLogs && auditLogs.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('4. Log de Auditoria e Modificações Recentes', 14, currentY);
    currentY += 6;

    const auditTableData = auditLogs.slice(0, 10).map((log: any) => [
      log.timestamp || '-',
      log.user || 'Auditor',
      log.action || '-',
      log.details || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data/Hora', 'Usuário', 'Ação', 'Detalhes']],
      body: auditTableData,
      theme: 'grid',
      headStyles: { fillColor: [141, 198, 63], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Mini SAP Web Auditoria — Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`relatorio-executivo-sap-${selectedPlant}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
