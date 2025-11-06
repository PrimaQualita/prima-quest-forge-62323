import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateTrainingCertificate } from "@/utils/generateTrainingCertificate";
import { useToast } from "@/hooks/use-toast";

interface CertificateButtonProps {
  employeeName: string;
  trainingTitle: string;
  completionDate: string;
  score: number;
}

export const CertificateButton = ({
  employeeName,
  trainingTitle,
  completionDate,
  score,
}: CertificateButtonProps) => {
  const { toast } = useToast();

  const handleDownloadCertificate = async () => {
    try {
      await generateTrainingCertificate({
        employeeName,
        trainingTitle,
        completionDate,
        score,
      });
      
      toast({
        title: "Certificado gerado com sucesso!",
        description: "O download do seu certificado foi iniciado.",
      });
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      toast({
        title: "Erro ao gerar certificado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleDownloadCertificate}
      className="w-full"
      size="lg"
    >
      <Download className="w-4 h-4 mr-2" />
      Baixar Certificado
    </Button>
  );
};
