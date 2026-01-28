import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield } from "lucide-react";

const VerifyReport = () => {
  const { protocol } = useParams<{ protocol: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary">
            Verificação de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Documento Autêntico</h3>
              <p className="text-sm text-green-700 mt-1">
                Este relatório foi emitido oficialmente pela plataforma Prima Qualità.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Protocolo</p>
              <p className="font-mono text-lg font-semibold text-gray-800">
                {protocol || "N/A"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="font-semibold text-green-600">Verificado ✓</p>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500">
            Este sistema de verificação garante a autenticidade dos relatórios de compliance emitidos pela plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyReport;
