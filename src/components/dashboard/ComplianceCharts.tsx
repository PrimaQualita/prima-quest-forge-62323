import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceChartsProps {
  documentAcceptance?: any[];
  trainingCompletion?: any[];
  totalEmployees: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const NOT_COMPLETED_COLORS = ['#93c5fd', '#86efac', '#fde68a', '#fca5a5', '#c7d2fe'];

export const ComplianceCharts = ({ 
  documentAcceptance = [], 
  trainingCompletion = [],
  totalEmployees 
}: ComplianceChartsProps) => {
  
  // Adicionar "Não Realizados" para cada documento/regulamento
  const documentData = documentAcceptance.slice(0, 5).map((doc, index) => {
    const notAccepted = totalEmployees - doc.accepted;
    return [
      {
        name: doc.title,
        value: doc.accepted,
        percentage: doc.percentage,
        fill: COLORS[index % COLORS.length]
      },
      {
        name: `${doc.title} - Não Realizados`,
        value: notAccepted,
        percentage: Math.round((notAccepted / totalEmployees) * 100),
        fill: NOT_COMPLETED_COLORS[index % NOT_COMPLETED_COLORS.length]
      }
    ];
  }).flat();

  // Adicionar "Não Realizados" para cada treinamento
  const trainingData = trainingCompletion.slice(0, 5).map((training, index) => {
    const notCompleted = totalEmployees - training.completed;
    return [
      {
        name: training.title,
        value: training.completed,
        percentage: training.percentage,
        fill: COLORS[index % COLORS.length]
      },
      {
        name: `${training.title} - Não Realizados`,
        value: notCompleted,
        percentage: Math.round((notCompleted / totalEmployees) * 100),
        fill: NOT_COMPLETED_COLORS[index % NOT_COMPLETED_COLORS.length]
      }
    ];
  }).flat();

  const renderCustomLabel = (entry: any) => {
    return entry.value > 0 ? `${entry.percentage}%` : '';
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
          <CardTitle>Taxa de Aceite de Regulamentos</CardTitle>
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
                  `${value} colaboradores (${props.payload.percentage}%)`,
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
                  `${value} colaboradores (${props.payload.percentage}%)`,
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
