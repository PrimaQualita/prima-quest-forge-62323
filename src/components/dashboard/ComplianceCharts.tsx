import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceChartsProps {
  documentAcceptance?: any[];
  trainingCompletion?: any[];
  totalEmployees: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ComplianceCharts = ({ 
  documentAcceptance = [], 
  trainingCompletion = [],
  totalEmployees 
}: ComplianceChartsProps) => {
  
  const documentData = documentAcceptance.slice(0, 5).map((doc, index) => ({
    name: doc.title,
    value: doc.accepted,
    percentage: doc.percentage,
    fill: COLORS[index % COLORS.length]
  }));

  const trainingData = trainingCompletion.slice(0, 5).map((training, index) => ({
    name: training.title,
    value: training.completed,
    percentage: training.percentage,
    fill: COLORS[index % COLORS.length]
  }));

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Aceite de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {documentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any, props: any) => [
                  `${value} de ${totalEmployees} colaboradores (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão de Treinamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trainingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#82ca9d"
                dataKey="value"
              >
                {trainingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any, props: any) => [
                  `${value} de ${totalEmployees} colaboradores (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
