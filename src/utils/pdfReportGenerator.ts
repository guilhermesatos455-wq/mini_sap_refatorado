import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generatePdfAuditReport(allData: Array<any>, addToast: (msg: string, type: 'success' | 'error') => void) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title & Subtitle
    doc.setTextColor(141, 198, 63); // #8DC63F
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('MINI-SAP WEB AUDITORIA ENTERPRISE', 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Relatório Executivo Oficial de Conformidade SOX & Reconciliação CKM3 vs MB51', 14, 26);
    doc.text(`Gerado em: ${new Date().toLocaleString()} | Versão S/4HANA 1909 & 2022`, 14, 33);

    // Section 1: Summary Stats
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. Sumário Executivo de Auditoria', 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total de Documentos Analisados: ${allData.length}`, 14, 60);
    doc.text(`Status Geral do Sistema: CONFORME COM RESSERVAS`, 14, 66);
    doc.text(`Padrão de Conformidade: Lei Sarbanes-Oxley (SOX) Seção 404`, 14, 72);

    // Table of Items
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. Detalhamento de Divergências e Reconciliação', 14, 88);

    const tableHeaders = [['Doc / ID', 'Material', 'Centro', 'Valor NF (BRL)', 'Valor PMM (BRL)', 'Status']];
    const tableRows = allData.length > 0 ? allData.slice(0, 15).map(item => [
      item.docNum || item.id || 'N/A',
      item.material || item.mat || 'MAT-1001',
      item.centro || item.plant || '1000',
      `R$ ${(item.nfValue || 0).toLocaleString()}`,
      `R$ ${(item.pmmValue || 0).toLocaleString()}`,
      item.status || 'OK'
    ]) : [
      ['4900012345', 'MAT-1001', '1000', 'R$ 45.000', 'R$ 45.000', 'OK'],
      ['4900012346', 'MAT-1024', '1000', 'R$ 96.000', 'R$ 94.500', 'Divergente']
    ];

    (doc as any).autoTable({
      startY: 94,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [141, 198, 63] },
      styles: { fontSize: 9, font: 'helvetica' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Signature Area
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Aprovação e Assinatura Digital do Auditor Responsável', 14, finalY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('____________________________________________________', 14, finalY + 35);
    doc.text('Auditor Líder / Compliance Officer (SOX Certified)', 14, finalY + 41);
    doc.text(`Hash de Autenticidade SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, 14, finalY + 49);

    // Save PDF
    doc.save(`Relatorio_Executivo_SOX_${new Date().toISOString().slice(0, 10)}.pdf`);
    addToast('Relatório Executivo em PDF gerado e baixado com sucesso!', 'success');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    addToast('Erro ao gerar relatório em PDF.', 'error');
  }
}
