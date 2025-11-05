import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ContractCandlestickChartProps {
  contractId: string;
  contractName: string;
  year: number;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export const ContractCandlestickChart = ({ contractId, contractName, year }: ContractCandlestickChartProps) => {
  const { data: monthlyData } = useQuery({
    queryKey: ['contract-monthly-docs', contractId, year],
    queryFn: async () => {
      const monthlyStats = await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          const month = index + 1;
          const { count } = await supabase
            .from('contract_documents')
            .select('*', { count: 'exact', head: true })
            .eq('contract_id', contractId)
            .eq('year', year)
            .eq('month', month);
          
          return {
            month: MONTHS[index],
            monthNumber: month,
            count: count || 0,
            // Adicionar linha de tendência
            average: 0
          };
        })
      );
      
      // Calcular média móvel simples para linha de tendência
      const totalDocs = monthlyStats.reduce((sum, stat) => sum + stat.count, 0);
      const average = Math.round(totalDocs / 12);
      monthlyStats.forEach(stat => stat.average = average);
      
      return monthlyStats;
    },
    enabled: !!contractId,
  });

  const getCandleColor = (count: number, average: number) => {
    if (count === 0) return {
      fill: '#e5e7eb',
      stroke: '#9ca3af'
    };
    
    // Verde se acima da média, vermelho se abaixo
    if (count >= average) {
      const intensity = Math.min(count / (average * 2), 1);
      return {
        fill: `rgba(34, 197, 94, ${0.4 + intensity * 0.6})`, // green-500
        stroke: '#16a34a' // green-600
      };
    } else {
      const intensity = Math.min(count / average, 1);
      return {
        fill: `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`, // red-500
        stroke: '#dc2626' // red-600
      };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{contractName}</span>
          <span className="text-sm font-normal text-muted-foreground">{year}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <filter id="shadow" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              axisLine={{ stroke: '#d1d5db' }}
              label={{ 
                value: 'Documentos', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: 12, fill: '#6b7280' } 
              }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const colors = getCandleColor(data.count, data.average);
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">{data.month}/{year}</p>
                      <p className="text-sm" style={{ color: colors.stroke }}>
                        {data.count} documento(s)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Média: {data.average} docs
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Linha de tendência/média */}
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            {/* Barras tipo vela */}
            <Bar 
              dataKey="count" 
              radius={[6, 6, 6, 6]}
              filter="url(#shadow)"
            >
              {monthlyData?.map((entry, index) => {
                const colors = getCandleColor(entry.count, entry.average);
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
            <span className="text-muted-foreground">Linha de média</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
