import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToExcel(data: any[], filename = 'relatorio_audit_sap.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria SAP');
  XLSX.writeFile(workbook, filename);
}

export function exportToPdf(title: string, headers: string[], data: any[][], filename = 'relatorio_audit_sap.pdf') {
  const doc = new jsPDF() as any;

  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleString()} - Mini-SAP Enterprise Auditoria`, 14, 28);

  doc.autoTable({
    startY: 35,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [141, 198, 63] }, // #8DC63F
    styles: { fontSize: 8 }
  });

  doc.save(filename);
}
