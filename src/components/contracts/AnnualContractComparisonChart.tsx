import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Contract {
  id: string;
  name: string;
}

interface AnnualContractComparisonChartProps {
  contracts: Contract[];
  year: number;
}

export const AnnualContractComparisonChart = ({ contracts, year }: AnnualContractComparisonChartProps) => {
  const { data: annualData } = useQuery({
    queryKey: ['contract-annual-comparison', contracts?.map(c => c.id), year],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      
      const contractStats = await Promise.all(
        contracts.map(async (contract) => {
          const { count } = await supabase
            .from('contract_documents')
            .select('*', { count: 'exact', head: true })
            .eq('contract_id', contract.id)
            .eq('year', year);
          
          return {
            name: contract.name.length > 25 ? contract.name.substring(0, 25) + '...' : contract.name,
            fullName: contract.name,
            count: count || 0,
            average: 0
          };
        })
      );
      
      // Calcular média geral para linha de tendência
      const totalDocs = contractStats.reduce((sum, stat) => sum + stat.count, 0);
      const average = contractStats.length > 0 ? Math.round(totalDocs / contractStats.length) : 0;
      contractStats.forEach(stat => stat.average = average);
      
      return contractStats;
    },
    enabled: contracts && contracts.length > 0,
  });

  const getBarColor = (count: number, average: number) => {
    if (count === 0) return {
      fill: '#e5e7eb',
      stroke: '#9ca3af'
    };
    
    if (count >= average) {
      const intensity = Math.min(count / (average * 2 || 1), 1);
      return {
        fill: `rgba(34, 197, 94, ${0.4 + intensity * 0.6})`,
        stroke: '#16a34a'
      };
    } else {
      const intensity = Math.min(count / (average || 1), 1);
      return {
        fill: `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`,
        stroke: '#dc2626'
      };
    }
  };

  const totalDocuments = annualData?.reduce((sum, stat) => sum + stat.count, 0) || 0;
  const averagePerContract = annualData && annualData.length > 0 
    ? Math.round(totalDocuments / annualData.length) 
    : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Comparativo Anual de Análises por Contrato de Gestão</span>
            <span className="text-sm font-normal text-muted-foreground">
              Total: {totalDocuments} análises | Média: {averagePerContract} por contrato
            </span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">{year}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!annualData || annualData.length === 0) ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum contrato cadastrado
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={annualData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <filter id="shadow-annual" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  axisLine={{ stroke: '#d1d5db' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{ 
                    value: 'Análises/Ano', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fontSize: 12, fill: '#6b7280' } 
                  }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const colors = getBarColor(data.count, data.average);
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
                          <p className="font-medium text-sm">{data.fullName}</p>
                          <p className="text-sm mt-1" style={{ color: colors.stroke }}>
                            {data.count} análise(s) em {year}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Média geral: {data.average} análises
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Linha de média */}
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                {/* Barras por contrato */}
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                  filter="url(#shadow-annual)"
                  maxBarSize={80}
                >
                  {annualData?.map((entry, index) => {
                    const colors = getBarColor(entry.count, entry.average);
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={2}
                      />
                    );
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }} />
                <span className="text-muted-foreground">Acima da média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
                <span className="text-muted-foreground">Abaixo da média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-slate-400" style={{ borderTop: '2px dashed #94a3b8' }} />
                <span className="text-muted-foreground">Média geral</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
