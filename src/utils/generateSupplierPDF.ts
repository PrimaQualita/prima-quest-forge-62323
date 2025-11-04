import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Question {
  id: string;
  question: string;
  yes_points: number;
  no_points: number;
}

interface Supplier {
  company_name: string;
  cnpj: string;
  email: string;
  phone: string;
  owner: string;
  partners: string | null;
  total_score: number;
  status: string;
  responses: any;
  reviewed_at: string | null;
  certificate_expires_at: string | null;
}

export const generateSupplierPDF = async (
  supplier: Supplier,
  questions: Question[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Adicionar logo (menor e melhor formatada)
  try {
    const logoImg = await fetch('/logo-prima-qualita.png');
    const logoBlob = await logoImg.blob();
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(logoBlob);
    });
    // Logo menor e mais bem posicionada
    doc.addImage(logoDataUrl, 'PNG', pageWidth - 40, 15, 30, 30);
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
  }

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Due Diligence', 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Prima Qualitá Saúde', 20, yPos);
  yPos += 15;

  // Informações da Empresa
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações da Empresa', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const companyInfo = [
    `Razão Social: ${supplier.company_name}`,
    `CNPJ: ${supplier.cnpj}`,
    `E-mail: ${supplier.email}`,
    `Telefone: ${supplier.phone}`,
    `Proprietário: ${supplier.owner}`,
  ];

  if (supplier.partners) {
    companyInfo.push(`Sócios: ${supplier.partners}`);
  }

  companyInfo.forEach((info) => {
    doc.text(info, 20, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Status e Score
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Avaliação', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const statusText = supplier.status === 'approved' ? 'APROVADO' : 
                     supplier.status === 'rejected' ? 'REJEITADO' : 'PENDENTE';
  
  doc.setTextColor(supplier.status === 'approved' ? 0 : supplier.status === 'rejected' ? 255 : 0, 
                   supplier.status === 'approved' ? 128 : 0, 0);
  doc.text(`Status: ${statusText}`, 20, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 6;

  doc.text(`Score Total: ${supplier.total_score} pontos`, 20, yPos);
  yPos += 6;

  if (supplier.reviewed_at) {
    doc.text(`Data da Avaliação: ${format(new Date(supplier.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, yPos);
    yPos += 6;
  }

  if (supplier.certificate_expires_at) {
    doc.text(`Validade do Certificado: ${format(new Date(supplier.certificate_expires_at), "dd/MM/yyyy", { locale: ptBR })}`, 20, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Respostas do Questionário
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Respostas do Questionário', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  questions.forEach((question, index) => {
    // Verificar se precisa de nova página
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const response = supplier.responses[question.id];
    const responseText = response === 'sim' ? 'SIM' : response === 'nao' ? 'NÃO' : 'Não respondida';
    const points = response === 'sim' ? question.yes_points : response === 'nao' ? question.no_points : 0;

    doc.setFont('helvetica', 'bold');
    const questionText = `${index + 1}. ${question.question}`;
    const questionLines = doc.splitTextToSize(questionText, pageWidth - 40);
    
    // Renderizar cada linha da pergunta
    questionLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, 20, yPos + (lineIndex * 5));
    });
    yPos += questionLines.length * 5 + 2;

    doc.setFont('helvetica', 'normal');
    doc.text(`Resposta: ${responseText} (${points} pontos)`, 25, yPos);
    yPos += 8;
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  doc.save(`due-diligence-${supplier.cnpj.replace(/[^\d]/g, '')}-${format(new Date(), 'yyyyMMdd')}.pdf`);
};
