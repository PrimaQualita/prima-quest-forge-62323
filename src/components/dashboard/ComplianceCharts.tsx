import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceChartsProps {
  documentAcceptance?: any[];
  trainingCompletion?: any[];
  totalEmployees: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#f87171'];

export const ComplianceCharts = ({ 
  documentAcceptance = [], 
  trainingCompletion = [],
  totalEmployees 
}: ComplianceChartsProps) => {
  
  // Calcular colaboradores que não aceitaram nenhum documento
  const totalAccepted = documentAcceptance.reduce((sum, doc) => sum + doc.accepted, 0);
  const notAcceptedDocs = Math.max(0, (totalEmployees * documentAcceptance.length) - totalAccepted);
  const notAcceptedPercentage = totalEmployees > 0 
    ? Math.round((notAcceptedDocs / (totalEmployees * documentAcceptance.length)) * 100) 
    : 0;

  const documentData = [
    ...documentAcceptance.slice(0, 5).map((doc, index) => ({
      name: doc.title,
      value: doc.accepted,
      percentage: doc.percentage,
      fill: COLORS[index % COLORS.length]
    })),
    {
      name: 'Não Realizados',
      value: notAcceptedDocs,
      percentage: notAcceptedPercentage,
      fill: '#f87171'
    }
  ];

  // Calcular colaboradores que não completaram nenhum treinamento
  const totalCompleted = trainingCompletion.reduce((sum, training) => sum + training.completed, 0);
  const notCompletedTrainings = Math.max(0, (totalEmployees * trainingCompletion.length) - totalCompleted);
  const notCompletedPercentage = totalEmployees > 0 
    ? Math.round((notCompletedTrainings / (totalEmployees * trainingCompletion.length)) * 100) 
    : 0;

  const trainingData = [
    ...trainingCompletion.slice(0, 5).map((training, index) => ({
      name: training.title,
      value: training.completed,
      percentage: training.percentage,
      fill: COLORS[index % COLORS.length]
    })),
    {
      name: 'Não Realizados',
      value: notCompletedTrainings,
      percentage: notCompletedPercentage,
      fill: '#f87171'
    }
  ];

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Aceite de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
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
                  `${value} (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão de Treinamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
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
                  `${value} (${props.payload.percentage}%)`,
                  props.payload.name
                ]}
              />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
