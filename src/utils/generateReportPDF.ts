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

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generateReportPDF = async (
  employees: EmployeeCompliance[],
  stats: ReportStats
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;
  const lineHeight = 7;

  // Load images
  let logoImg: HTMLImageElement | null = null;
  let footerImg: HTMLImageElement | null = null;

  try {
    logoImg = await loadImage('/images/report-logo.png');
  } catch (e) {
    console.warn('Could not load logo image');
  }

  try {
    footerImg = await loadImage('/images/report-footer.png');
  } catch (e) {
    console.warn('Could not load footer image');
  }

  const sideMargin = 4; // 4mm margin from edges
  
  // Calculate logo height dynamically
  let logoHeight = 0;
  if (logoImg) {
    const logoWidth = pageWidth - (sideMargin * 2);
    logoHeight = (logoImg.height / logoImg.width) * logoWidth;
  }
  
  // Calculate footer height dynamically
  let footerHeight = 0;
  if (footerImg) {
    const footerWidth = pageWidth - (sideMargin * 2);
    footerHeight = (footerImg.height / footerImg.width) * footerWidth;
  }

  const contentStartY = sideMargin + logoHeight + 10; // Start after logo + 10mm spacing
  const footerSpace = footerHeight + sideMargin + 10; // Footer height + margin + 10mm spacing

  const addHeader = () => {
    if (logoImg) {
      const logoWidth = pageWidth - (sideMargin * 2);
      const lHeight = (logoImg.height / logoImg.width) * logoWidth;
      doc.addImage(logoImg, 'PNG', sideMargin, sideMargin, logoWidth, lHeight);
    }
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    if (footerImg) {
      const footerWidth = pageWidth - (sideMargin * 2);
      const fHeight = (footerImg.height / footerImg.width) * footerWidth;
      doc.addImage(footerImg, 'PNG', sideMargin, pageHeight - fHeight - sideMargin, footerWidth, fHeight);
    }
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - footerHeight - sideMargin - 2, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // Add header to first page
  addHeader();
  yPosition = contentStartY;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 153);
  doc.text('RELATÓRIO DE COMPLIANCE', pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPosition += 12;

  // Summary section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 153);
  doc.text('RESUMO GERAL', margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 7;

  doc.setFontSize(9);
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
    yPosition += 6;
  });

  yPosition += 8;

  // Table header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 153);
  doc.text('STATUS POR COLABORADOR', margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;

  // Table column headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  const colWidths = {
    name: 70,
    docsOk: 25,
    docsPend: 25,
    trainOk: 25,
    trainPend: 25,
  };

  const startX = margin;
  
  // Header background
  doc.setFillColor(0, 102, 153);
  doc.rect(margin - 2, yPosition - 4, pageWidth - (margin * 2) + 4, 6, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.text('Colaborador', startX, yPosition);
  doc.text('Reg. OK', startX + colWidths.name, yPosition);
  doc.text('Reg. Pend.', startX + colWidths.name + colWidths.docsOk, yPosition);
  doc.text('Trein. OK', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend, yPosition);
  doc.text('Trein. Pend.', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk, yPosition);
  doc.setTextColor(0, 0, 0);
  
  yPosition += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  employees.forEach((employee, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - footerSpace) {
      doc.addPage();
      yPosition = contentStartY;
      
      // Add header to new page
      addHeader();
      
      // Repeat table header on new page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      // Header background
      doc.setFillColor(0, 102, 153);
      doc.rect(margin - 2, yPosition - 4, pageWidth - (margin * 2) + 4, 6, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.text('Colaborador', startX, yPosition);
      doc.text('Reg. OK', startX + colWidths.name, yPosition);
      doc.text('Reg. Pend.', startX + colWidths.name + colWidths.docsOk, yPosition);
      doc.text('Trein. OK', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend, yPosition);
      doc.text('Trein. Pend.', startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(240, 248, 255); // Light blue shade
      doc.rect(margin - 2, yPosition - 4, pageWidth - (margin * 2) + 4, 6, 'F');
    }

    // Truncate name if too long
    const truncatedName = employee.name.length > 40 
      ? employee.name.substring(0, 37) + '...' 
      : employee.name;

    doc.setTextColor(0, 0, 0);
    doc.text(truncatedName, startX, yPosition);
    
    // Color code the values
    doc.setTextColor(34, 139, 34); // Green for completed
    doc.text(String(employee.docsAccepted), startX + colWidths.name + 5, yPosition);
    
    doc.setTextColor(employee.docsPending > 0 ? 205 : 100, employee.docsPending > 0 ? 92 : 100, employee.docsPending > 0 ? 92 : 100); // Red if pending
    doc.text(String(employee.docsPending), startX + colWidths.name + colWidths.docsOk + 10, yPosition);
    
    doc.setTextColor(34, 139, 34); // Green for completed
    doc.text(String(employee.trainingsCompleted), startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + 5, yPosition);
    
    doc.setTextColor(employee.trainingsPending > 0 ? 205 : 100, employee.trainingsPending > 0 ? 92 : 100, employee.trainingsPending > 0 ? 92 : 100); // Red if pending
    doc.text(String(employee.trainingsPending), startX + colWidths.name + colWidths.docsOk + colWidths.docsPend + colWidths.trainOk + 10, yPosition);
    
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight;
  });

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  // Save the PDF
  const fileName = `relatorio-compliance-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
