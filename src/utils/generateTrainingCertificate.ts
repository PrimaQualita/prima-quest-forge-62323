import jsPDF from "jspdf";
import logoImage from "@/assets/logo-prima-qualita-cert.jpeg";
import signatureImage from "@/assets/assinatura-diego.jpg";

interface CertificateData {
  employeeName: string;
  trainingTitle: string;
  completionDate: string;
  score: number;
}

export const generateTrainingCertificate = async ({
  employeeName,
  trainingTitle,
  completionDate,
  score,
}: CertificateData) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background color - usando cores do Prima Qualitá (tons de verde/azul)
  doc.setFillColor(240, 248, 245); // Tom suave verde claro
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border decorativo
  doc.setDrawColor(34, 139, 34); // Verde Prima Qualitá
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, "S");
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "S");

  // Logo Prima Qualitá
  try {
    doc.addImage(logoImage, "JPEG", pageWidth / 2 - 20, 20, 40, 40);
  } catch (error) {
    console.error("Erro ao adicionar logo:", error);
  }

  // Título do certificado
  doc.setFontSize(36);
  doc.setTextColor(34, 139, 34); // Verde Prima Qualitá
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO", pageWidth / 2, 75, { align: "center" });

  // Subtítulo
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text("Projeto Social Cresce Comunidade", pageWidth / 2, 85, { align: "center" });

  // Texto de certificação
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Certificamos que", pageWidth / 2, 100, { align: "center" });

  // Nome do colaborador
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text(employeeName.toUpperCase(), pageWidth / 2, 115, { align: "center" });

  // Linha decorativa sob o nome
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 117, pageWidth / 2 + 60, 117);

  // Texto de conclusão
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text("concluiu com êxito o treinamento", pageWidth / 2, 130, { align: "center" });

  // Nome do treinamento
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  
  // Split training title if too long
  const maxWidth = pageWidth - 80;
  const titleLines = doc.splitTextToSize(trainingTitle, maxWidth);
  doc.text(titleLines, pageWidth / 2, 140, { align: "center" });

  // Nota obtida
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const yPositionScore = 140 + (titleLines.length * 7);
  doc.text(`com aproveitamento de ${score}%`, pageWidth / 2, yPositionScore, { align: "center" });

  // Data de conclusão
  const formattedDate = new Date(completionDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Concluído em ${formattedDate}`, pageWidth / 2, yPositionScore + 10, { align: "center" });

  // Assinatura
  const signatureY = pageHeight - 50;
  
  try {
    doc.addImage(signatureImage, "JPEG", pageWidth / 2 - 25, signatureY - 15, 50, 15);
  } catch (error) {
    console.error("Erro ao adicionar assinatura:", error);
  }

  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 35, signatureY, pageWidth / 2 + 35, signatureY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Diego Martins", pageWidth / 2, signatureY + 5, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.text("Coordenador de Compliance", pageWidth / 2, signatureY + 10, { align: "center" });
  doc.text("Prima Qualitá", pageWidth / 2, signatureY + 15, { align: "center" });

  // Save PDF
  doc.save(`Certificado_${employeeName.replace(/\s+/g, "_")}_${trainingTitle.substring(0, 30).replace(/\s+/g, "_")}.pdf`);
};
