import jsPDF from 'jspdf';

interface EmployeeCompliance {
  id: string;
  name: string;
  docsAccepted: number;
  docsPending: number;
  trainingsCompleted: number;
  trainingsPending: number;
}

interface ReportStats {
  totalEmployees: number;
  totalDocuments: number;
  totalTrainings: number;
  acknowledgedDocs: number;
  completedTrainings: number;
}

export const generateReportPDF = (
  employees: EmployeeCompliance[],
  stats: ReportStats
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;
  const lineHeight = 7;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE COMPLIANCE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Summary section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO GERAL', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    `Total de Colaboradores: ${stats.totalEmployees}`,
    `Regulamentos Disponíveis: ${stats.totalDocuments}`,
    `Treinamentos Disponíveis: ${stats.totalTrainings}`,
    `Total de Aceites de Regulamentos: ${stats.acknowledgedDocs}`,
    `Total de Treinamentos Concluídos: ${stats.completedTrainings}`,
  ];

  summaryData.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Table header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS POR COLABORADOR', margin, yPosition);
  yPosition += 10;

  // Table column headers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const colWidths = {
    name: 70,
    docsOk: 25,
    docsPend: 25,
    trainOk: 25,
    trainPend: 25,
  };

  const startX = margin;
  doc.text('Colaborador', startX, yPosition);
  doc.text('Reg. OK', startX + colWidths.name, yPosition);
  doc.text('Reg. Pend.', startX + colWidths.name + colWidths.docsOk, yPosition);
  doc.text('Trein. OK', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend, yPosition);
  doc.text('Trein. Pend.', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk, yPosition);
  
  yPosition += 3;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  employees.forEach((employee, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      
      // Repeat header on new page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Colaborador', startX, yPosition);
      doc.text('Reg. OK', startX + colWidths.name, yPosition);
      doc.text('Reg. Pend.', startX + colWidths.name + colWidths.docsOk, yPosition);
      doc.text('Trein. OK', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend, yPosition);
      doc.text('Trein. Pend.', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk, yPosition);
      yPosition += 3;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Truncate name if too long
    const truncatedName = employee.name.length > 40 
      ? employee.name.substring(0, 37) + '...' 
      : employee.name;

    doc.text(truncatedName, startX, yPosition);
    doc.text(String(employee.docsAccepted), startX + colWidths.name + 5, yPosition);
    doc.text(String(employee.docsPending), startX + colWidths.name + colWidths.docsOk + 10, yPosition);
    doc.text(String(employee.trainingsCompleted), startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + 5, yPosition);
    doc.text(String(employee.trainingsPending), startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk + 10, yPosition);
    
    yPosition += lineHeight;
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save the PDF
  const fileName = `relatorio-compliance-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
