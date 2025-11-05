import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceChartsProps {
  documentAcceptance?: any[];
  trainingCompletion?: any[];
  totalEmployees: number;
}

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#06b6d4', '#6366f1']; // Cores frias
const NOT_COMPLETED_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#fb923c']; // Cores quentes

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
        name: `${doc.title} - Realizados`,
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
        name: `${training.title} - Realizados`,
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
    
    // Separar realizados e não realizados
    const realizados = payload.filter((entry: any) => entry.value.includes('Realizados') && !entry.value.includes('Não'));
    const naoRealizados = payload.filter((entry: any) => entry.value.includes('Não Realizados'));
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4 px-4">
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Realizados</h4>
          <ul className="space-y-1">
            {realizados.map((entry: any, index: number) => (
              <li key={`realized-${index}`} className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-foreground">{entry.value.replace(' - Realizados', '')}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Não Realizados</h4>
          <ul className="space-y-1">
            {naoRealizados.map((entry: any, index: number) => (
              <li key={`not-realized-${index}`} className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-foreground">{entry.value.replace(' - Não Realizados', '')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Aceite de Regulamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={documentData}
                cx="50%"
                cy="40%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={140}
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
            </PieChart>
          </ResponsiveContainer>
          {renderLegend({ payload: documentData.map(d => ({ value: d.name, color: d.fill })) })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão de Treinamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={trainingData}
                cx="50%"
                cy="40%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={140}
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
            </PieChart>
          </ResponsiveContainer>
          {renderLegend({ payload: trainingData.map(d => ({ value: d.name, color: d.fill })) })}
        </CardContent>
      </Card>
    </div>
  );
};
