import jsPDF from "jspdf";
import logoImage from "@/assets/logo-prima-qualita-cert.png";
import { supabase } from "@/integrations/supabase/client";

interface CertificateData {
  employeeName: string;
  trainingTitle: string;
  completionDate: string;
  score: number;
}

// Gerar código de verificação único
const generateVerificationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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

  // Background color - usando cores do Prima Qualitá (tons de azul)
  doc.setFillColor(240, 248, 255); // Azul muito claro (Alice Blue)
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border decorativo
  doc.setDrawColor(52, 152, 219); // Azul Prima Qualitá
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, "S");
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "S");

  // Gerar e salvar código de verificação
  const verificationCode = generateVerificationCode();
  
  try {
    await supabase.from('certificates').insert({
      verification_code: verificationCode,
      employee_name: employeeName,
      training_title: trainingTitle,
      completion_date: completionDate,
      score: score,
    });
  } catch (error) {
    console.error("Erro ao salvar certificado:", error);
  }

  // Logo Prima Qualitá - menor e mais proporcional
  try {
    doc.addImage(logoImage, "PNG", pageWidth / 2 - 25, 18, 50, 25);
  } catch (error) {
    console.error("Erro ao adicionar logo:", error);
  }

  // Título do certificado
  doc.setFontSize(36);
  doc.setTextColor(52, 152, 219); // Azul Prima Qualitá
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO", pageWidth / 2, 60, { align: "center" });

  // Subtítulo
  doc.setFontSize(15);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text("Projeto Social Cresce Comunidade - Prima Qualitá", pageWidth / 2, 72, { align: "center" });

  // Texto de certificação
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text("Certificamos que", pageWidth / 2, 88, { align: "center" });

  // Nome do colaborador
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 152, 219); // Azul Prima Qualitá
  doc.text(employeeName.toUpperCase(), pageWidth / 2, 103, { align: "center" });

  // Texto de conclusão - dividido em duas linhas
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text("Concluiu com êxito o treinamento", pageWidth / 2, 117, { align: "center" });

  // Nome do treinamento
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 152, 219); // Azul Prima Qualitá
  
  // Split training title if too long
  const maxWidth = pageWidth - 80;
  const titleLines = doc.splitTextToSize(trainingTitle, maxWidth);
  const titleStartY = 128;
  doc.text(titleLines, pageWidth / 2, titleStartY, { align: "center" });

  // Nota obtida - com espaçamento reduzido
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const lineHeight = 5;
  const yPositionScore = titleStartY + (titleLines.length * lineHeight) + 8;
  doc.text("Com aproveitamento de " + score + "%", pageWidth / 2, yPositionScore, { align: "center" });

  // Data de conclusão
  const formattedDate = new Date(completionDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Concluído em ${formattedDate}`, pageWidth / 2, yPositionScore + 10, { align: "center" });

  // Assinatura - com espaçamento aumentado
  const signatureY = yPositionScore + 26;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 152, 219);
  doc.text("Coordenação de Compliance", pageWidth / 2, signatureY, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Prima Qualitá", pageWidth / 2, signatureY + 8, { align: "center" });

  // Código de verificação - na parte inferior (azul e negrito)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 152, 219); // Azul Prima Qualitá
  doc.text(`Código de Verificação: ${verificationCode}`, pageWidth / 2, pageHeight - 24, { align: "center" });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(52, 152, 219);
  const verificationUrl = `${window.location.origin}/verificar-certificado`;
  doc.text(`Verifique a autenticidade em: ${verificationUrl}`, pageWidth / 2, pageHeight - 16, { align: "center" });

  // Save PDF
  doc.save(`Certificado_${employeeName.replace(/\s+/g, "_")}_${trainingTitle.substring(0, 30).replace(/\s+/g, "_")}.pdf`);
};
